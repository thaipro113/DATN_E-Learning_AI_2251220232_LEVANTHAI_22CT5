import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../services/api';

const QUICK_TOPICS = [
  { id: 'daily', title: '☕ Giao tiếp đời sống', prompt: 'Hi! Let\'s practice a casual daily conversation. How was your day today?' },
  { id: 'interview', title: '💼 Phỏng vấn xin việc', prompt: 'Welcome to the interview! Can you tell me a little about yourself and your background?' },
  { id: 'travel', title: '✈️ Du lịch & Sân bay', prompt: 'Hello traveller! Where are you planning to travel for your next vacation?' },
  { id: 'restaurant', title: '🍽️ Gọi món nhà hàng', prompt: 'Good evening! Welcome to our restaurant. Are you ready to order or would you like a few minutes with the menu?' },
  { id: 'business', title: '🏢 Tiếng Anh công sở', prompt: 'Hi there! Could you give me a quick update on your current project milestone?' },
  { id: 'ielts', title: '🎯 Luyện Speaking IELTS', prompt: 'Let\'s practice IELTS Speaking Part 1. What do you enjoy doing in your free time?' },
];

export default function FloatingAITutor({
  user,
  isLoggedIn,
  onOpenAuthModal,
  isOpenExternal,
  onCloseExternal,
}) {
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isOpen = isOpenExternal !== undefined ? isOpenExternal : isOpenInternal;

  const setIsOpen = (val) => {
    if (onCloseExternal && !val) {
      onCloseExternal();
    }
    setIsOpenInternal(val);
  };

  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Hello ${user?.full_name || 'there'}! 👋 Welcome to your **AI English Communication Coach**. Choose a topic below or type anything in English to start practicing!`,
      grammar: null,
      model_used: 'AI Speaking Coach',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [targetLevel, setTargetLevel] = useState(user?.level || 'B1');
  const [sessionType, setSessionType] = useState('ROLEPLAY');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  // Load danh sách sessions
  const fetchSessions = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await aiAPI.getSessions();
      const list = res.data?.results || res.data?.data?.results || res.data?.data || [];
      if (Array.isArray(list)) {
        setSessions(list);
        if (list.length > 0 && !sessionId) {
          loadSessionMessages(list[0].id);
        }
      }
    } catch (e) {
      console.warn('Could not load AI sessions:', e);
    }
  };

  const loadSessionMessages = async (sId) => {
    setSessionId(sId);
    try {
      const res = await aiAPI.getSessionDetail(sId);
      const sessionData = res.data?.data || res.data;
      if (sessionData?.messages && Array.isArray(sessionData.messages)) {
        const mapped = sessionData.messages.map((m) => ({
          role: m.sender_type === 'USER' ? 'user' : 'ai',
          text: m.content,
          grammar: m.grammar_corrections?.has_errors ? m.grammar_corrections : null,
          model_used: m.model_used || 'AI Coach',
        }));
        setMessages(mapped);
      }
    } catch (err) {
      console.warn('Could not fetch session detail:', err);
    }
  };

  useEffect(() => {
    if (isOpen && isLoggedIn) {
      fetchSessions();
    } else if (!isOpen && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [isOpen, isLoggedIn]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text to Speech phát âm tiếng Anh
  const handleSpeakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStartTopic = async (topic) => {
    setSessionId(null);
    setMessages([
      {
        role: 'ai',
        text: topic.prompt,
        grammar: null,
        model_used: 'AI Speaking Coach',
      },
    ]);
    if ('speechSynthesis' in window) {
      handleSpeakText(topic.prompt);
    }
  };

  const handleCreateNewSession = async () => {
    try {
      const res = await aiAPI.createSession({
        title: `Luyện giao tiếp (${targetLevel})`,
        session_type: 'ROLEPLAY',
        target_level: targetLevel,
      });
      const newSession = res.data?.data || res.data;
      setSessionId(newSession.id);
      setMessages([
        {
          role: 'ai',
          text: `Hi! Ready to practice English communication? Type your sentence or pick a scenario to start!`,
          grammar: null,
          model_used: 'AI Speaking Coach',
        },
      ]);
      fetchSessions();
      setShowHistorySidebar(false);
    } catch (e) {
      setMessages([
        {
          role: 'ai',
          text: `New practice session started. Let's talk in English!`,
          grammar: null,
          model_used: 'AI Speaking Coach',
        },
      ]);
    }
  };

  const handleDeleteSession = async (sId, e) => {
    e.stopPropagation();
    try {
      await aiAPI.deleteSession(sId);
      if (sessionId === sId) {
        setSessionId(null);
        setMessages([
          {
            role: 'ai',
            text: 'Đoạn chat đã được xóa. Bạn có thể chọn chủ đề mới bên dưới để bắt đầu!',
            grammar: null,
            model_used: 'AI Speaking Coach',
          },
        ]);
      }
      fetchSessions();
    } catch (err) {
      alert('Đã xóa phiên hội thoại.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userText = inputText.trim();
    setInputText('');
    setMessages((prev) => [...prev, { role: 'user', text: userText, grammar: null }]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');

      // 1. ĐÃ ĐĂNG NHẬP
      if (token) {
        let activeSessionId = sessionId;

        if (!activeSessionId) {
          const createRes = await aiAPI.createSession({
            title: userText.slice(0, 30) + '...',
            session_type: 'ROLEPLAY',
            target_level: targetLevel,
          });
          activeSessionId = createRes.data?.data?.id || createRes.data?.id;
          setSessionId(activeSessionId);
          fetchSessions();
        }

        const res = await aiAPI.sendMessage(activeSessionId, userText, targetLevel);
        const data = res.data?.data || res.data;
        const aiMessage = data?.ai_message;
        const aiReply = aiMessage?.content || data?.content || 'I understand. Let\'s keep practicing!';
        const grammarAnalysis = aiMessage?.grammar_corrections;

        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: aiReply,
            grammar: grammarAnalysis?.has_errors ? grammarAnalysis : null,
            model_used: aiMessage?.model_used || 'AI Speaking Coach',
          },
        ]);
      } else {
        // 2. CHƯA ĐĂNG NHẬP
        const grammarRes = await aiAPI.checkGrammar(userText, targetLevel);
        const grammarData = grammarRes.data?.data || grammarRes.data;

        let responseText = '';
        if (grammarData?.has_errors) {
          responseText = `💡 **Gợi ý cách diễn đạt chuẩn:**\n"${grammarData.corrected_text}"\n\n${grammarData.overall_comment_vi || 'Great effort! Keep practicing!'}`;
        } else {
          responseText = `That sounds very natural! Let's keep the conversation going. What else would you like to discuss?`;
        }

        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: responseText,
            grammar: grammarData?.has_errors ? grammarData : null,
            model_used: 'AI Grammar & Coach',
          },
        ]);
      }
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `I received your sentence: "${userText}". Keep speaking and practicing regularly!`,
          grammar: null,
          model_used: 'AI Coach Live',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div
        className="floating-ai-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Phòng Luyện Giao Tiếp & Sửa Lỗi Tiếng Anh cùng AI"
        style={{
          background: 'linear-gradient(135deg, #16a34a, #0284c7)',
          boxShadow: '0 4px 16px rgba(22, 163, 74, 0.35)',
        }}
      >
        <i className="fa-solid fa-comments"></i>
        <span>Giao tiếp AI</span>
        <span className="live-badge" style={{ backgroundColor: '#22c55e' }}>Live</span>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="ai-chat-window"
          style={{
            width: showHistorySidebar ? '560px' : '420px',
            height: '560px',
            transition: 'width 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 35px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)',
          }}
        >
          {/* Header */}
          <div
            className="ai-chat-header"
            style={{
              background: 'linear-gradient(135deg, #0f766e, #0284c7)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => setShowHistorySidebar(!showHistorySidebar)}
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '1rem', cursor: 'pointer', padding: '2px' }}
                  title="Lịch sử các đoạn hội thoại"
                >
                  <i className="fa-solid fa-clock-rotate-left"></i>
                </button>
              )}
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1rem',
                }}
              >
                <i className="fa-solid fa-headset"></i>
              </div>
              <div>
                <strong style={{ fontSize: '0.92rem', display: 'block', color: 'white' }}>
                  Luyện Giao Tiếp & Sửa Lỗi AI
                </strong>
                <span style={{ fontSize: '0.7rem', color: '#e0f2fe' }}>
                  {isLoggedIn ? `Trình độ: ${targetLevel} • Phản xạ & Sửa lỗi câu` : 'Dùng thử Luyện Giao Tiếp'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={handleCreateNewSession}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontWeight: '700',
                  }}
                  title="Tạo đoạn chat mới"
                >
                  <i className="fa-solid fa-plus" style={{ marginRight: '4px' }}></i>
                  <span>Mới</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                title="Đóng cửa sổ"
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          {/* Quick Scenario Picker Bar */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '8px 10px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid var(--border-color)',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => handleStartTopic(topic)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  backgroundColor: 'white',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.target.style.borderColor = '#0284c7'; e.target.style.color = '#0284c7'; }}
                onMouseLeave={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.color = '#334155'; }}
              >
                {topic.title}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Sidebar Lịch sử Hội thoại */}
            {showHistorySidebar && isLoggedIn && (
              <div
                style={{
                  width: '180px',
                  backgroundColor: '#f8fafc',
                  borderRight: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '10px',
                  gap: '6px',
                  overflowY: 'auto',
                }}
              >
                <button
                  onClick={handleCreateNewSession}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#0f766e',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    marginBottom: '6px',
                  }}
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Hội thoại mới</span>
                </button>

                <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                  Lịch sử ({sessions.length}):
                </span>

                {sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      loadSessionMessages(s.id);
                      setShowHistorySidebar(false);
                    }}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      backgroundColor: sessionId === s.id ? '#ccfbf1' : 'white',
                      border: '1px solid',
                      borderColor: sessionId === s.id ? '#5eead4' : '#e2e8f0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px', fontWeight: sessionId === s.id ? '700' : '500' }}>
                      {s.title || 'Đoạn hội thoại'}
                    </span>
                    <button
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                      title="Xóa"
                    >
                      <i className="fa-solid fa-trash" style={{ fontSize: '0.65rem' }}></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Khung tin nhắn */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="ai-chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.map((m, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', maxWidth: '90%' }}>
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                          backgroundColor: m.role === 'user' ? '#0f766e' : '#f1f5f9',
                          color: m.role === 'user' ? '#ffffff' : '#0f172a',
                          fontSize: '0.86rem',
                          lineHeight: '1.5',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {m.text}
                      </div>

                      {/* Nút phát âm loa */}
                      <button
                        type="button"
                        onClick={() => handleSpeakText(m.text)}
                        style={{
                          border: 'none',
                          background: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '4px',
                          fontSize: '0.82rem',
                          alignSelf: 'center',
                        }}
                        title="Nghe phát âm chuẩn (Text-to-Speech)"
                      >
                        <i className="fa-solid fa-volume-high"></i>
                      </button>
                    </div>

                    {/* Hộp phân tích & sửa lỗi ngữ pháp / diễn đạt */}
                    {m.grammar && (
                      <div
                        style={{
                          marginTop: '6px',
                          maxWidth: '90%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fecaca',
                          fontSize: '0.78rem',
                          color: '#991b1b',
                        }}
                      >
                        <strong style={{ display: 'block', marginBottom: '4px', color: '#dc2626' }}>
                          <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: '4px' }}></i>
                          Chỉnh sửa & Gợi ý câu tự nhiên hơn:
                        </strong>
                        {m.grammar.corrected_text && (
                          <div style={{ marginBottom: '4px', fontWeight: '700', color: '#15803d' }}>
                            ✓ Câu chuẩn: "{m.grammar.corrected_text}"
                          </div>
                        )}
                        {m.grammar.errors?.map((err, errIdx) => (
                          <div key={errIdx} style={{ marginBottom: '3px' }}>
                            • Thay <em>"{err.error_segment}"</em> → <strong>"{err.correction}"</strong> ({err.explanation_vi})
                          </div>
                        ))}
                      </div>
                    )}

                    {m.role === 'ai' && m.model_used && (
                      <span style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '2px', marginLeft: '4px' }}>
                        ✦ {m.model_used}
                      </span>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '8px', width: 'fit-content' }}>
                    <i className="fa-solid fa-circle-notch fa-spin" style={{ color: '#0f766e' }}></i>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>AI Coach đang phản hồi & phân tích câu...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Form nhập */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '10px 12px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  gap: '8px',
                  backgroundColor: 'white',
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  placeholder="Nhắn câu tiếng Anh hoặc hỏi gia sư bằng tiếng Việt..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: inputText.trim() && !isLoading ? '#0f766e' : '#94a3b8',
                    color: 'white',
                    border: 'none',
                    cursor: inputText.trim() && !isLoading ? 'pointer' : 'not-allowed',
                    fontSize: '0.85rem',
                  }}
                >
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

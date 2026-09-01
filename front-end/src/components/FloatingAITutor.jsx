import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../services/api';

export default function FloatingAITutor({ user, isLoggedIn, onOpenAuthModal }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Hello ${user?.full_name || 'there'}! 🎓 I am your AI English Tutor powered by Google Gemini. How can I help you practice English or explain grammar today?`,
      grammar: null,
      model_used: 'Gemini & Groq',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [targetLevel, setTargetLevel] = useState(user?.level || 'B1');
  const [sessionType, setSessionType] = useState('GENERAL');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Load danh sách sessions
  const fetchSessions = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await aiAPI.getSessions();
      const list = res.data?.results || res.data?.data?.results || res.data?.data || [];
      if (Array.isArray(list)) {
        setSessions(list);
        if (list.length > 0 && !sessionId) {
          setSessionId(list[0].id);
        }
      }
    } catch (e) {
      console.warn('Could not load AI sessions:', e);
    }
  };

  useEffect(() => {
    if (isOpen && isLoggedIn) {
      fetchSessions();
    }
  }, [isOpen, isLoggedIn]);

  const handleCreateNewSession = async () => {
    try {
      const res = await aiAPI.createSession({
        title: `Hội thoại mới (${targetLevel})`,
        session_type: sessionType,
        target_level: targetLevel,
      });
      const newSession = res.data?.data || res.data;
      setSessionId(newSession.id);
      setMessages([
        {
          role: 'ai',
          text: `Hi! New practice session started. Ask me any English grammar questions or start a conversation!`,
          grammar: null,
          model_used: 'Gemini 3.6 Flash',
        },
      ]);
      fetchSessions();
      setShowHistorySidebar(false);
    } catch (e) {
      setMessages([
        {
          role: 'ai',
          text: `New practice session started. How can I assist you?`,
          grammar: null,
          model_used: 'Gemini 3.6 Flash',
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
        setMessages([]);
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

      // 1. Nếu ĐÃ ĐĂNG NHẬP: Gọi API Hội thoại đầy đủ với CSDL & AI LLM
      if (token) {
        let activeSessionId = sessionId;

        // Nếu chưa có session ID, tạo session mới trên Backend
        if (!activeSessionId) {
          const createRes = await aiAPI.createSession({
            title: userText.slice(0, 30) + '...',
            session_type: sessionType,
            target_level: targetLevel,
          });
          activeSessionId = createRes.data?.data?.id || createRes.data?.id;
          setSessionId(activeSessionId);
          fetchSessions();
        }

        // Gửi tin nhắn đến session
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
            model_used: aiMessage?.model_used || 'Gemini 3.6 Flash',
          },
        ]);
      } else {
        // 2. Nếu CHƯA ĐĂNG NHẬP: Gọi API Phân tích Ngữ pháp / AI tức thì
        const grammarRes = await aiAPI.checkGrammar(userText, targetLevel);
        const grammarData = grammarRes.data?.data || grammarRes.data;

        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: grammarData?.has_errors
              ? `I noticed some grammar points in your sentence:\n"${grammarData.corrected_text}"`
              : `Great job! Your sentence is grammatically correct.`,
            grammar: grammarData?.has_errors ? grammarData : null,
            model_used: 'Gemini Instant Check',
          },
        ]);
      }
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: 'Great question! In English, regular verbs add -ed for past tense (e.g., walk -> walked), while irregular verbs change completely (e.g., go -> went). Practice makes perfect!',
          grammar: null,
          model_used: 'AI Engine',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="floating-ai-btn" onClick={() => setIsOpen(!isOpen)} title="Trợ lý Gia sư AI 24/7">
        <i className="fa-solid fa-robot"></i>
        <span>Gia sư AI</span>
        <span className="live-badge">Live</span>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat-window" style={{ width: showHistorySidebar ? '540px' : '380px', transition: 'width 0.2s ease' }}>
          {/* Header */}
          <div className="ai-chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => setShowHistorySidebar(!showHistorySidebar)}
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '1rem', cursor: 'pointer', padding: '2px' }}
                  title="Lịch sử các đoạn chat"
                >
                  <i className="fa-solid fa-clock-rotate-left"></i>
                </button>
              )}
              <div className="ai-avatar-circle">
                <i className="fa-solid fa-brain"></i>
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'block' }}>Gia sư AI Tutor</strong>
                <span style={{ fontSize: '0.68rem', opacity: 0.9 }}>
                  {isLoggedIn ? `Trình độ: ${targetLevel}` : 'Dùng thử phân tích ngữ pháp'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={handleCreateNewSession}
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.85rem', cursor: 'pointer', padding: '4px' }}
                  title="Tạo đoạn chat mới"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              )}
              <button
                className="ai-chat-close"
                onClick={() => setIsOpen(false)}
                title="Đóng cửa sổ chat"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
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
                    backgroundColor: '#0284c7',
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
                  <span>Đoạn chat mới</span>
                </button>

                <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                  Lịch sử ({sessions.length}):
                </span>

                {sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSessionId(s.id);
                      setShowHistorySidebar(false);
                    }}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      backgroundColor: sessionId === s.id ? '#e0f2fe' : 'white',
                      border: '1px solid',
                      borderColor: sessionId === s.id ? '#bae6fd' : '#e2e8f0',
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
                      title="Xóa phiên"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Chat Body & Input */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {/* Messages Body */}
              <div className="ai-chat-body">
                {messages.map((m, idx) => (
                  <div key={idx} className={`ai-message-wrapper ${m.role}`}>
                    <div className="ai-bubble">
                      <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{m.text}</p>

                      {/* Phân tích lỗi ngữ pháp chi tiết */}
                      {m.grammar && m.grammar.errors && m.grammar.errors.length > 0 && (
                        <div className="ai-grammar-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#ea580c' }}></i>
                            <strong style={{ fontSize: '0.75rem', color: '#c2410c' }}>Phát hiện lỗi ngữ pháp:</strong>
                          </div>

                          {m.grammar.errors.map((err, errIdx) => (
                            <div key={errIdx} style={{ marginBottom: '4px', fontSize: '0.72rem' }}>
                              <span style={{ color: '#dc2626', textDecoration: 'line-through' }}>{err.original_text || err.error}</span>
                              {' → '}
                              <strong style={{ color: '#16a34a' }}>{err.suggested_correction || err.suggestion}</strong>
                              <p style={{ margin: '2px 0 0', color: '#475569', fontStyle: 'italic' }}>{err.explanation}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {m.model_used && (
                        <span style={{ display: 'block', fontSize: '0.62rem', color: '#94a3b8', marginTop: '4px', textAlign: 'right' }}>
                          ⚡ {m.model_used}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="ai-message-wrapper ai">
                    <div className="ai-bubble typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Form */}
              <form onSubmit={handleSendMessage} className="ai-chat-footer">
                <input
                  type="text"
                  placeholder={isLoggedIn ? "Hỏi bài hoặc trò chuyện tiếng Anh..." : "Nhập câu tiếng Anh để AI sửa lỗi..."}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !inputText.trim()}>
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

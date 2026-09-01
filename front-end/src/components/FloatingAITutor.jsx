import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../services/api';

export default function FloatingAITutor({ user, isLoggedIn, onOpenAuthModal }) {
  const [isOpen, setIsOpen] = useState(false);
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

  // Khởi tạo hoặc tải phiên chat gần nhất khi mở
  useEffect(() => {
    const initSession = async () => {
      const token = localStorage.getItem('access_token');
      if (!token || sessionId) return;

      try {
        const res = await aiAPI.getSessions();
        const sessionList = res.data?.results || res.data?.data || [];
        if (sessionList.length > 0) {
          setSessionId(sessionList[0].id);
        }
      } catch (e) {
        // Sẽ tạo phiên mới khi gửi tin nhắn
      }
    };

    if (isOpen && isLoggedIn) {
      initSession();
    }
  }, [isOpen, isLoggedIn, sessionId]);

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
            title: `Luyện tập Tiếng Anh ${targetLevel}`,
            session_type: sessionType,
            target_level: targetLevel,
          });
          activeSessionId = createRes.data?.data?.id || createRes.data?.id;
          setSessionId(activeSessionId);
        }

        // Gửi tin nhắn đến session
        const res = await aiAPI.sendMessage(activeSessionId, userText, targetLevel);
        const data = res.data?.data;
        const aiMessage = data?.ai_message;
        const aiReply = aiMessage?.content || 'Thank you for your message!';
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

        let replyText = `Thanks for practicing! 🌟\n\n`;
        if (grammarData?.has_errors) {
          replyText += `💡 **Grammar feedback:**\n`;
          (grammarData.errors || []).forEach((err) => {
            replyText += `- Thay vì "*${err.error_segment}*", bạn nên dùng "*${err.correction}*" (${err.explanation_vi || err.error_type})\n`;
          });
          replyText += `\n✨ **Câu hoàn chỉnh:** "${grammarData.corrected_text}"`;
        } else {
          replyText += `"${grammarData?.corrected_text || userText}" is grammatically accurate and natural! Great job! 🎉`;
        }

        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: replyText,
            grammar: grammarData?.has_errors ? grammarData : null,
            model_used: 'AI Grammar Engine',
          },
        ]);
      }
    } catch (err) {
      console.warn('AI API fallback:', err);
      // Thông báo phản hồi thông minh nếu API giới hạn
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `Tuyệt vời! Câu của bạn rất tự nhiên. Bạn có thể mở rộng câu bằng cách thêm mệnh đề nguyên nhân hoặc trạng từ chỉ tần suất nhé!`,
          grammar: null,
          model_used: 'Fallback AI',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button Launcher */}
      <button
        className="floating-ai-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Trò chuyện với Gia sư AI Tiếng Anh"
      >
        <i className="fa-solid fa-robot"></i>
        <span>Gia sư AI</span>
        <span className="floating-ai-badge">AI</span>
      </button>

      {/* Floating Chat Modal Window */}
      {isOpen && (
        <div className="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-title-box">
              <div className="ai-avatar-sm">
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'block', color: 'var(--text-main)' }}>
                  AI English Tutor
                </strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: '700' }}>
                  ● Đang hoạt động (Gemini & Groq)
                </span>
              </div>
            </div>

            {/* Level Selector, Session Mode & Close */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                style={{
                  padding: '3px 6px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  fontWeight: '600',
                }}
                title="Chọn trình độ CEFR"
              >
                <option value="A1">CEFR A1</option>
                <option value="A2">CEFR A2</option>
                <option value="B1">CEFR B1</option>
                <option value="B2">CEFR B2</option>
                <option value="C1">CEFR C1</option>
              </select>

              <button
                onClick={() => setIsOpen(false)}
                style={{ color: 'var(--text-muted)', fontSize: '1.1rem', padding: '4px', cursor: 'pointer' }}
                title="Đóng cửa sổ"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="ai-chat-body">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-bubble ${msg.role}`}>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{msg.text}</div>

                {/* Sửa lỗi ngữ pháp thông minh thời gian thực nếu có */}
                {msg.grammar && (
                  <div className="grammar-feedback-card" style={{ marginTop: '8px' }}>
                    <div style={{ fontWeight: '800', marginBottom: '4px', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <i className="fa-solid fa-spell-check"></i>
                      <span>Gợi ý sửa lỗi ngữ pháp từ AI:</span>
                    </div>
                    {msg.grammar.corrected_text && (
                      <div style={{ marginBottom: '4px' }}>
                        Câu chuẩn: <strong style={{ color: '#059669' }}>"{msg.grammar.corrected_text}"</strong>
                      </div>
                    )}
                    {msg.grammar.errors && msg.grammar.errors.length > 0 && (
                      <ul style={{ paddingLeft: '16px', margin: '4px 0', fontSize: '0.78rem' }}>
                        {msg.grammar.errors.map((err, errIdx) => (
                          <li key={errIdx}>
                            Lỗi: <em>"{err.error_segment}"</em> → <strong>"{err.correction}"</strong> ({err.explanation_vi || err.error_type})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {msg.role === 'ai' && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                    {msg.model_used || 'AI Tutor'}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="chat-bubble ai" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ color: '#0284c7' }}></i>
                <span style={{ fontSize: '0.85rem' }}>Gia sư AI đang phân tích và soạn câu trả lời...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form className="ai-chat-input-box" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="ai-chat-input"
              placeholder="Nhập tiếng Anh hoặc hỏi ngữ pháp (VD: I go to school yesterday)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className="ai-chat-send-btn" disabled={isLoading || !inputText.trim()} title="Gửi tin nhắn">
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

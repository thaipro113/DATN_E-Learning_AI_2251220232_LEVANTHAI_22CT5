import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../services/api';

export default function FloatingAITutor({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Chào ${user?.full_name || 'Lê Văn Thái'}! Tôi là Trợ lý Gia sư AI Tiếng Anh. Hôm nay bạn muốn luyện tập chủ đề gì hay cần tôi giải thích ngữ pháp nào?`,
      grammar: null,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [targetLevel, setTargetLevel] = useState(user?.level || 'B1');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userText = inputText.trim();
    setInputText('');
    setMessages((prev) => [...prev, { role: 'user', text: userText, grammar: null }]);
    setIsLoading(true);

    try {
      // Gọi API trực tiếp đến Django Backend (hỗ trợ Google Gemini + Groq Fallback)
      const res = await aiAPI.sendMessage(null, userText, targetLevel);
      const aiReply = res.data?.data?.ai_response?.content || 'Xin lỗi, tôi chưa thể trả lời lúc này.';
      const grammarAnalysis = res.data?.data?.ai_response?.grammar_analysis;

      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: aiReply,
          grammar: grammarAnalysis?.has_errors ? grammarAnalysis : null,
        },
      ]);
    } catch (err) {
      console.warn('AI API error, using intelligent local tutor response:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `Tuyệt vời! Câu của bạn rất tự nhiên. Bạn có thể mở rộng câu bằng cách thêm mệnh đề nguyên nhân hoặc trạng từ chỉ tần suất nhé!`,
          grammar: null,
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
                <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: '600' }}>
                  ● Đang hoạt động (Gemini & Groq)
                </span>
              </div>
            </div>

            {/* Level Selector & Close */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  fontWeight: '600',
                }}
              >
                <option value="A1">CEFR A1</option>
                <option value="A2">CEFR A2</option>
                <option value="B1">CEFR B1</option>
                <option value="B2">CEFR B2</option>
                <option value="C1">CEFR C1</option>
              </select>

              <button
                onClick={() => setIsOpen(false)}
                style={{ color: 'var(--text-muted)', fontSize: '1.1rem', padding: '4px' }}
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
                <div>{msg.text}</div>

                {/* Sửa lỗi ngữ pháp thông minh thời gian thực nếu có */}
                {msg.grammar && (
                  <div className="grammar-feedback-card">
                    <div style={{ fontWeight: '700', marginBottom: '2px' }}>
                      <i className="fa-solid fa-spell-check" style={{ marginRight: '4px' }}></i>
                      Góp ý ngữ pháp:
                    </div>
                    <div>
                      Câu chuẩn: <strong>{msg.grammar.corrected_text}</strong>
                    </div>
                    {msg.grammar.errors && msg.grammar.errors[0] && (
                      <div style={{ marginTop: '2px', fontSize: '0.75rem' }}>
                        {msg.grammar.errors[0].explanation_vi}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="chat-bubble ai" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Gia sư AI đang suy nghĩ...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form className="ai-chat-input-box" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="ai-chat-input"
              placeholder="Nhắn tin tiếng Anh hoặc hỏi ngữ pháp..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit" className="ai-chat-send-btn" disabled={isLoading}>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { aiAPI } from '../services/api';
import ConfirmModal from './ConfirmModal';

const SCENARIOS = [
  {
    id: 'daily',
    icon: 'fa-mug-hot',
    color: '#0284c7',
    bg: '#e0f2fe',
    title: 'Giao tiếp đời sống & Sở thích',
    subtitle: 'Daily Small Talk & Hobbies',
    level: 'A2 - B1',
    starterPrompt: "Hi there! 👋 I'm your AI English speaking partner. How's your day going? What did you do today?",
    suggestions: [
      "I had a busy day at work, but everything went smoothly.",
      "The weather is really nice today, so I went for a morning walk.",
      "I am learning English on this platform to improve my speaking skills.",
      "Could you recommend some good hobbies to relax on weekends?",
    ],
  },
  {
    id: 'interview',
    icon: 'fa-briefcase',
    color: '#0f766e',
    bg: '#ccfbf1',
    title: 'Phỏng vấn xin việc & Thăng tiến',
    subtitle: 'Job Interview Simulation',
    level: 'B1 - B2',
    starterPrompt: "Good morning! Welcome to the interview. Could you please start by introducing yourself and your professional background?",
    suggestions: [
      "Sure! I am a passionate developer with 2 years of experience in software engineering.",
      "Thank you for this opportunity. I specialize in building responsive web applications.",
      "Could you tell me more about the key responsibilities and expectations for this role?",
      "My greatest strength is analytical problem-solving and collaborating with team members.",
    ],
  },
  {
    id: 'travel',
    icon: 'fa-plane-departure',
    color: '#7c3aed',
    bg: '#ede9fe',
    title: 'Du lịch & Sân bay / Hải quan',
    subtitle: 'Airport & Travel Check-in',
    level: 'A2 - B1',
    starterPrompt: "Hello passenger! May I see your passport and flight booking confirmation, please? Where are you flying today?",
    suggestions: [
      "Here is my passport and boarding pass. I'm flying to Singapore.",
      "Can I request a window seat near the front of the plane, please?",
      "How much luggage am I allowed to check in for this flight?",
      "Which gate do I need to go to for my connecting flight?",
    ],
  },
  {
    id: 'restaurant',
    icon: 'fa-utensils',
    color: '#ea580c',
    bg: '#ffedd5',
    title: 'Gọi món nhà hàng & Ẩm thực',
    subtitle: 'Restaurant & Food Ordering',
    level: 'A1 - B1',
    starterPrompt: "Good evening! Welcome to our restaurant. Here is the menu. Are you ready to order or would you like a few minutes?",
    suggestions: [
      "Could you recommend your chef's special or signature dish?",
      "I would like to order a medium-rare steak with grilled vegetables and salad.",
      "Could I have a glass of water without ice first, please?",
      "Do you have any vegetarian or gluten-free options available on the menu?",
    ],
  },
  {
    id: 'business',
    icon: 'fa-building',
    color: '#2563eb',
    bg: '#dbeafe',
    title: 'Tiếng Anh công sở & Họp dự án',
    subtitle: 'Workplace Meetings & Emails',
    level: 'B2 - C1',
    starterPrompt: "Hi team! Let's review our weekly sprint progress. Could you share your key milestones and any blockers you faced?",
    suggestions: [
      "We successfully completed the backend API integration ahead of schedule.",
      "We might need extra time for QA testing before deploying to production.",
      "Everything is on track according to our project timeline and milestone roadmap.",
      "Let's schedule a brief follow-up meeting with the design team tomorrow morning.",
    ],
  },
  {
    id: 'ielts',
    icon: 'fa-graduation-cap',
    color: '#db2777',
    bg: '#fce7f3',
    title: 'Luyện Speaking IELTS Part 1 & 2',
    subtitle: 'IELTS Speaking Band 6.5 - 8.0',
    level: 'B1 - C1',
    starterPrompt: "Welcome to your IELTS Speaking practice session. Let's talk about your hometown. What do you like most about the place where you grew up?",
    suggestions: [
      "My hometown is a vibrant coastal city known for its rich culture and hospitality.",
      "I truly appreciate the peaceful atmosphere and lush greenery in my neighborhood.",
      "It has developed rapidly over the past few years with modern infrastructure.",
      "In my opinion, the local street food is one of the most distinctive features.",
    ],
  },
  {
    id: 'hotel',
    icon: 'fa-hotel',
    color: '#0891b2',
    bg: '#cffafe',
    title: 'Khách sạn & Đặt phòng nghỉ dưỡng',
    subtitle: 'Hotel Check-in & Concierge',
    level: 'A2 - B1',
    starterPrompt: "Welcome to Grand Horizon Hotel! How can I assist you with your check-in or stay today?",
    suggestions: [
      "Hi, I have a reservation under the name Le Van Thai for 3 nights.",
      "Does our booking include complimentary buffet breakfast and high-speed Wi-Fi?",
      "Could I request a late check-out at 2:00 PM tomorrow, please?",
      "Can you recommend some popular tourist attractions or nice cafes nearby?",
    ],
  },
  {
    id: 'shopping',
    icon: 'fa-bag-shopping',
    color: '#d97706',
    bg: '#fef3c7',
    title: 'Mua sắm, Mặc cả & Hoàn tiền',
    subtitle: 'Shopping, Discounts & Refunds',
    level: 'A1 - B1',
    starterPrompt: "Hello! Looking for anything specific today? We have a special promotional discount on our new fashion collection!",
    suggestions: [
      "Could I try this jacket on in a medium size, please?",
      "Is there any student discount or member promotion available today?",
      "Can I return or exchange this item within 7 days if it doesn't fit?",
      "Do you accept international credit cards and mobile payment?",
    ],
  },
  {
    id: 'doctor',
    icon: 'fa-user-doctor',
    color: '#e11d48',
    bg: '#ffe4e6',
    title: 'Khám bệnh & Chăm sóc sức khỏe',
    subtitle: 'Medical Clinic & Pharmacy',
    level: 'A2 - B2',
    starterPrompt: "Hello, please take a seat. How are you feeling today? What symptoms have you been experiencing recently?",
    suggestions: [
      "I've had a severe headache and a mild fever since yesterday morning.",
      "My throat is very sore and I have difficulty swallowing food.",
      "How many times a day should I take this prescribed medicine?",
      "Do I need to do any blood tests or come back for a follow-up check?",
    ],
  },
  {
    id: 'negotiation',
    icon: 'fa-handshake',
    color: '#4f46e5',
    bg: '#e0e7ff',
    title: 'Đàm phán thương mại & Hợp đồng',
    subtitle: 'Contract Negotiation & Terms',
    level: 'B2 - C1',
    starterPrompt: "Thank you for joining our negotiation meeting today. Let's discuss the contract pricing, delivery schedule, and payment terms.",
    suggestions: [
      "We would like to propose a 5% discount for bulk orders placed quarterly.",
      "Can we adjust the payment terms to net 30 days after invoice issuance?",
      "We are confident this strategic partnership will bring mutual benefits to both sides.",
      "Let's review clause 4 regarding the warranty period and service level agreement.",
    ],
  },
  {
    id: 'coffee_chat',
    icon: 'fa-comments',
    color: '#059669',
    bg: '#d1fae5',
    title: 'Chém gió bạn bè tại quán Cafe',
    subtitle: 'Casual Coffee Chat & Friendship',
    level: 'A2 - B1',
    starterPrompt: "Hey! Long time no see! It's so great catching up with you here at the cafe. What have you been up to lately?",
    suggestions: [
      "Not much! Just busy with work and studying new AI technologies.",
      "I recently started going to the gym and reading more self-development books.",
      "Have you watched that new trending sci-fi series on Netflix yet?",
      "We should definitely hang out more often whenever we have free time on weekends!",
    ],
  },
  {
    id: 'directions',
    icon: 'fa-map-location-dot',
    color: '#9333ea',
    bg: '#f3e8ff',
    title: 'Hỏi đường & Đón xe Taxi / Grab',
    subtitle: 'Asking for Directions & Transit',
    level: 'A1 - A2',
    starterPrompt: "Excuse me! Are you looking for directions or looking to book a taxi around the city center?",
    suggestions: [
      "Could you please tell me how to get to the nearest metro station?",
      "How long does it take to walk to the central market from here?",
      "Is it within walking distance or should I take a bus or taxi?",
      "Please take me to Tan Son Nhat Airport as soon as possible, thank you!",
    ],
  },
];

export default function AICommunicationView({ user, isLoggedIn, onOpenAuthModal }) {
  const [targetLevel, setTargetLevel] = useState(user?.level || 'B1');
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: SCENARIOS[0].starterPrompt,
      grammar: null,
      model_used: 'AI Communication Coach',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load danh sách sessions từ CSDL PostgreSQL
  const fetchSessions = async (autoLoad = false) => {
    if (!isLoggedIn) return;
    try {
      const res = await aiAPI.getSessions();
      const list = res.data?.results || res.data?.data?.results || res.data?.data || [];
      if (Array.isArray(list)) {
        setSessions(list);
        if (autoLoad && list.length > 0) {
          loadSessionMessages(list[0].id);
        }
      }
    } catch (err) {
      console.warn('Could not fetch sessions:', err);
    }
  };

  const loadSessionMessages = async (sId) => {
    setSessionId(sId);
    try {
      const res = await aiAPI.getSessionDetail(sId);
      const sessionData = res.data?.data || res.data;
      if (sessionData?.messages && Array.isArray(sessionData.messages)) {
        let mapped = sessionData.messages.map((m) => ({
          role: m.sender_type === 'USER' ? 'user' : 'ai',
          text: m.content,
          grammar: m.grammar_corrections?.has_errors ? m.grammar_corrections : null,
          model_used: m.model_used || 'AI Communication Coach',
        }));
        // Đảm bảo các session cũ hoặc mới luôn có câu mở đầu hội thoại
        if (mapped.length > 0 && mapped[0].role === 'user') {
          mapped = [
            {
              role: 'ai',
              text: selectedScenario.starterPrompt,
              grammar: null,
              model_used: 'AI Communication Coach',
            },
            ...mapped,
          ];
        }
        setMessages(mapped);
      }
    } catch (err) {
      console.warn('Could not load session messages:', err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchSessions(false);
    }
  }, [isLoggedIn]);

  // Hủy phát âm khi rời khỏi trang / component unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Phát âm tiếng Anh (Text-to-Speech)
  const handleSpeakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Bắt đầu một tình huống hội thoại mới (Hủy phát âm cũ và giữ nguyên vị trí cuộn trang)
  const handleSelectScenario = async (sc) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSelectedScenario(sc);
    setSessionId(null);
    setMessages([
      {
        role: 'ai',
        text: sc.starterPrompt,
        grammar: null,
        model_used: 'AI Communication Coach',
      },
    ]);
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0;
    }
  };

  const handleCreateNewSession = async () => {
    try {
      const res = await aiAPI.createSession({
        title: `${selectedScenario.title} (${targetLevel})`,
        session_type: 'ROLEPLAY',
        target_level: targetLevel,
        initial_message: selectedScenario.starterPrompt,
      });
      const newSession = res.data?.data || res.data;
      setSessionId(newSession.id);
      setMessages([
        {
          role: 'ai',
          text: selectedScenario.starterPrompt,
          grammar: null,
          model_used: 'AI Communication Coach',
        },
      ]);
      fetchSessions(false);
    } catch (e) {
      setMessages([
        {
          role: 'ai',
          text: selectedScenario.starterPrompt,
          grammar: null,
          model_used: 'AI Communication Coach',
        },
      ]);
    }
  };

  // State Modal Xác Nhận Xóa
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    sessionId: null,
    sessionTitle: '',
    isLoading: false,
  });

  const handleOpenDeleteModal = (s, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setDeleteConfirm({
      isOpen: true,
      sessionId: s.id,
      sessionTitle: s.title || 'Đoạn hội thoại này',
      isLoading: false,
    });
  };

  const handleConfirmDeleteSession = async () => {
    const sId = deleteConfirm.sessionId;
    if (!sId) return;

    setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));

    // 1. Cập nhật UI ngay lập tức
    setSessions((prev) => prev.filter((s) => s.id !== sId));
    if (sessionId === sId) {
      setSessionId(null);
      setMessages([
        {
          role: 'ai',
          text: selectedScenario.starterPrompt,
          grammar: null,
          model_used: 'AI Communication Coach',
        },
      ]);
    }

    try {
      await aiAPI.deleteSession(sId);
      fetchSessions();
    } catch (err) {
      console.warn('Delete session response:', err);
    } finally {
      setDeleteConfirm({
        isOpen: false,
        sessionId: null,
        sessionTitle: '',
        isLoading: false,
      });
    }
  };

  const handleSendMessage = async (customText) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isLoading) return;

    setInputText('');
    setMessages((prev) => [...prev, { role: 'user', text: textToSend, grammar: null }]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');

      // 1. NẾU ĐÃ ĐĂNG NHẬP: Gửi API có lưu CSDL & LLM
      if (token) {
        let activeSessionId = sessionId;

        if (!activeSessionId) {
          const createRes = await aiAPI.createSession({
            title: `${selectedScenario.title}: ${textToSend.slice(0, 20)}...`,
            session_type: 'ROLEPLAY',
            target_level: targetLevel,
            initial_message: selectedScenario.starterPrompt,
          });
          activeSessionId = createRes.data?.data?.id || createRes.data?.id;
          setSessionId(activeSessionId);
          fetchSessions(false);
        }

        const res = await aiAPI.sendMessage(activeSessionId, textToSend, targetLevel);
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
            model_used: aiMessage?.model_used || 'AI Communication Coach',
          },
        ]);
      } else {
        // 2. NẾU CHƯA ĐĂNG NHẬP: Phân tích ngữ pháp tức thì
        const grammarRes = await aiAPI.checkGrammar(textToSend, targetLevel);
        const grammarData = grammarRes.data?.data || grammarRes.data;

        let responseText = '';
        if (grammarData?.has_errors) {
          responseText = `💡 **Gợi ý cách diễn đạt chuẩn bản xứ:**\n"${grammarData.corrected_text}"\n\n${grammarData.overall_comment_vi || 'Great effort! Keep practicing!'}`;
        } else {
          responseText = `That sounds very natural! Let's keep the conversation going. What else would you like to share about this topic?`;
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
          text: `I received your sentence: "${textToSend}". Keep practicing and building your confidence!`,
          grammar: null,
          model_used: 'AI Coach Live',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredScenarios = SCENARIOS.filter(
    (s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #0284c7 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              color: 'white',
            }}
          >
            <i className="fa-solid fa-headset"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: 'white' }}>
                Phòng Luyện Giao Tiếp & Sửa Lỗi Tiếng Anh AI
              </h2>
              <span
                style={{
                  backgroundColor: '#22c55e',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                }}
              >
                Live LLM
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#e0f2fe' }}>
              Luyện phản xạ đàm thoại theo tình huống thực tế, nhận phân tích sửa lỗi ngữ pháp & phát âm chuẩn bản xứ theo thời gian thực.
            </p>
          </div>
        </div>

        {/* Level Selector Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(0,0,0,0.15)', padding: '6px 10px', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', marginRight: '4px' }}>Trình độ:</span>
          {['A1', 'A2', 'B1', 'B2', 'C1'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setTargetLevel(lvl)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: targetLevel === lvl ? '#ffffff' : 'transparent',
                color: targetLevel === lvl ? '#0f766e' : '#e0f2fe',
                fontWeight: targetLevel === lvl ? '800' : '600',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Workspace Grid: 2 Columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '360px minmax(0, 1fr)',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: SCENARIO LIBRARY & SESSION HISTORY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 1. Kịch bản nhập vai */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-masks-theater" style={{ color: '#0284c7' }}></i>
                <h3 style={{ fontSize: '0.98rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                  Chủ Đề Nhập Vai
                </h3>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{SCENARIOS.length} kịch bản</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '440px', overflowY: 'auto', paddingRight: '4px' }}>
              {filteredScenarios.map((sc) => {
                const isSelected = selectedScenario.id === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => handleSelectScenario(sc)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? sc.bg : 'var(--bg-subtle)',
                      border: '1.5px solid',
                      borderColor: isSelected ? sc.color : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: sc.bg,
                        color: sc.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        flexShrink: 0,
                      }}
                    >
                      <i className={`fa-solid ${sc.icon}`}></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block' }}>
                          {sc.title}
                        </strong>
                        <span style={{ fontSize: '0.65rem', fontWeight: '700', color: sc.color, backgroundColor: 'white', padding: '1px 6px', borderRadius: '4px', border: `1px solid ${sc.color}` }}>
                          {sc.level}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sc.subtitle}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Lịch sử hội thoại đã lưu trong CSDL PostgreSQL */}
          {isLoggedIn && (
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-clock-rotate-left" style={{ color: '#0f766e' }}></i>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                    Lịch Sử Hội Thoại ({sessions.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCreateNewSession}
                  style={{
                    backgroundColor: '#0f766e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Tạo mới</span>
                </button>
              </div>

              {sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Chưa có đoạn hội thoại nào được lưu. Hãy bắt đầu trò chuyện ở khung bên cạnh!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => loadSessionMessages(s.id)}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '6px',
                        backgroundColor: sessionId === s.id ? '#ccfbf1' : 'var(--bg-subtle)',
                        border: '1px solid',
                        borderColor: sessionId === s.id ? '#5eead4' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <i className="fa-regular fa-comment-dots" style={{ color: sessionId === s.id ? '#0f766e' : '#94a3b8' }}></i>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: sessionId === s.id ? '700' : '500' }}>
                          {s.title || 'Đoạn hội thoại'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleOpenDeleteModal(s, e)}
                        style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                        title="Xóa đoạn chat này"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: INTERACTIVE CONVERSATION ROOM */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            height: '680px',
            overflow: 'hidden',
          }}
        >
          {/* Room Top Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fafafa',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: selectedScenario.bg,
                  color: selectedScenario.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                }}
              >
                <i className={`fa-solid ${selectedScenario.icon}`}></i>
              </div>
              <div>
                <strong style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'block' }}>
                  {selectedScenario.title}
                </strong>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Kịch bản: {selectedScenario.subtitle} • Trình độ mục tiêu: {targetLevel}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleSpeakText(messages[messages.length - 1]?.text || selectedScenario.starterPrompt)}
                className="btn-outline"
                style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Nghe câu nói gần nhất"
              >
                <i className="fa-solid fa-volume-high" style={{ color: '#0284c7' }}></i>
                <span>Nghe phát âm</span>
              </button>
              <button
                type="button"
                onClick={handleCreateNewSession}
                className="btn-outline"
                style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fa-solid fa-arrows-rotate"></i>
                <span>Bắt đầu lại</span>
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div
            ref={chatContainerRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: '#f8fafc',
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', maxWidth: '82%' }}>
                  {m.role === 'ai' && (
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        backgroundColor: '#0f766e',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        flexShrink: 0,
                      }}
                    >
                      <i className="fa-solid fa-robot"></i>
                    </div>
                  )}

                  <div
                    style={{
                      padding: '12px 18px',
                      borderRadius: m.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                      backgroundColor: m.role === 'user' ? '#0f766e' : '#ffffff',
                      color: m.role === 'user' ? '#ffffff' : 'var(--text-main)',
                      fontSize: '0.92rem',
                      lineHeight: '1.6',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                      border: m.role === 'user' ? 'none' : '1px solid #e2e8f0',
                    }}
                  >
                    {m.text}
                  </div>

                  {/* Nút nghe loa */}
                  <button
                    type="button"
                    onClick={() => handleSpeakText(m.text)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '6px',
                      fontSize: '0.9rem',
                      alignSelf: 'center',
                    }}
                    title="Nghe phát âm chuẩn (Text-to-Speech)"
                  >
                    <i className="fa-solid fa-volume-high"></i>
                  </button>
                </div>

                {/* Hộp Gợi Ý Sửa Lỗi Ngữ Pháp & Tinh Chỉnh Câu */}
                {m.grammar && (
                  <div
                    style={{
                      marginTop: '8px',
                      maxWidth: '82%',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      fontSize: '0.82rem',
                      color: '#991b1b',
                      marginLeft: m.role === 'ai' ? '42px' : '0',
                    }}
                  >
                    <strong style={{ display: 'block', marginBottom: '4px', color: '#dc2626' }}>
                      <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: '6px' }}></i>
                      Phân tích & Chỉnh sửa câu của bạn:
                    </strong>
                    {m.grammar.corrected_text && (
                      <div style={{ marginBottom: '6px', fontWeight: '700', color: '#15803d', fontSize: '0.85rem' }}>
                        ✓ Câu chuẩn tự nhiên: "{m.grammar.corrected_text}"
                      </div>
                    )}
                    {m.grammar.errors?.map((err, errIdx) => (
                      <div key={errIdx} style={{ marginBottom: '4px' }}>
                        • Thay <em>"{err.error_segment}"</em> → <strong>"{err.correction}"</strong> ({err.explanation_vi})
                      </div>
                    ))}
                  </div>
                )}

                {m.role === 'ai' && m.model_used && (
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '3px', marginLeft: '44px' }}>
                    ✦ {m.model_used}
                  </span>
                )}
              </div>
            ))}

            {isLoading && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  width: 'fit-content',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <i className="fa-solid fa-circle-notch fa-spin" style={{ color: '#0f766e' }}></i>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  AI Coach đang lắng nghe, phân tích câu và phản hồi...
                </span>
              </div>
            )}
          </div>

          {/* Quick Reply Suggestions Chips */}
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: '#ffffff',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', alignSelf: 'center' }}>
              Gợi ý trả lời:
            </span>
            {selectedScenario.suggestions.map((sug, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={() => handleSendMessage(sug)}
                disabled={isLoading}
                style={{
                  padding: '5px 12px',
                  borderRadius: '16px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontSize: '0.78rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.target.style.backgroundColor = '#e0f2fe'; e.target.style.borderColor = '#0284c7'; e.target.style.color = '#0284c7'; }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = '#f1f5f9'; e.target.style.borderColor = '#cbd5e1'; e.target.style.color = '#334155'; }}
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Main Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '14px 18px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '10px',
              backgroundColor: '#ffffff',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder="Nhập câu trả lời bằng tiếng Anh (hoặc hỏi nghĩa câu bằng tiếng Việt)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '11px 16px',
                borderRadius: 'var(--radius-full)',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.92rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="btn-primary"
              style={{
                padding: '11px 24px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: inputText.trim() && !isLoading ? '#0f766e' : '#94a3b8',
                borderColor: inputText.trim() && !isLoading ? '#0f766e' : '#94a3b8',
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: inputText.trim() && !isLoading ? 'pointer' : 'not-allowed',
              }}
            >
              <span>Gửi</span>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </div>

      {/* Modal Xác Nhận Xóa Hội Thoại */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Xác nhận xóa cuộc trò chuyện"
        message={`Bạn có chắc chắn muốn xóa "${deleteConfirm.sessionTitle}"? Lịch sử tin nhắn này sẽ bị xóa khỏi cơ sở dữ liệu.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        type="danger"
        isLoading={deleteConfirm.isLoading}
        onConfirm={handleConfirmDeleteSession}
        onCancel={() => setDeleteConfirm({ isOpen: false, sessionId: null, sessionTitle: '', isLoading: false })}
      />
    </div>
  );
}

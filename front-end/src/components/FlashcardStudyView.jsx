import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  getAllDecksWithWords,
  canUserAccessDeck,
  getStoredCustomDecks,
  saveStoredCustomDecks,
  getStoredCustomWords,
  saveStoredCustomWords,
  VOCABULARY_DECKS,
  speakWord,
} from '../utils/flashcardStorage';

export default function FlashcardStudyView({
  user,
  myCourses = [],
  onRecordStudySession,
  initialDeckId = null,
  onNavigateToCourse = null,
}) {
  // 1. State danh sách các Chủ đề / Bộ thẻ tự tạo (Lưu vào localStorage)
  const [customDecks, setCustomDecks] = useState(() => getStoredCustomDecks());
  useEffect(() => {
    saveStoredCustomDecks(customDecks);
  }, [customDecks]);

  // 2. State từ vựng tự tạo (gắn theo từng deckId, lưu vào localStorage)
  const [customWords, setCustomWords] = useState(() => getStoredCustomWords());
  useEffect(() => {
    saveStoredCustomWords(customWords);
  }, [customWords]);

  // 3. Tổng hợp danh sách tất cả các bộ thẻ và LỌC QUYỀN TRUY CẬP (Đã đăng ký khóa học hoặc Public)
  const allDecks = useMemo(() => {
    const raw = getAllDecksWithWords(user, customDecks, customWords);
    return raw.filter((deck) => canUserAccessDeck(deck, user, myCourses));
  }, [user, customDecks, customWords, myCourses]);

  // Bộ lọc danh mục: 'ALL' | 'system' | 'teacher' | 'personal'
  const [deckCategoryFilter, setDeckCategoryFilter] = useState('ALL');
  // Lọc theo Giảng viên cụ thể
  const [teacherFilter, setTeacherFilter] = useState('ALL');
  // Ô tìm kiếm bộ thẻ
  const [deckSearchQuery, setDeckSearchQuery] = useState('');

  // Danh sách các giảng viên có bộ thẻ
  const availableTeachers = useMemo(() => {
    const set = new Set();
    allDecks.forEach((d) => {
      if (d.authorRole === 'TEACHER' && d.author) {
        set.add(d.author);
      }
    });
    return Array.from(set);
  }, [allDecks]);

  // Danh sách bộ thẻ sau khi lọc
  const filteredDecks = useMemo(() => {
    return allDecks.filter((deck) => {
      // 1. Lọc theo danh mục
      if (deckCategoryFilter === 'system' && deck.category !== 'system' && deck.authorRole !== 'ADMIN') return false;
      if (deckCategoryFilter === 'teacher' && deck.category !== 'teacher' && deck.authorRole !== 'TEACHER') return false;
      if (deckCategoryFilter === 'personal' && deck.category !== 'personal' && deck.id !== 'custom_personal' && deck.authorRole !== 'STUDENT') return false;

      // 2. Lọc theo Giảng viên
      if (teacherFilter !== 'ALL' && deck.author !== teacherFilter) return false;

      // 3. Tìm kiếm từ khóa
      if (deckSearchQuery.trim()) {
        const q = deckSearchQuery.toLowerCase().trim();
        const matchTitle = deck.title.toLowerCase().includes(q);
        const matchDesc = deck.description?.toLowerCase().includes(q);
        const matchAuthor = deck.author?.toLowerCase().includes(q);
        const matchCourse = deck.courseTitle?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchAuthor && !matchCourse) return false;
      }
      return true;
    });
  }, [allDecks, deckCategoryFilter, teacherFilter, deckSearchQuery]);

  // State quản lý bộ thẻ & thẻ hiện tại
  const [selectedDeckId, setSelectedDeckId] = useState(() => initialDeckId || 'daily_life');

  // Tự động chuyển đến bộ thẻ ban đầu nếu được truyền từ ngoài (ví dụ từ phòng học) hoặc reset khi bộ thẻ hiện tại không có quyền truy cập
  useEffect(() => {
    if (initialDeckId && allDecks.some((d) => d.id === initialDeckId)) {
      setSelectedDeckId(initialDeckId);
      const target = allDecks.find((d) => d.id === initialDeckId);
      if (target?.category) {
        setDeckCategoryFilter(target.category);
      }
    } else if (allDecks.length > 0 && !allDecks.some((d) => d.id === selectedDeckId)) {
      setSelectedDeckId(allDecks[0].id);
    }
  }, [initialDeckId, allDecks, selectedDeckId]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0); // 1.0x hoặc 0.8x
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoPronounce, setAutoPronounce] = useState(false);

  // State Modal Tạo Chủ Đề / Bộ Thẻ Mới
  const [isCreateDeckModalOpen, setIsCreateDeckModalOpen] = useState(false);
  const [newDeckForm, setNewDeckForm] = useState({
    title: '',
    level: 'B1 - B2',
    color: '#0284c7',
    description: '',
  });
  const [createDeckError, setCreateDeckError] = useState('');

  // State Modal Thêm Từ Vựng Mới
  const [isAddWordModalOpen, setIsAddWordModalOpen] = useState(false);
  const [newWordForm, setNewWordForm] = useState({
    deckId: 'daily_life',
    word: '',
    ipa: '',
    type: 'Noun',
    meaning: '',
    english_def: '',
    example: '',
    example_vi: '',
    collocation: '',
  });
  const [addWordError, setAddWordError] = useState('');

  // Tiến độ ghi nhớ từ vựng (Lưu tạm vào State / LocalStorage)
  const [masteredWordIds, setMasteredWordIds] = useState(() => {
    try {
      const saved = localStorage.getItem('flashcard_mastered_words');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [reviewWordIds, setReviewWordIds] = useState(() => {
    try {
      const saved = localStorage.getItem('flashcard_review_words');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Chế độ kiểm tra nhanh Mini-Quiz (5 câu hỏi)
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Chế độ lọc học: 'ALL' (toàn bộ thẻ trong bộ) | 'REVIEW_ONLY' (chỉ các từ cần ôn lại)
  const [studyFilterMode, setStudyFilterMode] = useState('ALL');

  // Lấy bộ thẻ đang chọn
  const currentDeck = allDecks.find((d) => d.id === selectedDeckId) || allDecks[0];
  const allDeckCards = currentDeck ? (currentDeck.cards || []) : [];

  // Thống kê số lượng theo trạng thái ghi nhớ trong bộ thẻ
  const deckMasteredCount = allDeckCards.filter((c) => masteredWordIds.includes(c.id)).length;
  const deckReviewCount = allDeckCards.filter((c) => reviewWordIds.includes(c.id)).length;

  // Lọc thẻ theo chế độ học (Tất cả hoặc Chỉ từ cần ôn lại)
  const cards = useMemo(() => {
    if (studyFilterMode === 'REVIEW_ONLY') {
      return allDeckCards.filter((c) => reviewWordIds.includes(c.id));
    }
    return allDeckCards;
  }, [allDeckCards, studyFilterMode, reviewWordIds]);

  const currentCard = cards.length > 0 ? (cards[currentCardIndex] || cards[0]) : null;

  // Lưu tiến độ vào LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('flashcard_mastered_words', JSON.stringify(masteredWordIds));
      localStorage.setItem('flashcard_review_words', JSON.stringify(reviewWordIds));
    } catch (e) {}
  }, [masteredWordIds, reviewWordIds]);

  // Reset thẻ khi đổi bộ
  useEffect(() => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsQuizMode(false);
    setStudyFilterMode('ALL');
  }, [selectedDeckId]);

  // Đảm bảo currentCardIndex hợp lệ khi danh sách thẻ thay đổi (ví dụ khi thẻ được chuyển trạng thái hoặc xóa)
  useEffect(() => {
    if (cards.length > 0 && currentCardIndex >= cards.length) {
      setCurrentCardIndex(Math.max(0, cards.length - 1));
    }
  }, [cards.length, currentCardIndex]);

  // Tự động phát âm khi chuyển thẻ nếu bật Auto-pronounce
  useEffect(() => {
    if (autoPronounce && currentCard && currentCard.word) {
      handlePronounce(currentCard.word);
    }
  }, [currentCardIndex, autoPronounce, selectedDeckId, studyFilterMode]);

  // Hủy âm thanh khi unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 1. Hàm phát âm giọng đọc bản xứ bằng Web Speech API
  const handlePronounce = (textToSpeak, e) => {
    if (e) e.stopPropagation();
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ tính năng phát âm Text-to-Speech.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'en-US';
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // 2. Lật thẻ
  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  // 3. Đánh dấu "Đã thuộc"
  const handleMarkMastered = () => {
    if (!currentCard) return;
    if (!masteredWordIds.includes(currentCard.id)) {
      setMasteredWordIds((prev) => [...prev, currentCard.id]);
    }
    setReviewWordIds((prev) => prev.filter((id) => id !== currentCard.id));

    // Ghi nhận phiên học cho Streak
    if (onRecordStudySession) {
      onRecordStudySession();
    }

    if (studyFilterMode === 'REVIEW_ONLY') {
      setIsFlipped(false);
      if (currentCardIndex >= cards.length - 1) {
        setCurrentCardIndex(Math.max(0, cards.length - 2));
      }
    } else {
      handleNextCard();
    }
  };

  // 4. Đánh dấu "Cần ôn lại"
  const handleMarkReview = () => {
    if (!currentCard) return;
    if (!reviewWordIds.includes(currentCard.id)) {
      setReviewWordIds((prev) => [...prev, currentCard.id]);
      setMasteredWordIds((prev) => prev.filter((id) => id !== currentCard.id));
    }
    handleNextCard();
  };

  // 5. Thêm thẻ từ vựng mới (gắn vào đúng chủ đề được chọn)
  const handleSaveNewWord = (e) => {
    e.preventDefault();
    if (!newWordForm.word.trim()) {
      setAddWordError('Vui lòng nhập từ vựng tiếng Anh.');
      return;
    }
    if (!newWordForm.meaning.trim()) {
      setAddWordError('Vui lòng nhập nghĩa tiếng Việt.');
      return;
    }

    const targetDeck = newWordForm.deckId || selectedDeckId || 'daily_life';

    const newCard = {
      id: `custom_${Date.now()}`,
      deckId: targetDeck,
      isCustom: true,
      word: newWordForm.word.trim(),
      ipa: newWordForm.ipa.trim() || `/${newWordForm.word.trim().toLowerCase()}/`,
      type: newWordForm.type,
      meaning: newWordForm.meaning.trim(),
      english_def: newWordForm.english_def.trim() || 'Custom user vocabulary word.',
      example: newWordForm.example.trim() || `Example with "${newWordForm.word.trim()}".`,
      example_vi: newWordForm.example_vi.trim() || `Ví dụ với từ "${newWordForm.word.trim()}".`,
      collocation: newWordForm.collocation.trim(),
    };

    setCustomWords((prev) => [newCard, ...prev]);
    setIsAddWordModalOpen(false);
    setNewWordForm({
      deckId: targetDeck,
      word: '',
      ipa: '',
      type: 'Noun',
      meaning: '',
      english_def: '',
      example: '',
      example_vi: '',
      collocation: '',
    });
    setAddWordError('');

    // Chuyển sang xem đúng chủ đề vừa thêm từ và đặt vào thẻ mới tạo
    setSelectedDeckId(targetDeck);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  // 6. Xóa thẻ từ vựng tự tạo
  const handleDeleteCustomCard = (cardId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa thẻ từ vựng này khỏi bộ thẻ?')) {
      return;
    }
    setCustomWords((prev) => prev.filter((c) => c.id !== cardId));
    setMasteredWordIds((prev) => prev.filter((id) => id !== cardId));
    setReviewWordIds((prev) => prev.filter((id) => id !== cardId));
    setCurrentCardIndex(0);
  };

  // 7. Tạo chủ đề / bộ thẻ mới (Dành cho Giáo viên & Admin)
  const handleCreateNewDeck = (e) => {
    e.preventDefault();
    if (!newDeckForm.title.trim()) {
      setCreateDeckError('Vui lòng nhập tên chủ đề từ vựng.');
      return;
    }

    const newDeck = {
      id: `deck_${Date.now()}`,
      title: newDeckForm.title.trim(),
      level: newDeckForm.level || 'B1 - B2',
      color: newDeckForm.color || '#0284c7',
      description: newDeckForm.description.trim() || 'Chủ đề từ vựng chuyên đề do giáo viên / quản trị viên biên soạn.',
      icon: 'fa-layer-group',
      isCustomDeck: true,
    };

    setCustomDecks((prev) => [...prev, newDeck]);
    setIsCreateDeckModalOpen(false);
    setNewDeckForm({
      title: '',
      level: 'B1 - B2',
      color: '#0284c7',
      description: '',
    });
    setCreateDeckError('');

    // Chuyển sang chủ đề vừa tạo
    setSelectedDeckId(newDeck.id);
    setCurrentCardIndex(0);
  };

  // 8. Xóa chủ đề tự tạo
  const handleDeleteDeck = (deckId, deckTitle, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa chủ đề "${deckTitle}" cùng tất cả các từ vựng bên trong?`)) {
      return;
    }
    setCustomDecks((prev) => prev.filter((d) => d.id !== deckId));
    setCustomWords((prev) => prev.filter((w) => w.deckId !== deckId));
    if (selectedDeckId === deckId) {
      setSelectedDeckId('daily_life');
    }
  };

  // Chuyển thẻ tiếp theo
  const handleNextCard = () => {
    setIsFlipped(false);
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      setCurrentCardIndex(0); // Lặp lại từ đầu
    }
  };

  // Quay lại thẻ trước
  const handlePrevCard = () => {
    setIsFlipped(false);
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
    } else {
      setCurrentCardIndex(cards.length - 1);
    }
  };

  // Xáo trộn thẻ ngẫu nhiên
  const handleShuffle = () => {
    const randomIndex = Math.floor(Math.random() * cards.length);
    setCurrentCardIndex(randomIndex);
    setIsFlipped(false);
  };

  // 5. Khởi tạo bài kiểm tra nhanh Mini-Quiz (5 câu ngẫu nhiên)
  const handleStartMiniQuiz = () => {
    const shuffledCards = [...cards].sort(() => 0.5 - Math.random());
    const selectedFive = shuffledCards.slice(0, 5);

    const questions = selectedFive.map((card) => {
      // 1 đáp án đúng + 3 đáp án sai từ các thẻ khác
      const otherCards = cards.filter((c) => c.id !== card.id).sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = [
        { text: card.meaning, isCorrect: true },
        ...otherCards.map((c) => ({ text: c.meaning, isCorrect: false })),
      ].sort(() => 0.5 - Math.random());

      return {
        word: card.word,
        ipa: card.ipa,
        type: card.type,
        options,
      };
    });

    setQuizQuestions(questions);
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
    setIsQuizMode(true);
  };

  // Trả lời câu hỏi trong quiz
  const handleSelectQuizAnswer = (option) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(option);

    if (option.isCorrect) {
      setQuizScore((prev) => prev + 1);
    }

    setTimeout(() => {
      if (currentQuizIndex < quizQuestions.length - 1) {
        setCurrentQuizIndex((prev) => prev + 1);
        setSelectedAnswer(null);
      } else {
        setQuizFinished(true);
        // Ghi nhận Streak học hôm nay khi hoàn thành quiz
        if (onRecordStudySession) {
          onRecordStudySession();
        }
      }
    }, 1200);
  };

  // Thống kê tiến độ bộ thẻ hiện tại
  const deckCardsCount = allDeckCards.length;
  const progressPercent = deckCardsCount > 0 ? Math.round((deckMasteredCount / deckCardsCount) * 100) : 0;
  const isCurrentMastered = currentCard ? masteredWordIds.includes(currentCard.id) : false;
  const isCurrentReview = currentCard ? reviewWordIds.includes(currentCard.id) : false;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px 16px', color: '#1e293b' }}>
      {/* Banner Giới thiệu Flashcards */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)',
          borderRadius: '20px',
          padding: '26px 30px',
          color: '#ffffff',
          marginBottom: '24px',
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.2)', fontSize: '0.78rem', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '8px' }}>
            <i className="fa-solid fa-volume-high" style={{ color: '#fef08a' }}></i>
            <span>HỌC TỪ VỰNG TƯƠNG TÁC & PHÁT ÂM CHUẨN IPA</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '900', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Thẻ Ghi Nhớ Thông Minh (Smart Flashcards)
          </h1>
          <p style={{ margin: 0, fontSize: '0.92rem', color: '#bfdbfe', maxWidth: '650px', lineHeight: '1.5' }}>
            Luyện trí nhớ dài hạn với phương pháp lật thẻ (Active Recall) kết hợp giọng phát âm bản xứ (Audio Speech) và kiểm tra phản xạ tức thì.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Nút Tạo Chủ Đề / Bộ Thẻ Mới (Dành cho Giáo viên & Admin) */}
          <button
            onClick={() => {
              setNewDeckForm({
                title: '',
                level: 'B1 - B2',
                color: '#0284c7',
                description: '',
              });
              setCreateDeckError('');
              setIsCreateDeckModalOpen(true);
            }}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              transition: 'transform 0.15s ease',
            }}
            title="Tạo chủ đề / bộ thẻ từ vựng mới (Giáo viên & Admin)"
          >
            <i className="fa-solid fa-folder-plus"></i>
            <span>+ Tạo chủ đề mới</span>
          </button>

          {/* Nút Thêm Từ Vựng Mới (Có dropdown chọn chủ đề muốn thêm vào) */}
          <button
            onClick={() => {
              setNewWordForm({
                deckId: selectedDeckId,
                word: '',
                ipa: '',
                type: 'Noun',
                meaning: '',
                english_def: '',
                example: '',
                example_vi: '',
                collocation: '',
              });
              setAddWordError('');
              setIsAddWordModalOpen(true);
            }}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
              transition: 'transform 0.15s ease',
            }}
            title="Thêm từ vựng mới vào chủ đề đã chọn"
          >
            <i className="fa-solid fa-plus-circle"></i>
            <span>+ Thêm từ vựng mới</span>
          </button>

          {!isQuizMode && (
            <button
              onClick={handleStartMiniQuiz}
              disabled={cards.length === 0}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                backgroundColor: cards.length === 0 ? '#94a3b8' : '#f59e0b',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: '800',
                cursor: cards.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: cards.length === 0 ? 'none' : '0 4px 12px rgba(245, 158, 11, 0.4)',
              }}
            >
              <i className="fa-solid fa-bolt"></i>
              <span>Kiểm tra nhanh 5 câu</span>
            </button>
          )}
        </div>
      </div>

      {/* Thanh Điều Hướng Danh Mục & Bộ Lọc Tác Giả (Admin / Giảng Viên / Khóa Học / Cá Nhân) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '18px',
          padding: '12px 16px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Pills chuyển danh mục */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => { setDeckCategoryFilter('ALL'); setTeacherFilter('ALL'); }}
            style={{
              padding: '7px 14px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: deckCategoryFilter === 'ALL' ? '#0284c7' : '#f1f5f9',
              color: deckCategoryFilter === 'ALL' ? '#ffffff' : '#475569',
              fontSize: '0.82rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Tất Cả Bộ Thẻ ({allDecks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setDeckCategoryFilter('system'); setTeacherFilter('ALL'); }}
            style={{
              padding: '7px 14px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: deckCategoryFilter === 'system' ? '#0284c7' : '#f1f5f9',
              color: deckCategoryFilter === 'system' ? '#ffffff' : '#475569',
              fontSize: '0.82rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <i className="fa-solid fa-shield-halved" style={{ color: deckCategoryFilter === 'system' ? '#ffffff' : '#0284c7' }}></i>
            <span>Chuẩn Hệ Thống CEFR ({allDecks.filter((d) => d.category === 'system' || d.authorRole === 'ADMIN').length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setDeckCategoryFilter('teacher'); }}
            style={{
              padding: '7px 14px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: deckCategoryFilter === 'teacher' ? '#ea580c' : '#f1f5f9',
              color: deckCategoryFilter === 'teacher' ? '#ffffff' : '#475569',
              fontSize: '0.82rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <i className="fa-solid fa-chalkboard-user" style={{ color: deckCategoryFilter === 'teacher' ? '#ffffff' : '#ea580c' }}></i>
            <span>Từ Vựng Giảng Viên & Khóa Học ({allDecks.filter((d) => d.category === 'teacher' || d.authorRole === 'TEACHER').length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setDeckCategoryFilter('personal'); setTeacherFilter('ALL'); }}
            style={{
              padding: '7px 14px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: deckCategoryFilter === 'personal' ? '#8b5cf6' : '#f1f5f9',
              color: deckCategoryFilter === 'personal' ? '#ffffff' : '#475569',
              fontSize: '0.82rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <i className="fa-solid fa-book-bookmark" style={{ color: deckCategoryFilter === 'personal' ? '#ffffff' : '#8b5cf6' }}></i>
            <span>Sổ Tay Cá Nhân ({allDecks.filter((d) => d.category === 'personal' || d.id === 'custom_personal' || d.authorRole === 'STUDENT').length})</span>
          </button>
        </div>

        {/* Cụm lọc chi tiết bên phải */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Dropdown lọc theo giảng viên nếu có giảng viên */}
          {availableTeachers.length > 0 && (
            <select
              value={teacherFilter}
              onChange={(e) => {
                setTeacherFilter(e.target.value);
                if (e.target.value !== 'ALL') setDeckCategoryFilter('teacher');
              }}
              style={{
                height: '34px',
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: '700',
                color: '#334155',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="ALL">Tất cả giảng viên</option>
              {availableTeachers.map((teachName, idx) => (
                <option key={idx} value={teachName}>
                  {teachName}
                </option>
              ))}
            </select>
          )}

          {/* Ô tìm kiếm bộ thẻ */}
          <div style={{ position: 'relative', width: '220px' }}>
            <i
              className="fa-solid fa-magnifying-glass"
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.75rem',
                color: '#94a3b8',
              }}
            ></i>
            <input
              type="text"
              placeholder="Tìm bộ thẻ, khóa học..."
              value={deckSearchQuery}
              onChange={(e) => setDeckSearchQuery(e.target.value)}
              style={{
                height: '34px',
                width: '100%',
                padding: '0 10px 0 28px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabs chọn Chủ đề / Bộ thẻ (bao gồm các bộ CEFR & các bộ Giảng viên/Khóa học) */}
      {filteredDecks.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '40px 20px', textAlign: 'center', border: '1px dashed #cbd5e1', color: '#64748b', marginBottom: '22px' }}>
          <i className="fa-solid fa-folder-open" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '12px' }}></i>
          <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e293b', margin: '0 0 6px 0' }}>
            {deckCategoryFilter === 'teacher' ? 'Chưa có bộ thẻ từ vựng giảng viên nào được mở khóa' : 'Không tìm thấy bộ thẻ nào phù hợp'}
          </h4>
          <p style={{ fontSize: '0.85rem', margin: '0 0 14px 0', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
            {deckCategoryFilter === 'teacher'
              ? 'Các bộ thẻ này gắn liền với từng khóa học độc quyền. Chỉ học viên đã đăng ký khóa học (hoặc bộ thẻ được giảng viên chọn tự do/public) mới hiển thị tại đây.'
              : 'Hãy thử chọn danh mục khác hoặc xóa bộ lọc tìm kiếm.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setDeckCategoryFilter('ALL'); setTeacherFilter('ALL'); setDeckSearchQuery(''); }}
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              Xem tất cả bộ thẻ
            </button>
            {deckCategoryFilter === 'teacher' && onNavigateToCourse && (
              <button
                type="button"
                className="btn-primary"
                onClick={onNavigateToCourse}
                style={{ fontSize: '0.82rem', padding: '6px 14px', backgroundColor: '#0284c7' }}
              >
                <i className="fa-solid fa-graduation-cap" style={{ marginRight: '6px' }}></i>
                Khám phá khóa học
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '22px' }}>
          {filteredDecks.map((deck) => {
            const isSelected = selectedDeckId === deck.id;
            const totalInDeck = deck.cards?.length || 0;
            const masteredInDeck = (deck.cards || []).filter((c) => masteredWordIds.includes(c.id)).length;
            const percent = totalInDeck > 0 ? Math.round((masteredInDeck / totalInDeck) * 100) : 0;

            return (
              <div
                key={deck.id}
                onClick={() => setSelectedDeckId(deck.id)}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  border: isSelected ? `2px solid ${deck.color}` : '1px solid #e2e8f0',
                  boxShadow: isSelected ? `0 6px 20px -2px ${deck.color}30` : '0 2px 4px rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {/* Hàng 1: Trình độ + Badge nhận diện Tác giả */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: '800', color: deck.color, backgroundColor: `${deck.color}15`, padding: '2px 8px', borderRadius: '6px' }}>
                        {deck.level}
                      </span>
                      {deck.authorRole === 'ADMIN' ? (
                        <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fa-solid fa-shield-halved"></i> Hệ thống
                        </span>
                      ) : deck.authorRole === 'TEACHER' ? (
                        <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#ea580c', backgroundColor: '#fff7ed', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #ffedd5' }}>
                          <i className="fa-solid fa-chalkboard-user"></i> {deck.author}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#8b5cf6', backgroundColor: '#f3e8ff', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fa-solid fa-user-pen"></i> Cá nhân
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>
                        {masteredInDeck}/{totalInDeck} từ
                      </span>

                      {deck.isCustomDeck && (deck.authorRole === 'STUDENT' || deck.id === 'custom_personal') && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDeck(deck.id, deck.title, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            fontSize: '0.8rem',
                            transition: 'color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                          title="Xóa chủ đề tự tạo này"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hàng 2: Tiêu đề bộ thẻ */}
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: '800', color: '#0f172a', lineHeight: '1.3' }}>
                    {deck.title}
                  </h4>

                  {/* Hàng 3: Khóa học liên kết (Course Badge nếu có) & Huy hiệu quyền truy cập */}
                  {deck.courseTitle && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.72rem', color: '#475569', fontWeight: '700', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <i className="fa-solid fa-graduation-cap" style={{ color: '#0284c7' }}></i>
                      <span>Khóa: {deck.courseTitle}</span>
                      {deck.accessScope === 'PUBLIC' || deck.isPublic ? (
                        <span style={{ fontSize: '0.68rem', color: '#059669', backgroundColor: '#ecfdf5', padding: '1px 6px', borderRadius: '4px', marginLeft: '2px', border: '1px solid #d1fae5' }}>
                          <i className="fa-solid fa-globe"></i> Tự do / Public
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.68rem', color: '#16a34a', backgroundColor: '#f0fdf4', padding: '1px 6px', borderRadius: '4px', marginLeft: '2px', border: '1px solid #bbf7d0' }}>
                          <i className="fa-solid fa-circle-check"></i> Đã đăng ký
                        </span>
                      )}
                    </div>
                  )}

                  {/* Hàng 4: Mô tả */}
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: '#64748b', lineHeight: '1.4' }}>
                    {deck.description}
                  </p>
                </div>

                {/* Hàng 5: Thanh tiến độ ghi nhớ */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '3px', fontWeight: '700' }}>
                    <span>Tiến độ ghi nhớ</span>
                    <span>{percent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, height: '100%', backgroundColor: deck.color, borderRadius: '4px', transition: 'width 0.3s' }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          CHẾ ĐỘ 1: HỌC THẺ TƯƠNG TÁC (FLASHCARD STUDY MODE)
         ========================================================================= */}
      {!isQuizMode ? (
        allDeckCards.length === 0 ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '60px 24px',
              textAlign: 'center',
              border: '2px dashed #cbd5e1',
              marginBottom: '24px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#f3e8ff',
                color: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                margin: '0 auto 16px auto',
              }}
            >
              <i className="fa-solid fa-book-bookmark"></i>
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
              Sổ tay từ vựng của bạn đang trống!
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.92rem', maxWidth: '520px', margin: '0 auto 24px auto', lineHeight: '1.5' }}>
              Học viên, Giảng viên hoặc Quản trị viên đều có thể tự tạo từ vựng vào đây để luyện phát âm chuẩn IPA và lật thẻ ghi nhớ Active Recall.
            </p>
            <button
              onClick={() => {
                setNewWordForm({
                  word: '',
                  ipa: '',
                  type: 'Noun',
                  meaning: '',
                  english_def: '',
                  example: '',
                  example_vi: '',
                  collocation: '',
                });
                setAddWordError('');
                setIsAddWordModalOpen(true);
              }}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
              }}
            >
              <i className="fa-solid fa-plus-circle"></i>
              <span>+ Thêm từ vựng đầu tiên</span>
            </button>
          </div>
        ) : cards.length === 0 && studyFilterMode === 'REVIEW_ONLY' ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '48px 24px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              marginBottom: '24px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
              maxWidth: '620px',
              margin: '0 auto 24px auto',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.4rem',
                margin: '0 auto 16px auto',
                border: '2px solid #a7f3d0',
              }}
            >
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
              Không còn từ nào cần ôn lại!
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '0 0 22px 0', lineHeight: '1.6' }}>
              Tuyệt vời! Bạn đã thuộc hết các từ vựng trong danh sách cần ôn của bộ thẻ <strong>"{currentDeck.title}"</strong>.
            </p>
            <button
              type="button"
              onClick={() => {
                setStudyFilterMode('ALL');
                setCurrentCardIndex(0);
                setIsFlipped(false);
              }}
              style={{
                padding: '11px 24px',
                borderRadius: '12px',
                backgroundColor: '#0284c7',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              }}
            >
              <i className="fa-solid fa-layer-group"></i>
              <span>Quay lại học toàn bộ ({allDeckCards.length} từ)</span>
            </button>
          </div>
        ) : (
        <div>
          {/* 1. THANH TRẠNG THÁI TIẾN ĐỘ & CHẾ ĐỘ ÔN LẠI TRỰC QUAN */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '12px 18px',
              border: '1px solid #e2e8f0',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
          >
            {/* Nhóm nút lọc theo trạng thái từ vựng */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#64748b', marginRight: '4px' }}>
                Tiến độ:
              </span>

              {/* Nút: Tất cả từ vựng */}
              <button
                type="button"
                onClick={() => {
                  setStudyFilterMode('ALL');
                  setCurrentCardIndex(0);
                  setIsFlipped(false);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: studyFilterMode === 'ALL' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  backgroundColor: studyFilterMode === 'ALL' ? '#f0f9ff' : '#ffffff',
                  color: studyFilterMode === 'ALL' ? '#0284c7' : '#475569',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <i className="fa-solid fa-layer-group"></i>
                <span>Tất cả ({allDeckCards.length})</span>
              </button>

              {/* Nút: Cần ôn lại (Nổi bật, có icon đồng hồ và số lượng) */}
              <button
                type="button"
                onClick={() => {
                  if (deckReviewCount === 0) {
                    alert('Bộ thẻ này hiện chưa có từ nào được đánh dấu "Cần ôn lại". Bạn có thể bấm nút "Cần ôn lại" khi lật thẻ để thêm vào danh sách ôn!');
                    return;
                  }
                  setStudyFilterMode(studyFilterMode === 'REVIEW_ONLY' ? 'ALL' : 'REVIEW_ONLY');
                  setCurrentCardIndex(0);
                  setIsFlipped(false);
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: studyFilterMode === 'REVIEW_ONLY' ? '2px solid #ea580c' : (deckReviewCount > 0 ? '1.5px solid #fdba74' : '1px solid #e2e8f0'),
                  backgroundColor: studyFilterMode === 'REVIEW_ONLY' ? '#ea580c' : (deckReviewCount > 0 ? '#fff7ed' : '#f8fafc'),
                  color: studyFilterMode === 'REVIEW_ONLY' ? '#ffffff' : (deckReviewCount > 0 ? '#c2410c' : '#94a3b8'),
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  cursor: deckReviewCount > 0 ? 'pointer' : 'default',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: studyFilterMode === 'REVIEW_ONLY' ? '0 4px 12px rgba(234, 88, 12, 0.3)' : (deckReviewCount > 0 ? '0 2px 6px rgba(234, 88, 12, 0.12)' : 'none'),
                  transition: 'all 0.15s ease',
                }}
                title="Lọc và chỉ học các từ cần ôn lại"
              >
                <i className="fa-solid fa-clock-rotate-left"></i>
                <span>Cần ôn lại ({deckReviewCount})</span>
                {studyFilterMode === 'REVIEW_ONLY' && (
                  <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(255,255,255,0.3)', padding: '1px 6px', borderRadius: '10px', marginLeft: '2px' }}>
                    Đang lọc
                  </span>
                )}
              </button>

              {/* Badge: Đã thuộc */}
              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#16a34a',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <i className="fa-solid fa-circle-check"></i>
                <span>Đã thuộc ({deckMasteredCount})</span>
              </span>
            </div>

            {/* Nút hành động nhanh: "Ôn lại các từ cần ôn" nếu chưa ở chế độ ôn lại */}
            {deckReviewCount > 0 && studyFilterMode !== 'REVIEW_ONLY' ? (
              <button
                type="button"
                onClick={() => {
                  setStudyFilterMode('REVIEW_ONLY');
                  setCurrentCardIndex(0);
                  setIsFlipped(false);
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#fff7ed',
                  border: '1.5px solid #ea580c',
                  color: '#ea580c',
                  fontWeight: '800',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <i className="fa-solid fa-rotate-right"></i>
                <span>Ôn ngay {deckReviewCount} từ cần ôn lại</span>
              </button>
            ) : studyFilterMode === 'REVIEW_ONLY' ? (
              <button
                type="button"
                onClick={() => {
                  setStudyFilterMode('ALL');
                  setCurrentCardIndex(0);
                  setIsFlipped(false);
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  fontWeight: '800',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <i className="fa-solid fa-xmark"></i>
                <span>Thoát chế độ ôn lại</span>
              </button>
            ) : null}
          </div>

          {/* Banner nhắc nhở khi đang bật chế độ ôn từ khó */}
          {studyFilterMode === 'REVIEW_ONLY' && (
            <div
              style={{
                backgroundColor: '#fff7ed',
                border: '1px solid #ffedd5',
                borderRadius: '12px',
                padding: '10px 16px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: '0.84rem',
                color: '#9a3412',
                fontWeight: '700',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-bullseye" style={{ color: '#ea580c', fontSize: '1rem' }}></i>
                <span>Đang trong chế độ ôn tập: Chỉ hiển thị các từ vựng bạn đã đánh dấu "Cần ôn lại" ({cards.length} từ). Bấm "✓ Đã thuộc từ này" khi đã nhớ để loại khỏi danh sách!</span>
              </div>
            </div>
          )}
          {/* Thanh công cụ hỗ trợ phát âm & điều khiển */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569' }}>
                Thẻ {currentCardIndex + 1} / {cards.length}
              </span>
              {isCurrentMastered && (
                <span style={{ fontSize: '0.72rem', backgroundColor: '#d1fae5', color: '#059669', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>
                  ✓ Đã thuộc
                </span>
              )}
              {isCurrentReview && (
                <span style={{ fontSize: '0.72rem', backgroundColor: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>
                  Cần ôn lại
                </span>
              )}
              {currentCard?.isCustom && (
                <span style={{ fontSize: '0.72rem', backgroundColor: '#f3e8ff', color: '#7c3aed', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>
                  Tự tạo
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Chọn tốc độ phát âm */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748b' }}>
                <span>Tốc độ đọc:</span>
                <button
                  onClick={() => setSpeechRate(1.0)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: speechRate === 1.0 ? '#2563eb' : '#ffffff',
                    color: speechRate === 1.0 ? '#ffffff' : '#334155',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  1.0x Chuẩn
                </button>
                <button
                  onClick={() => setSpeechRate(0.8)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: speechRate === 0.8 ? '#2563eb' : '#ffffff',
                    color: speechRate === 0.8 ? '#ffffff' : '#334155',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  0.8x Chậm
                </button>
              </div>

              {/* Nút Auto-pronounce */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748b', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoPronounce}
                  onChange={(e) => setAutoPronounce(e.target.checked)}
                />
                <span>Tự đọc từ vựng</span>
              </label>

              {/* Xáo trộn */}
              <button
                onClick={handleShuffle}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Xáo trộn ngẫu nhiên thứ tự thẻ"
              >
                <i className="fa-solid fa-shuffle"></i>
                <span>Xáo trộn</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              THẺ 3D FLIP CARD TƯƠNG TÁC
             ========================================================================= */}
          <div
            onClick={handleFlipCard}
            style={{
              perspective: '1200px',
              cursor: 'pointer',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                minHeight: '340px',
                borderRadius: '24px',
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* MẶT TRƯỚC CỦA THẺ (FRONT: Tiếng Anh + Phiên âm + Nút phát âm) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  backgroundColor: '#ffffff',
                  borderRadius: '24px',
                  padding: '36px 30px',
                  border: '1.5px solid #e2e8f0',
                  boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                {/* Header mặt trước */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: currentDeck.color, backgroundColor: `${currentDeck.color}15`, padding: '4px 12px', borderRadius: '12px' }}>
                      [{currentCard?.type}]
                    </span>
                    {currentCard?.isCustom && (
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#7c3aed', backgroundColor: '#f3e8ff', padding: '3px 8px', borderRadius: '8px' }}>
                        Từ của bạn
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Nhấp vào thẻ để lật mặt sau
                    </span>
                  </div>
                </div>

                {/* Phần thân từ vựng & âm thanh */}
                <div style={{ margin: 'auto 0' }}>
                  <h2
                    style={{
                      fontSize: '2.8rem',
                      fontWeight: '900',
                      color: '#0f172a',
                      margin: '0 0 10px 0',
                      letterSpacing: '-1px',
                    }}
                  >
                    {currentCard.word}
                  </h2>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', backgroundColor: '#f1f5f9', padding: '6px 16px', borderRadius: '20px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '1.15rem', color: '#475569', fontWeight: '600', fontFamily: 'monospace' }}>
                      {currentCard.ipa}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handlePronounce(currentCard.word, e)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: isSpeaking ? '#059669' : currentDeck.color,
                        border: 'none',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}
                      title="Nghe phát âm chuẩn giọng bản xứ"
                    >
                      <i className={`fa-solid ${isSpeaking ? 'fa-volume-high' : 'fa-volume-low'}`}></i>
                    </button>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', fontStyle: 'italic' }}>
                    "{currentCard.english_def}"
                  </p>
                </div>

                {/* Gợi ý lật thẻ */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748b' }}>
                  <i className="fa-solid fa-arrows-rotate" style={{ color: currentDeck.color }}></i>
                  <span>Nhấp vào bất kỳ đâu để xem nghĩa tiếng Việt & câu ví dụ</span>
                </div>
              </div>

              {/* MẶT SAU CỦA THẺ (BACK: Nghĩa tiếng Việt + Câu ví dụ + Collocation) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  backgroundColor: '#ffffff',
                  borderRadius: '24px',
                  padding: '36px 30px',
                  border: `2px solid ${currentDeck.color}`,
                  boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'center',
                  transform: 'rotateY(180deg)',
                }}
              >
                {/* Header mặt sau */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#059669', backgroundColor: '#d1fae5', padding: '4px 12px', borderRadius: '12px' }}>
                    ĐỊNH NGHĨA & NGỮ CẢNH
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Mặt sau thẻ
                    </span>
                  </div>
                </div>

                {/* Nội dung chi tiết */}
                <div style={{ margin: 'auto 0', maxWidth: '600px' }}>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                    {currentCard.word} [{currentCard.type}]
                  </div>

                  <h3
                    style={{
                      fontSize: '1.9rem',
                      fontWeight: '900',
                      color: '#0f172a',
                      margin: '0 0 16px 0',
                    }}
                  >
                    {currentCard.meaning}
                  </h3>

                  {/* Câu ví dụ ngữ cảnh có nút phát âm cả câu */}
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '14px',
                      padding: '14px 18px',
                      border: '1px solid #e2e8f0',
                      textAlign: 'left',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#1e293b', lineHeight: '1.45' }}>
                        "{currentCard.example}"
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handlePronounce(currentCard.example, e)}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          backgroundColor: '#e2e8f0',
                          border: 'none',
                          color: '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                        title="Nghe phát âm cả câu ví dụ"
                      >
                        <i className="fa-solid fa-volume-high" style={{ fontSize: '0.75rem' }}></i>
                      </button>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>
                      → {currentCard.example_vi}
                    </div>
                  </div>

                  {/* Cụm từ hay đi kèm (Collocation) */}
                  {currentCard.collocation && (
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                      <strong style={{ color: currentDeck.color }}>Cụm từ ghi nhớ: </strong>
                      <code style={{ backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', color: '#0f172a', fontWeight: '700' }}>
                        {currentCard.collocation}
                      </code>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748b' }}>
                  <i className="fa-solid fa-arrows-rotate" style={{ color: currentDeck.color }}></i>
                  <span>Nhấp để lật lại mặt trước</span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              BỘ ĐIỀU HƯỚNG & ĐÁNH GIÁ MỨC ĐỘ THUỘC TỪ
             ========================================================================= */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '16px 20px',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Nút lùi */}
            <button
              onClick={handlePrevCard}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#334155',
                fontSize: '0.88rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Từ trước</span>
            </button>

            {/* 2 Nút Đánh dấu ghi nhớ */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleMarkReview}
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  backgroundColor: isCurrentReview ? '#ea580c' : '#fff7ed',
                  border: isCurrentReview ? '2px solid #c2410c' : '1.5px solid #fdba74',
                  color: isCurrentReview ? '#ffffff' : '#c2410c',
                  fontSize: '0.88rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: isCurrentReview ? '0 4px 12px rgba(234, 88, 12, 0.3)' : 'none',
                  transition: 'all 0.2s ease',
                }}
                title="Đánh dấu từ này để đưa vào danh sách cần ôn tập lại"
              >
                <i className="fa-solid fa-clock-rotate-left"></i>
                <span>{isCurrentReview ? 'Đang cần ôn lại' : 'Cần ôn lại'}</span>
              </button>

              <button
                type="button"
                onClick={handleMarkMastered}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  backgroundColor: isCurrentMastered ? '#047857' : '#059669',
                  border: isCurrentMastered ? '2px solid #064e3b' : 'none',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                  transition: 'all 0.2s ease',
                }}
                title="Đánh dấu đã thuộc từ này (loại khỏi danh sách cần ôn)"
              >
                <i className="fa-solid fa-check"></i>
                <span>{isCurrentMastered ? '✓ Đã thuộc từ này' : 'Đã thuộc từ này'}</span>
              </button>
            </div>

            {/* Nút tiến */}
            <button
              onClick={handleNextCard}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#334155',
                fontSize: '0.88rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Từ sau</span>
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
        )
      ) : (
        /* =========================================================================
            CHẾ ĐỘ 2: MINI-QUIZ KIỂM TRA PHẢN XẠ NHANH 5 CÂU
           ========================================================================= */
        <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '32px 24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.06)' }}>
          {!quizFinished ? (
            <div>
              {/* Header Quiz */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#f59e0b', backgroundColor: '#fef3c7', padding: '4px 12px', borderRadius: '12px' }}>
                  CÂU HỎI {currentQuizIndex + 1} / {quizQuestions.length}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#059669' }}>
                  Điểm hiện tại: {quizScore}/{quizQuestions.length}
                </span>
              </div>

              {/* Từ vựng câu hỏi */}
              <div style={{ textAlign: 'center', margin: '24px 0 32px 0' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '700' }}>
                  Nghĩa của từ vựng này là gì?
                </span>
                <h2 style={{ fontSize: '2.4rem', fontWeight: '900', color: '#0f172a', margin: '8px 0' }}>
                  {quizQuestions[currentQuizIndex]?.word}
                </h2>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem', color: '#64748b', fontFamily: 'monospace' }}>
                    {quizQuestions[currentQuizIndex]?.ipa}
                  </span>
                  <button
                    onClick={() => handlePronounce(quizQuestions[currentQuizIndex]?.word)}
                    style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '1.1rem' }}
                    title="Nghe phát âm"
                  >
                    <i className="fa-solid fa-volume-high"></i>
                  </button>
                </div>
              </div>

              {/* 4 Lựa chọn trả lời */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {quizQuestions[currentQuizIndex]?.options.map((option, idx) => {
                  let btnBg = '#f8fafc';
                  let btnBorder = '#e2e8f0';
                  let btnColor = '#1e293b';

                  if (selectedAnswer !== null) {
                    if (option.isCorrect) {
                      btnBg = '#d1fae5';
                      btnBorder = '#10b981';
                      btnColor = '#065f46';
                    } else if (selectedAnswer.text === option.text && !option.isCorrect) {
                      btnBg = '#fee2e2';
                      btnBorder = '#ef4444';
                      btnColor = '#991b1b';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectQuizAnswer(option)}
                      disabled={selectedAnswer !== null}
                      style={{
                        padding: '16px',
                        borderRadius: '14px',
                        backgroundColor: btnBg,
                        border: `1.5px solid ${btnBorder}`,
                        color: btnColor,
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        cursor: selectedAnswer === null ? 'pointer' : 'default',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <span
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: '#e2e8f0',
                          color: '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          flexShrink: 0,
                        }}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option.text}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => setIsQuizMode(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  ← Thoát chế độ kiểm tra và quay lại học thẻ
                </button>
              </div>
            </div>
          ) : (
            /* Kết thúc Quiz */
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: quizScore >= 4 ? '#d1fae5' : '#fef3c7',
                  color: quizScore >= 4 ? '#059669' : '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  margin: '0 auto 16px',
                }}
              >
                <i className={quizScore >= 4 ? 'fa-solid fa-trophy' : 'fa-solid fa-star'}></i>
              </div>

              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0f172a', margin: '0 0 8px 0' }}>
                {quizScore === 5 ? 'Tuyệt đối 5/5! Xuất sắc!' : quizScore >= 3 ? 'Làm tốt lắm!' : 'Cần ôn tập thêm!'}
              </h2>
              <p style={{ margin: '0 0 20px 0', fontSize: '0.95rem', color: '#64748b' }}>
                Bạn đã trả lời đúng <strong>{quizScore}/{quizQuestions.length} câu hỏi</strong>.
                <br />
                <span style={{ color: '#059669', fontWeight: '700' }}>
                  ✓ Đã ghi nhận vào Chuỗi ngày học (Daily Streak 🔥)!
                </span>
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  onClick={handleStartMiniQuiz}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    backgroundColor: '#2563eb',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                  }}
                >
                  <i className="fa-solid fa-arrows-rotate" style={{ marginRight: '6px' }}></i>
                  Làm lại đề khác
                </button>

                <button
                  onClick={() => setIsQuizMode(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Quay lại lật thẻ
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: THÊM THẺ TỪ VỰNG MỚI (Học viên, Giáo viên & Admin đều có thể thêm)
         ========================================================================= */}
      {isAddWordModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setIsAddWordModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '22px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
              }}
            >
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '800', color: '#7c3aed', backgroundColor: '#f3e8ff', padding: '3px 10px', borderRadius: '12px', marginBottom: '6px' }}>
                  <i className="fa-solid fa-book-bookmark"></i>
                  <span>SỔ TAY TỪ VỰNG CÁ NHÂN</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#0f172a' }}>
                  Thêm Thẻ Từ Vựng Mới
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Học viên, Giáo viên và Quản trị viên đều có thể thêm từ vựng để luyện phát âm & phản xạ Active Recall.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddWordModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '8px',
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveNewWord} style={{ padding: '24px' }}>
              {addWordError && (
                <div
                  style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fca5a5',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{addWordError}</span>
                </div>
              )}

              {/* Row 0: Chọn Chủ Đề / Bộ Thẻ muốn thêm vào */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                  Thêm vào Chủ Đề / Bộ Thẻ nào? <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={newWordForm.deckId}
                  onChange={(e) => setNewWordForm({ ...newWordForm, deckId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #8b5cf6',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    outline: 'none',
                    backgroundColor: '#faf5ff',
                    color: '#6b21a8',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                >
                  {allDecks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.level}) {d.isCustomDeck ? '★ Chủ đề tự tạo' : ''}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Từ vựng mới sẽ được phân loại và hiển thị trong đúng chủ đề này.
                </span>
              </div>

              {/* Row 1: Từ tiếng Anh & Phiên âm & Loại từ */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                    Từ vựng tiếng Anh <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Resilient, Serendipity..."
                    value={newWordForm.word}
                    onChange={(e) => setNewWordForm({ ...newWordForm, word: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                    Phiên âm IPA
                  </label>
                  <input
                    type="text"
                    placeholder="VD: /rɪˈzɪl.jənt/"
                    value={newWordForm.ipa}
                    onChange={(e) => setNewWordForm({ ...newWordForm, ipa: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                    Loại từ
                  </label>
                  <select
                    value={newWordForm.type}
                    onChange={(e) => setNewWordForm({ ...newWordForm, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 10px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="Noun">Noun (Danh từ)</option>
                    <option value="Verb">Verb (Động từ)</option>
                    <option value="Adjective">Adjective (Tính từ)</option>
                    <option value="Adverb">Adverb (Trạng từ)</option>
                    <option value="Idiom">Idiom (Thành ngữ)</option>
                    <option value="Phrasal Verb">Phrasal Verb (Cụm động từ)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Nghĩa tiếng Việt */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                  Nghĩa tiếng Việt <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Kiên cường, có khả năng phục hồi nhanh trước khó khăn"
                  value={newWordForm.meaning}
                  onChange={(e) => setNewWordForm({ ...newWordForm, meaning: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Row 3: Định nghĩa tiếng Anh (tùy chọn) */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                  Định nghĩa tiếng Anh (English definition)
                </label>
                <input
                  type="text"
                  placeholder="VD: Able to quickly return to a previous good condition after difficulties..."
                  value={newWordForm.english_def}
                  onChange={(e) => setNewWordForm({ ...newWordForm, english_def: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Row 4: Câu ví dụ tiếng Anh & Dịch nghĩa tiếng Việt */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                    Câu ví dụ tiếng Anh
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Highly resilient people face challenges with optimism."
                    value={newWordForm.example}
                    onChange={(e) => setNewWordForm({ ...newWordForm, example: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                    Dịch nghĩa câu ví dụ
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Những người kiên cường đối mặt thử thách với sự lạc quan."
                    value={newWordForm.example_vi}
                    onChange={(e) => setNewWordForm({ ...newWordForm, example_vi: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Row 5: Cụm từ đi kèm (Collocation) */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                  Cụm từ ghi nhớ (Collocation / Phrasal)
                </label>
                <input
                  type="text"
                  placeholder="VD: highly resilient / resilient economy / bounce back"
                  value={newWordForm.collocation}
                  onChange={(e) => setNewWordForm({ ...newWordForm, collocation: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddWordModalOpen(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Lưu Thẻ Vào Chủ Đề Này</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TẠO CHỦ ĐỀ / BỘ THẺ TỪ VỰNG MỚI (Dành cho Giáo viên & Admin)
         ========================================================================= */}
      {isCreateDeckModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setIsCreateDeckModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '22px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
              }}
            >
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '3px 10px', borderRadius: '12px', marginBottom: '6px' }}>
                  <i className="fa-solid fa-folder-plus"></i>
                  <span>QUẢN LÝ CHỦ ĐỀ TỪ VỰNG</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#0f172a' }}>
                  Tạo Chủ Đề / Bộ Thẻ Mới
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Giáo viên & Quản trị viên có thể tạo các chủ đề mới để phân loại và soạn từ vựng theo chuyên đề.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateDeckModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '8px',
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateNewDeck} style={{ padding: '24px' }}>
              {createDeckError && (
                <div
                  style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fca5a5',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{createDeckError}</span>
                </div>
              )}

              {/* Tên chủ đề */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                  Tên Chủ Đề / Bộ Thẻ <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Từ Vựng Công Nghệ Thông Tin (IT), Tiếng Anh Du Lịch, IELTS Writing..."
                  value={newDeckForm.title}
                  onChange={(e) => setNewDeckForm({ ...newDeckForm, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Cấp độ & Màu sắc */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                    Trình độ áp dụng (Level)
                  </label>
                  <select
                    value={newDeckForm.level}
                    onChange={(e) => setNewDeckForm({ ...newDeckForm, level: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="A1 - A2">A1 - A2 (Căn bản)</option>
                    <option value="B1 - B2">B1 - B2 (Trung cấp)</option>
                    <option value="B2 - C1">B2 - C1 (Nâng cao)</option>
                    <option value="IELTS Master">IELTS Master</option>
                    <option value="TOEIC 800+">TOEIC 800+</option>
                    <option value="Chuyên ngành">Chuyên ngành</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                    Màu sắc chủ đạo
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '42px' }}>
                    {[
                      { hex: '#0284c7', name: 'Xanh biển' },
                      { hex: '#059669', name: 'Xanh ngọc' },
                      { hex: '#8b5cf6', name: 'Tím' },
                      { hex: '#d97706', name: 'Vàng cam' },
                      { hex: '#db2777', name: 'Hồng' },
                      { hex: '#dc2626', name: 'Đỏ' },
                    ].map((c) => (
                      <div
                        key={c.hex}
                        onClick={() => setNewDeckForm({ ...newDeckForm, color: c.hex })}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          backgroundColor: c.hex,
                          cursor: 'pointer',
                          border: newDeckForm.color === c.hex ? '3px solid #0f172a' : '2px solid transparent',
                          transform: newDeckForm.color === c.hex ? 'scale(1.15)' : 'scale(1)',
                          transition: 'all 0.15s ease',
                        }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Mô tả ngắn */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                  Mô tả ngắn về chủ đề
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả mục tiêu từ vựng của chủ đề này (VD: 20 từ vựng cốt lõi thường gặp trong tài liệu kỹ thuật phần mềm)..."
                  value={newDeckForm.description}
                  onChange={(e) => setNewDeckForm({ ...newDeckForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'none',
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateDeckModalOpen(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <i className="fa-solid fa-folder-plus"></i>
                  <span>Tạo Chủ Đề Mới</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

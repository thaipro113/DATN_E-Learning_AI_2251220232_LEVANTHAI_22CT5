import React, { useState, useEffect, useMemo } from 'react';
import {
  DEFAULT_VOCABULARY_DECKS,
  getStoredCustomDecks,
  saveStoredCustomDecks,
  getStoredCustomWords,
  saveStoredCustomWords,
  speakWord,
} from '../utils/flashcardStorage';

export default function TeacherFlashcardManager({ user, onBackToDashboard }) {
  const [customDecks, setCustomDecks] = useState(() => getStoredCustomDecks());
  const [customWords, setCustomWords] = useState(() => getStoredCustomWords());
  const [selectedDeckId, setSelectedDeckId] = useState('daily_life');
  const [wordSearch, setWordSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isPreviewStudentMode, setIsPreviewStudentMode] = useState(false);
  const [previewCardIndex, setPreviewCardIndex] = useState(0);
  const [isPreviewFlipped, setIsPreviewFlipped] = useState(false);
  const [playingWord, setPlayingWord] = useState(null);

  // Modal Đề tài
  const [deckModal, setDeckModal] = useState({
    isOpen: false,
    mode: 'create',
    id: null,
    title: '',
    level: 'B1 - B2',
    color: '#0284c7',
    description: '',
  });

  // Modal Từ vựng
  const [wordModal, setWordModal] = useState({
    isOpen: false,
    mode: 'create',
    id: null,
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

  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    saveStoredCustomDecks(customDecks);
  }, [customDecks]);

  useEffect(() => {
    saveStoredCustomWords(customWords);
  }, [customWords]);

  // Tổng hợp tất cả các bộ thẻ
  const allDecks = useMemo(() => {
    const builtIn = DEFAULT_VOCABULARY_DECKS.map((d) => ({
      ...d,
      isSystem: true,
      cards: [
        ...d.cards,
        ...customWords.filter((w) => w.deckId === d.id),
      ],
    }));

    const custom = customDecks.map((d) => ({
      ...d,
      isCustomDeck: true,
      cards: customWords.filter((w) => w.deckId === d.id),
    }));

    return [...builtIn, ...custom];
  }, [customDecks, customWords]);

  const currentDeck = useMemo(() => {
    return allDecks.find((d) => d.id === selectedDeckId) || allDecks[0] || null;
  }, [allDecks, selectedDeckId]);

  const cards = currentDeck?.cards || [];

  const filteredWords = useMemo(() => {
    if (!currentDeck) return [];
    return (currentDeck.cards || []).filter((w) => {
      const matchSearch =
        !wordSearch.trim() ||
        w.word.toLowerCase().includes(wordSearch.toLowerCase()) ||
        (w.meaning && w.meaning.toLowerCase().includes(wordSearch.toLowerCase()));
      const matchType = typeFilter === 'ALL' || w.type.toLowerCase().includes(typeFilter.toLowerCase());
      return matchSearch && matchType;
    });
  }, [currentDeck, wordSearch, typeFilter]);

  const handlePlayAudio = (word) => {
    setPlayingWord(word);
    speakWord(word, 1.0);
    setTimeout(() => setPlayingWord(null), 1500);
  };

  // Tạo đề tài mới
  const handleOpenCreateDeck = () => {
    setDeckModal({
      isOpen: true,
      mode: 'create',
      id: null,
      title: '',
      level: 'B1 - B2',
      color: '#0284c7',
      description: '',
    });
  };

  const handleOpenEditDeck = (deck) => {
    setDeckModal({
      isOpen: true,
      mode: 'edit',
      id: deck.id,
      title: deck.title,
      level: deck.level,
      color: deck.color || '#0284c7',
      description: deck.description || '',
    });
  };

  const handleSaveDeck = (e) => {
    e.preventDefault();
    if (!deckModal.title.trim()) {
      alert('Vui lòng nhập tên đề tài từ vựng.');
      return;
    }

    if (deckModal.mode === 'create') {
      const newDeck = {
        id: `deck_${Date.now()}`,
        title: deckModal.title.trim(),
        level: deckModal.level,
        color: deckModal.color || '#0284c7',
        description: deckModal.description.trim() || 'Chủ đề từ vựng chuyên ngành do Giảng viên biên soạn.',
        icon: 'fa-book-bookmark',
        isCustomDeck: true,
        author: user?.full_name || 'Giảng viên',
        created_at: new Date().toISOString().split('T')[0],
      };
      setCustomDecks((prev) => [...prev, newDeck]);
      setSelectedDeckId(newDeck.id);
      showToast('Đã tạo đề tài từ vựng mới thành công!');
    } else {
      setCustomDecks((prev) =>
        prev.map((d) =>
          d.id === deckModal.id
            ? {
                ...d,
                title: deckModal.title.trim(),
                level: deckModal.level,
                color: deckModal.color,
                description: deckModal.description.trim(),
              }
            : d
        )
      );
      showToast('Đã cập nhật đề tài thành công!');
    }
    setDeckModal({ ...deckModal, isOpen: false });
  };

  const handleDeleteDeck = (deckId, deckTitle, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Bạn có chắc muốn xóa đề tài "${deckTitle}" và toàn bộ từ vựng bên trong?`)) {
      return;
    }
    setCustomDecks((prev) => prev.filter((d) => d.id !== deckId));
    setCustomWords((prev) => prev.filter((w) => w.deckId !== deckId));
    if (selectedDeckId === deckId) {
      setSelectedDeckId('daily_life');
    }
    showToast('Đã xóa đề tài thành công!');
  };

  // Thêm / Sửa từ vựng
  const handleOpenAddWord = (deckId) => {
    setWordModal({
      isOpen: true,
      mode: 'create',
      id: null,
      deckId: deckId || selectedDeckId,
      word: '',
      ipa: '',
      type: 'Noun',
      meaning: '',
      english_def: '',
      example: '',
      example_vi: '',
      collocation: '',
    });
  };

  const handleOpenEditWord = (w) => {
    setWordModal({
      isOpen: true,
      mode: 'edit',
      id: w.id,
      deckId: w.deckId || selectedDeckId,
      word: w.word,
      ipa: w.ipa || '',
      type: w.type || 'Noun',
      meaning: w.meaning || '',
      english_def: w.english_def || '',
      example: w.example || '',
      example_vi: w.example_vi || '',
      collocation: w.collocation || '',
    });
  };

  const handleSaveWord = (e) => {
    e.preventDefault();
    if (!wordModal.word.trim() || !wordModal.meaning.trim()) {
      alert('Vui lòng điền từ tiếng Anh và nghĩa tiếng Việt.');
      return;
    }

    if (wordModal.mode === 'create') {
      const newCard = {
        id: `word_${Date.now()}`,
        deckId: wordModal.deckId,
        isCustom: true,
        word: wordModal.word.trim(),
        ipa: wordModal.ipa.trim() || `/${wordModal.word.trim().toLowerCase()}/`,
        type: wordModal.type,
        meaning: wordModal.meaning.trim(),
        english_def: wordModal.english_def.trim() || 'Teacher curated vocabulary.',
        example: wordModal.example.trim(),
        example_vi: wordModal.example_vi.trim(),
        collocation: wordModal.collocation.trim(),
      };
      setCustomWords((prev) => [newCard, ...prev]);
      setSelectedDeckId(wordModal.deckId);
      showToast(`Đã thêm từ vựng "${newCard.word}" thành công!`);
    } else {
      setCustomWords((prev) => {
        const exists = prev.some((w) => w.id === wordModal.id);
        if (exists) {
          return prev.map((w) =>
            w.id === wordModal.id
              ? {
                  ...w,
                  deckId: wordModal.deckId,
                  word: wordModal.word.trim(),
                  ipa: wordModal.ipa.trim(),
                  type: wordModal.type,
                  meaning: wordModal.meaning.trim(),
                  english_def: wordModal.english_def.trim(),
                  example: wordModal.example.trim(),
                  example_vi: wordModal.example_vi.trim(),
                  collocation: wordModal.collocation.trim(),
                }
              : w
          );
        } else {
          return [
            {
              id: wordModal.id,
              deckId: wordModal.deckId,
              isCustom: true,
              word: wordModal.word.trim(),
              ipa: wordModal.ipa.trim(),
              type: wordModal.type,
              meaning: wordModal.meaning.trim(),
              english_def: wordModal.english_def.trim(),
              example: wordModal.example.trim(),
              example_vi: wordModal.example_vi.trim(),
              collocation: wordModal.collocation.trim(),
            },
            ...prev,
          ];
        }
      });
      showToast(`Đã cập nhật từ vựng "${wordModal.word}" thành công!`);
    }
    setWordModal({ ...wordModal, isOpen: false });
  };

  const handleDeleteWord = (wordId, wordText) => {
    if (!window.confirm(`Bạn có chắc muốn xóa từ vựng "${wordText}" khỏi đề tài?`)) {
      return;
    }
    setCustomWords((prev) => prev.filter((w) => w.id !== wordId));
    showToast(`Đã xóa từ vựng "${wordText}" thành công!`);
  };

  // Preview Cards navigation
  const previewCard = cards[previewCardIndex] || cards[0];

  return (
    <div style={{ padding: '0 0 60px 0', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Toast thông báo */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '12px 20px',
            backgroundColor: toastMsg.type === 'error' ? '#ef4444' : '#059669',
            color: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontWeight: '700',
            fontSize: '0.9rem',
          }}
        >
          {toastMsg.text}
        </div>
      )}

      {/* Header Banner Dành Riêng Cho Giảng Viên (Gọn gàng & Đơn giản) */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px 24px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#ede9fe',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}
            >
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Biên Soạn & Quản Lý Flashcards Từ Vựng
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 46px' }}>
            Quản lý danh sách các đề tài từ vựng, biên soạn định nghĩa & câu ví dụ ngữ cảnh cho học viên.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsPreviewStudentMode(!isPreviewStudentMode)}
            style={{
              padding: '9px 15px',
              borderRadius: '8px',
              backgroundColor: isPreviewStudentMode ? '#0f172a' : '#f1f5f9',
              color: isPreviewStudentMode ? '#ffffff' : '#334155',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className={`fa-solid ${isPreviewStudentMode ? 'fa-table-list' : 'fa-eye'}`}></i>
            <span>{isPreviewStudentMode ? 'Quay lại Bảng Quản Lý' : 'Xem thử giao diện học viên'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateDeck}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
            }}
          >
            <i className="fa-solid fa-folder-plus"></i>
            <span>+ Tạo đề tài mới</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddWord(selectedDeckId)}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)',
            }}
          >
            <i className="fa-solid fa-plus-circle"></i>
            <span>+ Thêm từ vựng mới</span>
          </button>
        </div>
      </div>

      {/* ==================== CHẾ ĐỘ XEM THỬ GIAO DIỆN HỌC VIÊN ==================== */}
      {isPreviewStudentMode ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: currentDeck?.color || '#0284c7', backgroundColor: `${currentDeck?.color || '#0284c7'}15`, padding: '3px 8px', borderRadius: '6px' }}>
                {currentDeck?.level}
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: '6px 0 0 0' }}>
                Đang xem thử đề tài: {currentDeck?.title} ({cards.length} thẻ)
              </h3>
            </div>
            <button
              onClick={() => setIsPreviewStudentMode(false)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer' }}
            >
              Đóng xem thử
            </button>
          </div>

          {cards.length === 0 ? (
            <div style={{ padding: '40px', color: '#64748b' }}>Đề tài này chưa có từ vựng nào để xem trước.</div>
          ) : (
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '10px' }}>
                Thẻ {previewCardIndex + 1} / {cards.length} (Nhấp thẻ để lật mặt sau)
              </div>

              {/* Thẻ Lật */}
              <div
                onClick={() => setIsPreviewFlipped(!isPreviewFlipped)}
                style={{
                  minHeight: '260px',
                  backgroundColor: '#ffffff',
                  border: '2px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '30px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  transition: 'transform 0.15s ease',
                  position: 'relative',
                }}
              >
                {!isPreviewFlipped ? (
                  <>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: '4px', marginBottom: '12px' }}>
                      [{previewCard.type}]
                    </span>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#0f172a', margin: '0 0 8px 0' }}>
                      {previewCard.word}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '1rem', fontStyle: 'italic' }}>
                      <span>{previewCard.ipa}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAudio(previewCard.word);
                        }}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                        }}
                      >
                        <i className="fa-solid fa-volume-high"></i>
                      </button>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: '16px' }}>
                      Nhấp vào bất kỳ đâu để xem nghĩa tiếng Việt & ví dụ
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#059669', marginBottom: '8px' }}>
                      {previewCard.meaning}
                    </div>
                    {previewCard.english_def && (
                      <div style={{ fontSize: '0.88rem', color: '#475569', fontStyle: 'italic', marginBottom: '12px', maxWidth: '500px' }}>
                        "{previewCard.english_def}"
                      </div>
                    )}
                    {previewCard.example && (
                      <div style={{ fontSize: '0.86rem', color: '#1e293b', marginBottom: '4px' }}>
                        <strong>VD:</strong> {previewCard.example}
                      </div>
                    )}
                    {previewCard.example_vi && (
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        ↳ {previewCard.example_vi}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Điều khiển chuyển thẻ */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '18px' }}>
                <button
                  onClick={() => {
                    setIsPreviewFlipped(false);
                    setPreviewCardIndex((prev) => (prev > 0 ? prev - 1 : cards.length - 1));
                  }}
                  style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: '700', cursor: 'pointer' }}
                >
                  ← Thẻ trước
                </button>
                <button
                  onClick={() => {
                    setIsPreviewFlipped(false);
                    setPreviewCardIndex((prev) => (prev < cards.length - 1 ? prev + 1 : 0));
                  }}
                  style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: '700', cursor: 'pointer' }}
                >
                  Thẻ sau →
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ==================== GIAO DIỆN QUẢN LÝ CHÍNH CỦA GIẢNG VIÊN ==================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1. DANH SÁCH ĐỀ TÀI (GỌN GÀNG, NGĂN NẮP THEO YÊU CẦU) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '20px 22px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-list-check" style={{ color: '#0284c7' }}></i>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Danh Sách Đề Tài Từ Vựng ({allDecks.length} đề tài)
                </h2>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Nhấp chọn đề tài để hiển thị và chỉnh sửa bảng từ vựng bên dưới
              </span>
            </div>

            {/* Grid các đề tài gọn gàng */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {allDecks.map((deck) => {
                const isSelected = selectedDeckId === deck.id;
                const count = deck.cards?.length || 0;

                return (
                  <div
                    key={deck.id}
                    onClick={() => setSelectedDeckId(deck.id)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          padding: '2px 7px',
                          borderRadius: '5px',
                          backgroundColor: `${deck.color || '#0284c7'}15`,
                          color: deck.color || '#0284c7',
                        }}
                      >
                        {deck.level}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: '800', color: count > 0 ? '#059669' : '#94a3b8' }}>
                          {count} từ vựng
                        </span>

                        {deck.isCustomDeck && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditDeck(deck);
                              }}
                              style={{ border: 'none', background: 'none', color: '#0284c7', cursor: 'pointer', fontSize: '0.78rem', padding: '2px' }}
                              title="Sửa đề tài"
                            >
                              <i className="fa-solid fa-pen"></i>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteDeck(deck.id, deck.title, e)}
                              style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.78rem', padding: '2px' }}
                              title="Xóa đề tài"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ fontWeight: '800', fontSize: '0.92rem', color: isSelected ? '#0284c7' : '#0f172a', lineHeight: 1.3 }}>
                      {deck.title}
                    </div>

                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {deck.description || 'Chưa có mô tả chi tiết.'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. BẢNG TỪ VỰNG CỦA ĐỀ TÀI ĐANG CHỌN (GỌN GÀNG, RÕ RÀNG) */}
          {currentDeck && (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '20px 22px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              {/* Header Bảng từ vựng */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: '800', backgroundColor: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '4px' }}>
                      {currentDeck.level}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      Từ Vựng Đề Tài: {currentDeck.title}
                    </h3>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b' }}>
                      ({filteredWords.length} / {cards.length} từ)
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>
                    Biên soạn từ ngữ, phiên âm, giải nghĩa và ví dụ trực quan.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Ô tìm kiếm từ vựng */}
                  <div style={{ position: 'relative', width: '220px' }}>
                    <i
                      className="fa-solid fa-magnifying-glass"
                      style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.82rem' }}
                    ></i>
                    <input
                      type="text"
                      placeholder="Tìm từ vựng, nghĩa..."
                      value={wordSearch}
                      onChange={(e) => setWordSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 10px 7px 30px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.84rem',
                      }}
                    />
                  </div>

                  {/* Lọc loại từ */}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      fontWeight: '600',
                    }}
                  >
                    <option value="ALL">Tất cả loại từ</option>
                    <option value="Noun">Danh từ (Noun)</option>
                    <option value="Verb">Động từ (Verb)</option>
                    <option value="Adjective">Tính từ (Adjective)</option>
                    <option value="Adverb">Trạng từ (Adverb)</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleOpenAddWord(currentDeck.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>Thêm từ vào đề tài</span>
                  </button>
                </div>
              </div>

              {/* Table Danh Sách Từ Vựng */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px', fontWeight: '800', color: '#334155', width: '50px' }}>STT</th>
                      <th style={{ padding: '10px 12px', fontWeight: '800', color: '#334155', width: '180px' }}>Từ Vựng & Phát Âm</th>
                      <th style={{ padding: '10px 12px', fontWeight: '800', color: '#334155', width: '100px' }}>Loại Từ</th>
                      <th style={{ padding: '10px 12px', fontWeight: '800', color: '#334155', width: '220px' }}>Nghĩa Tiếng Việt</th>
                      <th style={{ padding: '10px 12px', fontWeight: '800', color: '#334155' }}>Định Nghĩa & Ví Dụ Ngữ Cảnh</th>
                      <th style={{ padding: '10px 12px', fontWeight: '800', color: '#334155', width: '110px', textAlign: 'right' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWords.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                          Chưa có từ vựng nào trong đề tài này. Hãy bấm <strong>"+ Thêm từ vào đề tài"</strong> để bắt đầu.
                        </td>
                      </tr>
                    ) : (
                      filteredWords.map((card, idx) => (
                        <tr
                          key={card.id || idx}
                          style={{ borderBottom: '1px solid #e2e8f0' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '10px 12px', fontWeight: '700', color: '#64748b' }}>
                            #{idx + 1}
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.98rem', fontWeight: '800', color: '#0f172a' }}>
                                {card.word}
                              </span>
                              <button
                                type="button"
                                onClick={() => handlePlayAudio(card.word)}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  backgroundColor: playingWord === card.word ? '#0284c7' : '#f1f5f9',
                                  color: playingWord === card.word ? '#ffffff' : '#0284c7',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.72rem',
                                }}
                                title="Nghe phát âm chuẩn"
                              >
                                <i className="fa-solid fa-volume-high"></i>
                              </button>
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                              {card.ipa}
                            </div>
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                              }}
                            >
                              {card.type}
                            </span>
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>{card.meaning}</div>
                            {card.collocation && (
                              <div style={{ fontSize: '0.74rem', color: '#0284c7', marginTop: '2px' }}>
                                <i className="fa-solid fa-link" style={{ marginRight: '3px' }}></i>
                                {card.collocation}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            {card.english_def && (
                              <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '3px' }}>
                                {card.english_def}
                              </div>
                            )}
                            {card.example && (
                              <div style={{ fontSize: '0.8rem', color: '#1e293b' }}>
                                <strong>VD:</strong> "{card.example}"
                              </div>
                            )}
                            {card.example_vi && (
                              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                                ↳ {card.example_vi}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditWord(card)}
                                style={{
                                  padding: '4px 7px',
                                  borderRadius: '5px',
                                  backgroundColor: 'transparent',
                                  color: '#0284c7',
                                  border: '1px solid #bae6fd',
                                  fontSize: '0.76rem',
                                  cursor: 'pointer',
                                }}
                                title="Sửa từ vựng"
                              >
                                <i className="fa-solid fa-pen"></i>
                              </button>

                              {card.isCustom && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteWord(card.id, card.word)}
                                  style={{
                                    padding: '4px 7px',
                                    borderRadius: '5px',
                                    backgroundColor: 'transparent',
                                    color: '#dc2626',
                                    border: '1px solid #fecaca',
                                    fontSize: '0.76rem',
                                    cursor: 'pointer',
                                  }}
                                  title="Xóa từ vựng"
                                >
                                  <i className="fa-solid fa-trash-can"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== MODAL TẠO / SỬA ĐỀ TÀI ==================== */}
      {deckModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                {deckModal.mode === 'create' ? '+ Tạo Đề Tài Từ Vựng Mới' : 'Chỉnh Sửa Đề Tài'}
              </h3>
              <button
                type="button"
                onClick={() => setDeckModal({ ...deckModal, isOpen: false })}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDeck} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                  Tên Đề Tài Từ Vựng <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Từ Vựng Chuyên Ngành Y Khoa & Dược Học"
                  value={deckModal.title}
                  onChange={(e) => setDeckModal({ ...deckModal, title: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    Trình độ CEFR
                  </label>
                  <select
                    value={deckModal.level}
                    onChange={(e) => setDeckModal({ ...deckModal, level: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    <option value="A1 - A2">A1 - A2 (Cơ bản)</option>
                    <option value="B1 - B2">B1 - B2 (Trung cấp)</option>
                    <option value="B2 - C1">B2 - C1 (Nâng cao)</option>
                    <option value="IELTS / TOEIC">IELTS / TOEIC</option>
                    <option value="Chuyên ngành">Chuyên ngành</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    Màu nhận diện
                  </label>
                  <select
                    value={deckModal.color}
                    onChange={(e) => setDeckModal({ ...deckModal, color: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    <option value="#0284c7">Xanh dương (Blue)</option>
                    <option value="#7c3aed">Tím (Purple)</option>
                    <option value="#059669">Xanh lá (Green)</option>
                    <option value="#d97706">Cam (Amber)</option>
                    <option value="#e11d48">Hồng đậm (Rose)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                  Mô tả đề tài
                </label>
                <textarea
                  rows="3"
                  placeholder="Mô tả phạm vi từ vựng và lưu ý học tập..."
                  value={deckModal.description}
                  onChange={(e) => setDeckModal({ ...deckModal, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', resize: 'vertical' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDeckModal({ ...deckModal, isOpen: false })}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: '700', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                >
                  {deckModal.mode === 'create' ? 'Tạo Đề Tài' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL THÊM / SỬA TỪ VỰNG ==================== */}
      {wordModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '600px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                {wordModal.mode === 'create' ? '+ Thêm Từ Vựng Vào Đề Tài' : 'Chỉnh Sửa Từ Vựng'}
              </h3>
              <button
                type="button"
                onClick={() => setWordModal({ ...wordModal, isOpen: false })}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWord} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                  Thuộc Đề Tài / Chủ Đề <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={wordModal.deckId}
                  onChange={(e) => setWordModal({ ...wordModal, deckId: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: '700' }}
                >
                  {allDecks.map((d) => (
                    <option key={d.id} value={d.id}>
                      [{d.level}] {d.title} ({d.cards?.length || 0} từ)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    Từ Tiếng Anh <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Collaborate"
                    value={wordModal.word}
                    onChange={(e) => setWordModal({ ...wordModal, word: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: '700' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    Phiên âm IPA
                  </label>
                  <input
                    type="text"
                    placeholder="/kəˈlæb.ə.reɪt/"
                    value={wordModal.ipa}
                    onChange={(e) => setWordModal({ ...wordModal, ipa: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    Loại từ
                  </label>
                  <select
                    value={wordModal.type}
                    onChange={(e) => setWordModal({ ...wordModal, type: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    <option value="Noun">Danh từ (Noun)</option>
                    <option value="Verb">Động từ (Verb)</option>
                    <option value="Adjective">Tính từ (Adjective)</option>
                    <option value="Adverb">Trạng từ (Adverb)</option>
                    <option value="Idiom">Thành ngữ (Idiom)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                  Nghĩa Tiếng Việt <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hợp tác, cộng tác cùng làm việc"
                  value={wordModal.meaning}
                  onChange={(e) => setWordModal({ ...wordModal, meaning: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                  Định nghĩa tiếng Anh (English Definition)
                </label>
                <input
                  type="text"
                  placeholder="To work together with someone for a special purpose."
                  value={wordModal.english_def}
                  onChange={(e) => setWordModal({ ...wordModal, english_def: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    Câu Ví Dụ Tiếng Anh
                  </label>
                  <textarea
                    rows="2"
                    placeholder="We collaborate with international partners."
                    value={wordModal.example}
                    onChange={(e) => setWordModal({ ...wordModal, example: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', resize: 'vertical' }}
                  ></textarea>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    Bản Dịch Câu Ví Dụ
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Chúng tôi hợp tác với các đối tác quốc tế."
                    value={wordModal.example_vi}
                    onChange={(e) => setWordModal({ ...wordModal, example_vi: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', resize: 'vertical' }}
                  ></textarea>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                  Cụm từ hay gặp (Collocation)
                </label>
                <input
                  type="text"
                  placeholder="collaborate on a project / collaborate closely"
                  value={wordModal.collocation}
                  onChange={(e) => setWordModal({ ...wordModal, collocation: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setWordModal({ ...wordModal, isOpen: false })}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: '700', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: '#7c3aed', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                >
                  {wordModal.mode === 'create' ? 'Thêm Từ Vựng' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

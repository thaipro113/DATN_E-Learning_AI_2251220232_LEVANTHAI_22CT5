import React, { useState, useEffect, useMemo } from 'react';
import {
  DEFAULT_VOCABULARY_DECKS,
  getStoredCustomDecks,
  saveStoredCustomDecks,
  getStoredCustomWords,
  saveStoredCustomWords,
  getDeckOverrides,
  saveDeckOverrides,
  getDeletedDeckIds,
  saveDeletedDeckIds,
  getWordOverrides,
  saveWordOverrides,
  getDeletedWordIds,
  saveDeletedWordIds,
  speakWord,
} from '../utils/flashcardStorage';

export default function AdminFlashcardManager() {
  const [customDecks, setCustomDecks] = useState(() => getStoredCustomDecks());
  const [customWords, setCustomWords] = useState(() => getStoredCustomWords());
  const [deckOverrides, setDeckOverrides] = useState(() => getDeckOverrides());
  const [deletedDeckIds, setDeletedDeckIds] = useState(() => getDeletedDeckIds());
  const [wordOverrides, setWordOverrides] = useState(() => getWordOverrides());
  const [deletedWordIds, setDeletedWordIds] = useState(() => getDeletedWordIds());

  const [activeDeckId, setActiveDeckId] = useState('daily_life');
  const [wordSearch, setWordSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [playingWord, setPlayingWord] = useState(null);

  // Modal Chủ Đề
  const [deckModal, setDeckModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
    id: null,
    title: '',
    level: 'B1 - B2',
    color: '#0284c7',
    description: '',
  });

  // Modal Từ Vựng
  const [wordModal, setWordModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
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

  // Đồng bộ vào localStorage
  useEffect(() => saveStoredCustomDecks(customDecks), [customDecks]);
  useEffect(() => saveStoredCustomWords(customWords), [customWords]);
  useEffect(() => saveDeckOverrides(deckOverrides), [deckOverrides]);
  useEffect(() => saveDeletedDeckIds(deletedDeckIds), [deletedDeckIds]);
  useEffect(() => saveWordOverrides(wordOverrides), [wordOverrides]);
  useEffect(() => saveDeletedWordIds(deletedWordIds), [deletedWordIds]);

  // Danh sách tất cả các chủ đề (Toàn bộ 3 bộ ban đầu gán quyền sở hữu cho Admin quản lý 100%)
  const allDecks = useMemo(() => {
    const builtIn = DEFAULT_VOCABULARY_DECKS
      .filter((d) => !deletedDeckIds.includes(d.id))
      .map((d) => {
        const override = deckOverrides[d.id] || {};
        const baseCards = d.cards
          .filter((c) => !deletedWordIds.includes(c.id))
          .map((c) => ({
            ...c,
            deckId: d.id,
            isCustom: true,
            ...(wordOverrides[c.id] || {}),
          }));
        const extraCards = customWords
          .filter((w) => w.deckId === d.id && !deletedWordIds.includes(w.id))
          .map((w) => ({
            ...w,
            ...(wordOverrides[w.id] || {}),
          }));

        return {
          ...d,
          author: 'Admin',
          isCustomDeck: true,
          ...override,
          cards: [...baseCards, ...extraCards],
        };
      });

    const custom = customDecks
      .filter((d) => !deletedDeckIds.includes(d.id))
      .map((d) => {
        const override = deckOverrides[d.id] || {};
        const cards = customWords
          .filter((w) => w.deckId === d.id && !deletedWordIds.includes(w.id))
          .map((w) => ({
            ...w,
            ...(wordOverrides[w.id] || {}),
          }));
        return {
          ...d,
          author: d.author || 'Admin',
          isCustomDeck: true,
          ...override,
          cards,
        };
      });

    return [...builtIn, ...custom];
  }, [customDecks, customWords, deckOverrides, deletedDeckIds, wordOverrides, deletedWordIds]);

  // Bộ thẻ đang chọn
  const activeDeck = useMemo(() => {
    return allDecks.find((d) => d.id === activeDeckId) || allDecks[0] || null;
  }, [allDecks, activeDeckId]);

  // Danh sách từ vựng của bộ thẻ đang chọn (có lọc & tìm kiếm)
  const filteredWords = useMemo(() => {
    if (!activeDeck) return [];
    return (activeDeck.cards || []).filter((w) => {
      const matchSearch =
        !wordSearch.trim() ||
        w.word.toLowerCase().includes(wordSearch.toLowerCase()) ||
        (w.meaning && w.meaning.toLowerCase().includes(wordSearch.toLowerCase())) ||
        (w.english_def && w.english_def.toLowerCase().includes(wordSearch.toLowerCase()));
      const matchType = typeFilter === 'ALL' || w.type.toLowerCase().includes(typeFilter.toLowerCase());
      return matchSearch && matchType;
    });
  }, [activeDeck, wordSearch, typeFilter]);

  // Thống kê tổng quan
  const totalDecksCount = allDecks.length;
  const totalWordsCount = allDecks.reduce((sum, d) => sum + (d.cards?.length || 0), 0);
  const adminDecksCount = allDecks.filter((d) => d.author === 'Admin' || !d.author).length;
  const teacherDecksCount = allDecks.filter((d) => d.author === 'Giảng viên').length;

  // Phát âm từ vựng
  const handlePlayAudio = (word) => {
    setPlayingWord(word);
    speakWord(word, 1.0);
    setTimeout(() => setPlayingWord(null), 1500);
  };

  // Mở modal tạo chủ đề
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

  // Mở modal sửa chủ đề
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

  // Lưu chủ đề (Áp dụng cho mọi chủ đề do Admin quản lý)
  const handleSaveDeck = (e) => {
    e.preventDefault();
    if (!deckModal.title.trim()) {
      alert('Vui lòng nhập tên chủ đề từ vựng.');
      return;
    }

    if (deckModal.mode === 'create') {
      const newDeck = {
        id: `deck_${Date.now()}`,
        title: deckModal.title.trim(),
        level: deckModal.level,
        color: deckModal.color || '#0284c7',
        description: deckModal.description.trim() || 'Chủ đề từ vựng chuyên ngành được biên soạn bởi quản trị viên.',
        icon: 'fa-folder-open',
        isCustomDeck: true,
        author: 'Admin',
        created_at: new Date().toISOString().split('T')[0],
      };
      setCustomDecks((prev) => [...prev, newDeck]);
      setActiveDeckId(newDeck.id);
      showToast('Đã tạo chủ đề từ vựng mới thành công!');
    } else {
      const isBuiltIn = DEFAULT_VOCABULARY_DECKS.some((d) => d.id === deckModal.id);
      if (isBuiltIn) {
        setDeckOverrides((prev) => ({
          ...prev,
          [deckModal.id]: {
            title: deckModal.title.trim(),
            level: deckModal.level,
            color: deckModal.color,
            description: deckModal.description.trim(),
          },
        }));
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
      }
      showToast('Đã cập nhật thông tin chủ đề thành công!');
    }
    setDeckModal({ ...deckModal, isOpen: false });
  };

  // Xóa chủ đề (Admin có toàn quyền xóa bất kỳ chủ đề nào)
  const handleDeleteDeck = (deckId, deckTitle) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa chủ đề "${deckTitle}" cùng tất cả các từ vựng liên quan?`)) {
      return;
    }
    setDeletedDeckIds((prev) => [...prev, deckId]);
    setCustomDecks((prev) => prev.filter((d) => d.id !== deckId));
    setCustomWords((prev) => prev.filter((w) => w.deckId !== deckId));
    if (activeDeckId === deckId) {
      const remaining = allDecks.filter((d) => d.id !== deckId);
      setActiveDeckId(remaining[0]?.id || 'daily_life');
    }
    showToast(`Đã xóa chủ đề "${deckTitle}" thành công!`);
  };

  // Mở modal thêm từ vựng
  const handleOpenAddWord = (defaultDeckId) => {
    setWordModal({
      isOpen: true,
      mode: 'create',
      id: null,
      deckId: defaultDeckId || activeDeckId,
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

  // Mở modal sửa từ vựng
  const handleOpenEditWord = (wordItem) => {
    setWordModal({
      isOpen: true,
      mode: 'edit',
      id: wordItem.id,
      deckId: wordItem.deckId || activeDeckId,
      word: wordItem.word,
      ipa: wordItem.ipa || '',
      type: wordItem.type || 'Noun',
      meaning: wordItem.meaning || '',
      english_def: wordItem.english_def || '',
      example: wordItem.example || '',
      example_vi: wordItem.example_vi || '',
      collocation: wordItem.collocation || '',
    });
  };

  // Lưu từ vựng (Áp dụng cho mọi từ trong hệ thống)
  const handleSaveWord = (e) => {
    e.preventDefault();
    if (!wordModal.word.trim() || !wordModal.meaning.trim()) {
      alert('Vui lòng nhập từ tiếng Anh và nghĩa tiếng Việt.');
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
        english_def: wordModal.english_def.trim() || 'Custom vocabulary entry.',
        example: wordModal.example.trim(),
        example_vi: wordModal.example_vi.trim(),
        collocation: wordModal.collocation.trim(),
      };
      setCustomWords((prev) => [newCard, ...prev]);
      setActiveDeckId(wordModal.deckId);
      showToast(`Đã thêm từ vựng "${newCard.word}" thành công!`);
    } else {
      const isCustomInState = customWords.some((w) => w.id === wordModal.id);
      if (isCustomInState) {
        setCustomWords((prev) =>
          prev.map((w) =>
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
          )
        );
      } else {
        // Built-in word override
        setWordOverrides((prev) => ({
          ...prev,
          [wordModal.id]: {
            deckId: wordModal.deckId,
            word: wordModal.word.trim(),
            ipa: wordModal.ipa.trim(),
            type: wordModal.type,
            meaning: wordModal.meaning.trim(),
            english_def: wordModal.english_def.trim(),
            example: wordModal.example.trim(),
            example_vi: wordModal.example_vi.trim(),
            collocation: wordModal.collocation.trim(),
          },
        }));
      }
      showToast(`Đã cập nhật từ vựng "${wordModal.word}" thành công!`);
    }
    setWordModal({ ...wordModal, isOpen: false });
  };

  // Xóa từ vựng (Admin có toàn quyền xóa bất kỳ từ nào)
  const handleDeleteWord = (wordId, wordText) => {
    if (!window.confirm(`Bạn có chắc muốn xóa từ vựng "${wordText}"?`)) {
      return;
    }
    setDeletedWordIds((prev) => [...prev, wordId]);
    setCustomWords((prev) => prev.filter((w) => w.id !== wordId));
    showToast(`Đã xóa từ vựng "${wordText}" thành công!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

      {/* Header Bar Quản Trị Flashcards */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
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
            <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              Quản Lý Chủ Đề & Ngân Hàng Từ Vựng Flashcards
            </h1>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '4px 0 0 46px' }}>
            Hệ thống bộ thẻ từ vựng phân loại theo chủ đề, cấp độ CEFR do Admin quản trị tập trung phục vụ học viên ôn tập.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleOpenCreateDeck}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.86rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
            }}
          >
            <i className="fa-solid fa-folder-plus"></i>
            <span>+ Tạo chủ đề mới</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddWord(activeDeckId)}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.86rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
            }}
          >
            <i className="fa-solid fa-plus-circle"></i>
            <span>+ Thêm từ vựng mới</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row (Gán quyền sở hữu rõ ràng cho Admin) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 20px',
            border: '1px solid var(--border-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TỔNG CHỦ ĐỀ FLASHCARDS
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0284c7', marginTop: '4px' }}>
              {totalDecksCount} chủ đề
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Đang hoạt động trên hệ thống
            </div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            <i className="fa-solid fa-layer-group"></i>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 20px',
            border: '1px solid var(--border-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TỔNG TỪ VỰNG HỆ THỐNG
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
              {totalWordsCount} từ vựng
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Đầy đủ IPA, nghĩa, ví dụ & âm thanh
            </div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            <i className="fa-solid fa-spell-check"></i>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 20px',
            border: '1px solid var(--border-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              DO ADMIN QUẢN TRỊ
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0284c7', marginTop: '4px' }}>
              {adminDecksCount} chủ đề
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Toàn quyền sửa, xóa & thêm từ
            </div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            <i className="fa-solid fa-user-shield"></i>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 20px',
            border: '1px solid var(--border-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              DO GIẢNG VIÊN BIÊN SOẠN
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#7c3aed', marginTop: '4px' }}>
              {teacherDecksCount} chủ đề
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Bộ thẻ do giáo viên tự tạo
            </div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            <i className="fa-solid fa-chalkboard-user"></i>
          </div>
        </div>
      </div>

      {/* ==================== PHẦN 1: BẢNG QUẢN LÝ CHỦ ĐỀ / BỘ THẺ ==================== */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-card)',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              Danh Sách Chủ Đề / Bộ Thẻ Từ Vựng ({allDecks.length})
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Tất cả các chủ đề đều do Admin toàn quyền quản lý, chỉnh sửa nội dung hoặc xóa bỏ khi cần thiết.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontWeight: '800', color: 'var(--text-main)', width: '60px' }}>STT</th>
                <th style={{ padding: '12px 14px', fontWeight: '800', color: 'var(--text-main)', width: '110px' }}>Cấp độ</th>
                <th style={{ padding: '12px 14px', fontWeight: '800', color: 'var(--text-main)' }}>Tên Chủ Đề & Mô Tả</th>
                <th style={{ padding: '12px 14px', fontWeight: '800', color: 'var(--text-main)', width: '120px', textAlign: 'center' }}>Số Từ Vựng</th>
                <th style={{ padding: '12px 14px', fontWeight: '800', color: 'var(--text-main)', width: '130px' }}>Phân Loại</th>
                <th style={{ padding: '12px 14px', fontWeight: '800', color: 'var(--text-main)', width: '220px', textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {allDecks.map((deck, idx) => {
                const isSelected = activeDeckId === deck.id;
                const wordCount = deck.cards?.length || 0;
                const isAdminDeck = deck.author === 'Admin' || !deck.author;

                return (
                  <tr
                    key={deck.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.05)' : 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-muted)' }}>
                      #{idx + 1}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '0.74rem',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: `${deck.color || '#0284c7'}15`,
                          color: deck.color || '#0284c7',
                          border: `1px solid ${deck.color || '#0284c7'}30`,
                        }}
                      >
                        {deck.level}
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '800', color: isSelected ? '#0284c7' : 'var(--text-main)', fontSize: '0.92rem' }}>
                        {deck.title}
                        {isSelected && (
                          <span style={{ marginLeft: '8px', fontSize: '0.72rem', backgroundColor: '#0284c7', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                            Đang xem
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {deck.description || 'Chưa có mô tả chi tiết.'}
                      </div>
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{ fontWeight: '800', fontSize: '0.9rem', color: wordCount > 0 ? '#059669' : '#94a3b8' }}>
                        {wordCount} thẻ
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      {isAdminDeck ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '3px 8px', borderRadius: '6px' }}>
                          <i className="fa-solid fa-user-shield" style={{ marginRight: '4px' }}></i>Admin
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#7c3aed', backgroundColor: '#ede9fe', padding: '3px 8px', borderRadius: '6px' }}>
                          <i className="fa-solid fa-chalkboard-user" style={{ marginRight: '4px' }}></i>Giảng viên
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setActiveDeckId(deck.id)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            backgroundColor: isSelected ? '#0284c7' : 'var(--bg-subtle)',
                            color: isSelected ? '#ffffff' : 'var(--text-main)',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          <i className="fa-solid fa-list-check" style={{ marginRight: '4px' }}></i>
                          {isSelected ? 'Đang chọn' : 'Xem từ vựng'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditDeck(deck)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'transparent',
                            color: '#0284c7',
                            border: '1px solid #bae6fd',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                          }}
                          title="Chỉnh sửa chủ đề"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteDeck(deck.id, deck.title)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'transparent',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                          }}
                          title="Xóa chủ đề"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== PHẦN 2: BẢNG DANH SÁCH TỪ VỰNG TRONG CHỦ ĐỀ ĐANG CHỌN ==================== */}
      {activeDeck && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-card)',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          {/* Header Bảng Từ Vựng + Thanh Tìm Kiếm + Bộ Lọc */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: `${activeDeck.color || '#0284c7'}15`,
                    color: activeDeck.color || '#0284c7',
                  }}
                >
                  {activeDeck.level}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                  Từ Vựng Chủ Đề: {activeDeck.title}
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                  ({filteredWords.length} / {activeDeck.cards?.length || 0} từ)
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Admin có toàn quyền chỉnh sửa phát âm, định nghĩa, ví dụ hoặc xóa từ vựng trong bất kỳ bộ thẻ nào.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Ô tìm kiếm từ vựng */}
              <div style={{ position: 'relative', width: '220px' }}>
                <i
                  className="fa-solid fa-magnifying-glass"
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.82rem' }}
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
                    border: '1px solid var(--border-color)',
                    fontSize: '0.84rem',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
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
                  border: '1px solid var(--border-color)',
                  fontSize: '0.84rem',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-main)',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">Tất cả loại từ</option>
                <option value="Noun">Danh từ (Noun)</option>
                <option value="Verb">Động từ (Verb)</option>
                <option value="Adjective">Tính từ (Adjective)</option>
                <option value="Adverb">Trạng từ (Adverb)</option>
              </select>

              {/* Nút Thêm từ vào bộ này */}
              <button
                type="button"
                onClick={() => handleOpenAddWord(activeDeck.id)}
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
                <span>Thêm từ vào bộ này</span>
              </button>
            </div>
          </div>

          {/* Bảng Từ Vựng */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--text-main)', width: '50px' }}>STT</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--text-main)', width: '180px' }}>Từ Vựng & Phát Âm</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--text-main)', width: '100px' }}>Loại Từ</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--text-main)', width: '220px' }}>Nghĩa Tiếng Việt</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--text-main)' }}>Định Nghĩa & Ví Dụ Ngữ Cảnh</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--text-main)', width: '120px', textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredWords.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-box-open" style={{ fontSize: '2rem', marginBottom: '8px', display: 'block', color: '#cbd5e1' }}></i>
                      Chưa có từ vựng nào phù hợp trong chủ đề này. Hãy bấm <strong>"+ Thêm từ vào bộ này"</strong> để bắt đầu.
                    </td>
                  </tr>
                ) : (
                  filteredWords.map((card, idx) => (
                    <tr
                      key={card.id || idx}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: '700', color: 'var(--text-muted)' }}>
                        #{idx + 1}
                      </td>

                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>
                            {card.word}
                          </span>
                          <button
                            type="button"
                            onClick={() => handlePlayAudio(card.word)}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              backgroundColor: playingWord === card.word ? '#0284c7' : '#f1f5f9',
                              color: playingWord === card.word ? '#ffffff' : '#0284c7',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              transition: 'all 0.15s ease',
                            }}
                            title="Nghe phát âm chuẩn bản xứ"
                          >
                            <i className="fa-solid fa-volume-high"></i>
                          </button>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                          {card.ipa}
                        </div>
                      </td>

                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: '#e2e8f0',
                            color: '#334155',
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
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
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
                              padding: '5px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'transparent',
                              color: '#0284c7',
                              border: '1px solid #bae6fd',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                            }}
                            title="Sửa từ vựng"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteWord(card.id, card.word)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'transparent',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                            }}
                            title="Xóa từ vựng"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
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

      {/* ==================== MODAL TẠO / SỬA CHỦ ĐỀ ==================== */}
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
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                {deckModal.mode === 'create' ? '+ Tạo Chủ Đề / Bộ Thẻ Mới' : 'Chỉnh Sửa Thông Tin Chủ Đề'}
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
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
                  Tên Chủ Đề Từ Vựng <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Từ Vựng Chuyên Ngành Logistics & Xuất Nhập Khẩu"
                  value={deckModal.title}
                  onChange={(e) => setDeckModal({ ...deckModal, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.88rem',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
                    Trình độ CEFR
                  </label>
                  <select
                    value={deckModal.level}
                    onChange={(e) => setDeckModal({ ...deckModal, level: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.88rem',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-main)',
                    }}
                  >
                    <option value="A1 - A2">A1 - A2 (Cơ bản)</option>
                    <option value="B1 - B2">B1 - B2 (Trung cấp)</option>
                    <option value="B2 - C1">B2 - C1 (Nâng cao)</option>
                    <option value="IELTS / TOEIC">IELTS / TOEIC</option>
                    <option value="Chuyên ngành">Chuyên ngành</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
                    Màu sắc nhận diện
                  </label>
                  <select
                    value={deckModal.color}
                    onChange={(e) => setDeckModal({ ...deckModal, color: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.88rem',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-main)',
                    }}
                  >
                    <option value="#0284c7">Xanh dương (Blue)</option>
                    <option value="#7c3aed">Tím (Purple)</option>
                    <option value="#059669">Xanh lá (Green)</option>
                    <option value="#d97706">Cam hổ phách (Amber)</option>
                    <option value="#e11d48">Hồng đậm (Rose)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
                  Mô tả chủ đề
                </label>
                <textarea
                  rows="3"
                  placeholder="Mô tả phạm vi từ vựng và đối tượng học viên hướng tới..."
                  value={deckModal.description}
                  onChange={(e) => setDeckModal({ ...deckModal, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.88rem',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    resize: 'vertical',
                  }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDeckModal({ ...deckModal, isOpen: false })}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.86rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    backgroundColor: '#0284c7',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  {deckModal.mode === 'create' ? 'Tạo Chủ Đề' : 'Lưu Thay Đổi'}
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
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '620px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                {wordModal.mode === 'create' ? '+ Thêm Từ Vựng Vào Ngân Hàng' : 'Chỉnh Sửa Từ Vựng'}
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
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
                  Thuộc Chủ Đề / Bộ Thẻ <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={wordModal.deckId}
                  onChange={(e) => setWordModal({ ...wordModal, deckId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.88rem',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    fontWeight: '700',
                  }}
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
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
                    Từ Tiếng Anh <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Comprehensive"
                    value={wordModal.word}
                    onChange={(e) => setWordModal({ ...wordModal, word: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.88rem',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-main)',
                      fontWeight: '700',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
                    Phiên âm IPA
                  </label>
                  <input
                    type="text"
                    placeholder="/kɑːm.prəˈhen.sɪv/"
                    value={wordModal.ipa}
                    onChange={(e) => setWordModal({ ...wordModal, ipa: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.88rem',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-main)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
                    Loại từ
                  </label>
                  <select
                    value={wordModal.type}
                    onChange={(e) => setWordModal({ ...wordModal, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.88rem',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-main)',
                    }}
                  >
                    <option value="Noun">Danh từ (Noun)</option>
                    <option value="Verb">Động từ (Verb)</option>
                    <option value="Adjective">Tính từ (Adjective)</option>
                    <option value="Adverb">Trạng từ (Adverb)</option>
                    <option value="Idiom">Thành ngữ (Idiom)</option>
                    <option value="Phrase">Cụm từ (Phrase)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
                  Nghĩa Tiếng Việt <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Toàn diện, bao quát mọi khía cạnh"
                  value={wordModal.meaning}
                  onChange={(e) => setWordModal({ ...wordModal, meaning: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.88rem',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
                  Định nghĩa tiếng Anh (English Definition)
                </label>
                <input
                  type="text"
                  placeholder="Complete and including everything that is necessary."
                  value={wordModal.english_def}
                  onChange={(e) => setWordModal({ ...wordModal, english_def: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.88rem',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
                    Câu Ví Dụ Tiếng Anh
                  </label>
                  <textarea
                    rows="2"
                    placeholder="The course provides a comprehensive overview of AI."
                    value={wordModal.example}
                    onChange={(e) => setWordModal({ ...wordModal, example: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.88rem',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-main)',
                      resize: 'vertical',
                    }}
                  ></textarea>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
                    Bản Dịch Câu Ví Dụ
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Khóa học cung cấp một cái nhìn toàn diện về trí tuệ nhân tạo."
                    value={wordModal.example_vi}
                    onChange={(e) => setWordModal({ ...wordModal, example_vi: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.88rem',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-main)',
                      resize: 'vertical',
                    }}
                  ></textarea>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
                  Cụm từ hay gặp (Collocation)
                </label>
                <input
                  type="text"
                  placeholder="comprehensive overview / comprehensive guide"
                  value={wordModal.collocation}
                  onChange={(e) => setWordModal({ ...wordModal, collocation: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.88rem',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setWordModal({ ...wordModal, isOpen: false })}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.86rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    backgroundColor: '#7c3aed',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
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

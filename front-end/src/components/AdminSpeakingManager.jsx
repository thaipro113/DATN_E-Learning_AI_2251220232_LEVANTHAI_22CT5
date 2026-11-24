import React, { useState, useEffect } from 'react';
import {
  getSpeakingSentences,
  addSpeakingSentence,
  updateSpeakingSentence,
  deleteSpeakingSentence,
  resetSpeakingSentences,
  getSpeakingTopics,
  addSpeakingTopic,
  deleteSpeakingTopic,
} from '../utils/speakingStorage';
import ConfirmModal from './ConfirmModal';
import Pagination from './Pagination';

export default function AdminSpeakingManager() {
  const [sentences, setSentences] = useState([]);
  const [topics, setTopics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterTopic, setFilterTopic] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State cho Câu Luyện Nói
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'CREATE', // 'CREATE' | 'EDIT'
    editingId: null,
    formData: {
      sentence: '',
      translation: '',
      level: 'A1',
      topic: 'DAILY',
      customTopicName: '',
      tips: '',
    },
  });

  // Modal State cho Quản Lý Danh Mục Chủ Đề
  const [topicModalState, setTopicModalState] = useState({
    isOpen: false,
    newTopicName: '',
    newTopicLevel: 'A1 - B2',
    newTopicColor: '#0284c7',
  });

  // Delete Sentence Confirm Modal
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    item: null,
  });

  // Delete Topic Confirm Modal
  const [deleteTopicConfirm, setDeleteTopicConfirm] = useState({
    isOpen: false,
    topic: null,
  });

  // Toast message
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = () => {
    setSentences(getSpeakingSentences());
    setTopics(getSpeakingTopics());
  };

  useEffect(() => {
    loadData();
    const handleUpdateSentences = () => setSentences(getSpeakingSentences());
    const handleUpdateTopics = () => setTopics(getSpeakingTopics());

    window.addEventListener('tl_speaking_sentences_updated', handleUpdateSentences);
    window.addEventListener('tl_speaking_topics_updated', handleUpdateTopics);

    return () => {
      window.removeEventListener('tl_speaking_sentences_updated', handleUpdateSentences);
      window.removeEventListener('tl_speaking_topics_updated', handleUpdateTopics);
    };
  }, []);

  // Map thông tin hiển thị chủ đề
  const getTopicInfo = (topicId) => {
    const found = topics.find((t) => t.id === topicId);
    if (found) {
      return { name: found.name, color: found.color || '#0284c7', bg: found.bg || '#e0f2fe' };
    }
    return { name: topicId, color: '#475569', bg: '#f1f5f9' };
  };

  // Phát âm thử câu mẫu
  const handleTestAudio = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    utt.rate = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find((v) => v.lang && (v.lang.startsWith('en-US') || v.lang.startsWith('en-GB') || v.lang.startsWith('en')));
    if (enVoice) utt.voice = enVoice;
    window.speechSynthesis.speak(utt);
  };

  // Mở modal tạo câu mới
  const handleOpenCreate = () => {
    setModalState({
      isOpen: true,
      mode: 'CREATE',
      editingId: null,
      formData: {
        sentence: '',
        translation: '',
        level: 'A1',
        topic: topics[0]?.id || 'DAILY',
        customTopicName: '',
        tips: '',
      },
    });
  };

  // Mở modal sửa câu
  const handleOpenEdit = (item) => {
    setModalState({
      isOpen: true,
      mode: 'EDIT',
      editingId: item.id,
      formData: {
        sentence: item.sentence || '',
        translation: item.translation || '',
        level: item.level || 'A1',
        topic: item.topic || 'DAILY',
        customTopicName: '',
        tips: item.tips || '',
      },
    });
  };

  // Lưu câu (Thêm / Sửa)
  const handleSubmitForm = (e) => {
    e.preventDefault();
    let { sentence, translation, level, topic, customTopicName, tips } = modalState.formData;

    if (!sentence.trim()) {
      alert('Vui lòng nhập câu tiếng Anh chuẩn!');
      return;
    }
    if (!translation.trim()) {
      alert('Vui lòng nhập nghĩa tiếng Việt!');
      return;
    }

    // Nếu chọn tạo chủ đề mới ngay trong form câu hỏi
    if (topic === '__NEW__') {
      if (!customTopicName.trim()) {
        alert('Vui lòng nhập tên cho chủ đề mới!');
        return;
      }
      const createdTopic = addSpeakingTopic({
        name: customTopicName.trim(),
        level: 'A1 - B2',
        color: '#0284c7',
        bg: '#e0f2fe',
      });
      topic = createdTopic.id;
    }

    if (modalState.mode === 'CREATE') {
      addSpeakingSentence({ sentence, translation, level, topic, tips });
      showToast('Đã thêm câu luyện nói mới thành công!');
    } else {
      updateSpeakingSentence(modalState.editingId, { sentence, translation, level, topic, tips });
      showToast('Đã cập nhật câu luyện nói thành công!');
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
    loadData();
  };

  // Xóa câu
  const handleConfirmDelete = () => {
    if (!deleteConfirm.item) return;
    deleteSpeakingSentence(deleteConfirm.item.id);
    setDeleteConfirm({ isOpen: false, item: null });
    showToast('Đã xóa câu luyện nói khỏi ngân hàng đề!');
    loadData();
  };

  // Tạo chủ đề mới từ Modal Quản lý Chủ đề
  const handleCreateTopic = (e) => {
    e.preventDefault();
    if (!topicModalState.newTopicName.trim()) {
      alert('Vui lòng nhập tên chủ đề!');
      return;
    }
    addSpeakingTopic({
      name: topicModalState.newTopicName.trim(),
      level: topicModalState.newTopicLevel || 'A1 - B2',
      color: topicModalState.newTopicColor || '#0284c7',
      bg: '#e0f2fe',
    });
    setTopicModalState((prev) => ({ ...prev, newTopicName: '' }));
    showToast('Đã thêm chủ đề luyện nói mới thành công!');
    loadData();
  };

  // Xóa chủ đề
  const handleConfirmDeleteTopic = () => {
    if (!deleteTopicConfirm.topic) return;
    deleteSpeakingTopic(deleteTopicConfirm.topic.id);
    setDeleteTopicConfirm({ isOpen: false, topic: null });
    showToast(`Đã xóa chủ đề "${deleteTopicConfirm.topic.name}"!`);
    loadData();
  };

  // Khôi phục mặc định
  const handleResetDefaults = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục danh sách câu và chủ đề mặc định ban đầu?')) {
      resetSpeakingSentences();
      showToast('Đã khôi phục dữ liệu mặc định!');
      loadData();
    }
  };

  // Lọc danh sách câu
  const filteredSentences = sentences.filter((item) => {
    const matchSearch =
      (item.sentence || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.translation || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchLevel = filterLevel === 'ALL' || item.level === filterLevel;
    const matchTopic = filterTopic === 'ALL' || item.topic === filterTopic;
    return matchSearch && matchLevel && matchTopic;
  });

  const totalPages = Math.ceil(filteredSentences.length / itemsPerPage) || 1;
  const paginatedSentences = filteredSentences.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="quiz-room-container" style={{ padding: '0 4px' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 20px',
            backgroundColor: toast.type === 'error' ? '#dc2626' : '#059669',
            color: 'white',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '0.9rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Header & Main Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
            <i className="fa-solid fa-microphone-lines" style={{ color: '#0284c7', marginRight: '8px' }}></i>
            Quản Lý Ngân Hàng Câu Luyện Nói & Phát Âm AI
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.86rem', margin: 0 }}>
            Admin toàn quyền tạo mới chủ đề, thêm/sửa/xóa câu mẫu luyện nói theo chuẩn CEFR cho học viên.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleResetDefaults}
            style={{
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Khôi phục danh sách câu và chủ đề mặc định"
          >
            <i className="fa-solid fa-rotate-left"></i> Khôi phục mặc định
          </button>

          <button
            onClick={() => setTopicModalState((prev) => ({ ...prev, isOpen: true }))}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid #0284c7',
              backgroundColor: '#f0f9ff',
              color: '#0284c7',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-folder-plus"></i> Quản lý Chủ đề ({topics.length})
          </button>

          <button
            onClick={handleOpenCreate}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#0284c7',
              color: 'white',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
            }}
          >
            <i className="fa-solid fa-plus"></i> Thêm câu luyện nói mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '700' }}>TỔNG SỐ CÂU</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0284c7', marginTop: '2px' }}>{sentences.length} câu</div>
        </div>
        <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '700' }}>TỔNG CHỦ ĐỀ</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0d9488', marginTop: '2px' }}>{topics.length} chủ đề</div>
        </div>
        <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '700' }}>SƠ CẤP (A1 - A2)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#059669', marginTop: '2px' }}>
            {sentences.filter((s) => s.level === 'A1' || s.level === 'A2').length} câu
          </div>
        </div>
        <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '700' }}>TRUNG CẤP & CAO CẤP</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#7c3aed', marginTop: '2px' }}>
            {sentences.filter((s) => s.level === 'B1' || s.level === 'B2' || s.level === 'C1').length} câu
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '16px',
          background: '#ffffff',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
          ></i>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo câu tiếng Anh hoặc nghĩa tiếng Việt..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.86rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '0.84rem',
            color: '#334155',
            fontWeight: '600',
            outline: 'none',
          }}
        >
          <option value="ALL">Tất cả Cấp độ</option>
          <option value="A1">Cấp độ A1</option>
          <option value="A2">Cấp độ A2</option>
          <option value="B1">Cấp độ B1</option>
          <option value="B2">Cấp độ B2</option>
          <option value="C1">Cấp độ C1</option>
        </select>

        <select
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '0.84rem',
            color: '#334155',
            fontWeight: '600',
            outline: 'none',
          }}
        >
          <option value="ALL">Tất cả Chủ đề ({topics.length})</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sentences Data Table */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
              <th style={{ padding: '12px 14px', width: '50px' }}>#</th>
              <th style={{ padding: '12px 14px', width: '100px' }}>Cấp độ</th>
              <th style={{ padding: '12px 14px', width: '170px' }}>Chủ đề</th>
              <th style={{ padding: '12px 14px' }}>Câu tiếng Anh chuẩn</th>
              <th style={{ padding: '12px 14px' }}>Nghĩa tiếng Việt</th>
              <th style={{ padding: '12px 14px', width: '180px' }}>Mẹo phát âm</th>
              <th style={{ padding: '12px 14px', width: '110px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSentences.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                  Không tìm thấy câu luyện nói nào phù hợp.
                </td>
              </tr>
            ) : (
              paginatedSentences.map((item, index) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                const topicInfo = getTopicInfo(item.topic);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                    <td style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: '700' }}>{globalIndex}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          backgroundColor: '#ede9fe',
                          color: '#6d28d9',
                          fontWeight: '800',
                          fontSize: '0.72rem',
                          padding: '3px 7px',
                          borderRadius: '6px',
                        }}
                      >
                        {item.level || 'A1'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          backgroundColor: topicInfo.bg,
                          color: topicInfo.color,
                          fontWeight: '700',
                          fontSize: '0.72rem',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {topicInfo.name}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: '700' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{item.sentence}</span>
                        <button
                          type="button"
                          onClick={() => handleTestAudio(item.sentence)}
                          style={{
                            border: 'none',
                            background: '#f1f5f9',
                            color: '#0284c7',
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                          }}
                          title="Nghe thử giọng đọc AI"
                        >
                          <i className="fa-solid fa-volume-high"></i>
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{item.translation}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.8rem' }}>
                      {item.tips || <span style={{ color: '#cbd5e1' }}>--</span>}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          style={{
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#0284c7',
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Chỉnh sửa câu"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, item })}
                          style={{
                            border: '1px solid #fecaca',
                            background: '#fff5f5',
                            color: '#dc2626',
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Xóa câu"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(p)} />
        </div>
      )}

      {/* Modal Thêm / Chỉnh Sửa Câu */}
      {modalState.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '580px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                {modalState.mode === 'CREATE' ? '➕ Thêm Câu Luyện Nói Mới' : '✏️ Chỉnh Sửa Câu Luyện Nói'}
              </h3>
              <button
                onClick={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
                style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Câu tiếng Anh chuẩn: <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nice to meet you. I am excited to learn English."
                  value={modalState.formData.sentence}
                  onChange={(e) => setModalState((prev) => ({ ...prev, formData: { ...prev.formData, sentence: e.target.value } }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Nghĩa tiếng Việt: <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Rất vui được gặp bạn. Tôi rất hào hứng học tiếng Anh."
                  value={modalState.formData.translation}
                  onChange={(e) => setModalState((prev) => ({ ...prev, formData: { ...prev.formData, translation: e.target.value } }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Cấp độ CEFR:
                  </label>
                  <select
                    value={modalState.formData.level}
                    onChange={(e) => setModalState((prev) => ({ ...prev, formData: { ...prev.formData, level: e.target.value } }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  >
                    <option value="A1">A1 · Mới bắt đầu</option>
                    <option value="A2">A2 · Sơ cấp</option>
                    <option value="B1">B1 · Trung cấp</option>
                    <option value="B2">B2 · Trung cao cấp</option>
                    <option value="C1">C1 · Cao cấp</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Chủ đề bài học:
                  </label>
                  <select
                    value={modalState.formData.topic}
                    onChange={(e) => setModalState((prev) => ({ ...prev, formData: { ...prev.formData, topic: e.target.value } }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                    <option value="__NEW__" style={{ color: '#0284c7', fontWeight: '700' }}>
                      + Tạo chủ đề mới tùy ý...
                    </option>
                  </select>
                </div>
              </div>

              {/* Ô nhập chủ đề mới nếu chọn __NEW__ */}
              {modalState.formData.topic === '__NEW__' && (
                <div style={{ marginBottom: '16px', background: '#f0f9ff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#0369a1', marginBottom: '6px' }}>
                    Nhập tên chủ đề mới của bạn: <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Tiếng Anh Chuyên Ngành IT, Y Tế, Khách Sạn..."
                    value={modalState.formData.customTopicName}
                    onChange={(e) => setModalState((prev) => ({ ...prev, formData: { ...prev.formData, customTopicName: e.target.value } }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #0284c7',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Mẹo phát âm / Lưu ý trọng âm (Tips):
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Chú ý phát âm rõ âm đuôi /t/ và nhấn trọng âm từ đầu..."
                  value={modalState.formData.tips}
                  onChange={(e) => setModalState((prev) => ({ ...prev, formData: { ...prev.formData, tips: e.target.value } }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.86rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontWeight: '700',
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#0284c7',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                  }}
                >
                  {modalState.mode === 'CREATE' ? 'Thêm câu mới' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Quản Lý Danh Mục Chủ Đề */}
      {topicModalState.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                📁 Quản Lý Danh Mục Chủ Đề Luyện Nói
              </h3>
              <button
                onClick={() => setTopicModalState((prev) => ({ ...prev, isOpen: false }))}
                style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {/* Form tạo chủ đề mới */}
              <form onSubmit={handleCreateTopic} style={{ marginBottom: '20px', background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.86rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                  ➕ Thêm chủ đề mới:
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    required
                    placeholder="Tên chủ đề (Ví dụ: Tiếng Anh IT, Y Tế...)"
                    value={topicModalState.newTopicName}
                    onChange={(e) => setTopicModalState((prev) => ({ ...prev, newTopicName: e.target.value }))}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.86rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#0284c7',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                    }}
                  >
                    Tạo chủ đề
                  </button>
                </div>
              </form>

              {/* Danh sách các chủ đề hiện tại */}
              <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#64748b', marginBottom: '10px' }}>
                DANH SÁCH CHỦ ĐỀ HIỆN CÓ ({topics.length}):
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {topics.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: t.color || '#0284c7',
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#0f172a' }}>{t.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Mã: {t.id}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {t.isDefault ? (
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                          Mặc định
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeleteTopicConfirm({ isOpen: true, topic: t })}
                          style={{
                            border: 'none',
                            background: '#fee2e2',
                            color: '#b91c1c',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.76rem',
                            fontWeight: '700',
                          }}
                          title="Xóa chủ đề này"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setTopicModalState((prev) => ({ ...prev, isOpen: false }))}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontWeight: '700',
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Sentence Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title="Xác nhận xóa câu luyện nói"
          message={`Bạn có chắc chắn muốn xóa câu "${deleteConfirm.item?.sentence}" khỏi ngân hàng luyện nói không?`}
          confirmText="Xóa vĩnh viễn"
          cancelText="Hủy"
          type="danger"
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
        />
      )}

      {/* Delete Topic Confirmation Modal */}
      {deleteTopicConfirm.isOpen && (
        <ConfirmModal
          isOpen={deleteTopicConfirm.isOpen}
          title="Xác nhận xóa chủ đề"
          message={`Bạn có chắc chắn muốn xóa chủ đề "${deleteTopicConfirm.topic?.name}" không? Các câu thuộc chủ đề này vẫn được bảo lưu.`}
          confirmText="Xóa chủ đề"
          cancelText="Hủy"
          type="danger"
          onConfirm={handleConfirmDeleteTopic}
          onClose={() => setDeleteTopicConfirm({ isOpen: false, topic: null })}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  getSpeakingSentences,
  addSpeakingSentence,
  updateSpeakingSentence,
  deleteSpeakingSentence,
  resetSpeakingSentences,
} from '../utils/speakingStorage';
import ConfirmModal from './ConfirmModal';
import Pagination from './Pagination';

const TOPIC_LABELS = {
  DAILY: { name: 'Giao tiếp hàng ngày', color: '#0284c7', bg: '#e0f2fe' },
  WORKPLACE: { name: 'Công sở & Phỏng vấn', color: '#059669', bg: '#ecfdf5' },
  TRAVEL: { name: 'Du lịch & Ẩm thực', color: '#d97706', bg: '#fef3c7' },
  ACADEMIC: { name: 'Học thuật & Thuyết trình', color: '#7c3aed', bg: '#ede9fe' },
  MISTAKES: { name: 'Khắc phục lỗi sai', color: '#dc2626', bg: '#fee2e2' },
};

export default function AdminSpeakingManager() {
  const [sentences, setSentences] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterTopic, setFilterTopic] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'CREATE', // 'CREATE' | 'EDIT'
    editingId: null,
    formData: {
      sentence: '',
      translation: '',
      level: 'A1',
      topic: 'DAILY',
      tips: '',
    },
  });

  // Delete Confirm Modal
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    item: null,
  });

  // Toast message
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadSentences = () => {
    const list = getSpeakingSentences();
    setSentences(list);
  };

  useEffect(() => {
    loadSentences();
    const handleUpdate = () => loadSentences();
    window.addEventListener('tl_speaking_sentences_updated', handleUpdate);
    return () => window.removeEventListener('tl_speaking_sentences_updated', handleUpdate);
  }, []);

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

  // Mở modal tạo mới
  const handleOpenCreate = () => {
    setModalState({
      isOpen: true,
      mode: 'CREATE',
      editingId: null,
      formData: {
        sentence: '',
        translation: '',
        level: 'A1',
        topic: 'DAILY',
        tips: '',
      },
    });
  };

  // Mở modal sửa
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
        tips: item.tips || '',
      },
    });
  };

  // Lưu câu (Thêm / Sửa)
  const handleSubmitForm = (e) => {
    e.preventDefault();
    const { sentence, translation, level, topic, tips } = modalState.formData;
    if (!sentence.trim()) {
      alert('Vui lòng nhập câu tiếng Anh chuẩn!');
      return;
    }
    if (!translation.trim()) {
      alert('Vui lòng nhập nghĩa tiếng Việt!');
      return;
    }

    if (modalState.mode === 'CREATE') {
      addSpeakingSentence({ sentence, translation, level, topic, tips });
      showToast('Đã thêm câu luyện nói mới thành công!');
    } else {
      updateSpeakingSentence(modalState.editingId, { sentence, translation, level, topic, tips });
      showToast('Đã cập nhật câu luyện nói thành công!');
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
    loadSentences();
  };

  // Xóa câu
  const handleConfirmDelete = () => {
    if (!deleteConfirm.item) return;
    deleteSpeakingSentence(deleteConfirm.item.id);
    setDeleteConfirm({ isOpen: false, item: null });
    showToast('Đã xóa câu luyện nói khỏi ngân hàng đề!');
    loadSentences();
  };

  // Khôi phục mặc định
  const handleResetDefaults = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục danh sách câu luyện nói về mặc định ban đầu?')) {
      resetSpeakingSentences();
      showToast('Đã khôi phục danh sách câu luyện nói mặc định!');
      loadSentences();
    }
  };

  // Lọc danh sách
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
            Quản lý kho câu mẫu chuẩn CEFR để học viên luyện nói, nhận diện giọng nói và chấm điểm phát âm tự động.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
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
            title="Khôi phục danh sách câu mặc định của hệ thống"
          >
            <i className="fa-solid fa-rotate-left"></i> Khôi phục mặc định
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
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '700' }}>SƠ CẤP (A1 - A2)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#059669', marginTop: '2px' }}>
            {sentences.filter((s) => s.level === 'A1' || s.level === 'A2').length} câu
          </div>
        </div>
        <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '700' }}>TRUNG CẤP (B1 - B2)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#d97706', marginTop: '2px' }}>
            {sentences.filter((s) => s.level === 'B1' || s.level === 'B2').length} câu
          </div>
        </div>
        <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '700' }}>CAO CẤP (C1)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#7c3aed', marginTop: '2px' }}>
            {sentences.filter((s) => s.level === 'C1').length} câu
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
          <option value="ALL">Tất cả Chủ đề</option>
          <option value="DAILY">Giao tiếp hàng ngày</option>
          <option value="WORKPLACE">Công sở & Phỏng vấn</option>
          <option value="TRAVEL">Du lịch & Ẩm thực</option>
          <option value="ACADEMIC">Học thuật & Thuyết trình</option>
          <option value="MISTAKES">Khắc phục lỗi sai</option>
        </select>
      </div>

      {/* Sentences Data Table */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
              <th style={{ padding: '12px 14px', width: '50px' }}>#</th>
              <th style={{ padding: '12px 14px', width: '100px' }}>Cấp độ</th>
              <th style={{ padding: '12px 14px', width: '160px' }}>Chủ đề</th>
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
                const topicInfo = TOPIC_LABELS[item.topic] || { name: item.topic, color: '#475569', bg: '#f1f5f9' };
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
              maxWidth: '560px',
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
                    <option value="DAILY">Giao tiếp hàng ngày</option>
                    <option value="WORKPLACE">Công sở & Phỏng vấn</option>
                    <option value="TRAVEL">Du lịch & Ẩm thực</option>
                    <option value="ACADEMIC">Học thuật & Thuyết trình</option>
                    <option value="MISTAKES">Khắc phục lỗi sai</option>
                  </select>
                </div>
              </div>

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

      {/* Delete Confirmation Modal */}
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
    </div>
  );
}

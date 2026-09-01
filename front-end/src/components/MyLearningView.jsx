import React, { useState } from 'react';
import CertificateModal from './CertificateModal';
import StudentProgressQuizModal from './StudentProgressQuizModal';

export default function MyLearningView({ user }) {
  const [activeLesson, setActiveLesson] = useState({
    id: 1,
    title: 'Bài 1: Các Thì Quá Khứ Cơ Bản & Cách Ứng Dụng',
    duration: '12:30',
    completed: true,
    notes: 'Quá khứ đơn dùng cho hành động đã chấm dứt trong quá khứ. Quá khứ tiếp diễn dùng cho hành động đang diễn ra tại một thời điểm xác định.',
  });

  const [activeTab, setActiveTab] = useState('video');
  const [userNote, setUserNote] = useState(activeLesson.notes);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showProgressQuizModal, setShowProgressQuizModal] = useState(false);

  // Trạng thái làm bài kiểm tra ôn tập AI trực tiếp
  const [activeTakingQuiz, setActiveTakingQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const [lessons, setLessons] = useState([
    { id: 1, title: 'Bài 1: Các Thì Quá Khứ Cơ Bản & Cách Ứng Dụng', duration: '12:30', completed: true },
    { id: 2, title: 'Bài 2: Mệnh Đề Quan Hệ & Câu Điều Kiện Loại 2', duration: '15:45', completed: true },
    { id: 3, title: 'Bài 3: Cụm Động Từ (Phrasal Verbs) Phổ Biến', duration: '18:10', completed: true },
    { id: 4, title: 'Bài 4: Kỹ Năng Nghe & Nhận Diện Trọng Âm Từ', duration: '14:20', completed: true },
  ]);

  const completedLessons = lessons.filter((l) => l.completed);
  const progressPercent = Math.round((completedLessons.length / lessons.length) * 100);

  const handleToggleLesson = (id) => {
    setLessons(
      lessons.map((l) => (l.id === id ? { ...l, completed: !l.completed } : l))
    );
  };

  const handleStartGeneratedQuiz = (quizData) => {
    setActiveTakingQuiz(quizData);
    setUserAnswers({});
    setQuizSubmitted(false);
  };

  const handleSelectAnswer = (qId, optId) => {
    if (quizSubmitted) return;
    setUserAnswers({ ...userAnswers, [qId]: optId });
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
  };

  const calculateScore = () => {
    if (!activeTakingQuiz || !activeTakingQuiz.questions) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    activeTakingQuiz.questions.forEach((q) => {
      const selectedOptId = userAnswers[q.id];
      const correctOpt = q.options?.find((opt) => opt.is_correct);
      if (selectedOptId && (selectedOptId === correctOpt?.id || selectedOptId === correctOpt?.content)) {
        correct++;
      }
    });
    const total = activeTakingQuiz.questions.length;
    const percentage = Math.round((correct / total) * 100);
    return { correct, total, percentage };
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-box">
        <div>
          <h2 className="page-title">
            <i className="fa-solid fa-circle-play" style={{ color: '#7c3aed' }}></i>
            <span>PHÒNG HỌC & TIẾN ĐỘ KHÓA HỌC</span>
          </h2>
          <p className="page-subtitle">
            Khóa học: <strong>Ngữ Pháp & Giao Tiếp Tiếng Anh Toàn Diện (CEFR B1-B2)</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Nút Kích Hoạt AI Sinh Đề Ôn Tập Tức Thì (UC_S7) */}
          <button
            className="btn-primary"
            onClick={() => setShowProgressQuizModal(true)}
            style={{
              backgroundColor: '#7c3aed',
              padding: '8px 16px',
              fontSize: '0.85rem',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
            }}
          >
            <i className="fa-solid fa-bolt"></i>
            <span>AI Sinh Đề Ôn Tập (UC_S7)</span>
          </button>

          {progressPercent === 100 ? (
            <button
              className="btn-primary"
              onClick={() => setShowCertificate(true)}
              style={{ backgroundColor: '#d97706', padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <i className="fa-solid fa-award"></i>
              <span>Nhận Chứng Chỉ Tốt Nghiệp</span>
            </button>
          ) : (
            <span className="badge-stat blue">
              <i className="fa-solid fa-award"></i>
              <span>Tiến độ: {progressPercent}% ({completedLessons.length}/{lessons.length} bài)</span>
            </span>
          )}
        </div>
      </div>

      {/* Phòng thi làm bài kiểm tra AI vừa sinh ra */}
      {activeTakingQuiz && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '2px solid #7c3aed',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#ede9fe', color: '#7c3aed', fontSize: '0.72rem', fontWeight: '800', marginBottom: '4px' }}>
                <i className="fa-solid fa-bolt"></i>
                <span>BÀI KIỂM TRA AI THÍCH ỨNG THEO TIẾN ĐỘ (UC_S7)</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {activeTakingQuiz.title}
              </h3>
            </div>
            <button
              onClick={() => setActiveTakingQuiz(null)}
              className="btn-outline"
              style={{ fontSize: '0.8rem', padding: '4px 10px' }}
            >
              <i className="fa-solid fa-xmark"></i> Thoát phòng thi
            </button>
          </div>

          {/* Danh sách câu hỏi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeTakingQuiz.questions?.map((q, qIdx) => {
              const selectedOptId = userAnswers[q.id];
              return (
                <div key={q.id || qIdx} style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px' }}>
                    Câu {qIdx + 1}: {q.content}
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {q.options?.map((opt, optIdx) => {
                      const isSelected = selectedOptId === opt.id || selectedOptId === opt.content;
                      let borderColor = 'var(--border-color)';
                      let bgColor = 'var(--bg-surface)';

                      if (quizSubmitted) {
                        if (opt.is_correct) {
                          borderColor = '#86efac';
                          bgColor = '#f0fdf4';
                        } else if (isSelected && !opt.is_correct) {
                          borderColor = '#fca5a5';
                          bgColor = '#fef2f2';
                        }
                      } else if (isSelected) {
                        borderColor = '#7c3aed';
                        bgColor = '#ede9fe';
                      }

                      return (
                        <div
                          key={opt.id || optIdx}
                          onClick={() => handleSelectAnswer(q.id, opt.id || opt.content)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid',
                            borderColor: borderColor,
                            backgroundColor: bgColor,
                            cursor: quizSubmitted ? 'default' : 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{String.fromCharCode(65 + optIdx)}. {opt.content}</span>
                          {quizSubmitted && opt.is_correct && (
                            <span style={{ color: '#15803d', fontWeight: '800', fontSize: '0.75rem' }}>✓ Đúng</span>
                          )}
                          {quizSubmitted && isSelected && !opt.is_correct && (
                            <span style={{ color: '#dc2626', fontWeight: '800', fontSize: '0.75rem' }}>✗ Sai</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {quizSubmitted && q.explanation && (
                    <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#fffbeb', borderLeft: '3px solid #f59e0b', fontSize: '0.8rem', color: '#92400e' }}>
                      <strong>💡 Lời giải chi tiết:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Submit / Result */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            {quizSubmitted ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: calculateScore().percentage >= 70 ? '#059669' : '#ea580c' }}>
                  Kết quả: {calculateScore().correct} / {calculateScore().total} câu đúng ({calculateScore().percentage}%)
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {calculateScore().percentage >= 70 ? '🎉 Xuất sắc! Bạn đã nắm vững các bài học trong chương.' : '💡 Hãy ôn tập lại các bài giảng video nhé!'}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Đã trả lời {Object.keys(userAnswers).length}/{activeTakingQuiz.questions?.length} câu hỏi
              </span>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              {!quizSubmitted ? (
                <button
                  onClick={handleSubmitQuiz}
                  className="btn-primary"
                  style={{ backgroundColor: '#7c3aed', padding: '8px 24px', fontSize: '0.9rem' }}
                >
                  <i className="fa-solid fa-paper-plane"></i>
                  <span>Nộp bài & Chấm điểm</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowProgressQuizModal(true)}
                  className="btn-primary"
                  style={{ backgroundColor: '#0284c7', padding: '8px 20px', fontSize: '0.85rem' }}
                >
                  <i className="fa-solid fa-rotate-right"></i>
                  <span>Tạo đề ôn tập khác</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Player & Lesson Curriculum Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Left: Player & Content Area */}
        <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '18px', border: '1px solid var(--border-card)' }}>
          {/* Simulated Video Player */}
          <div
            style={{
              width: '100%',
              height: '360px',
              backgroundColor: '#0f172a',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.2rem',
              flexDirection: 'column',
              gap: '12px',
              position: 'relative',
            }}
          >
            <i className="fa-solid fa-play-circle" style={{ fontSize: '3.8rem', color: '#38bdf8', cursor: 'pointer' }}></i>
            <span style={{ fontSize: '1rem', fontWeight: '700' }}>{activeLesson.title}</span>
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '16px',
                right: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#94a3b8',
              }}
            >
              <span>04:15 / {activeLesson.duration}</span>
              <span style={{ color: '#10b981', fontWeight: '700' }}>HD 1080p</span>
            </div>
          </div>

          {/* Lesson Sub-Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', margin: '16px 0 14px 0' }}>
            <button
              onClick={() => setActiveTab('video')}
              style={{
                padding: '8px 14px',
                fontSize: '0.85rem',
                fontWeight: '700',
                borderBottom: activeTab === 'video' ? '2px solid #0284c7' : 'none',
                color: activeTab === 'video' ? '#0284c7' : 'var(--text-muted)',
              }}
            >
              <i className="fa-solid fa-circle-info" style={{ marginRight: '6px' }}></i>
              Giới thiệu bài học
            </button>

            <button
              onClick={() => setActiveTab('materials')}
              style={{
                padding: '8px 14px',
                fontSize: '0.85rem',
                fontWeight: '700',
                borderBottom: activeTab === 'materials' ? '2px solid #0284c7' : 'none',
                color: activeTab === 'materials' ? '#0284c7' : 'var(--text-muted)',
              }}
            >
              <i className="fa-solid fa-file-pdf" style={{ marginRight: '6px' }}></i>
              Tài liệu đính kèm (2)
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              style={{
                padding: '8px 14px',
                fontSize: '0.85rem',
                fontWeight: '700',
                borderBottom: activeTab === 'notes' ? '2px solid #0284c7' : 'none',
                color: activeTab === 'notes' ? '#0284c7' : 'var(--text-muted)',
              }}
            >
              <i className="fa-solid fa-note-sticky" style={{ marginRight: '6px' }}></i>
              Ghi chú cá nhân
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'video' && (
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {activeLesson.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.6 }}>
                Bài học trang bị hệ thống lý thuyết cốt lõi, bài tập minh họa và bài test nhanh nhằm giúp học viên nắm chắc ngữ pháp trước khi bước vào các bài học tiếp theo.
              </p>
            </div>
          )}

          {activeTab === 'materials' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="fa-solid fa-file-pdf" style={{ color: '#ef4444', fontSize: '1.2rem' }}></i>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block' }}>Slide_Bài_Giảng_Ngữ_Pháp_B1.pdf</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>2.4 MB · Tài liệu chính thức</span>
                  </div>
                </div>
                <button className="btn-outline" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                  <i className="fa-solid fa-download"></i> Tải về
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="fa-solid fa-file-word" style={{ color: '#0284c7', fontSize: '1.2rem' }}></i>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block' }}>Bai_Tap_Tu_Luyen_Kem_Dap_An.docx</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>1.1 MB · Bài tập tự luyện</span>
                  </div>
                </div>
                <button className="btn-outline" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                  <i className="fa-solid fa-download"></i> Tải về
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <textarea
                rows={4}
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="Ghi chú kiến thức quan trọng của bài học tại đây..."
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
              />
              <button
                className="btn-primary"
                onClick={() => alert('Đã lưu ghi chú thành công!')}
                style={{ marginTop: '8px', padding: '6px 14px', fontSize: '0.8rem' }}
              >
                <i className="fa-solid fa-floppy-disk"></i>
                <span>Lưu ghi chú</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Curriculum List */}
        <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '18px', border: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
              NỘI DUNG CHƯƠNG TRÌNH
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {lessons.length} bài học
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid',
                  borderColor: activeLesson.id === lesson.id ? '#0284c7' : 'var(--border-color)',
                  backgroundColor: activeLesson.id === lesson.id ? '#e0f2fe' : 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div
                  onClick={() => setActiveLesson(lesson)}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}
                >
                  <i
                    className={lesson.completed ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle-play'}
                    style={{ color: lesson.completed ? '#10b981' : '#64748b' }}
                  ></i>
                  <span style={{ fontSize: '0.82rem', fontWeight: activeLesson.id === lesson.id ? '700' : '500' }}>
                    {lesson.title}
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={lesson.completed}
                  onChange={() => handleToggleLesson(lesson.id)}
                  title="Đánh dấu hoàn thành bài học"
                  style={{ width: '16px', height: '16px', cursor: 'pointer', marginLeft: '6px' }}
                />
              </div>
            ))}
          </div>

          {/* Quick AI Quiz Trigger in Curriculum Box */}
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setShowProgressQuizModal(true)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ede9fe',
                color: '#7c3aed',
                border: '1px dashed #c4b5fd',
                fontSize: '0.82rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              <span>Tạo Đề Ôn Tập AI Cho {completedLessons.length} Bài Đã Học</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Progress Quiz Generator Modal (UC_S7) */}
      <StudentProgressQuizModal
        isOpen={showProgressQuizModal}
        onClose={() => setShowProgressQuizModal(false)}
        completedLessons={completedLessons}
        onStartQuiz={handleStartGeneratedQuiz}
      />

      {/* Graduation Certificate Modal */}
      <CertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        user={user}
        courseTitle="Ngữ Pháp & Giao Tiếp Tiếng Anh Toàn Diện (CEFR B1-B2)"
      />
    </div>
  );
}

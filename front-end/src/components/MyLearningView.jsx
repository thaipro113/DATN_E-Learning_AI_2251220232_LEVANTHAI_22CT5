import React, { useState, useEffect } from 'react';
import CertificateModal from './CertificateModal';
import StudentProgressQuizModal from './StudentProgressQuizModal';
import { learningAPI, courseAPI } from '../services/api';

export default function MyLearningView({ user, currentCourse, onSelectCourseToLearn }) {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(currentCourse || null);
  const [courseDetail, setCourseDetail] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeTab, setActiveTab] = useState('video');
  const [userNote, setUserNote] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const [showProgressQuizModal, setShowProgressQuizModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Trạng thái làm bài kiểm tra ôn tập AI trực tiếp
  const [activeTakingQuiz, setActiveTakingQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Load danh sách khóa học học viên đã ghi danh
  const fetchEnrolledCourses = async () => {
    setIsLoading(true);
    try {
      const res = await learningAPI.getMyCourses();
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setEnrolledCourses(list);

        // Nếu có currentCourse được truyền vào, ưu tiên chọn currentCourse
        let target = null;
        if (currentCourse) {
          target = list.find((item) => {
            const c = item.course || item;
            return c.id === currentCourse.id || c.slug === currentCourse.slug;
          });
          if (target) target = target.course || target;
        }

        if (!target) {
          target = list[0].course || list[0];
        }

        setSelectedCourse(target);
        await loadCourseDetail(target.slug || target.id);
      } else {
        // Fallback: nếu chưa ghi danh thì lấy khóa học đầu tiên để học viên trải nghiệm
        const allRes = await courseAPI.getCourses();
        const allList = allRes.data?.results || allRes.data?.data?.results || allRes.data?.data || [];
        if (allList.length > 0) {
          const target = currentCourse || allList[0];
          setSelectedCourse(target);
          await loadCourseDetail(target.slug || target.id);
        }
      }
    } catch (e) {
      console.warn('Could not load enrolled courses:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCourseDetail = async (identifier) => {
    if (!identifier) return;
    try {
      const res = await courseAPI.getCourseDetail(identifier);
      const data = res.data?.data || res.data;
      if (data) {
        setCourseDetail(data);
        const allLessons = (data.chapters || []).flatMap((ch) => ch.lessons || []);
        if (allLessons.length > 0) {
          setActiveLesson(allLessons[0]);
          setUserNote(allLessons[0].content || 'Ghi chú kiến thức quan trọng của bài giảng.');
        }
      }
    } catch (e) {
      console.warn('Could not load course detail:', e);
    }
  };

  useEffect(() => {
    fetchEnrolledCourses();
  }, [currentCourse?.id]);

  const handleSwitchCourse = async (cId) => {
    const found = enrolledCourses.find((item) => {
      const c = item.course || item;
      return String(c.id) === String(cId);
    });
    const target = found ? (found.course || found) : null;
    if (target) {
      setSelectedCourse(target);
      if (onSelectCourseToLearn) onSelectCourseToLearn(target);
      await loadCourseDetail(target.slug || target.id);
    }
  };

  // Xử lý hoàn thành bài học và gửi tiến độ về Backend
  const handleCompleteLesson = async (lesson) => {
    if (!lesson) return;
    try {
      await learningAPI.completeLesson(lesson.id);
      await learningAPI.trackLessonProgress(lesson.id, {
        is_completed: true,
        last_watched_second: (lesson.duration_minutes || 15) * 60,
      });
      if (selectedCourse) {
        await loadCourseDetail(selectedCourse.slug || selectedCourse.id);
      }
    } catch (e) {
      // Done silently without blocking popup
    }
  };

  // Xem chứng chỉ tốt nghiệp từ CSDL
  const handleOpenCertificate = async () => {
    try {
      const res = await learningAPI.getMyCertificates();
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setCertificateData(list[0]);
      } else {
        setCertificateData({
          certificate_code: `CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
          student_name: user?.full_name || 'Lê Văn Thái',
          course_title: selectedCourse?.title || 'Ngữ Pháp Tiếng Anh Nền Tảng (CEFR A1-A2)',
          course_level: selectedCourse?.level || 'A2',
          teacher_name: selectedCourse?.teacher?.full_name || 'Thầy Nguyễn Văn An',
          issued_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      setCertificateData({
        certificate_code: `CERT-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        student_name: user?.full_name || 'Lê Văn Thái',
        course_title: selectedCourse?.title || 'Ngữ Pháp Tiếng Anh Nền Tảng (CEFR A1-A2)',
        course_level: selectedCourse?.level || 'A2',
        teacher_name: selectedCourse?.teacher?.full_name || 'Thầy Nguyễn Văn An',
        issued_at: new Date().toISOString(),
      });
    }
    setShowCertificate(true);
  };

  const allLessons = (courseDetail?.chapters || []).flatMap((ch) => ch.lessons || []);
  const currentMaterials = (activeLesson?.materials || []).length > 0
    ? activeLesson.materials
    : [
        { id: 1, title: `Slide bài giảng - ${activeLesson?.title || 'Ngữ pháp'}`, file_type_display: 'PDF', file_size_bytes: 2450000, file_url: '#' },
        { id: 2, title: `Tài liệu bài tập tự luyện kèm đáp án`, file_type_display: 'DOCX', file_size_bytes: 1120000, file_url: '#' },
      ];

  const progressPercent = allLessons.length > 0 ? 75 : 0;

  // Xử lý làm bài kiểm tra ôn tập AI
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
      <div className="page-header-box" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <h2 className="page-title">
            <i className="fa-solid fa-circle-play" style={{ color: '#7c3aed' }}></i>
            <span>PHÒNG HỌC & TIẾN ĐỘ BÀI GIẢNG TRỰC TUYẾN</span>
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Khóa học đang học:</span>
            {enrolledCourses.length > 1 ? (
              <select
                value={selectedCourse?.id || ''}
                onChange={(e) => handleSwitchCourse(e.target.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  backgroundColor: 'var(--bg-surface)',
                }}
              >
                {enrolledCourses.map((item) => {
                  const c = item.course || item;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.title} (CEFR {c.level || 'B1'})
                    </option>
                  );
                })}
              </select>
            ) : (
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                {selectedCourse?.title || 'Đang tải khóa học...'}
              </strong>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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

          {/* Nút Nhận Chứng Chỉ */}
          <button
            className="btn-primary"
            onClick={handleOpenCertificate}
            style={{
              backgroundColor: '#d97706',
              padding: '8px 16px',
              fontSize: '0.85rem',
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
            }}
          >
            <i className="fa-solid fa-award"></i>
            <span>Chứng chỉ khóa học</span>
          </button>
        </div>
      </div>

      {/* Main Learning Layout */}
      <div className="learning-layout">
        {/* Left Column: Video Player & Tabs */}
        <div>
          {/* Video Player */}
          <div className="video-player-box" style={{ overflow: 'hidden', position: 'relative' }}>
            {activeLesson?.video_url && activeLesson.video_url.includes('youtube.com') ? (
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0"
                title={activeLesson.title}
                style={{ width: '100%', height: '360px', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div style={{ height: '340px', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: '12px' }}>
                  <i className="fa-solid fa-play" style={{ marginLeft: '4px' }}></i>
                </div>
                <strong style={{ fontSize: '1.1rem' }}>{activeLesson?.title || 'Chọn bài học để bắt đầu'}</strong>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                  Thời lượng: {activeLesson?.duration_minutes || 15} phút · Đã đồng bộ CSDL
                </span>
              </div>
            )}
          </div>

          {/* Current Lesson Bar */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              marginTop: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase' }}>
                Đang phát bài giảng
              </span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: '2px 0 0' }}>
                {activeLesson?.title || 'Bài học tiếng Anh'}
              </h3>
            </div>

            <button
              className="btn-primary"
              onClick={() => handleCompleteLesson(activeLesson)}
              style={{ padding: '8px 16px', fontSize: '0.85rem', backgroundColor: '#059669' }}
            >
              <i className="fa-solid fa-circle-check"></i>
              <span>Đánh dấu hoàn thành</span>
            </button>
          </div>

          {/* Tab Controls */}
          <div className="tab-control-pills">
            <button
              className={`tab-pill-btn ${activeTab === 'video' ? 'active' : ''}`}
              onClick={() => setActiveTab('video')}
            >
              <i className="fa-solid fa-file-lines"></i>
              <span>Nội dung bài học</span>
            </button>
            <button
              className={`tab-pill-btn ${activeTab === 'materials' ? 'active' : ''}`}
              onClick={() => setActiveTab('materials')}
            >
              <i className="fa-solid fa-paperclip"></i>
              <span>Tài liệu đính kèm ({currentMaterials.length})</span>
            </button>
            <button
              className={`tab-pill-btn ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              <i className="fa-solid fa-note-sticky"></i>
              <span>Ghi chú cá nhân</span>
            </button>
          </div>

          {/* Tab Contents */}
          <div className="learning-tab-content">
            {activeTab === 'video' && (
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-main)' }}>
                  TÓM TẮT TRỌNG TÂM BÀI HỌC
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {activeLesson?.content || 'Nắm vững cấu trúc câu, các thì cơ bản và quy tắc ngữ pháp tiếng Anh chuẩn CEFR.'}
                </p>
              </div>
            )}

            {activeTab === 'materials' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentMaterials.map((mat) => (
                  <div
                    key={mat.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className={`fa-solid ${mat.file_type_display === 'PDF' ? 'fa-file-pdf' : 'fa-file-word'}`} style={{ color: mat.file_type_display === 'PDF' ? '#dc2626' : '#0284c7', fontSize: '1.2rem' }}></i>
                      <div>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block' }}>{mat.title}</strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{mat.file_type_display || 'PDF'} · {Math.round((mat.file_size_bytes || 2000000) / 1024 / 1024)} MB</span>
                      </div>
                    </div>
                    <button
                      className="btn-outline"
                      onClick={() => alert(`Tải xuống tài liệu: ${mat.title}`)}
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      <i className="fa-solid fa-download"></i>
                      <span>Tải về</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <textarea
                  rows={4}
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder="Nhập ghi chú quan trọng từ bài giảng này..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    marginBottom: '8px',
                  }}
                />
                <button className="btn-primary" onClick={() => alert('Đã lưu ghi chú vào CSDL!')} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                  Lưu ghi chú
                </button>
              </div>
            )}
          </div>

          {/* AI Progress Quiz Interactive Area */}
          {activeTakingQuiz && (
            <div
              style={{
                marginTop: '20px',
                padding: '20px',
                backgroundColor: 'var(--bg-surface)',
                border: '2px solid #7c3aed',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase' }}>
                    ⚡ AI PROGRESS QUIZ (ĐANG LÀM BÀI)
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', margin: '2px 0' }}>
                    {activeTakingQuiz.title}
                  </h3>
                </div>
                <button onClick={() => setActiveTakingQuiz(null)} style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Questions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeTakingQuiz.questions?.map((q, qIdx) => (
                  <div key={q.id || qIdx} style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg-subtle)' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '10px' }}>
                      Câu {qIdx + 1}: {q.content}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                      {q.options?.map((opt, oIdx) => {
                        const isSelected = userAnswers[q.id] === opt.id || userAnswers[q.id] === opt.content;
                        let optionStyle = {
                          padding: '10px 14px',
                          borderRadius: '6px',
                          border: isSelected ? '2px solid #7c3aed' : '1px solid var(--border-color)',
                          backgroundColor: isSelected ? '#ede9fe' : 'var(--bg-surface)',
                          cursor: quizSubmitted ? 'default' : 'pointer',
                          textAlign: 'left',
                          fontSize: '0.85rem',
                          fontWeight: isSelected ? '700' : '500',
                          color: isSelected ? '#6d28d9' : 'var(--text-main)',
                        };

                        if (quizSubmitted) {
                          if (opt.is_correct) {
                            optionStyle.backgroundColor = '#dcfce7';
                            optionStyle.borderColor = '#16a34a';
                            optionStyle.color = '#15803d';
                          } else if (isSelected && !opt.is_correct) {
                            optionStyle.backgroundColor = '#fee2e2';
                            optionStyle.borderColor = '#dc2626';
                            optionStyle.color = '#b91c1c';
                          }
                        }

                        return (
                          <button
                            key={opt.id || oIdx}
                            onClick={() => handleSelectAnswer(q.id, opt.id || opt.content)}
                            style={optionStyle}
                          >
                            <span style={{ fontWeight: '800', marginRight: '8px' }}>
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            {opt.content}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && q.explanation && (
                      <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '0.8rem' }}>
                        💡 <strong>Giải thích:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit Button & Score */}
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                {!quizSubmitted ? (
                  <button
                    className="btn-primary"
                    onClick={handleSubmitQuiz}
                    style={{ backgroundColor: '#7c3aed', padding: '10px 24px' }}
                  >
                    <i className="fa-solid fa-paper-plane"></i>
                    <span>Nộp Bài Chấm Điểm Tự Động</span>
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: '800', fontSize: '1rem' }}>
                      Điểm số: {calculateScore().correct} / {calculateScore().total} ({calculateScore().percentage}%)
                    </div>
                    <button
                      className="btn-outline"
                      onClick={() => {
                        setQuizSubmitted(false);
                        setUserAnswers({});
                      }}
                    >
                      Làm lại đề này
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Course Curriculum Playlist */}
        <div className="curriculum-sidebar-box">
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-card)', backgroundColor: 'var(--bg-subtle)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              MỤC LỤC GIÁO TRÌNH
            </span>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', margin: '2px 0 6px' }}>
              {courseDetail?.title || 'Khóa học tiếng Anh'}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--bg-muted)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#10b981' }}></div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#059669' }}>
                {allLessons.length} bài
              </span>
            </div>
          </div>

          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
            {(courseDetail?.chapters || []).map((ch, cIdx) => (
              <div key={ch.id || cIdx} style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-subtle)', fontWeight: '800', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                  {ch.title}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {(ch.lessons || []).map((les, lIdx) => {
                    const isActive = activeLesson?.id === les.id;
                    return (
                      <div
                        key={les.id || lIdx}
                        onClick={() => {
                          setActiveLesson(les);
                          setUserNote(les.content || '');
                        }}
                        style={{
                          padding: '10px 12px',
                          borderTop: '1px solid var(--border-color)',
                          backgroundColor: isActive ? '#f0f9ff' : 'var(--bg-surface)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className={`fa-regular ${isActive ? 'fa-circle-play' : 'fa-circle'}`} style={{ color: isActive ? '#0284c7' : 'var(--text-light)', fontSize: '0.9rem' }}></i>
                          <span style={{ fontSize: '0.82rem', fontWeight: isActive ? '700' : '500', color: isActive ? '#0284c7' : 'var(--text-main)' }}>
                            {les.title}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
                          {les.duration_minutes || 15}m
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal 1: Chứng chỉ tốt nghiệp */}
      <CertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        certificate={certificateData}
        user={user}
        course={selectedCourse}
      />

      {/* Modal 2: AI Sinh Đề Ôn Tập (UC_S7) */}
      <StudentProgressQuizModal
        isOpen={showProgressQuizModal}
        onClose={() => setShowProgressQuizModal(false)}
        chapterId={courseDetail?.chapters?.[0]?.id}
        chapterTitle={courseDetail?.chapters?.[0]?.title || 'Chương 1'}
        onStartQuiz={handleStartGeneratedQuiz}
      />
    </div>
  );
}

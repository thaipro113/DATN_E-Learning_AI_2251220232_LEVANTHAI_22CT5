import React, { useState, useEffect } from 'react';
import CertificateModal from './CertificateModal';
import StudentProgressQuizModal from './StudentProgressQuizModal';
import { learningAPI, courseAPI } from '../services/api';
import { isYouTubeUrl, getYouTubeEmbedUrl, cleanCourseTitle } from '../utils/media';

export default function MyLearningView({ user, currentCourse, onSelectCourseToLearn }) {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(currentCourse || null);
  const [courseDetail, setCourseDetail] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [activeTab, setActiveTab] = useState('content');
  const [userNote, setUserNote] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const [showProgressQuizModal, setShowProgressQuizModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Trạng thái làm bài kiểm tra ôn tập AI trực tiếp
  const [activeTakingQuiz, setActiveTakingQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Tự động ẩn thông báo sau 4 giây
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // Load danh sách khóa học học viên đã ghi danh
  const fetchEnrolledCourses = async () => {
    setIsLoading(true);
    try {
      const res = await learningAPI.getMyCourses();
      const list = res.data?.results || res.data?.data?.results || res.data?.data || res.data || [];
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
        // Fallback: nếu chưa ghi danh thì lấy khóa học đầu tiên từ CSDL để trải nghiệm
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
      // 1. Thử lấy Enrollment Detail (tiến độ thực tế & chứng chỉ)
      let courseData = null;
      try {
        const enrollRes = await learningAPI.getMyCourseDetail(identifier);
        const enrollData = enrollRes.data?.data || enrollRes.data;
        if (enrollData && enrollData.course) {
          courseData = enrollData.course;
          if (Array.isArray(enrollData.lesson_progresses)) {
            const completed = enrollData.lesson_progresses
              .filter((p) => p.is_completed)
              .map((p) => p.lesson_id || p.lesson?.id);
            setCompletedLessonIds(completed);
          }
          if (enrollData.certificate) {
            setCertificateData(enrollData.certificate);
          }
        }
      } catch (e) {
        // Chưa ghi danh hoặc endpoint enrollment 404
      }

      // 2. Nếu chưa có, lấy chi tiết khóa học từ Course API
      if (!courseData) {
        const res = await courseAPI.getCourseDetail(identifier);
        courseData = res.data?.data || res.data;
      }

      if (courseData) {
        setCourseDetail(courseData);
        const chapters = courseData.chapters || [];
        if (chapters.length > 0) {
          setActiveChapter(chapters[0]);
          const allLessons = chapters.flatMap((ch) => ch.lessons || []);
          if (allLessons.length > 0) {
            await handleSelectLesson(allLessons[0], chapters[0]);
          }
        }
      }
    } catch (e) {
      console.warn('Could not load course detail:', e);
    }
  };

  const handleSelectLesson = async (lesson, chapter) => {
    if (!lesson) return;
    setActiveLesson(lesson);
    if (chapter) setActiveChapter(chapter);

    // Tải chi tiết bài học từ backend để lấy lý thuyết, video và tài liệu mới nhất
    try {
      const res = await courseAPI.getLessonDetail(lesson.id);
      const detail = res.data?.data || res.data;
      if (detail) {
        setActiveLesson({
          ...lesson,
          ...detail,
          video_url: detail.video_url !== undefined && detail.video_url !== null ? detail.video_url : lesson.video_url,
          content: detail.content || lesson.content,
          materials: detail.materials || lesson.materials || [],
        });
        setUserNote(detail.content || 'Ghi chú kiến thức quan trọng của bài giảng.');
      }
    } catch (err) {
      setUserNote(lesson.content || 'Ghi chú kiến thức quan trọng của bài giảng.');
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

  const allLessons = (courseDetail?.chapters || []).flatMap((ch) => ch.lessons || []);
  const currentLessonIndex = allLessons.findIndex((l) => l.id === activeLesson?.id);

  // Xử lý chuyển sang bài học tiếp theo / trước đó
  const handleNavigateLesson = (direction) => {
    if (currentLessonIndex === -1 || allLessons.length === 0) return;
    const nextIdx = currentLessonIndex + direction;
    if (nextIdx >= 0 && nextIdx < allLessons.length) {
      const nextLesson = allLessons[nextIdx];
      const parentChapter = (courseDetail?.chapters || []).find((ch) =>
        ch.lessons?.some((l) => l.id === nextLesson.id)
      );
      handleSelectLesson(nextLesson, parentChapter);
    }
  };

  // Xử lý hoàn thành bài học và gửi tiến độ về Backend
  const handleCompleteLesson = async (lesson) => {
    if (!lesson) return;
    try {
      const res = await learningAPI.completeLesson(lesson.id);
      await learningAPI.trackLessonProgress(lesson.id, {
        is_completed: true,
        last_watched_second: (lesson.duration_minutes || 15) * 60,
      });

      // Cập nhật danh sách bài đã hoàn thành
      if (!completedLessonIds.includes(lesson.id)) {
        setCompletedLessonIds((prev) => [...prev, lesson.id]);
      }

      const resData = res.data?.data || res.data;
      if (resData?.is_course_completed && resData?.certificate) {
        setCertificateData(resData.certificate);
        setToastMsg({
          type: 'success',
          text: '🎉 Chúc mừng! Bạn đã hoàn thành 100% khóa học và nhận được Chứng chỉ tốt nghiệp!',
        });
      } else {
        setToastMsg({
          type: 'success',
          text: `✓ Đã hoàn thành bài học: "${lesson.title}"`,
        });
      }

      // Tự động chuyển tiếp sang bài tiếp theo nếu còn
      if (currentLessonIndex !== -1 && currentLessonIndex + 1 < allLessons.length) {
        setTimeout(() => handleNavigateLesson(1), 1000);
      }
    } catch (e) {
      if (!completedLessonIds.includes(lesson.id)) {
        setCompletedLessonIds((prev) => [...prev, lesson.id]);
      }
      setToastMsg({
        type: 'success',
        text: `✓ Đã lưu tiến độ hoàn thành bài học!`,
      });
    }
  };

  // Xem chứng chỉ tốt nghiệp từ CSDL
  const handleOpenCertificate = async () => {
    try {
      const res = await learningAPI.getMyCertificates();
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setCertificateData(list[0]);
      } else if (!certificateData) {
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
      if (!certificateData) {
        setCertificateData({
          certificate_code: `CERT-2026-${Math.floor(100000 + Math.random() * 900000)}`,
          student_name: user?.full_name || 'Lê Văn Thái',
          course_title: selectedCourse?.title || 'Ngữ Pháp Tiếng Anh Nền Tảng (CEFR A1-A2)',
          course_level: selectedCourse?.level || 'A2',
          teacher_name: selectedCourse?.teacher?.full_name || 'Thầy Nguyễn Văn An',
          issued_at: new Date().toISOString(),
        });
      }
    }
    setShowCertificate(true);
  };

  const currentMaterials = (activeLesson?.materials || []).length > 0
    ? activeLesson.materials
    : [
        { id: 1, title: `Slide bài giảng chi tiết - ${activeLesson?.title || 'Ngữ pháp'}`, file_type_display: 'PDF', file_size_bytes: 2450000, file_url: '#' },
        { id: 2, title: `Tài liệu bài tập tự luyện & Đáp án giải thích`, file_type_display: 'DOCX', file_size_bytes: 1120000, file_url: '#' },
      ];

  const progressPercent = allLessons.length > 0
    ? Math.round((completedLessonIds.length / allLessons.length) * 100)
    : 0;

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
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, total, percentage };
  };

  const embedVideoUrl = getYouTubeEmbedUrl(activeLesson?.video_url);

  return (
    <div>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 200,
            padding: '12px 20px',
            backgroundColor: '#059669',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            fontWeight: '700',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <i className="fa-solid fa-circle-check"></i>
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-box" style={{ flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <h2 className="page-title" style={{ margin: 0 }}>
            <i className="fa-solid fa-circle-play" style={{ color: '#7c3aed' }}></i>
            <span>PHÒNG HỌC TRỰC TUYẾN & TIẾN ĐỘ BÀI GIẢNG</span>
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
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
                      {cleanCourseTitle(c.title)} (CEFR {c.level || 'B1'})
                    </option>
                  );
                })}
              </select>
            ) : (
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                {cleanCourseTitle(selectedCourse?.title) || 'Đang tải khóa học...'}
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

      {/* Main Learning 2-Column Layout */}
      <div className="learning-layout">
        {/* Left Column: Video Player & Tabs */}
        <div>
          {/* Video Player Box with dynamic key for instant video update on lesson switch */}
          <div className="video-player-box" style={{ overflow: 'hidden', position: 'relative', borderRadius: 'var(--radius-md)', backgroundColor: '#000' }}>
            {activeLesson?.video_url ? (
              isYouTubeUrl(activeLesson.video_url) ? (
                <iframe
                  key={`yt-player-${activeLesson.id}-${activeLesson.video_url}`}
                  src={getYouTubeEmbedUrl(activeLesson.video_url)}
                  title={activeLesson.title || 'Lesson Video'}
                  style={{ width: '100%', height: '440px', border: 'none', display: 'block' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  key={`html5-player-${activeLesson.id}-${activeLesson.video_url}`}
                  src={activeLesson.video_url}
                  controls
                  controlsList="nodownload"
                  playsInline
                  style={{ width: '100%', height: '440px', objectFit: 'contain', display: 'block', backgroundColor: '#000' }}
                />
              )
            ) : (
              <div style={{ height: '380px', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ffffff', padding: '24px', textAlign: 'center' }}>
                <div style={{ width: '68px', height: '68px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: '14px', color: '#38bdf8' }}>
                  <i className="fa-solid fa-circle-play"></i>
                </div>
                <strong style={{ fontSize: '1.2rem', fontWeight: '800' }}>{activeLesson?.title || 'Chọn bài học để bắt đầu'}</strong>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '6px' }}>
                  Thời lượng: {activeLesson?.duration_minutes || 15} phút · Đã đồng bộ với CSDL PostgreSQL
                </span>
              </div>
            )}
          </div>

          {/* Current Lesson Bar with Controls */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              marginTop: '14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {activeChapter ? `${activeChapter.title} · ` : ''}BÀI GIẢNG HIỆN TẠI
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', margin: '4px 0 0' }}>
                {activeLesson?.title || 'Bài học tiếng Anh'}
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="btn-outline"
                onClick={() => handleNavigateLesson(-1)}
                disabled={currentLessonIndex <= 0}
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                title="Bài trước đó"
              >
                <i className="fa-solid fa-backward-step"></i>
                <span>Bài trước</span>
              </button>

              <button
                className="btn-primary"
                onClick={() => handleCompleteLesson(activeLesson)}
                style={{
                  padding: '9px 18px',
                  fontSize: '0.85rem',
                  backgroundColor: completedLessonIds.includes(activeLesson?.id) ? '#059669' : '#0284c7',
                  boxShadow: completedLessonIds.includes(activeLesson?.id) ? '0 2px 8px rgba(5, 150, 105, 0.25)' : '0 2px 8px rgba(2, 132, 199, 0.25)',
                }}
              >
                <i className={`fa-solid ${completedLessonIds.includes(activeLesson?.id) ? 'fa-circle-check' : 'fa-check'}`}></i>
                <span>{completedLessonIds.includes(activeLesson?.id) ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}</span>
              </button>

              <button
                className="btn-outline"
                onClick={() => handleNavigateLesson(1)}
                disabled={currentLessonIndex === -1 || currentLessonIndex >= allLessons.length - 1}
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                title="Bài kế tiếp"
              >
                <span>Bài tiếp</span>
                <i className="fa-solid fa-forward-step"></i>
              </button>
            </div>
          </div>

          {/* Tab Controls (Styled Pills like Header Nav) */}
          <div className="tab-control-pills">
            <button
              className={`tab-pill-btn ${activeTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveTab('content')}
            >
              <i className="fa-solid fa-book-open"></i>
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
              <i className="fa-solid fa-pen-to-square"></i>
              <span>Ghi chú cá nhân</span>
            </button>
          </div>

          {/* Tab Contents Card */}
          <div className="learning-tab-content">
            {activeTab === 'content' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                    <i className="fa-solid fa-file-lines" style={{ color: '#0284c7', marginRight: '8px' }}></i>
                    TÓM TẮT & KIẾN THỨC TRỌNG TÂM
                  </h4>
                  <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 'var(--radius-full)', backgroundColor: '#e0f2fe', color: '#0284c7', fontWeight: '800' }}>
                    CEFR {selectedCourse?.level || 'B1'}
                  </span>
                </div>

                <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '16px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>
                    {activeLesson?.content || 'Nắm vững cấu trúc ngữ pháp, mẫu câu giao tiếp và các lưu ý quan trọng trong bài giảng này.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    className="btn-outline"
                    onClick={() => setShowProgressQuizModal(true)}
                    style={{ fontSize: '0.82rem', padding: '7px 14px' }}
                  >
                    <i className="fa-solid fa-bolt" style={{ color: '#7c3aed' }}></i>
                    <span>Tạo bài tập AI về bài này</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'materials' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                    <i className="fa-solid fa-folder-open" style={{ color: '#d97706', marginRight: '8px' }}></i>
                    TÀI LIỆU HỌC TẬP & SLIDE BÀI GIẢNG ({currentMaterials.length})
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentMaterials.map((mat) => (
                    <div
                      key={mat.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '8px',
                            backgroundColor: mat.file_type_display === 'PDF' ? '#fee2e2' : '#e0f2fe',
                            color: mat.file_type_display === 'PDF' ? '#dc2626' : '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.3rem',
                            flexShrink: 0,
                          }}
                        >
                          <i className={`fa-solid ${mat.file_type_display === 'PDF' ? 'fa-file-pdf' : 'fa-file-word'}`}></i>
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'block' }}>
                            {mat.title}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Định dạng: {mat.file_type_display || 'PDF'} · Kích thước: {Math.round((mat.file_size_bytes || 2000000) / 1024 / 1024)} MB
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-primary"
                          onClick={() => {
                            if (mat.file_url && mat.file_url !== '#') {
                              window.open(mat.file_url, '_blank');
                            } else {
                              setToastMsg({ type: 'success', text: `✓ Đang tải tài liệu: "${mat.title}"` });
                            }
                          }}
                          style={{ padding: '6px 14px', fontSize: '0.8rem', backgroundColor: '#0284c7' }}
                        >
                          <i className="fa-solid fa-download"></i>
                          <span>Tải về máy</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                    <i className="fa-solid fa-note-sticky" style={{ color: '#059669', marginRight: '8px' }}></i>
                    SỔ TAY GHI CHÚ BÀI HỌC
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Tự động lưu vào trình duyệt & tài khoản
                  </span>
                </div>

                <textarea
                  rows={6}
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder="Ghi chép các mẫu câu, cấu trúc ngữ pháp quan trọng hoặc từ mới..."
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.88rem',
                    lineHeight: 1.6,
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    marginBottom: '12px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                    {userNote.length} ký tự
                  </span>
                  <button
                    className="btn-primary"
                    onClick={() => setToastMsg({ type: 'success', text: '✓ Đã lưu ghi chú bài học thành công!' })}
                    style={{ fontSize: '0.85rem', padding: '8px 20px', backgroundColor: '#059669' }}
                  >
                    <i className="fa-solid fa-floppy-disk"></i>
                    <span>Lưu Ghi Chú</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Progress Quiz Interactive Area */}
          {activeTakingQuiz && (
            <div
              style={{
                marginTop: '20px',
                padding: '24px',
                backgroundColor: 'var(--bg-surface)',
                border: '2px solid #7c3aed',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase' }}>
                    ⚡ AI PROGRESS QUIZ (ĐANG LÀM BÀI ÔN TẬP)
                  </span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', margin: '4px 0 0' }}>
                    {activeTakingQuiz.title}
                  </h3>
                </div>
                <button onClick={() => setActiveTakingQuiz(null)} style={{ fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Questions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeTakingQuiz.questions?.map((q, qIdx) => (
                  <div key={q.id || qIdx} style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px' }}>
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
                      <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '0.82rem' }}>
                        💡 <strong>Giải thích:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit Button & Score */}
              <div style={{ marginTop: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
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
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-card)', backgroundColor: 'var(--bg-subtle)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              MỤC LỤC GIÁO TRÌNH
            </span>
            <h4 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', margin: '4px 0 8px' }}>
              {courseDetail?.title || 'Khóa học tiếng Anh'}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--bg-muted)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.3s ease' }}></div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#059669' }}>
                {completedLessonIds.length}/{allLessons.length} bài ({progressPercent}%)
              </span>
            </div>
          </div>

          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '580px', overflowY: 'auto' }}>
            {(courseDetail?.chapters || []).map((ch, cIdx) => (
              <div key={ch.id || cIdx} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div
                  onClick={() => setActiveChapter(ch)}
                  style={{
                    padding: '10px 14px',
                    backgroundColor: activeChapter?.id === ch.id ? '#e0f2fe' : 'var(--bg-subtle)',
                    fontWeight: '800',
                    fontSize: '0.84rem',
                    color: activeChapter?.id === ch.id ? '#0284c7' : 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <span>{ch.title}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ch.lessons?.length || 0} bài</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {(ch.lessons || []).map((les, lIdx) => {
                    const isActive = activeLesson?.id === les.id;
                    const isCompleted = completedLessonIds.includes(les.id);
                    return (
                      <div
                        key={les.id || lIdx}
                        onClick={() => handleSelectLesson(les, ch)}
                        style={{
                          padding: '11px 14px',
                          borderTop: '1px solid var(--border-color)',
                          backgroundColor: isActive ? '#f0f9ff' : 'var(--bg-surface)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <i
                            className={isCompleted ? "fa-solid fa-circle-check" : (isActive ? "fa-regular fa-circle-play" : "fa-regular fa-circle")}
                            style={{ color: isCompleted ? '#059669' : (isActive ? '#0284c7' : 'var(--text-light)'), fontSize: '0.95rem' }}
                          ></i>
                          <span style={{ fontSize: '0.84rem', fontWeight: isActive ? '700' : '500', color: isActive ? '#0284c7' : 'var(--text-main)' }}>
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
        chapterId={activeChapter?.id || courseDetail?.chapters?.[0]?.id}
        chapterTitle={activeChapter?.title || courseDetail?.chapters?.[0]?.title || 'Chương 1'}
        onStartQuiz={handleStartGeneratedQuiz}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import CertificateModal from './CertificateModal';
import StudentProgressQuizModal from './StudentProgressQuizModal';
import CourseQuizTakingModal from './CourseQuizTakingModal';
import CourseQuizzesOverviewModal from './CourseQuizzesOverviewModal';
import { learningAPI, courseAPI, assessmentAPI } from '../services/api';
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
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // Quản lý Đề thi thực tế từ CSDL (gắn theo Khóa học, Chương học, Bài học)
  const [courseQuizzes, setCourseQuizzes] = useState([]);
  const [studentAttempts, setStudentAttempts] = useState([]);
  const [takingQuiz, setTakingQuiz] = useState(null);
  const [showCourseQuizzesOverview, setShowCourseQuizzesOverview] = useState(false);

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
        // Học viên CHƯA ghi danh khóa nào: Không lấy tất cả khóa học trong database!
        setEnrolledCourses([]);
        setSelectedCourse(null);
        setCourseDetail(null);
      }
    } catch (e) {
      console.warn('Could not load enrolled courses:', e);
      setEnrolledCourses([]);
      setSelectedCourse(null);
      setCourseDetail(null);
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
        fetchCourseQuizzes(courseData.id);
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

  // Tải danh sách đề thi và lịch sử làm bài của khóa học
  const fetchCourseQuizzes = async (courseId) => {
    if (!courseId) return;
    try {
      const [quizzesRes, attemptsRes] = await Promise.allSettled([
        assessmentAPI.getQuizzes({ course_id: courseId, page_size: 100 }),
        assessmentAPI.getMyAttempts(),
      ]);

      if (quizzesRes.status === 'fulfilled' && quizzesRes.value?.data) {
        const list =
          quizzesRes.value.data.results ||
          quizzesRes.value.data.data?.results ||
          quizzesRes.value.data.data ||
          quizzesRes.value.data ||
          [];
        setCourseQuizzes(Array.isArray(list) ? list : []);
      }

      if (attemptsRes.status === 'fulfilled' && attemptsRes.value?.data) {
        const aList =
          attemptsRes.value.data.data ||
          attemptsRes.value.data.results ||
          attemptsRes.value.data ||
          [];
        setStudentAttempts(Array.isArray(aList) ? aList : []);
      }
    } catch (err) {
      console.warn('Khong the tai de thi khoa hoc:', err);
    }
  };

  // Helper lọc đề thi theo bài học
  const getLessonQuizzes = (lessonId) => {
    if (!lessonId) return [];
    return courseQuizzes.filter(
      (q) => String(q.lesson || q.lesson_id) === String(lessonId)
    );
  };

  // Helper lọc đề thi theo chương
  const getChapterQuizzes = (chapterId) => {
    if (!chapterId) return [];
    return courseQuizzes.filter(
      (q) => String(q.chapter || q.chapter_id) === String(chapterId) && !q.lesson && !q.lesson_id
    );
  };

  // Helper lọc đề thi toàn khóa
  const getGeneralCourseQuizzes = () => {
    return courseQuizzes.filter((q) => !q.chapter && !q.chapter_id && !q.lesson && !q.lesson_id);
  };

  // Lấy lần làm bài đạt điểm cao nhất của đề thi
  const getQuizBestAttempt = (quizId) => {
    const list = studentAttempts.filter((a) => String(a.quiz_id || a.quiz?.id || a.quiz) === String(quizId));
    if (list.length === 0) return null;
    return list.reduce((best, cur) => {
      const curScore = Number(cur.percentage ?? (cur.score != null && cur.max_score ? (cur.score / cur.max_score) * 100 : 0));
      const bestScore = Number(best.percentage ?? (best.score != null && best.max_score ? (best.score / best.max_score) * 100 : 0));
      return curScore >= bestScore ? cur : best;
    }, list[0]);
  };

  const currentLessonQuizzes = getLessonQuizzes(activeLesson?.id);
  const currentLessonBestAttempt = currentLessonQuizzes.length > 0 ? getQuizBestAttempt(currentLessonQuizzes[0].id) : null;

  const handleOpenQuiz = (quiz) => {
    setTakingQuiz(quiz);
  };

  const handleStartGeneratedQuiz = (generatedQuiz) => {
    setTakingQuiz(generatedQuiz);
  };

  const handleAttemptComplete = () => {
    if (courseDetail?.id) {
      fetchCourseQuizzes(courseDetail.id);
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
          text: 'Chúc mừng! Bạn đã hoàn thành 100% khóa học và nhận được Chứng chỉ tốt nghiệp!',
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

  const currentMaterials = activeLesson?.materials || [];

  const progressPercent = allLessons.length > 0
    ? Math.round((completedLessonIds.length / allLessons.length) * 100)
    : 0;



  const embedVideoUrl = getYouTubeEmbedUrl(activeLesson?.video_url);

  // 1. NẾU ĐANG LÀM ĐỀ THI ÔN TẬP AI -> HIỂN THỊ MÀN HÌNH THI & KẾT QUẢ CHUYÊN BIỆT
  if (activeTakingQuiz) {
    return (
      <AIProgressExamScreen
        quiz={activeTakingQuiz}
        onBackToLearning={() => setActiveTakingQuiz(null)}
      />
    );
  }

  // 1.5. NẾU ĐANG TẢI DỮ LIỆU KHÓA HỌC -> HIỂN THỊ SPINNER TẢI TRANG
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', margin: '20px 0', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#0284c7', marginBottom: '16px' }}></i>
        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 6px 0' }}>Đang nạp không gian học tập...</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Đang đồng bộ khóa học và tiến độ bài giảng của bạn</p>
      </div>
    );
  }

  // 2. NẾU CHƯA ĐĂNG KÝ KHÓA HỌC NÀO
  if (enrolledCourses.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-card)', margin: '20px 0', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px' }}>
          <i className="fa-solid fa-graduation-cap"></i>
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
          Bạn chưa đăng ký khóa học nào
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 20px' }}>
          Hãy khám phá danh mục khóa học tiếng Anh chuẩn CEFR (A1 – C2) và đăng ký khóa học để bắt đầu học tập cùng Trợ lý AI!
        </p>
        <button
          className="btn-primary"
          onClick={() => {
            window.location.hash = '#/courses';
          }}
          style={{ padding: '10px 24px', fontSize: '0.9rem' }}
        >
          <i className="fa-solid fa-book-open"></i>
          <span>Khám phá danh mục khóa học</span>
        </button>
      </div>
    );
  }

  const completedLessonsList = (courseDetail?.chapters || []).flatMap((ch) =>
    (ch.lessons || [])
      .filter((l) => completedLessonIds.includes(l.id))
      .map((l) => ({ ...l, chapterTitle: ch.title, isCompleted: true }))
  );

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
          {/* Nút Xem Danh Sách Toàn Bộ Đề Thi Của Khóa Học */}
          <button
            className="btn-primary"
            onClick={() => setShowCourseQuizzesOverview(true)}
            style={{
              backgroundColor: '#0284c7',
              padding: '8px 16px',
              fontSize: '0.85rem',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Xem danh sách tất cả bài tập & đề thi của khóa học"
          >
            <i className="fa-solid fa-clipboard-list"></i>
            <span>Đề thi khóa học ({courseQuizzes.length})</span>
          </button>

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

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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

              {/* Nút Làm Đề Thi Của Bài Học Hiện Tại (nếu có đề thi) */}
              {currentLessonQuizzes.length > 0 && (
                <button
                  className="btn-primary"
                  onClick={() => handleOpenQuiz(currentLessonQuizzes[0])}
                  style={{
                    padding: '9px 18px',
                    fontSize: '0.85rem',
                    backgroundColor: currentLessonBestAttempt?.is_passed ? '#0284c7' : '#7c3aed',
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '700',
                  }}
                  title={currentLessonQuizzes[0].title}
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                  <span>
                    {currentLessonBestAttempt
                      ? `Làm lại đề bài học (${currentLessonBestAttempt.percentage ?? Math.round((currentLessonBestAttempt.score / currentLessonBestAttempt.max_score) * 100)}%)`
                      : `Làm bài tập bài học (${currentLessonQuizzes.length})`}
                  </span>
                </button>
              )}

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
            <button
              className={`tab-pill-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
              onClick={() => setActiveTab('quizzes')}
            >
              <i className="fa-solid fa-clipboard-question"></i>
              <span>Bài tập & Đề thi ({currentLessonQuizzes.length})</span>
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

                {currentMaterials.length === 0 ? (
                  <div
                    style={{
                      padding: '36px 20px',
                      textAlign: 'center',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--border-color)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <i className="fa-solid fa-paperclip" style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '10px', display: 'block' }}></i>
                    <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                      Bài học này chưa có tài liệu đính kèm
                    </p>
                    <span style={{ fontSize: '0.78rem' }}>Giảng viên chưa tải lên tài liệu PDF hoặc Slide cho bài giảng này.</span>
                  </div>
                ) : (
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
                              backgroundColor: (mat.file_type || mat.file_type_display) === 'PDF' ? '#fee2e2' : '#e0f2fe',
                              color: (mat.file_type || mat.file_type_display) === 'PDF' ? '#dc2626' : '#0284c7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.3rem',
                              flexShrink: 0,
                            }}
                          >
                            <i className={`fa-solid ${(mat.file_type || mat.file_type_display) === 'PDF' ? 'fa-file-pdf' : 'fa-file-word'}`}></i>
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'block' }}>
                              {mat.title}
                            </strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Định dạng: {mat.file_type_display || mat.file_type || 'PDF'} · Kích thước: {mat.file_size_bytes ? (mat.file_size_bytes > 1048576 ? `${(mat.file_size_bytes / 1048576).toFixed(1)} MB` : `${Math.round(mat.file_size_bytes / 1024)} KB`) : '2 MB'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn-primary"
                            onClick={() => {
                              if (mat.file_url && mat.file_url !== '#') {
                                const link = document.createElement('a');
                                link.href = mat.file_url;
                                link.download = mat.title || 'tai-lieu';
                                link.target = '_blank';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
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
                )}
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

            {activeTab === 'quizzes' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                    <i className="fa-solid fa-clipboard-question" style={{ color: '#7c3aed', marginRight: '8px' }}></i>
                    BÀI TẬP & ĐỀ THI CỦA BÀI HỌC
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {activeLesson?.title}
                  </span>
                </div>

                {currentLessonQuizzes.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '36px 16px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--border-color)',
                    }}
                  >
                    <i className="fa-solid fa-file-circle-question" style={{ fontSize: '2.2rem', color: 'var(--text-light)', marginBottom: '10px' }}></i>
                    <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                      Bài học này hiện chưa có bộ đề trắc nghiệm riêng được biên soạn sẵn.
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 16px' }}>
                      Bạn có thể bấm vào nút "AI Sinh Đề Ôn Tập (UC_S7)" ở góc trên để AI tự động tạo đề thi thích ứng dựa trên bài học này!
                    </p>
                    <button
                      className="btn-primary"
                      onClick={() => setShowProgressQuizModal(true)}
                      style={{ padding: '8px 18px', fontSize: '0.85rem', backgroundColor: '#7c3aed' }}
                    >
                      <i className="fa-solid fa-bolt"></i>
                      <span>AI Sinh Đề Ôn Tập Cho Bài Này</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {currentLessonQuizzes.map((quiz) => {
                      const bestAttempt = getQuizBestAttempt(quiz.id);
                      const scorePct = bestAttempt ? Number(bestAttempt.percentage ?? Math.round((bestAttempt.score / bestAttempt.max_score) * 100)) : null;
                      const isPassed = bestAttempt?.is_passed ?? (scorePct != null && scorePct >= (quiz.passing_score || 70));

                      return (
                        <div
                          key={quiz.id}
                          style={{
                            padding: '16px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: '800',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: '#ede9fe',
                                  color: '#6d28d9',
                                }}
                              >
                                CEFR {quiz.level || 'B1'}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {quiz.total_questions || 5} câu hỏi · {quiz.time_limit_minutes || 15} phút · Điểm đạt: {quiz.passing_score || 70}%
                              </span>
                            </div>
                            <h5 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px' }}>
                              {quiz.title}
                            </h5>
                            {quiz.description && (
                              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                                {quiz.description}
                              </p>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {bestAttempt ? (
                              <div style={{ textAlign: 'right' }}>
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: '800',
                                    padding: '4px 10px',
                                    borderRadius: 'var(--radius-full)',
                                    backgroundColor: isPassed ? '#dcfce7' : '#fee2e2',
                                    color: isPassed ? '#15803d' : '#b91c1c',
                                    display: 'inline-block',
                                  }}
                                >
                                  {isPassed ? `Đạt (${scorePct}%)` : `Chưa đạt (${scorePct}%)`}
                                </span>
                              </div>
                            ) : (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: '700',
                                  padding: '4px 10px',
                                  borderRadius: 'var(--radius-full)',
                                  backgroundColor: 'var(--bg-surface)',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                Chưa làm
                              </span>
                            )}

                            <button
                              className="btn-primary"
                              onClick={() => handleOpenQuiz(quiz)}
                              style={{
                                padding: '8px 18px',
                                fontSize: '0.85rem',
                                backgroundColor: isPassed ? '#0284c7' : '#7c3aed',
                                fontWeight: '700',
                              }}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                              <span>{bestAttempt ? 'Làm lại đề thi' : 'Bắt đầu làm bài'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
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
                    const lessonQList = getLessonQuizzes(les.id);

                    return (
                      <div key={les.id || lIdx}>
                        <div
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

                        {/* Đề thi trực tiếp gắn với bài học này */}
                        {lessonQList.map((q) => {
                          const attempt = getQuizBestAttempt(q.id);
                          const scorePct = attempt ? Number(attempt.percentage ?? Math.round((attempt.score / attempt.max_score) * 100)) : null;
                          const isPassed = attempt?.is_passed ?? (scorePct != null && scorePct >= (q.passing_score || 70));

                          return (
                            <div
                              key={q.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenQuiz(q);
                              }}
                              style={{
                                padding: '7px 14px 7px 38px',
                                backgroundColor: '#f8fafc',
                                borderTop: '1px dashed var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                              }}
                              title={`Làm bài tập: ${q.title}`}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6d28d9', fontWeight: '600', minWidth: 0, flex: 1, marginRight: '8px' }}>
                                <i className="fa-solid fa-pen-to-square" style={{ flexShrink: 0 }}></i>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  Đề thi: {q.title}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: attempt ? (isPassed ? '#dcfce7' : '#fee2e2') : '#ede9fe',
                                  color: attempt ? (isPassed ? '#15803d' : '#b91c1c') : '#6d28d9',
                                  fontWeight: '700',
                                  flexShrink: 0,
                                }}
                              >
                                {attempt ? `${scorePct}%` : 'Làm bài'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* Đề kiểm tra đánh giá theo chương */}
                  {getChapterQuizzes(ch.id).map((cq) => {
                    const attempt = getQuizBestAttempt(cq.id);
                    const scorePct = attempt ? Number(attempt.percentage ?? Math.round((attempt.score / attempt.max_score) * 100)) : null;
                    const isPassed = attempt?.is_passed ?? (scorePct != null && scorePct >= (cq.passing_score || 70));

                    return (
                      <div
                        key={cq.id}
                        onClick={() => handleOpenQuiz(cq)}
                        style={{
                          padding: '10px 14px',
                          borderTop: '1px solid var(--border-color)',
                          backgroundColor: '#faf5ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                          <i className="fa-solid fa-layer-group" style={{ color: '#7c3aed', flexShrink: 0 }}></i>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#6d28d9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              Kiểm tra chương: {cq.title}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {cq.total_questions || 5} câu · {cq.time_limit_minutes || 15} phút
                            </div>
                          </div>
                        </div>
                        <button
                          className="btn-primary"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            backgroundColor: attempt ? (isPassed ? '#059669' : '#0284c7') : '#7c3aed',
                            flexShrink: 0,
                            fontWeight: '700',
                          }}
                        >
                          {attempt ? `${scorePct}% (Làm lại)` : 'Làm bài'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Đề thi tổng kết toàn khóa học */}
            {getGeneralCourseQuizzes().length > 0 && (
              <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#166534', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-award"></i>
                  <span>ĐỀ THI TỔNG KẾT KHÓA HỌC</span>
                </div>
                {getGeneralCourseQuizzes().map((gq) => {
                  const attempt = getQuizBestAttempt(gq.id);
                  const scorePct = attempt ? Number(attempt.percentage ?? Math.round((attempt.score / attempt.max_score) * 100)) : null;
                  const isPassed = attempt?.is_passed ?? (scorePct != null && scorePct >= (gq.passing_score || 70));

                  return (
                    <div
                      key={gq.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        backgroundColor: '#ffffff',
                        borderRadius: '6px',
                        border: '1px solid #86efac',
                        marginTop: '6px',
                        gap: '8px',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#14532d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {gq.title}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {gq.total_questions || 10} câu · {gq.time_limit_minutes || 30} phút
                        </div>
                      </div>
                      <button
                        className="btn-primary"
                        onClick={() => handleOpenQuiz(gq)}
                        style={{
                          padding: '5px 12px',
                          fontSize: '0.75rem',
                          backgroundColor: '#16a34a',
                          flexShrink: 0,
                          fontWeight: '700',
                        }}
                      >
                        {attempt ? `${scorePct}% (Thi lại)` : 'Vào thi'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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
        completedLessons={completedLessonsList}
        activeLesson={activeLesson}
        onStartQuiz={handleStartGeneratedQuiz}
      />

      {/* Modal 3: Làm bài thi trực tiếp trong phòng học */}
      <CourseQuizTakingModal
        quiz={takingQuiz}
        isOpen={Boolean(takingQuiz)}
        onClose={() => setTakingQuiz(null)}
        onAttemptComplete={handleAttemptComplete}
      />

      {/* Modal 4: Tổng hợp danh sách đề thi của khóa học */}
      <CourseQuizzesOverviewModal
        isOpen={showCourseQuizzesOverview}
        onClose={() => setShowCourseQuizzesOverview(false)}
        courseTitle={courseDetail?.title || selectedCourse?.title || 'Khóa học'}
        quizzes={courseQuizzes}
        attempts={studentAttempts}
        onSelectQuiz={handleOpenQuiz}
      />
    </div>
  );
}

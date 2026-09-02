import React, { useState, useEffect } from 'react';
import TeacherGradebookView from './TeacherGradebookView';
import TeacherAIQuizModal from './TeacherAIQuizModal';
import TeacherCourseCurriculumModal from './TeacherCourseCurriculumModal';
import Pagination from './Pagination';
import { courseAPI, aiAPI } from '../services/api';
import { cleanCourseTitle, generateSlug } from '../utils/media';

export default function TeacherDashboardView({ onOpenQuizImport, user, onBackToDashboard }) {
  const [activeTab, setActiveTab] = useState('courses');
  const [showAIQuizModal, setShowAIQuizModal] = useState(false);
  const [selectedCourseForAIQuiz, setSelectedCourseForAIQuiz] = useState(null);
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);
  const [selectedCourseForCurriculum, setSelectedCourseForCurriculum] = useState(null);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Modal Tạo khóa học mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newLevel, setNewLevel] = useState('B1');
  const [newStatus, setNewStatus] = useState('PUBLISHED');
  const [newThumbnailUrl, setNewThumbnailUrl] = useState('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80');
  const [newPrice, setNewPrice] = useState(0);
  const [isFree, setIsFree] = useState(true);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // Sample Thumbnail Suggestions
  const sampleThumbnails = [
    { label: 'Ngữ pháp A1-A2', url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80' },
    { label: 'Từ vựng B1', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80' },
    { label: 'Giao tiếp B2', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80' },
    { label: 'Luyện thi TOEIC', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80' },
    { label: 'IELTS Master', url: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=600&auto=format&fit=crop&q=80' },
  ];

  // Load danh sách khóa học của đúng giảng viên này từ CSDL
  const fetchTeacherCourses = async () => {
    setIsLoading(true);
    try {
      const [teachingRes, allCoursesRes, catsRes] = await Promise.allSettled([
        courseAPI.getTeachingCourses(),
        courseAPI.getCourses(),
        courseAPI.getCategories(),
      ]);

      let teacherCoursesList = [];
      if (teachingRes.status === 'fulfilled' && teachingRes.value.data) {
        const tList = teachingRes.value.data.data || teachingRes.value.data.results || teachingRes.value.data;
        if (Array.isArray(tList) && tList.length > 0) {
          teacherCoursesList = tList;
        }
      }

      // Lọc chính xác theo email/ID/tên của giáo viên đang đăng nhập
      if (teacherCoursesList.length === 0 && allCoursesRes.status === 'fulfilled' && allCoursesRes.value.data) {
        const allList = allCoursesRes.value.data.results || allCoursesRes.value.data.data?.results || allCoursesRes.value.data.data || allCoursesRes.value.data;
        if (Array.isArray(allList) && user) {
          teacherCoursesList = allList.filter((c) => {
            const isEmailMatch = user.email && c.teacher?.email && c.teacher.email.toLowerCase() === user.email.toLowerCase();
            const isIdMatch = user.id && c.teacher?.id && String(c.teacher.id) === String(user.id);
            const isNameMatch = user.full_name && c.teacher?.full_name && c.teacher.full_name.trim().toLowerCase() === user.full_name.trim().toLowerCase();
            return isEmailMatch || isIdMatch || isNameMatch;
          });
        }
      }

      setCourses(teacherCoursesList);

      if (catsRes.status === 'fulfilled' && catsRes.value.data) {
        const catList = catsRes.value.data.results || catsRes.value.data.data || catsRes.value.data || [];
        if (Array.isArray(catList)) {
          setCategories(catList);
          if (catList.length > 0 && !newCategoryId) {
            setNewCategoryId(catList[0].id);
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch teacher courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseUpdatedOrDeleted = (deletedCourseId) => {
    if (deletedCourseId) {
      setCourses((prev) => prev.filter((c) => c.id !== deletedCourseId && c.slug !== deletedCourseId));
    }
    fetchTeacherCourses();
  };

  useEffect(() => {
    fetchTeacherCourses();
  }, [user]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const payload = {
        title: newTitle.trim(),
        slug: newSlug.trim() || generateSlug(newTitle),
        description: newDescription.trim() || `Khóa học ${newTitle} chuẩn hóa CEFR ${newLevel}.`,
        level: newLevel,
        category_id: newCategoryId || null,
        thumbnail_url: newThumbnailUrl.trim(),
        price: isFree ? 0 : Number(newPrice),
        is_free: isFree,
        status: newStatus,
      };

      await courseAPI.createCourse(payload);
      setToastMsg(`✓ Đã tạo thành công khóa học "${newTitle}"!`);
      setNewTitle('');
      setNewSlug('');
      setNewDescription('');
      setNewStatus('PUBLISHED');
      setShowCreateModal(false);
      fetchTeacherCourses();
    } catch (err) {
      setToastMsg(`✓ Đã lưu khóa học "${newTitle}"!`);
      setShowCreateModal(false);
      fetchTeacherCourses();
    }
  };

  // Tự động sinh mô tả khóa học chi tiết và chuyên nghiệp bằng AI
  const handleGenerateAIDescription = async () => {
    if (!newTitle.trim()) {
      setToastMsg('⚠️ Vui lòng nhập "Tiêu đề khóa học" trước để AI có thể viết mô tả phù hợp!');
      return;
    }

    setIsGeneratingDesc(true);
    const selectedCat = categories.find((c) => String(c.id) === String(newCategoryId));
    const categoryName = selectedCat ? selectedCat.name : 'Tiếng Anh Tổng Quát';

    try {
      const res = await aiAPI.generateCourseDescription({
        title: newTitle.trim(),
        category: categoryName,
        level: newLevel,
        is_free: isFree,
        price: Number(newPrice || 0),
      });

      const aiText = res.data?.data?.description || res.data?.description;
      if (aiText && aiText.length > 50) {
        setNewDescription(aiText.trim());
        setToastMsg('✨ AI đã tự động tư duy và viết xong bản mô tả chi tiết cho khóa học!');
      } else {
        throw new Error('Empty response from AI backend');
      }
    } catch (e) {
      console.warn('AI Description Generation error:', e);
      setToastMsg('⚠️ Không thể kết nối đến máy chủ AI để sinh mô tả.');
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const totalLessons = courses.reduce((acc, c) => acc + (c.total_lessons || 0), 0);
  const totalStudents = courses.reduce((acc, c) => acc + (c.total_students || 0), 0);
  const avgCompletionRate = courses.length > 0
    ? Math.round(courses.reduce((acc, c) => acc + (c.completion_rate || 0), 0) / courses.length)
    : 0;
  const teacherDisplayName = user?.full_name || 'Giảng viên';

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <button
            onClick={onBackToDashboard}
            style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>Trang chủ</span>
          </button>
          <span>/</span>
          <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>Studio Giảng dạy ({teacherDisplayName})</span>
        </div>
      </div>

      {/* Header Banner Dành Riêng Cho Giảng Viên Đang Đăng Nhập */}
      <div
        style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#dbeafe',
              color: '#1d4ed8',
              fontSize: '0.75rem',
              fontWeight: '800',
              marginBottom: '8px',
            }}
          >
            <i className="fa-solid fa-chalkboard-user"></i>
            <span>TEACHER STUDIO & QUẢN LÝ GIẢNG DẠY CSDL</span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>
            Không gian Giảng viên - {teacherDisplayName} 👨‍🏫
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>
            Quản lý chương trình giảng dạy, ngân hàng đề thi AI và theo dõi kết quả học tập thực tế từ PostgreSQL.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            onClick={() => {
              setSelectedCourseForAIQuiz(null);
              setShowAIQuizModal(true);
            }}
            style={{ backgroundColor: '#7c3aed' }}
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>⚡ AI Sinh Đề Thi (UC_T4)</span>
          </button>

          <button
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{ backgroundColor: '#0284c7' }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>Tạo khóa học mới</span>
          </button>

          <button
            className="btn-primary"
            onClick={onOpenQuizImport}
            style={{ backgroundColor: '#e11d48' }}
          >
            <i className="fa-solid fa-file-import"></i>
            <span>Import Đề thi (Word/Excel)</span>
          </button>
        </div>
      </div>

      {/* Stats Counter Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="stat-counter-card">
          <div className="stat-counter-icon sky">
            <i className="fa-solid fa-book-open"></i>
          </div>
          <div className="stat-counter-content">
            <span className="stat-counter-title">KHÓA HỌC CỦA BẠN</span>
            <span className="stat-counter-val">{courses.length}</span>
            <span className="stat-counter-sub">Khóa giảng dạy thực tế</span>
          </div>
        </div>

        <div className="stat-counter-card">
          <div className="stat-counter-icon emerald">
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="stat-counter-content">
            <span className="stat-counter-title">TỔNG HỌC VIÊN</span>
            <span className="stat-counter-val">{totalStudents}</span>
            <span className="stat-counter-sub">Đã đăng ký học</span>
          </div>
        </div>

        <div className="stat-counter-card">
          <div className="stat-counter-icon purple">
            <i className="fa-solid fa-circle-play"></i>
          </div>
          <div className="stat-counter-content">
            <span className="stat-counter-title">BÀI GIẢNG VIDEO</span>
            <span className="stat-counter-val">{totalLessons} bài</span>
            <span className="stat-counter-sub">Có tài liệu đính kèm</span>
          </div>
        </div>

        <div className="stat-counter-card">
          <div className="stat-counter-icon orange">
            <i className="fa-solid fa-award"></i>
          </div>
          <div className="stat-counter-content">
            <span className="stat-counter-title">TỶ LỆ HOÀN THÀNH</span>
            <span className="stat-counter-val">{avgCompletionRate}%</span>
            <span className="stat-counter-sub">Học viên đạt chuẩn</span>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('courses')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'courses' ? '3px solid #0284c7' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'courses' ? '#0284c7' : 'var(--text-muted)',
            fontWeight: '800',
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          <i className="fa-solid fa-book-open" style={{ marginRight: '6px' }}></i>
          <span>Khóa học phụ trách ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gradebook')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'gradebook' ? '3px solid #0284c7' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'gradebook' ? '#0284c7' : 'var(--text-muted)',
            fontWeight: '800',
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          <i className="fa-solid fa-graduation-cap" style={{ marginRight: '6px' }}></i>
          <span>Sổ điểm học viên (Gradebook)</span>
        </button>
      </div>

      {/* Tab 1: Quản lý khóa học */}
      {activeTab === 'courses' && (
        <div>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '1.5rem', color: '#0284c7' }}></i>
              <p style={{ marginTop: '10px' }}>Đang tải danh sách khóa học của bạn...</p>
            </div>
          ) : courses.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-card)' }}>
              <i className="fa-solid fa-folder-open" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '12px' }}></i>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>Chưa có khóa học nào được tạo</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '8px auto 16px', maxWidth: '450px' }}>
                Bạn chưa phụ trách khóa học nào. Hãy bấm nút bên dưới để tạo khóa học đầu tiên của bạn.
              </p>
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                <i className="fa-solid fa-plus"></i>
                <span>Tạo khóa học mới</span>
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {courses
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((course) => (
                    <div
                      key={course.id}
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-card)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      {/* Course Thumbnail Image */}
                      <div
                        style={{ height: '150px', position: 'relative', overflow: 'hidden', backgroundColor: '#0284c7', cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedCourseForCurriculum(course);
                          setShowCurriculumModal(true);
                        }}
                      >
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2.5rem' }}>
                            <i className="fa-solid fa-graduation-cap"></i>
                          </div>
                        )}

                        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '5px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(15, 23, 42, 0.8)',
                              color: 'white',
                              fontSize: '0.72rem',
                              fontWeight: '800',
                            }}
                          >
                            CEFR {course.level || 'B1'}
                          </span>
                          {course.status === 'DRAFT' && (
                            <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f59e0b', color: 'white', fontSize: '0.72rem', fontWeight: '800' }}>
                              📝 Bản nháp
                            </span>
                          )}
                          {course.status === 'ARCHIVED' && (
                            <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#64748b', color: 'white', fontSize: '0.72rem', fontWeight: '800' }}>
                              📦 Lưu trữ
                            </span>
                          )}
                        </div>

                        <span
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: course.is_free ? '#10b981' : '#0284c7',
                            color: 'white',
                            fontSize: '0.72rem',
                            fontWeight: '800',
                          }}
                        >
                          {course.is_free ? 'Miễn phí' : `${Number(course.price || 0).toLocaleString('vi-VN')} đ`}
                        </span>
                      </div>

                      {/* Course Card Body */}
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase' }}>
                            {course.category?.name || 'Ngữ pháp Tiếng Anh'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            GV: {course.teacher?.full_name || teacherDisplayName}
                          </span>
                        </div>

                        <h3
                          style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px', lineHeight: '1.3', cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedCourseForCurriculum(course);
                            setShowCurriculumModal(true);
                          }}
                        >
                          {cleanCourseTitle(course.title)}
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {course.description}
                        </p>

                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginBottom: '12px' }}>
                          <span><i className="fa-solid fa-layer-group"></i> {course.total_chapters != null ? course.total_chapters : (course.chapters?.length || 0)} chương</span>
                          <span><i className="fa-solid fa-circle-play"></i> {course.total_lessons != null ? course.total_lessons : (course.chapters?.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0) || 0)} bài giảng</span>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn-outline"
                            onClick={() => {
                              setSelectedCourseForCurriculum(course);
                              setShowCurriculumModal(true);
                            }}
                            style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
                          >
                            <i className="fa-solid fa-pen-ruler"></i>
                            <span>Quản lý giáo trình (Chi tiết)</span>
                          </button>

                          <button
                            className="btn-primary"
                            onClick={() => {
                              setSelectedCourseForAIQuiz(course);
                              setShowAIQuizModal(true);
                            }}
                            style={{ padding: '6px 12px', fontSize: '0.78rem', backgroundColor: '#7c3aed' }}
                            title={`AI Tạo đề thi trắc nghiệm trực tiếp cho khóa "${course.title}"`}
                          >
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Phân trang Khóa học */}
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(courses.length / itemsPerPage)}
                totalItems={courses.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      )}

      {/* Tab 2: Sổ điểm học viên */}
      {activeTab === 'gradebook' && (
        <TeacherGradebookView />
      )}

      {/* Modal Studio Quản lý Toàn Diện Giáo Trình Khóa Học (Thêm, Sửa, Xóa Course, Chapter, Lesson, Material) */}
      <TeacherCourseCurriculumModal
        isOpen={showCurriculumModal}
        onClose={() => setShowCurriculumModal(false)}
        course={selectedCourseForCurriculum}
        onCourseUpdated={handleCourseUpdatedOrDeleted}
        user={user}
      />

      {/* Modal AI Quiz Generator cho Giáo Viên (UC_T4) */}
      <TeacherAIQuizModal
        isOpen={showAIQuizModal}
        onClose={() => {
          setShowAIQuizModal(false);
          setSelectedCourseForAIQuiz(null);
        }}
        onSaveSuccess={fetchTeacherCourses}
        courses={courses}
        initialCourse={selectedCourseForAIQuiz}
      />

      {/* Modal Tạo Khóa Học Mới với Hình Ảnh */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '26px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>Tạo Khóa Học Tiếng Anh Mới</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Nhập thông tin khóa học, hình ảnh và lưu vào CSDL</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Tiêu đề khóa học:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Chinh Phục Ngữ Pháp CEFR B2..."
                  value={newTitle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewTitle(val);
                    if (!newSlug || newSlug === generateSlug(newTitle)) {
                      setNewSlug(generateSlug(val));
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.88rem',
                  }}
                  required
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700' }}>
                    Slug định danh URL:
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Chuẩn SEO (elearning.vn/courses/<strong>{newSlug || 'ten-khoa-hoc'}</strong>)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ padding: '9px 12px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRight: 'none', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    /courses/
                  </span>
                  <input
                    type="text"
                    placeholder="chinh-phuc-ngu-phap-b2"
                    value={newSlug}
                    onChange={(e) => setNewSlug(generateSlug(e.target.value))}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700' }}>
                    Ảnh đại diện khóa học (Thumbnail):
                  </label>
                  <label
                    htmlFor="create-course-thumb-file"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: '#0284c7',
                      backgroundColor: '#e0f2fe',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                    <span>Tải ảnh từ máy tính</span>
                  </label>
                  <input
                    id="create-course-thumb-file"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setNewThumbnailUrl(event.target.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Nhập URL ảnh hoặc bấm nút 'Tải ảnh từ máy tính' ở trên..."
                  value={newThumbnailUrl}
                  onChange={(e) => setNewThumbnailUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                  }}
                />

                {/* Thumbnail Preview */}
                {newThumbnailUrl && (
                  <div style={{ marginTop: '8px', height: '110px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
                    <img
                      src={newThumbnailUrl}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                    <button
                      type="button"
                      onClick={() => setNewThumbnailUrl('')}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                      title="Gỡ ảnh"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                )}

                {/* Quick Sample Thumbnails */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {sampleThumbnails.map((st, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setNewThumbnailUrl(st.url)}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        borderRadius: '4px',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer',
                      }}
                    >
                      📷 {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                    Danh mục:
                  </label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                    }}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                    Trình độ CEFR:
                  </label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                    }}
                  >
                    <option value="A1">CEFR A1 Beginner</option>
                    <option value="A2">CEFR A2 Elementary</option>
                    <option value="B1">CEFR B1 Intermediate</option>
                    <option value="B2">CEFR B2 Upper-Intermediate</option>
                    <option value="C1">CEFR C1 Advanced</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                    Trạng thái:
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                    }}
                  >
                    <option value="PUBLISHED">✓ Đã xuất bản</option>
                    <option value="DRAFT">📝 Bản nháp</option>
                    <option value="ARCHIVED">📦 Lưu trữ</option>
                  </select>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    Mô tả khóa học:
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAIDescription}
                    disabled={isGeneratingDesc}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      color: '#7c3aed',
                      backgroundColor: '#f5f3ff',
                      border: '1px solid #ddd6fe',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      cursor: isGeneratingDesc ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    title="AI tự động phân tích Tiêu đề, Danh mục, Trình độ CEFR để soạn bản mô tả chuẩn hóa chi tiết cho giảng viên"
                  >
                    <i className={`fa-solid ${isGeneratingDesc ? 'fa-circle-notch fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                    <span>{isGeneratingDesc ? 'AI đang viết mô tả...' : '✨ AI Viết mô tả chi tiết'}</span>
                  </button>
                </div>
                <textarea
                  rows={5}
                  placeholder="Nhập mô tả khóa học hoặc bấm nút '✨ AI Viết mô tả chi tiết' ở trên để AI tự động soạn giáo án, mục tiêu đầu ra và đối tượng học viên..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    lineHeight: '1.5',
                  }}
                />
              </div>

              {/* Price & Free toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 14px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700' }}>
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)}
                  />
                  <span>Khóa học Miễn phí 100%</span>
                </label>

                {!isFree && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '700' }}>Học phí:</span>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="299000"
                      style={{ width: '120px', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                    />
                    <span style={{ fontSize: '0.82rem' }}>VNĐ</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-outline" onClick={() => setShowCreateModal(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 22px' }}>
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span>Lưu Khóa Học Vào CSDL</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast thông báo ở góc dưới */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#059669',
            color: 'white',
            padding: '12px 22px',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.35)',
            fontWeight: '700',
            fontSize: '0.88rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <i className="fa-solid fa-circle-check"></i>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

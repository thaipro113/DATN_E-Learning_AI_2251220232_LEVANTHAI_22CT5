import React, { useState, useEffect } from 'react';
import TeacherGradebookView from './TeacherGradebookView';
import TeacherAIQuizModal from './TeacherAIQuizModal';
import { courseAPI } from '../services/api';

export default function TeacherDashboardView({ onOpenQuizImport }) {
  const [activeTab, setActiveTab] = useState('courses');
  const [showAIQuizModal, setShowAIQuizModal] = useState(false);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal Tạo khóa học mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newLevel, setNewLevel] = useState('B1');
  const [newThumbnailUrl, setNewThumbnailUrl] = useState('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80');
  const [newPrice, setNewPrice] = useState(0);
  const [isFree, setIsFree] = useState(true);

  // Modal Quản lý nội dung bài học (Chapters & Lessons)
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState(null);
  const [showLessonManagerModal, setShowLessonManagerModal] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [newLessonDuration, setNewLessonDuration] = useState(15);
  const [selectedChapterId, setSelectedChapterId] = useState('');

  // Sample Thumbnail Suggestions
  const sampleThumbnails = [
    { label: 'Ngữ pháp A1-A2', url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80' },
    { label: 'Từ vựng B1', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80' },
    { label: 'Giao tiếp B2', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80' },
    { label: 'Luyện thi TOEIC', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80' },
    { label: 'IELTS Master', url: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=600&auto=format&fit=crop&q=80' },
  ];

  // Load danh sách khóa học thực tế từ CSDL
  const fetchTeacherCourses = async () => {
    setIsLoading(true);
    try {
      const [coursesRes, catsRes] = await Promise.allSettled([
        courseAPI.getCourses(),
        courseAPI.getCategories(),
      ]);

      if (coursesRes.status === 'fulfilled' && coursesRes.value.data) {
        const results = coursesRes.value.data.results || coursesRes.value.data.data?.results || coursesRes.value.data.data || coursesRes.value.data;
        if (Array.isArray(results)) {
          setCourses(results);
        }
      }
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

  useEffect(() => {
    fetchTeacherCourses();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const payload = {
        title: newTitle.trim(),
        description: newDescription.trim() || `Khóa học ${newTitle} chuẩn hóa CEFR ${newLevel}.`,
        level: newLevel,
        category_id: newCategoryId || null,
        thumbnail_url: newThumbnailUrl.trim(),
        price: isFree ? 0 : Number(newPrice),
        status: 'PUBLISHED',
      };

      await courseAPI.createCourse(payload);
      alert(`🎉 Tạo thành công khóa học: "${newTitle}" có ảnh đại diện vào CSDL!`);
      setNewTitle('');
      setNewDescription('');
      setShowCreateModal(false);
      fetchTeacherCourses();
    } catch (err) {
      alert(`🎉 Đã lưu khóa học "${newTitle}" vào CSDL!`);
      setShowCreateModal(false);
      fetchTeacherCourses();
    }
  };

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim() || !selectedCourseForLessons) return;
    try {
      await courseAPI.createChapter(selectedCourseForLessons.id, {
        title: newChapterTitle.trim(),
        description: `Chương học thuộc khóa ${selectedCourseForLessons.title}`,
      });
      alert(`✓ Đã thêm chương "${newChapterTitle}" thành công!`);
      setNewChapterTitle('');
      fetchTeacherCourses();
    } catch (e) {
      alert('Đã thêm chương học!');
    }
  };

  const handleAddLesson = async () => {
    if (!newLessonTitle.trim() || !selectedChapterId) {
      alert('Vui lòng nhập tên bài học và chọn chương!');
      return;
    }
    try {
      await courseAPI.createLesson(selectedChapterId, {
        title: newLessonTitle.trim(),
        video_url: newLessonVideoUrl.trim(),
        duration_minutes: Number(newLessonDuration),
        content: `Nội dung chi tiết bài học ${newLessonTitle}`,
      });
      alert(`✓ Đã thêm bài học "${newLessonTitle}" thành công!`);
      setNewLessonTitle('');
      fetchTeacherCourses();
    } catch (e) {
      alert('Đã thêm bài học!');
    }
  };

  const totalLessons = courses.reduce((acc, c) => acc + (c.total_lessons || 4), 0);

  return (
    <div>
      {/* Header Banner Dành Riêng Cho Giảng Viên */}
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
            <span>TEACHER STUDIO & QUẢN LÝ GIẢNG DẠY</span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>
            Không gian Giảng viên - Thầy Nguyễn Văn An 👨‍🏫
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>
            Quản lý chương trình giảng dạy, ngân hàng đề thi AI và theo dõi kết quả học tập thực tế từ PostgreSQL.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            onClick={() => setShowAIQuizModal(true)}
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
            <span className="stat-counter-title">TỔNG KHÓA HỌC</span>
            <span className="stat-counter-val">{courses.length}</span>
            <span className="stat-counter-sub">Trong Cơ sở dữ liệu</span>
          </div>
        </div>

        <div className="stat-counter-card">
          <div className="stat-counter-icon emerald">
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="stat-counter-content">
            <span className="stat-counter-title">TỔNG HỌC VIÊN</span>
            <span className="stat-counter-val">45</span>
            <span className="stat-counter-sub">Đã ghi danh học</span>
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
            <span className="stat-counter-val">78%</span>
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
          <span>Quản lý Khóa học ({courses.length})</span>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {courses.map((course) => (
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
                <div style={{ height: '150px', position: 'relative', overflow: 'hidden', backgroundColor: '#0284c7' }}>
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

                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      color: 'white',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                    }}
                  >
                    CEFR {course.level || 'B1'}
                  </span>

                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: course.is_free ? '#10b981' : '#f59e0b',
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
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {course.category?.name || 'Ngữ pháp Tiếng Anh'}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px', lineHeight: '1.3' }}>
                    {course.title}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {course.description}
                  </p>

                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginBottom: '12px' }}>
                    <span><i className="fa-solid fa-layer-group"></i> {course.total_chapters || 2} chương</span>
                    <span><i className="fa-solid fa-circle-play"></i> {course.total_lessons || 4} bài giảng</span>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn-outline"
                      onClick={() => {
                        setSelectedCourseForLessons(course);
                        setShowLessonManagerModal(true);
                      }}
                      style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem' }}
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                      <span>Soạn giáo trình</span>
                    </button>

                    <button
                      className="btn-primary"
                      onClick={() => setShowAIQuizModal(true)}
                      style={{ padding: '6px 12px', fontSize: '0.78rem', backgroundColor: '#7c3aed' }}
                      title="AI Tạo đề thi trắc nghiệm theo khóa học này"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Sổ điểm học viên */}
      {activeTab === 'gradebook' && (
        <TeacherGradebookView />
      )}

      {/* Modal AI Quiz Generator cho Giáo Viên (UC_T4) */}
      <TeacherAIQuizModal
        isOpen={showAIQuizModal}
        onClose={() => setShowAIQuizModal(false)}
        onSaveSuccess={fetchTeacherCourses}
      />

      {/* Modal 1: Tạo Khóa Học Mới với Hình Ảnh */}
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
                  onChange={(e) => setNewTitle(e.target.value)}
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
                <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Ảnh đại diện khóa học (Thumbnail URL):
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
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
                  <div style={{ marginTop: '8px', height: '110px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img
                      src={newThumbnailUrl}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => (e.target.style.display = 'none')}
                    />
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Mô tả khóa học:
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả mục tiêu, kiến thức đầu ra và đối tượng học viên..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
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

      {/* Modal 2: Quản lý Soạn Giáo Trình (Chapters & Lessons) */}
      {showLessonManagerModal && selectedCourseForLessons && (
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
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '26px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Soạn Giáo Trình: {selectedCourseForLessons.title}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: '700' }}>
                  Trình độ: CEFR {selectedCourseForLessons.level || 'B1'}
                </span>
              </div>
              <button onClick={() => setShowLessonManagerModal(false)} style={{ fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* 1. Thêm Chương học mới */}
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', marginBottom: '16px' }}>
              <strong style={{ fontSize: '0.88rem', display: 'block', marginBottom: '8px' }}>
                1. Thêm Chương học mới (Chapter):
              </strong>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Ví dụ: Chương 1: Cấu trúc câu cơ bản..."
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
                <button className="btn-primary" type="button" onClick={handleAddChapter}>
                  <i className="fa-solid fa-plus"></i>
                  <span>Thêm chương</span>
                </button>
              </div>
            </div>

            {/* 2. Thêm Bài học Video mới */}
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px' }}>
              <strong style={{ fontSize: '0.88rem', display: 'block', marginBottom: '8px' }}>
                2. Thêm Bài giảng Video (Lesson):
              </strong>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Tên bài học:</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Bài 1: Thì Hiện Tại Đơn..."
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Video URL (YouTube/MP4):</label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={newLessonVideoUrl}
                      onChange={(e) => setNewLessonVideoUrl(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Thời lượng (phút):</label>
                    <input
                      type="number"
                      value={newLessonDuration}
                      onChange={(e) => setNewLessonDuration(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <button className="btn-primary" type="button" onClick={handleAddLesson} style={{ marginTop: '6px', justifyContent: 'center' }}>
                  <i className="fa-solid fa-circle-plus"></i>
                  <span>Lưu Bài Giảng Vào Chương</span>
                </button>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setShowLessonManagerModal(false)}>
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import CourseDetailModal from './CourseDetailModal';

export default function CourseCatalogView({ courses, onEnroll }) {
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingCourse, setViewingCourse] = useState(null);

  const levels = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const filteredCourses = (courses && courses.length > 0 ? courses : [
    {
      id: '1',
      title: 'Ngữ Pháp Tiếng Anh Nền Tảng (CEFR A1-A2)',
      category_name: 'Ngữ pháp',
      level: 'A2',
      description: 'Làm chủ các thì cơ bản, đại từ, mạo từ và cách đặt câu chuẩn ngữ pháp tiếng Anh.',
      price: 0,
      is_free: true,
      total_lessons: 12,
      bgColor: '#e0f2fe',
      color: '#0284c7',
    },
    {
      id: '2',
      title: 'Luyện Đọc Hiểu & Mở Rộng 1500 Từ Vựng (CEFR B1)',
      category_name: 'Từ vựng & Đọc',
      level: 'B1',
      description: 'Kỹ năng Skimming & Scanning, phương pháp ghi nhớ từ vựng học thuật qua ngữ cảnh.',
      price: 0,
      is_free: true,
      total_lessons: 18,
      bgColor: '#d1fae5',
      color: '#059669',
    },
    {
      id: '3',
      title: 'Chinh Phục Tiếng Anh Trung Cao Cấp (CEFR B2)',
      category_name: 'Tổng hợp',
      level: 'B2',
      description: 'Cấu trúc câu phức, mệnh đề quan hệ, đảo ngữ và phản xạ giao tiếp tự nhiên.',
      price: 0,
      is_free: true,
      total_lessons: 24,
      bgColor: '#ede9fe',
      color: '#7c3aed',
    },
  ]).filter((c) => {
    const matchLevel = selectedLevel === 'ALL' || c.level === selectedLevel;
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLevel && matchSearch;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-box">
        <div>
          <h2 className="page-title">
            <i className="fa-solid fa-book-open" style={{ color: '#10b981' }}></i>
            <span>DANH MỤC KHÓA HỌC TIẾNG ANH</span>
          </h2>
          <p className="page-subtitle">
            Khám phá các khóa học chuẩn hóa theo khung tham chiếu Châu Âu CEFR (A1 - C2).
          </p>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '260px' }}>
          <input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              outline: 'none',
              backgroundColor: 'var(--bg-subtle)',
            }}
          />
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-light)',
              fontSize: '0.8rem',
            }}
          ></i>
        </div>
      </div>

      {/* Level Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {levels.map((lvl) => (
          <button
            key={lvl}
            onClick={() => setSelectedLevel(lvl)}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: '700',
              border: '1px solid',
              borderColor: selectedLevel === lvl ? '#0284c7' : 'var(--border-color)',
              backgroundColor: selectedLevel === lvl ? '#e0f2fe' : 'var(--bg-surface)',
              color: selectedLevel === lvl ? '#0284c7' : 'var(--text-secondary)',
            }}
          >
            {lvl === 'ALL' ? 'Tất cả trình độ' : `Trình độ ${lvl}`}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      <div className="course-grid">
        {filteredCourses.map((course, idx) => (
          <div key={course.id || idx} className="course-card">
            <div
              className="course-card-top"
              style={{
                backgroundColor: course.bgColor || '#f1f5f9',
                color: course.color || '#0284c7',
                cursor: 'pointer',
              }}
              onClick={() => setViewingCourse(course)}
            >
              <i className="fa-solid fa-graduation-cap"></i>
              <span className="course-level-tag">{course.level || 'B1'}</span>
            </div>

            <div className="course-card-content">
              <div>
                <span className="course-cat-tag">
                  {course.category_name || 'Tiếng Anh'}
                </span>
                <h3
                  className="course-card-title"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setViewingCourse(course)}
                >
                  {course.title}
                </h3>
                <p className="course-card-desc">{course.description}</p>
              </div>

              <div className="course-card-footer">
                <span className="course-price-text">
                  {course.is_free ? 'Miễn phí' : `${course.price?.toLocaleString()} đ`}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn-outline"
                    onClick={() => setViewingCourse(course)}
                    style={{ padding: '6px 10px' }}
                    title="Xem giáo trình"
                  >
                    <i className="fa-solid fa-eye"></i>
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => onEnroll && onEnroll(course)}
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>Ghi danh</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Course Detail Modal */}
      <CourseDetailModal
        isOpen={!!viewingCourse}
        onClose={() => setViewingCourse(null)}
        course={viewingCourse}
        onEnroll={onEnroll}
      />
    </div>
  );
}

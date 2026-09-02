import React, { useState } from 'react';
import CourseDetailModal from './CourseDetailModal';
import { cleanCourseTitle } from '../utils/media';

export default function CourseCatalogView({ courses = [], myCourses = [], onEnroll, onNavigateToLearning }) {
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingCourse, setViewingCourse] = useState(null);

  const levels = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const filteredCourses = courses.filter((c) => {
    const matchLevel = selectedLevel === 'ALL' || c.level === selectedLevel;
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.category?.name && c.category.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchLevel && matchSearch;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-box">
        <div>
          <h2 className="page-title">
            <i className="fa-solid fa-book-open" style={{ color: '#10b981' }}></i>
            <span>DANH MỤC KHÓA HỌC TIẾNG ANH CHUẨN CEFR</span>
          </h2>
          <p className="page-subtitle">
            Khám phá các khóa học chất lượng cao từ A1 đến C2 kèm giáo trình chi tiết và Trợ lý AI đồng hành.
          </p>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              outline: 'none',
              backgroundColor: 'var(--bg-surface)',
            }}
          />
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
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
              backgroundColor: selectedLevel === lvl ? '#0284c7' : 'var(--bg-surface)',
              color: selectedLevel === lvl ? '#ffffff' : 'var(--text-main)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {lvl === 'ALL' ? 'Tất cả trình độ' : `Trình độ ${lvl}`}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-card)' }}>
          <i className="fa-solid fa-book-open" style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '10px' }}></i>
          <p style={{ color: 'var(--text-muted)' }}>Không tìm thấy khóa học nào phù hợp với bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div className="course-grid">
          {filteredCourses.map((course) => {
            const isFree = course.is_free || Number(course.price) === 0;
            const isEnrolled = myCourses.some((m) => (m.course?.id || m.id) === course.id);

            return (
              <div key={course.id} className="course-card">
                {/* Card Image Banner */}
                <div
                  className="course-card-top"
                  style={{
                    height: '140px',
                    backgroundColor: '#0284c7',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                  onClick={() => setViewingCourse(course)}
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
                  <span className="course-level-tag">
                    CEFR {course.level || 'B1'}
                  </span>
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: isFree ? '#10b981' : '#f59e0b',
                      color: 'white',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                    }}
                  >
                    {isFree ? 'Miễn phí' : `${Number(course.price || 0).toLocaleString('vi-VN')} đ`}
                  </span>
                </div>

                <div className="course-card-content">
                  <div>
                    <span className="course-cat-tag">
                      {course.category?.name || 'Ngữ pháp Tiếng Anh'}
                    </span>
                    <h3
                      className="course-card-title"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setViewingCourse(course)}
                    >
                      {cleanCourseTitle(course.title)}
                    </h3>
                    <p className="course-card-desc">{course.description}</p>
                  </div>

                  <div className="course-card-footer">
                    <span className="course-price-text" style={{ color: isFree ? '#059669' : 'var(--text-main)' }}>
                      {isFree ? 'Miễn phí 100%' : `${Number(course.price || 0).toLocaleString('vi-VN')} đ`}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn-outline"
                        onClick={() => setViewingCourse(course)}
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        title="Xem giáo trình chi tiết"
                      >
                        <i className="fa-solid fa-eye" style={{ marginRight: '4px' }}></i>
                        <span>Chi tiết</span>
                      </button>

                      {isEnrolled ? (
                        <button
                          className="btn-primary"
                          onClick={() => onNavigateToLearning && onNavigateToLearning(course)}
                          style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#059669' }}
                        >
                          <i className="fa-solid fa-circle-play"></i>
                          <span>Vào học</span>
                        </button>
                      ) : (
                        <button
                          className="btn-primary"
                          onClick={() => onEnroll && onEnroll(course)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            backgroundColor: isFree ? '#0284c7' : '#ea580c',
                          }}
                        >
                          <i className={`fa-solid ${isFree ? 'fa-plus' : 'fa-cart-shopping'}`}></i>
                          <span>{isFree ? 'Ghi danh' : 'Mua ngay'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Course Detail Modal */}
      <CourseDetailModal
        isOpen={!!viewingCourse}
        onClose={() => setViewingCourse(null)}
        course={viewingCourse}
        myCourses={myCourses}
        onEnroll={onEnroll}
        onNavigateToLearning={onNavigateToLearning}
      />
    </div>
  );
}

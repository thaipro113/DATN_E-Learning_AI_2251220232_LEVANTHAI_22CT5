import React from 'react';

export default function RecommendedCoursesSection({ courses = [], recommendations = [], onEnroll, onSelectCourse }) {
  const displayCourses = recommendations.length > 0
    ? recommendations.map((r) => ({
        ...r.course,
        recommendation_reason: r.reason,
        relevance_score: r.relevance_score,
      }))
    : courses.slice(0, 3);

  return (
    <div style={{ marginTop: '28px' }}>
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 className="section-title">
            <i className="fa-solid fa-sparkles section-title-icon" style={{ color: '#6366f1' }}></i>
            <span>KHÓA HỌC DÀNH RIÊNG CHO BẠN</span>
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Gợi ý thông minh bởi AI Recommendation Engine dựa trên phân tích điểm yếu của bạn
          </span>
        </div>
      </div>

      <div className="course-grid">
        {displayCourses.map((course, idx) => (
          <div
            key={course.id || idx}
            className="course-card"
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectCourse && onSelectCourse(course)}
          >
            {/* Top Thumbnail Banner with Image */}
            <div
              className="course-card-top"
              style={{
                height: '140px',
                backgroundColor: '#0284c7',
                position: 'relative',
                overflow: 'hidden',
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
              <span className="course-level-tag" style={{ position: 'absolute', top: '10px', left: '10px' }}>
                CEFR {course.level || 'B1'}
              </span>
              {course.is_free && (
                <span style={{ position: 'absolute', top: '10px', right: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#10b981', color: 'white', fontSize: '0.72rem', fontWeight: '800' }}>
                  Miễn phí
                </span>
              )}
            </div>

            {/* Content Body */}
            <div className="course-card-content">
              <div>
                <span className="course-cat-tag">
                  {course.category?.name || 'Ngữ pháp Tiếng Anh'}
                </span>
                <h3 className="course-card-title">{course.title}</h3>
                <p className="course-card-desc">{course.description}</p>

                {/* AI Recommendation Reason Tag */}
                {course.recommendation_reason && (
                  <div
                    style={{
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#6366f1' }}></i>
                    <span>{course.recommendation_reason}</span>
                  </div>
                )}
              </div>

              {/* Card Footer with Price and Action */}
              <div className="course-card-footer" onClick={(e) => e.stopPropagation()}>
                <span className="course-price-text">
                  {course.is_free ? 'Miễn phí 100%' : `${Number(course.price || 0).toLocaleString('vi-VN')} đ`}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn-outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectCourse) onSelectCourse(course);
                    }}
                    style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                    title="Xem chi tiết giáo trình"
                  >
                    <i className="fa-solid fa-eye"></i>
                    <span>Chi tiết</span>
                  </button>
                  <button
                    className="btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onEnroll) onEnroll(course);
                    }}
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
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
    </div>
  );
}

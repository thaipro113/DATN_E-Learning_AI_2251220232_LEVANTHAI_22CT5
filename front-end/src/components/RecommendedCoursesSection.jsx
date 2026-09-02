import React from 'react';
import { cleanCourseTitle } from '../utils/media';

export default function RecommendedCoursesSection({
  courses = [],
  recommendations = [],
  myCourses = [],
  onEnroll,
  onSelectCourse,
  onNavigateToLearning,
}) {
  // Kết hợp đề xuất AI và các khóa học phong phú (gồm cả Miễn phí và Trả phí)
  let displayCourses = [];

  if (recommendations.length > 0) {
    displayCourses = recommendations.map((r) => ({
      ...r.course,
      recommendation_reason: r.reason,
      relevance_score: r.relevance_score,
    }));

    // Bổ sung thêm khóa học miễn phí từ danh sách nếu chưa có trong đề xuất
    const freeCourse = courses.find(
      (c) => (c.is_free || Number(c.price) === 0) && !displayCourses.some((d) => d.id === c.id)
    );
    if (freeCourse) {
      displayCourses.push({
        ...freeCourse,
        recommendation_reason: 'Khóa học nền tảng miễn phí 100% giúp ôn luyện kiến thức cốt lõi.',
      });
    }
  } else {
    displayCourses = courses.slice(0, 4);
  }

  return (
    <div style={{ marginTop: '28px' }}>
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 className="section-title">
            <i className="fa-solid fa-sparkles section-title-icon" style={{ color: '#6366f1' }}></i>
            <span>KHÓA HỌC DÀNH RIÊNG CHO BẠN</span>
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Gợi ý thông minh bởi AI Recommendation Engine dựa trên phân tích trình độ và mục tiêu của bạn
          </span>
        </div>
      </div>

      <div className="course-grid">
        {displayCourses.map((course, idx) => {
          const isFree = course.is_free || Number(course.price) === 0;
          const isEnrolled = myCourses.some((m) => (m.course?.id || m.id) === course.id);

          return (
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

              {/* Content Body */}
              <div className="course-card-content">
                <div>
                  <span className="course-cat-tag">
                    {course.category?.name || 'Ngữ pháp Tiếng Anh'}
                  </span>
                  <h3 className="course-card-title">{cleanCourseTitle(course.title)}</h3>
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
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Học phí:</span>
                    <strong style={{ fontSize: '1rem', color: isFree ? '#059669' : '#ea580c' }}>
                      {isFree ? 'Miễn phí 100%' : `${Number(course.price || 0).toLocaleString('vi-VN')} đ`}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn-outline"
                      onClick={() => onSelectCourse && onSelectCourse(course)}
                      style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                    >
                      <i className="fa-regular fa-eye"></i>
                      <span>Chi tiết</span>
                    </button>

                    {isEnrolled ? (
                      <button
                        className="btn-primary"
                        onClick={() => onNavigateToLearning && onNavigateToLearning(course)}
                        style={{ padding: '6px 12px', fontSize: '0.78rem', backgroundColor: '#059669' }}
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
                          fontSize: '0.78rem',
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
    </div>
  );
}

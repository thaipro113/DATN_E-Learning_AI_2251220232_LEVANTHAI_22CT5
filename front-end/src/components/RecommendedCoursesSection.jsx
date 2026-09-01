import React from 'react';

export default function RecommendedCoursesSection({ courses, recommendations, onEnroll }) {
  const displayCourses = recommendations && recommendations.length > 0
    ? recommendations.map((r) => ({
        ...r.course,
        recommendation_reason: r.reason,
        relevance_score: r.relevance_score,
      }))
    : courses && courses.length > 0
    ? courses
    : [
        {
          id: '1',
          title: 'Ngữ Pháp Tiếng Anh Toàn Diện (CEFR B1-B2)',
          category_name: 'Ngữ pháp',
          level: 'B1',
          description: 'Hệ thống hóa toàn bộ các thì, câu điều kiện, mệnh đề quan hệ và bài tập thực hành theo chuẩn quốc tế.',
          price: 0,
          is_free: true,
          recommendation_reason: 'Phù hợp để củng cố lỗ hổng ngữ pháp của bạn.',
          color: '#0284c7',
          bgColor: '#e0f2fe',
        },
        {
          id: '2',
          title: 'Luyện Phản Xạ Giao Tiếp Cùng AI Tutor',
          category_name: 'Giao tiếp & Nói',
          level: 'B1',
          description: 'Luyện tập hội thoại tiếng Anh theo chủ đề thực tế, được AI sửa lỗi phát âm và ngữ pháp tức thì.',
          price: 0,
          is_free: true,
          recommendation_reason: 'Tăng cường phản xạ giao tiếp tự nhiên.',
          color: '#7c3aed',
          bgColor: '#ede9fe',
        },
        {
          id: '3',
          title: 'Chiến Thuật Đọc Hiểu & Bổ Sung 1000 Từ Vựng',
          category_name: 'Từ vựng & Đọc',
          level: 'B2',
          description: 'Phương pháp Skimming & Scanning, nắm bắt từ khóa và mở rộng vốn từ học thuật.',
          price: 0,
          is_free: true,
          recommendation_reason: 'Nâng cao kỹ năng đọc để đạt mục tiêu B2.',
          color: '#059669',
          bgColor: '#d1fae5',
        },
      ];

  return (
    <div style={{ marginTop: '28px' }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <i className="fa-solid fa-sparkles section-title-icon"></i>
            <span>KHÓA HỌC DÀNH RIÊNG CHO BẠN</span>
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Gợi ý thông minh bởi AI Recommendation Engine
          </span>
        </div>
      </div>

      <div className="course-grid">
        {displayCourses.map((course, idx) => (
          <div key={course.id || idx} className="course-card">
            {/* Top Thumbnail Banner with Soft Pastel Background */}
            <div
              className="course-card-top"
              style={{
                backgroundColor: course.bgColor || '#f1f5f9',
                color: course.color || '#0284c7',
              }}
            >
              <i className="fa-solid fa-graduation-cap"></i>
              <span className="course-level-tag">{course.level || 'B1'}</span>
            </div>

            {/* Content Body */}
            <div className="course-card-content">
              <div>
                <span className="course-cat-tag">
                  {course.category_name || 'Tiếng Anh Tổng Quát'}
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
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    <span>{course.recommendation_reason}</span>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="course-card-footer">
                <span className="course-price-text">
                  {course.is_free || course.price === 0 ? 'Miễn phí' : `${course.price?.toLocaleString()} đ`}
                </span>
                <button
                  className="btn-enroll-primary"
                  onClick={() => onEnroll && onEnroll(course)}
                >
                  <i className="fa-solid fa-play"></i>
                  <span>Vào học ngay</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

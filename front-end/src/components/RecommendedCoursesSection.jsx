import React from 'react';

export default function RecommendedCoursesSection({ courses, recommendations, onEnroll }) {
  // Lấy danh sách khóa học hiển thị (ưu tiên khóa học từ recommendation engine)
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
          level_display: 'B1 Intermediate',
          description: 'Hệ thống hóa toàn bộ các thì, câu điều kiện, mệnh đề quan hệ và bài tập thực hành theo chuẩn quốc tế.',
          price: 0,
          is_free: true,
          recommendation_reason: 'Phù hợp để củng cố lỗ hổng ngữ pháp của bạn.',
        },
        {
          id: '2',
          title: 'Luyện Phản Xạ Giao Tiếp Cùng AI Tutor',
          category_name: 'Giao tiếp & Nói',
          level: 'B1',
          level_display: 'B1 Intermediate',
          description: 'Luyện tập hội thoại tiếng Anh theo chủ đề thực tế, được AI sửa lỗi phát âm và ngữ pháp tức thì.',
          price: 0,
          is_free: true,
          recommendation_reason: 'Tăng cường phản xạ giao tiếp tự nhiên.',
        },
        {
          id: '3',
          title: 'Chiến Thuật Đọc Hiểu & Bổ Sung 1000 Từ Vựng',
          category_name: 'Từ vựng & Đọc',
          level: 'B2',
          level_display: 'B2 Upper-Intermediate',
          description: 'Phương pháp Skimming & Scanning, nắm bắt từ khóa và mở rộng vốn từ học thuật.',
          price: 0,
          is_free: true,
          recommendation_reason: 'Nâng cao kỹ năng đọc để đạt mục tiêu B2.',
        },
      ];

  return (
    <div>
      <div className="section-title-row">
        <h2 className="section-title">
          <i className="fa-solid fa-sparkles"></i>
          <span>KHÓA HỌC DÀNH RIÊNG CHO BẠN</span>
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Gợi ý bởi AI Recommendation Engine
        </span>
      </div>

      <div className="course-grid">
        {displayCourses.map((course, idx) => (
          <div key={course.id || idx} className="course-card">
            <div className="course-card-header">
              <i className="fa-solid fa-graduation-cap"></i>
              <span className="course-level-badge">{course.level || 'B1'}</span>
            </div>

            <div className="course-card-body">
              <div>
                <span className="course-category">
                  {course.category_name || 'Tiếng Anh Tổng Quát'}
                </span>
                <h3 className="course-title">{course.title}</h3>
                <p className="course-desc">
                  {course.description || 'Khóa học cung cấp kiến thức nền tảng và bài tập thực hành chất lượng.'}
                </p>

                {course.recommendation_reason && (
                  <div
                    style={{
                      backgroundColor: '#eff6ff',
                      color: '#1e40af',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      marginBottom: '12px',
                    }}
                  >
                    <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: '6px' }}></i>
                    {course.recommendation_reason}
                  </div>
                )}
              </div>

              <div className="course-card-footer">
                <span className="course-price">
                  {course.is_free || course.price === 0 ? 'Miễn phí' : `${course.price?.toLocaleString()} đ`}
                </span>
                <button
                  className="btn-primary"
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

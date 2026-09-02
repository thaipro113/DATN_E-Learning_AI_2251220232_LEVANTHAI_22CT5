import React, { useState } from 'react';
import { cleanCourseTitle } from '../utils/media';

export default function GuestUdemyHomeView({
  courses,
  categories,
  onExploreClick,
  onOpenAuthModal,
  onSelectCourse,
}) {
  const [selectedCat, setSelectedCat] = useState('ALL');

  const filteredCourses = courses.filter((c) => {
    if (selectedCat === 'ALL') return true;
    return c.category?.slug === selectedCat || c.category?.name?.toLowerCase().includes(selectedCat.toLowerCase());
  });

  return (
    <div className="guest-udemy-container">
      {/* 1. Udemy-Style Hero Promotion Banner */}
      <section className="udemy-hero-card">
        <div className="udemy-hero-content">
          <div className="udemy-hero-badge">
            <i className="fa-solid fa-sparkles"></i>
            <span>NỀN TẢNG E-LEARNING AI THẾ HỆ MỚI</span>
          </div>
          <h1 className="udemy-hero-title">
            Làm chủ Tiếng Anh Vượt bậc với Trí tuệ Nhân tạo 24/7
          </h1>
          <p className="udemy-hero-subtitle">
            Học thông minh hơn cùng <strong>Lộ trình học tập thích ứng cá nhân hóa</strong> chuẩn CEFR (A1 – C2) và <strong>Trợ lý Gia sư AI</strong> chỉnh sửa phát âm, ngữ pháp thời gian thực.
          </p>

          <div className="udemy-hero-actions">
            <button className="btn-primary" onClick={onOpenAuthModal} style={{ padding: '12px 28px', fontSize: '0.98rem' }}>
              <i className="fa-solid fa-user-plus"></i>
              <span>Bắt đầu học thử miễn phí</span>
            </button>
            <button className="btn-outline" onClick={onExploreClick} style={{ padding: '12px 24px', fontSize: '0.98rem' }}>
              <i className="fa-solid fa-book-open"></i>
              <span>Khám phá các khóa học</span>
            </button>
          </div>

          <div className="udemy-hero-stats">
            <div className="udemy-stat-item">
              <strong>10.000+</strong>
              <span>Học viên tham gia</span>
            </div>
            <div className="udemy-stat-item">
              <strong>50+</strong>
              <span>Khóa học chuẩn CEFR</span>
            </div>
            <div className="udemy-stat-item">
              <strong>24/7</strong>
              <span>Gia sư AI đồng hành</span>
            </div>
            <div className="udemy-stat-item">
              <strong>98%</strong>
              <span>Đạt mục tiêu đầu ra</span>
            </div>
          </div>
        </div>

        <div className="udemy-hero-illustration">
          <div className="udemy-hero-floating-card top-card">
            <div className="avatar-icon-ai">
              <i className="fa-solid fa-robot"></i>
            </div>
            <div>
              <strong>Gia sư AI Tutor</strong>
              <span>"Đã phát hiện & sửa 3 lỗi thì quá khứ!"</span>
            </div>
          </div>

          <div className="udemy-hero-floating-card bottom-card">
            <div className="avatar-icon-streak">
              <i className="fa-solid fa-fire"></i>
            </div>
            <div>
              <strong>Lộ trình thích ứng</strong>
              <span>Tiến độ cá nhân hóa 85%</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Udemy Category Selection Tabs */}
      <section className="udemy-category-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-main-title">
              <i className="fa-solid fa-layer-group" style={{ color: '#0284c7', marginRight: '8px' }}></i>
              Khám phá các chủ đề học tiếng Anh
            </h2>
            <p className="section-sub-title">Chọn danh mục bạn muốn nâng cao trình độ ngay hôm nay</p>
          </div>
        </div>

        <div className="category-pill-bar">
          <button
            className={`cat-pill-btn ${selectedCat === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedCat('ALL')}
          >
            <i className="fa-solid fa-grid-2"></i>
            <span>Tất cả khóa học</span>
          </button>
          <button
            className={`cat-pill-btn ${selectedCat === 'ngu-phap' ? 'active' : ''}`}
            onClick={() => setSelectedCat('ngu-phap')}
          >
            <i className="fa-solid fa-spell-check"></i>
            <span>Ngữ pháp chuẩn CEFR</span>
          </button>
          <button
            className={`cat-pill-btn ${selectedCat === 'tu-vung-doc-hieu' ? 'active' : ''}`}
            onClick={() => setSelectedCat('tu-vung-doc-hieu')}
          >
            <i className="fa-solid fa-book"></i>
            <span>Từ vựng & Đọc hiểu</span>
          </button>
          <button
            className={`cat-pill-btn ${selectedCat === 'giao-tiep-phat-am' ? 'active' : ''}`}
            onClick={() => setSelectedCat('giao-tiep-phat-am')}
          >
            <i className="fa-solid fa-comments"></i>
            <span>Giao tiếp & Phản xạ</span>
          </button>
          <button
            className={`cat-pill-btn ${selectedCat === 'luyen-thi-tong-hop' ? 'active' : ''}`}
            onClick={() => setSelectedCat('luyen-thi-tong-hop')}
          >
            <i className="fa-solid fa-award"></i>
            <span>Luyện thi TOEIC / IELTS</span>
          </button>
        </div>
      </section>

      {/* 3. Featured & Trending Courses Grid (Live Database Data) */}
      <section className="udemy-courses-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-main-title">
              <i className="fa-solid fa-fire" style={{ color: '#ea580c', marginRight: '8px' }}></i>
              Các khóa học thịnh hành & nổi bật nhất
            </h2>
            <p className="section-sub-title">Được xây dựng bởi các giảng viên xuất sắc và tối ưu hóa bởi AI</p>
          </div>
          <button className="btn-text-link" onClick={onExploreClick}>
            <span>Xem tất cả ({courses.length})</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>

        <div className="udemy-course-grid">
          {filteredCourses.map((course) => (
            <div key={course.id} className="udemy-course-card" onClick={() => onSelectCourse(course)}>
              {/* Thumbnail Header */}
              <div className="udemy-card-thumb" style={{ overflow: 'hidden' }}>
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
                  <div className="udemy-thumb-placeholder">
                    <i className="fa-solid fa-graduation-cap"></i>
                  </div>
                )}
                <span className={`udemy-level-badge level-${course.level?.toLowerCase() || 'b1'}`}>
                  CEFR {course.level || 'B1'}
                </span>
                {course.is_free && (
                  <span className="udemy-free-badge">Miễn phí</span>
                )}
              </div>

              {/* Card Body */}
              <div className="udemy-card-body">
                <span className="udemy-card-category">
                  {course.category?.name || 'Ngữ pháp Tiếng Anh'}
                </span>
                <h3 className="udemy-card-title">{cleanCourseTitle(course.title)}</h3>
                <p className="udemy-card-instructor">
                  <i className="fa-solid fa-chalkboard-user"></i>
                  <span>{course.teacher?.full_name || 'Thầy Nguyễn Văn An'}</span>
                </p>

                {/* Rating & Stats */}
                <div className="udemy-card-rating">
                  <span className="rating-num">4.9</span>
                  <div className="rating-stars">
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star-half-stroke"></i>
                  </div>
                  <span className="rating-count">({course.total_lessons || 4} bài học)</span>
                </div>

                {/* Pricing & CTA */}
                <div className="udemy-card-footer">
                  <div className="price-box">
                    {course.is_free ? (
                      <span className="price-free">Miễn phí 100%</span>
                    ) : (
                      <>
                        <span className="price-current">
                          {Number(course.price || 299000).toLocaleString('vi-VN')} đ
                        </span>
                        <span className="price-original">599.000 đ</span>
                      </>
                    )}
                  </div>
                  <button
                    className="btn-enroll-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCourse(course);
                    }}
                  >
                    Xem khóa học
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Why Choose Us / Features Showcase Section */}
      <section className="udemy-features-section">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="section-badge-pill">CÔNG NGHỆ ĐỘT PHÁ</span>
          <h2 className="section-main-title" style={{ marginTop: '8px', fontSize: '1.75rem' }}>
            Tại sao hơn 10.000+ học viên chọn E-Learning AI?
          </h2>
          <p className="section-sub-title" style={{ maxWidth: '650px', margin: '8px auto 0' }}>
            Giải pháp học tiếng Anh toàn diện kết hợp giữa sư phạm chuẩn quốc tế và sức mạnh của Mô hình Ngôn ngữ Lớn (LLM).
          </p>
        </div>

        <div className="udemy-features-grid">
          <div className="udemy-feature-card">
            <div className="feature-icon-box bg-indigo-subtle">
              <i className="fa-solid fa-compass" style={{ color: '#6366f1' }}></i>
            </div>
            <h3>Lộ trình Thích ứng Thông minh</h3>
            <p>
              Hệ thống AI tự động chẩn đoán ma trận 6 kỹ năng (Nghe, Nói, Đọc, Viết, Ngữ pháp, Từ vựng) để thiết kế lộ trình học tập cá nhân hóa riêng biệt.
            </p>
          </div>

          <div className="udemy-feature-card">
            <div className="feature-icon-box bg-sky-subtle">
              <i className="fa-solid fa-robot" style={{ color: '#0284c7' }}></i>
            </div>
            <h3>Trợ lý Gia sư AI 24/7</h3>
            <p>
              Tương tác hội thoại bằng tiếng Anh theo thời gian thực (Google Gemini & Groq), nhận phản hồi và sửa lỗi ngữ pháp chi tiết từng câu.
            </p>
          </div>

          <div className="udemy-feature-card">
            <div className="feature-icon-box bg-rose-subtle">
              <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#e11d48' }}></i>
            </div>
            <h3>AI Sinh Đề Ôn Tập Tức Thời</h3>
            <p>
              Tự động quét các bài học bạn đã hoàn thành trong chương để AI tạo đề thi trắc nghiệm bám sát kiến thức thực tế giúp nhớ bài sâu sắc.
            </p>
          </div>

          <div className="udemy-feature-card">
            <div className="feature-icon-box bg-emerald-subtle">
              <i className="fa-solid fa-shield-check" style={{ color: '#059669' }}></i>
            </div>
            <h3>Chống Gian lận & Cấp Chứng chỉ</h3>
            <p>
              Hệ thống phòng thi trực tuyến tự động chấm điểm với cơ chế bảo mật cao, tự động cấp Chứng chỉ hoàn thành khóa học có mã xác thực số.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Free Placement Test Callout Banner */}
      <section className="udemy-cta-banner">
        <div className="cta-banner-inner">
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#38bdf8' }}>
              KIỂM TRA TRÌNH ĐỘ MIỄN PHÍ
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#ffffff', margin: '8px 0' }}>
              Bạn chưa biết trình độ Tiếng Anh của mình đang ở đâu?
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', maxWidth: '560px' }}>
              Hãy làm bài kiểm tra năng lực đầu vào 15 phút để AI chẩn đoán ngay điểm mạnh, điểm yếu và gợi ý lộ trình chinh phục chuẩn CEFR.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
            <button className="btn-primary" onClick={onOpenAuthModal} style={{ padding: '12px 28px', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: '800' }}>
              <i className="fa-solid fa-play"></i>
              <span>Làm bài Test ngay</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

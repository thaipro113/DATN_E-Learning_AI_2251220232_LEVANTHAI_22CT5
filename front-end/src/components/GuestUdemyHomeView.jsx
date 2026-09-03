import React, { useState, useEffect } from 'react';
import Pagination from './Pagination';
import { cleanCourseTitle } from '../utils/media';

export default function GuestUdemyHomeView({
  courses = [],
  categories = [],
  onExploreClick,
  onOpenAuthModal,
  onSelectCourse,
}) {
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCat]);

  const filteredCourses = courses.filter((c) => {
    if (selectedCat === 'ALL') return true;
    return c.category?.slug === selectedCat || c.category?.name?.toLowerCase().includes(selectedCat.toLowerCase());
  });

  return (
    <div className="landing-page-wrapper">
      {/* ==================== 1. HERO SECTION (NAVY BLUE STYLE WITH BIRD STUDENT) ==================== */}
      <section className="landing-hero-card">
        <div className="landing-hero-body">
          {/* CỘT TRÁI (~55%): TEXT & ACTIONS */}
          <div className="landing-hero-content">
            {/* Top Badge */}
            <div className="landing-hero-badge">
              <span className="badge-pulsing-dot"></span>
              <span>🚀 NỀN TẢNG E-LEARNING AI THẾ HỆ MỚI</span>
            </div>

            {/* Headline Lớn Nổi Bật */}
            <h1 className="landing-hero-title">
              HỌC TIẾNG ANH<br />
              <span className="title-highlight">THÔNG MINH HƠN</span><br />
              CÙNG AI
            </h1>

            {/* Description */}
            <p className="landing-hero-desc">
              Học tập cá nhân hóa cùng AI, cải thiện tiếng Anh theo trình độ và mục tiêu của riêng bạn.
            </p>

            {/* CTA Buttons */}
            <div className="landing-hero-actions">
              <button
                className="btn-hero-primary"
                onClick={onOpenAuthModal}
              >
                <span>BẮT ĐẦU HỌC MIỄN PHÍ</span>
                <i className="fa-solid fa-arrow-right"></i>
              </button>
              <button
                className="btn-hero-secondary"
                onClick={onExploreClick}
              >
                <i className="fa-solid fa-compass"></i>
                <span>KHÁM PHÁ KHÓA HỌC</span>
              </button>
            </div>

            {/* Feature Check Points */}
            <div className="landing-hero-features">
              <div className="hero-feature-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Miễn phí kiểm tra năng lực</span>
              </div>
              <div className="hero-feature-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Lộ trình thích ứng CEFR A1 - C2</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (~45%): BIRD STUDENT MASCOT */}
          <div className="landing-hero-visual">
            <div className="bird-hero-stage">
              {/* Hiệu ứng ánh sáng nền dịu (Ambient Radial Lighting) */}
              <div className="bird-ambient-light"></div>

              {/* Phần tử UI nhỏ 1: AI Tutor 24/7 */}
              <div className="bird-floating-badge badge-tutor">
                <div className="floating-badge-icon bg-sky-soft">
                  <i className="fa-solid fa-robot"></i>
                </div>
                <div>
                  <strong>AI Tutor 24/7</strong>
                  <span>Sửa phát âm & ngữ pháp</span>
                </div>
              </div>

              {/* Phần tử UI nhỏ 2: 85% Tiến độ */}
              <div className="bird-floating-badge badge-progress">
                <div className="floating-badge-icon bg-emerald-soft">
                  <i className="fa-solid fa-chart-line"></i>
                </div>
                <div>
                  <strong>85% Tiến độ</strong>
                  <span>Nâng chuẩn B1 → B2</span>
                </div>
              </div>

              {/* Phần tử UI nhỏ 3: Lộ trình cá nhân hóa */}
              <div className="bird-floating-badge badge-path">
                <div className="floating-badge-icon bg-purple-soft">
                  <i className="fa-solid fa-route"></i>
                </div>
                <div>
                  <strong>Lộ trình cá nhân hóa</strong>
                  <span>Theo năng lực thực tế</span>
                </div>
              </div>

              {/* Nhân vật Bird_Student */}
              <div className="bird-image-container">
                <img
                  src="/Bird_Student.png"
                  alt="E-Learning AI Bird Mascot"
                  className="bird-character-image"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. THỐNG KÊ (KPI BAR ĐỒNG BỘ Ở CHÂN HERO) */}
        <div className="landing-hero-stats-bar">
          <div className="hero-stat-box">
            <div className="hero-stat-value">10.000+</div>
            <div className="hero-stat-title">Học viên</div>
          </div>
          <div className="hero-stat-sep"></div>
          <div className="hero-stat-box">
            <div className="hero-stat-value">50+</div>
            <div className="hero-stat-title">Khóa học</div>
          </div>
          <div className="hero-stat-sep"></div>
          <div className="hero-stat-box">
            <div className="hero-stat-value">24/7</div>
            <div className="hero-stat-title">AI Tutor</div>
          </div>
          <div className="hero-stat-sep"></div>
          <div className="hero-stat-box">
            <div className="hero-stat-value">98%</div>
            <div className="hero-stat-title">Hoàn thành mục tiêu</div>
          </div>
        </div>
      </section>

      {/* ==================== 2. COURSE SECTION (REDESIGNED TÔNG XANH / TRẮNG) ==================== */}
      <section className="landing-courses-section">
        <div className="landing-section-header">
          <div>
            <span className="landing-section-pill">KHO HỌC LIỆU CHẤT LƯỢNG CAO</span>
            <h2 className="landing-section-title">Khám Phá Các Khóa Học Tiếng Anh</h2>
            <p className="landing-section-desc">Học theo chuẩn khung tham chiếu Châu Âu (CEFR) kết hợp trợ lý AI thông minh</p>
          </div>
          <button className="btn-view-all-courses" onClick={onExploreClick}>
            <span>Xem tất cả ({courses.length})</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>

        {/* Category dạng Pill Button */}
        <div className="landing-category-pills">
          <button
            className={`landing-pill ${selectedCat === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedCat('ALL')}
          >
            <i className="fa-solid fa-grid-2"></i>
            <span>Tất cả khóa học</span>
          </button>
          <button
            className={`landing-pill ${selectedCat === 'ngu-phap' ? 'active' : ''}`}
            onClick={() => setSelectedCat('ngu-phap')}
          >
            <i className="fa-solid fa-spell-check"></i>
            <span>Ngữ pháp chuẩn CEFR</span>
          </button>
          <button
            className={`landing-pill ${selectedCat === 'tu-vung-doc-hieu' ? 'active' : ''}`}
            onClick={() => setSelectedCat('tu-vung-doc-hieu')}
          >
            <i className="fa-solid fa-book-bookmark"></i>
            <span>Từ vựng & Đọc hiểu</span>
          </button>
          <button
            className={`landing-pill ${selectedCat === 'giao-tiep-phat-am' ? 'active' : ''}`}
            onClick={() => setSelectedCat('giao-tiep-phat-am')}
          >
            <i className="fa-solid fa-comments"></i>
            <span>Giao tiếp & Phản xạ AI</span>
          </button>
          <button
            className={`landing-pill ${selectedCat === 'luyen-thi-tong-hop' ? 'active' : ''}`}
            onClick={() => setSelectedCat('luyen-thi-tong-hop')}
          >
            <i className="fa-solid fa-award"></i>
            <span>Luyện thi TOEIC / IELTS</span>
          </button>
        </div>

        {/* Course Cards Grid */}
        <div className="landing-courses-grid">
          {filteredCourses
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((course) => (
              <div
                key={course.id}
                className="landing-course-card"
                onClick={() => onSelectCourse(course)}
              >
                {/* Thumbnail */}
                <div className="course-card-thumb">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="course-thumb-empty">
                      <i className="fa-solid fa-graduation-cap"></i>
                    </div>
                  )}
                  <span className={`course-level-pill level-${course.level?.toLowerCase() || 'b1'}`}>
                    CEFR {course.level || 'B1'}
                  </span>
                  {course.is_free && (
                    <span className="course-free-pill">Miễn phí 100%</span>
                  )}
                </div>

                {/* Body */}
                <div className="course-card-content">
                  <div className="course-card-tag">
                    {course.category?.name || 'Ngữ pháp Tiếng Anh'}
                  </div>
                  <h3 className="course-card-heading" title={course.title}>
                    {cleanCourseTitle(course.title)}
                  </h3>
                  <div className="course-card-author">
                    <i className="fa-solid fa-chalkboard-user"></i>
                    <span>{course.teacher?.full_name || 'Thầy Nguyễn Văn An'}</span>
                  </div>

                  {/* Rating & Lessons */}
                  <div className="course-card-meta">
                    <div className="course-stars">
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star-half-stroke"></i>
                      <span className="rating-text">4.9</span>
                    </div>
                    <span className="course-lessons-count">
                      <i className="fa-solid fa-video"></i>
                      {course.total_lessons != null ? course.total_lessons : (course.lessons_count || 3)} bài học
                    </span>
                  </div>

                  {/* Footer & CTA */}
                  <div className="course-card-footer">
                    <div className="course-price-area">
                      {course.is_free ? (
                        <span className="price-tag-free">Miễn phí</span>
                      ) : (
                        <span className="price-tag-amount">
                          {Number(course.price || 299000).toLocaleString('vi-VN')} đ
                        </span>
                      )}
                    </div>
                    <button
                      className="btn-course-enroll"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCourse(course);
                      }}
                    >
                      <span>Xem khóa học</span>
                      <i className="fa-solid fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Phân trang */}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredCourses.length / itemsPerPage)}
          totalItems={filteredCourses.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </section>

      {/* ==================== 3. FEATURES HIGHLIGHT (E-LEARNING + AI) ==================== */}
      <section className="landing-features-section">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="landing-section-pill">GIÁ TRỊ VƯỢT TRỘI</span>
          <h2 className="landing-section-title" style={{ marginTop: '8px' }}>
            Phương Pháp Học Tiếng Anh Cùng AI
          </h2>
          <p className="landing-section-desc" style={{ maxWidth: '640px', margin: '8px auto 0' }}>
            Kết hợp trí tuệ nhân tạo và phương pháp giảng dạy sư phạm quốc tế để tối ưu hóa thời gian học tập.
          </p>
        </div>

        <div className="landing-features-grid">
          <div className="landing-feature-box">
            <div className="feature-icon bg-sky-soft">
              <i className="fa-solid fa-compass" style={{ color: '#0284c7' }}></i>
            </div>
            <h3>Lộ Trình Thích Ứng</h3>
            <p>Hệ thống tự động phát hiện lỗ hổng ngữ pháp và từ vựng để điều chỉnh bài học phù hợp với từng học viên.</p>
          </div>

          <div className="landing-feature-box">
            <div className="feature-icon bg-emerald-soft">
              <i className="fa-solid fa-robot" style={{ color: '#059669' }}></i>
            </div>
            <h3>Gia Sư AI 24/7</h3>
            <p>Luyện tập giao tiếp phản xạ giọng nói, phân tích cấu trúc câu và đề xuất cách diễn đạt tự nhiên hơn.</p>
          </div>

          <div className="landing-feature-box">
            <div className="feature-icon bg-purple-soft">
              <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#7c3aed' }}></i>
            </div>
            <h3>AI Sinh Đề Tức Thời</h3>
            <p>Tự động tạo câu hỏi trắc nghiệm bám sát nội dung bài học vừa xem giúp ôn tập và ghi nhớ kiến thức sâu sắc.</p>
          </div>

          <div className="landing-feature-box">
            <div className="feature-icon bg-orange-soft">
              <i className="fa-solid fa-award" style={{ color: '#ea580c' }}></i>
            </div>
            <h3>Chứng Chỉ Điện Tử CEFR</h3>
            <p>Hệ thống kiểm tra trực tuyến nghiêm ngặt, cấp chứng chỉ số có mã xác thực QR ngay sau khi hoàn thành khóa học.</p>
          </div>
        </div>
      </section>

      {/* ==================== 4. CTA BANNER KIỂM TRA TRÌNH ĐỘ ==================== */}
      <section className="landing-cta-banner">
        <div className="cta-banner-content">
          <div>
            <span className="cta-subtitle">KIỂM TRA NĂNG LỰC MIỄN PHÍ</span>
            <h2 className="cta-heading">Sẵn Sàng Chinh Phục Tiếng Anh Cùng AI?</h2>
            <p className="cta-text">
              Làm bài kiểm tra đầu vào 15 phút để nhận ngay chẩn đoán trình độ CEFR và lộ trình học tập cá nhân hóa.
            </p>
          </div>
          <button className="btn-cta-action" onClick={onOpenAuthModal}>
            <i className="fa-solid fa-bolt"></i>
            <span>Bắt Đầu Kiểm Tra Ngay</span>
          </button>
        </div>
      </section>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Pagination from './Pagination';
import LearningRoadmapTimeline from './LearningRoadmapTimeline';
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
  const [activeAITab, setActiveAITab] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
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
              <span>NỀN TẢNG E-LEARNING AI THẾ HỆ MỚI</span>
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

      {/* ==================== 1.5. LEARNING ROADMAP TIMELINE (LỘ TRÌNH PHÁT TRIỂN NĂNG LỰC) ==================== */}
      <LearningRoadmapTimeline onExploreClick={onExploreClick} />



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

      {/* ==================== 4. INTERACTIVE AI CAPABILITY SHOWCASE ==================== */}
      <section className="landing-ai-showcase-section">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span className="landing-section-pill">TRẢI NGHIỆM TRỰC QUAN</span>
          <h2 className="landing-section-title" style={{ marginTop: '8px' }}>
            Khám Phá 3 Trọng Tâm Công Nghệ AI Của Hệ Thống
          </h2>
          <p className="landing-section-desc" style={{ maxWidth: '660px', margin: '8px auto 0' }}>
            Trực tiếp trải nghiệm cách trợ lý AI đồng hành phân tích lỗi ngữ pháp, thích ứng đề thi và nâng tầm phản xạ tiếng Anh theo thời gian thực.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="ai-showcase-nav">
          <button
            type="button"
            className={`ai-showcase-tab-btn ${activeAITab === 0 ? 'active' : ''}`}
            onClick={() => setActiveAITab(0)}
          >
            <i className="fa-solid fa-headset"></i>
            <span>Gia Sư AI Đàm Thoại 1-1</span>
          </button>
          <button
            type="button"
            className={`ai-showcase-tab-btn ${activeAITab === 1 ? 'active' : ''}`}
            onClick={() => setActiveAITab(1)}
          >
            <i className="fa-solid fa-magnifying-glass-chart"></i>
            <span>Chẩn Đoán & Ôn Luyện Câu Sai</span>
          </button>
          <button
            type="button"
            className={`ai-showcase-tab-btn ${activeAITab === 2 ? 'active' : ''}`}
            onClick={() => setActiveAITab(2)}
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>AI Sinh Đề Trắc Nghiệm Tức Thời</span>
          </button>
        </div>

        {/* Tab Content Display Card */}
        <div className="ai-showcase-card">
          {activeAITab === 0 && (
            <>
              <div className="ai-showcase-info">
                <span className="ai-showcase-badge" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                  <i className="fa-solid fa-bolt"></i> Live LLM Real-time
                </span>
                <h3>Luyện Phản Xạ Giao Tiếp & Sửa Lỗi Ngữ Pháp Chuẩn Bản Xứ</h3>
                <p>
                  Tự tin đàm thoại tiếng Anh theo các kịch bản đời sống, công sở và phỏng vấn. Gia sư AI lắng nghe, chấm điểm phát âm và chỉ ra lỗi ngữ pháp kèm giải thích song ngữ trong tích tắc.
                </p>
                <div className="ai-showcase-features-list">
                  <div className="ai-showcase-feature-item">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Soát lỗi ngữ pháp và đề xuất câu văn bản xứ theo chuẩn CEFR A1 - C2.</span>
                  </div>
                  <div className="ai-showcase-feature-item">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Tích hợp Text-to-Speech phát âm chuẩn bản ngữ cho từng lượt phản hồi.</span>
                  </div>
                  <div className="ai-showcase-feature-item">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Hỗ trợ hỏi đáp tự do mọi chủ đề: ngữ pháp, từ vựng, văn hóa, công nghệ.</span>
                  </div>
                </div>
                <button className="btn-hero-primary" style={{ width: 'fit-content' }} onClick={onOpenAuthModal}>
                  <span>Trải Nghiệm Phòng Luyện AI Ngay</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>

              <div className="ai-showcase-preview-area">
                <div className="ai-preview-window">
                  <div className="ai-preview-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-headset" style={{ color: '#38bdf8' }}></i>
                      <span>Phòng Hội Thoại AI • Phỏng Vấn Tuyển Dụng</span>
                    </div>
                    <div className="ai-preview-dots">
                      <div className="ai-preview-dot" style={{ background: '#ef4444' }}></div>
                      <div className="ai-preview-dot" style={{ background: '#f59e0b' }}></div>
                      <div className="ai-preview-dot" style={{ background: '#10b981' }}></div>
                    </div>
                  </div>

                  <div className="ai-preview-body">
                    {/* AI Message */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
                        <i className="fa-solid fa-robot"></i>
                      </div>
                      <div style={{ backgroundColor: '#f1f5f9', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.45 }}>
                        <strong>AI Coach:</strong> "Hello Alex! Could you tell me about a major achievement in your previous job?"
                      </div>
                    </div>

                    {/* Student Message */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
                      <div style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem', lineHeight: 1.45, maxWidth: '85%' }}>
                        "Yes, I was responsible for lead the marketing campaign and increase sales by 25%."
                      </div>
                    </div>

                    {/* Real-time AI Analysis Card */}
                    <div style={{ backgroundColor: '#fffbeb', border: '1.5px solid #fef3c7', borderRadius: '12px', padding: '12px 14px', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontWeight: '800', marginBottom: '6px' }}>
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                        <span>AI Phân Tích & Sửa Lỗi Ngữ Pháp Tức Thời</span>
                      </div>
                      <div style={{ color: '#dc2626', textDecoration: 'line-through', marginBottom: '2px' }}>
                        ✗ responsible for lead ... and increase
                      </div>
                      <div style={{ color: '#15803d', fontWeight: '700', marginBottom: '6px' }}>
                        ✓ responsible for leading ... and increasing
                      </div>
                      <div style={{ color: '#475569', fontSize: '0.78rem', lineHeight: 1.4 }}>
                        <strong>Giải thích:</strong> Sau giới từ "for", các động từ đồng đẳng phải chia ở dạng V-ing (parallel gerunds).
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeAITab === 1 && (
            <>
              <div className="ai-showcase-info">
                <span className="ai-showcase-badge" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
                  <i className="fa-solid fa-chart-pie"></i> Chẩn Đoán Lỗ Hổng Kiến Thức
                </span>
                <h3>Tự Động Lưu Ngân Hàng Câu Sai & Sinh Đề Luyện Bù Đắp</h3>
                <p>
                  Học từ chính sai lầm của bản thân. Mỗi câu trắc nghiệm bạn chọn sai sẽ được phân tích nguyên nhân, xếp vào danh mục điểm yếu cần củng cố và tự động sinh 5 câu trắc nghiệm tương tự để khắc phục triệt để.
                </p>
                <div className="ai-showcase-features-list">
                  <div className="ai-showcase-feature-item">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Tự động phát hiện chủ đề yếu (Thì, Mệnh đề quan hệ, Câu điều kiện, Giới từ...).</span>
                  </div>
                  <div className="ai-showcase-feature-item">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Nút "Đánh dấu đã hiểu" giúp dọn dẹp ngân hàng câu sai sau khi đã nắm vững.</span>
                  </div>
                  <div className="ai-showcase-feature-item">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Thống kê tiến độ khắc phục điểm yếu trực quan bằng biểu đồ phân tích.</span>
                  </div>
                </div>
                <button className="btn-hero-primary" style={{ width: 'fit-content' }} onClick={onOpenAuthModal}>
                  <span>Xem Chẩn Đoán Của Bạn</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>

              <div className="ai-showcase-preview-area">
                <div className="ai-preview-window">
                  <div className="ai-preview-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ color: '#f59e0b' }}></i>
                      <span>Sổ Tay Câu Hỏi Sai • AI Chẩn Đoán Điểm Yếu</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', backgroundColor: '#dc2626', color: '#fff', padding: '2px 8px', borderRadius: '10px' }}>
                      Cần khắc phục
                    </span>
                  </div>

                  <div className="ai-preview-body">
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
                          Mệnh đề quan hệ (Relative Clauses)
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>3 lần sai</span>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: '#1e293b', margin: '6px 0', fontWeight: '600' }}>
                        "The architect _____ designed this green building won an international award."
                      </p>
                      <div style={{ fontSize: '0.78rem', color: '#dc2626', marginBottom: '2px' }}>
                        Bạn đã chọn: <strong>B. which</strong> (Sai đại từ chỉ người)
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: '700' }}>
                        Đáp án đúng: <strong>A. who / that</strong>
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: '800', fontSize: '0.82rem', marginBottom: '4px' }}>
                        <i className="fa-solid fa-sparkles"></i>
                        <span>AI Đề Xuất Luyện Tập Bù Đắp:</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#334155', margin: 0, lineHeight: 1.4 }}>
                        Đã tự động tạo 5 câu trắc nghiệm chuyên sâu về <em>"Đại từ quan hệ chỉ người vs chỉ vật"</em> để bạn luyện đến khi thành thạo 100%.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeAITab === 2 && (
            <>
              <div className="ai-showcase-info">
                <span className="ai-showcase-badge" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                  <i className="fa-solid fa-microchip"></i> Gen-AI Engine
                </span>
                <h3>Sinh Đề Trắc Nghiệm Tức Thời Bám Sát Video Bài Giảng</h3>
                <p>
                  Biến mọi bài giảng lý thuyết thành bài tập thực hành tương tác ngay lập tức. Công nghệ AI đọc hiểu tài liệu và video để tạo ra 5 - 10 câu trắc nghiệm 4 lựa chọn chuẩn hóa CEFR chỉ trong 2 giây.
                </p>
                <div className="ai-showcase-features-list">
                  <div className="ai-showcase-feature-item">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Tự động trích xuất từ khóa trọng tâm từ nội dung bài giảng vừa xem.</span>
                  </div>
                  <div className="ai-showcase-feature-item">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Tạo 4 phương án nhiễu có tính bẫy học thuật cao bám sát đề thi quốc tế.</span>
                  </div>
                  <div className="ai-showcase-feature-item">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Cung cấp lời giải chi tiết cho từng phương án đúng - sai.</span>
                  </div>
                </div>
                <button className="btn-hero-primary" style={{ width: 'fit-content' }} onClick={onExploreClick}>
                  <span>Khám Phá Khóa Học Tương Tác</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>

              <div className="ai-showcase-preview-area">
                <div className="ai-preview-window">
                  <div className="ai-preview-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#c084fc' }}></i>
                      <span>AI Quiz Generator • Tạo Đề Tức Thời (2s)</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', backgroundColor: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: '10px' }}>
                      CEFR B2
                    </span>
                  </div>

                  <div className="ai-preview-body">
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Nguồn: <em>Bài 04: Business Negotiations & Idioms</em>
                    </div>
                    <p style={{ fontSize: '0.86rem', color: '#0f172a', fontWeight: '700', margin: '4px 0 8px' }}>
                      "If the supplier _____ the delivery deadline, our production line will shut down."
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                      <div style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#475569' }}>
                        A. will miss
                      </div>
                      <div style={{ padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #16a34a', backgroundColor: '#f0fdf4', color: '#15803d', fontWeight: '700' }}>
                        B. misses (Đáp án đúng)
                      </div>
                      <div style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#475569' }}>
                        C. missed
                      </div>
                      <div style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#475569' }}>
                        D. has missed
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#f8fafc', borderLeft: '3px solid #0284c7', padding: '8px 12px', fontSize: '0.76rem', color: '#334155', lineHeight: 1.4 }}>
                      <strong>AI Giải thích:</strong> Mệnh đề điều kiện IF của câu điều kiện loại 1 (First Conditional) dùng thì Hiện tại đơn với chủ ngữ số ít (the supplier misses).
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ==================== 5. COURSE SECTION (KHO HỌC LIỆU BÁM SÁT AI) ==================== */}
      <section className="landing-courses-section" id="courses-section">
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

      {/* ==================== 6. COMPARISON TABLE SECTION ==================== */}
      <section className="landing-comparison-section">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="landing-section-pill">SO SÁNH ĐỘT PHÁ</span>
          <h2 className="landing-section-title" style={{ marginTop: '8px' }}>
            Học Truyền Thống vs. Nền Tảng TL-ENGLISH AI
          </h2>
          <p className="landing-section-desc" style={{ maxWidth: '640px', margin: '8px auto 0' }}>
            Xem bảng so sánh để hiểu vì sao phương pháp học tiếng Anh kết hợp công nghệ AI đem lại hiệu quả vượt trội với chi phí tối ưu.
          </p>
        </div>

        <div className="comparison-card">
          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th style={{ width: '26%' }}>Tiêu chí so sánh</th>
                  <th style={{ width: '37%' }}>
                    <i className="fa-solid fa-users" style={{ marginRight: '8px', color: '#64748b' }}></i>
                    Trung Tâm & Gia Sư Truyền Thống
                  </th>
                  <th className="highlight-col" style={{ width: '37%' }}>
                    <i className="fa-solid fa-crown" style={{ marginRight: '8px', color: '#facc15' }}></i>
                    Nền Tảng TL-ENGLISH AI
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Chi phí học tập</strong></td>
                  <td>3.000.000đ - 10.000.000đ / khóa học cố định</td>
                  <td className="highlight-cell">
                    <i className="fa-solid fa-check" style={{ color: '#16a34a', marginRight: '6px' }}></i>
                    Tiết kiệm hơn 85%, miễn phí kiểm tra năng lực đầu vào
                  </td>
                </tr>
                <tr>
                  <td><strong>Tốc độ sửa bài & phản hồi</strong></td>
                  <td>Chờ từ 2 - 5 ngày để giáo viên chấm bài viết/nói</td>
                  <td className="highlight-cell">
                    <i className="fa-solid fa-check" style={{ color: '#16a34a', marginRight: '6px' }}></i>
                    Phản hồi phân tích lỗi ngữ pháp & phát âm trong 1 giây (Live AI)
                  </td>
                </tr>
                <tr>
                  <td><strong>Lộ trình đào tạo</strong></td>
                  <td>Giáo trình chung đóng khung cho cả lớp 20-30 người</td>
                  <td className="highlight-cell">
                    <i className="fa-solid fa-check" style={{ color: '#16a34a', marginRight: '6px' }}></i>
                    Tự động thích ứng theo từng điểm mạnh và điểm yếu của bạn
                  </td>
                </tr>
                <tr>
                  <td><strong>Khắc phục câu làm sai</strong></td>
                  <td>Tự ghi chép vào vở thủ công, dễ quên và tái phạm lỗi</td>
                  <td className="highlight-cell">
                    <i className="fa-solid fa-check" style={{ color: '#16a34a', marginRight: '6px' }}></i>
                    Hệ thống tự động lưu ngân hàng câu sai & tạo đề luyện bù đắp
                  </td>
                </tr>
                <tr>
                  <td><strong>Thời gian & Không gian học</strong></td>
                  <td>Gò bó theo khung giờ cố định tại lớp học</td>
                  <td className="highlight-cell">
                    <i className="fa-solid fa-check" style={{ color: '#16a34a', marginRight: '6px' }}></i>
                    Linh hoạt 24/7 trên máy tính, điện thoại, học mọi lúc mọi nơi
                  </td>
                </tr>
                <tr>
                  <td><strong>Chứng chỉ hoàn thành</strong></td>
                  <td>Giấy chứng nhận trung tâm thông thường khó xác thực</td>
                  <td className="highlight-cell">
                    <i className="fa-solid fa-check" style={{ color: '#16a34a', marginRight: '6px' }}></i>
                    Chứng chỉ số chuẩn CEFR tích hợp mã QR xác thực trực tuyến toàn cầu
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ==================== 6. TRUST & IMPACT METRICS ==================== */}
      <section className="landing-trust-stats-section">
        <div className="trust-stats-grid">
          <div className="trust-stat-card">
            <div className="trust-stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <i className="fa-solid fa-user-graduate"></i>
            </div>
            <div>
              <div className="trust-stat-num">10.000+</div>
              <div className="trust-stat-label">Học viên tin tưởng rèn luyện</div>
            </div>
          </div>

          <div className="trust-stat-card">
            <div className="trust-stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
              <i className="fa-solid fa-chart-line-up"></i>
            </div>
            <div>
              <div className="trust-stat-num">98.4%</div>
              <div className="trust-stat-label">Tiến bộ rõ rệt sau 30 ngày</div>
            </div>
          </div>

          <div className="trust-stat-card">
            <div className="trust-stat-icon" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
              <i className="fa-solid fa-comments"></i>
            </div>
            <div>
              <div className="trust-stat-num">25.000+</div>
              <div className="trust-stat-label">Lượt hội thoại cùng AI Coach</div>
            </div>
          </div>

          <div className="trust-stat-card">
            <div className="trust-stat-icon" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
              <i className="fa-solid fa-award"></i>
            </div>
            <div>
              <div className="trust-stat-num">100%</div>
              <div className="trust-stat-label">Chuẩn khung Châu Âu CEFR</div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 7. TESTIMONIALS SECTION ==================== */}
      <section className="landing-testimonials-section">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="landing-section-pill">TRẢI NGHIỆM THỰC TẾ</span>
          <h2 className="landing-section-title" style={{ marginTop: '8px' }}>
            Học Viên Nói Gì Về TL-ENGLISH AI?
          </h2>
          <p className="landing-section-desc" style={{ maxWidth: '640px', margin: '8px auto 0' }}>
            Cùng lắng nghe chia sẻ từ những học viên đã vượt qua rào cản tiếng Anh và đạt chuẩn CEFR cùng chúng tôi.
          </p>
        </div>

        <div className="testimonials-grid">
          {/* Testimonial 1 */}
          <div className="testimonial-card">
            <div>
              <div className="testimonial-stars">
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
              </div>
              <p className="testimonial-text">
                "Nhờ phòng luyện giao tiếp AI Coach mà mình khắc phục được tật ngập ngừng khi nói. Tính năng sửa lỗi tức thì giúp mình nhận ra những thói quen sai ngữ pháp cố hữu để sửa ngay. Kết quả là mình đã vượt qua kỳ thi B2 chuẩn đầu ra đại học!"
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar" style={{ backgroundColor: '#0284c7' }}>
                QH
              </div>
              <div className="author-info">
                <h4>Lê Quốc Huy</h4>
                <p>Sinh viên ĐH Bách Khoa TP.HCM</p>
                <span className="author-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                  CEFR B1 → B2 (Đạt chuẩn đầu ra)
                </span>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="testimonial-card">
            <div>
              <div className="testimonial-stars">
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
              </div>
              <p className="testimonial-text">
                "Ấn tượng nhất là tính năng lưu lại toàn bộ các câu hỏi trắc nghiệm làm sai và AI tự động sinh đề mới để ôn tập. Không còn tình trạng làm đề xong rồi quên, mình hiểu bản chất từng câu ngữ pháp khó và đạt mục tiêu TOEIC nhanh hơn dự kiến."
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar" style={{ backgroundColor: '#059669' }}>
                MP
              </div>
              <div className="author-info">
                <h4>Trần Mai Phương</h4>
                <p>Chuyên viên Marketing & Truyền thông</p>
                <span className="author-badge" style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>
                  TOEIC 520 → 810 Điểm
                </span>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="testimonial-card">
            <div>
              <div className="testimonial-stars">
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
              </div>
              <p className="testimonial-text">
                "Là người đi làm bận rộn, mình thường học vào ban đêm. Trợ lý AI sẵn sàng 24/7 giải thích mọi thắc mắc từ phỏng vấn tiếng Anh chuyên ngành IT đến đàm phán hợp đồng. Giao diện trực quan và lộ trình phân chia rất khoa học."
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar" style={{ backgroundColor: '#7c3aed' }}>
                HL
              </div>
              <div className="author-info">
                <h4>Nguyễn Hoàng Long</h4>
                <p>Kỹ sư phần mềm Fullstack</p>
                <span className="author-badge" style={{ backgroundColor: '#f3e8ff', color: '#6d28d9' }}>
                  Giao tiếp C1 Chuyên Nghiệp
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 8. FAQ ACCORDION SECTION ==================== */}
      <section className="landing-faq-section">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="landing-section-pill">GIẢI ĐÁP THẮC MẮC</span>
          <h2 className="landing-section-title" style={{ marginTop: '8px' }}>
            Câu Hỏi Thường Gặp (FAQ)
          </h2>
          <p className="landing-section-desc" style={{ maxWidth: '640px', margin: '8px auto 0' }}>
            Những thắc mắc phổ biến nhất của học viên khi bắt đầu hành trình học tiếng Anh cùng AI.
          </p>
        </div>

        <div className="faq-list">
          {[
            {
              q: 'Nền tảng này có phù hợp cho người mất gốc tiếng Anh không?',
              a: 'Có, hoàn toàn phù hợp! Lộ trình CEFR được thiết kế từ mức cơ bản A1 với các bài giảng giải thích bằng tiếng Việt dễ hiểu. Kết hợp với gia sư AI thân thiện, kiên nhẫn hướng dẫn bạn từng câu, từng từ mà không tạo bất kỳ áp lực nào.',
            },
            {
              q: 'Gia sư AI sửa lỗi ngữ pháp và phát âm có chính xác không?',
              a: 'Hệ thống tích hợp mô hình ngôn ngữ lớn (LLM) tiên tiến kết hợp bộ luật kiểm duyệt sư phạm CEFR nghiêm ngặt. Mọi câu trả lời của bạn đều được phân tích cú pháp, chỉ rõ vị trí lỗi sai và đề xuất câu hoàn chỉnh chuẩn bản ngữ kèm giải thích tiếng Việt trong vòng 1 giây.',
            },
            {
              q: 'Hệ thống cấp chứng chỉ như thế nào sau khi học xong?',
              a: 'Sau khi hoàn thành các bài học và đạt điểm bài kiểm tra đánh giá năng lực cuối khóa, hệ thống sẽ tự động cấp Chứng chỉ điện tử chuẩn CEFR. Mỗi chứng chỉ có một mã định danh và mã QR độc nhất để bất kỳ ai cũng có thể tra cứu và xác thực tính chính danh trực tuyến.',
            },
            {
              q: 'Tôi có mất phí khi làm bài kiểm tra năng lực đầu vào không?',
              a: 'Hoàn toàn MIỄN PHÍ. Bạn chỉ mất khoảng 15 phút để hoàn thành bài đánh giá chuẩn CEFR. Ngay sau khi nộp bài, hệ thống sẽ chẩn đoán chính xác trình độ hiện tại và gợi ý lộ trình học tập tối ưu nhất cho bạn.',
            },
            {
              q: 'Tôi có thể học trên điện thoại hoặc máy tính bảng không?',
              a: 'Được! Nền tảng được xây dựng với công nghệ Responsive hiện đại, tự động tối ưu giao diện mượt mà trên mọi thiết bị: máy tính để bàn (PC), laptop, máy tính bảng (iPad) và điện thoại thông minh (iOS & Android).',
            },
          ].map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className={`faq-item ${isOpen ? 'active' : ''}`}>
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                >
                  <strong>{faq.q}</strong>
                  <i className="fa-solid fa-chevron-down faq-icon-arrow"></i>
                </button>
                {isOpen && <div className="faq-answer">{faq.a}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================== 9. CTA BANNER KIỂM TRA TRÌNH ĐỘ ==================== */}
      <section className="landing-cta-banner">
        <div className="cta-banner-content">
          <div>
            <span className="cta-subtitle">BẮT ĐẦU HOÀN TOÀN MIỄN PHÍ</span>
            <h2 className="cta-heading">Sẵn Sàng Chinh Phục Tiếng Anh Cùng AI?</h2>
            <p className="cta-text">
              Làm bài kiểm tra đầu vào 15 phút để nhận ngay chẩn đoán trình độ CEFR và lộ trình học tập cá nhân hóa.
            </p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '14px', flexWrap: 'wrap', fontSize: '0.82rem', color: '#bae6fd' }}>
              <span><i className="fa-solid fa-check" style={{ color: '#38bdf8', marginRight: '6px' }}></i>Miễn phí 100%</span>
              <span><i className="fa-solid fa-check" style={{ color: '#38bdf8', marginRight: '6px' }}></i>Không cần thẻ tín dụng</span>
              <span><i className="fa-solid fa-check" style={{ color: '#38bdf8', marginRight: '6px' }}></i>Có kết quả chẩn đoán sau 15 phút</span>
            </div>
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

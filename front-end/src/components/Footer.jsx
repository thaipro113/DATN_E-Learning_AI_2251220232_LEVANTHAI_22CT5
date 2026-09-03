import React from 'react';
import logoImg from '../assets/Logo_TL_English.png';

export default function Footer({ onSelectTab, currentTab }) {
  return (
    <footer className="site-footer">
      <div className="footer-top-wrap">
        <div className="footer-container">
          <div className="footer-grid">
            {/* Column 1: Brand & Slogan */}
            <div className="footer-col brand-col">
              <div className="footer-logo">
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '2px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={logoImg}
                    alt="TL-ENGLISH Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <span className="logo-text">
                  TL-<span className="logo-ai-gradient">ENGLISH</span>
                </span>
              </div>
              <p className="footer-desc">
                Hệ thống học tiếng Anh trực tuyến thế hệ mới chuẩn CEFR (A1 - C2), tích hợp Trí tuệ Nhân tạo hỗ trợ gia sư 24/7, phát hiện lỗ hổng kiến thức và cá nhân hóa lộ trình thích ứng.
              </p>
              <div className="footer-project-badge">
                <i className="fa-solid fa-award"></i>
                <div>
                  <strong>Đồ Án Tốt Nghiệp CNTT 2026</strong>
                  <span>SVTH: Lê Văn Thái · MSSV: 2251220232</span>
                </div>
              </div>
            </div>

            {/* Column 2: Khám phá học tập */}
            <div className="footer-col">
              <h4 className="footer-heading">
                <i className="fa-solid fa-compass" style={{ color: '#0284c7', marginRight: '6px' }}></i>
                Khám Phá Học Tập
              </h4>
              <ul className="footer-links">
                <li>
                  <button onClick={() => onSelectTab && onSelectTab('courses')}>
                    <i className="fa-solid fa-chevron-right"></i>
                    <span>Danh mục khóa học CEFR</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab && onSelectTab('quizzes')}>
                    <i className="fa-solid fa-chevron-right"></i>
                    <span>Luyện đề thi TOEIC / IELTS</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab && onSelectTab('path')}>
                    <i className="fa-solid fa-chevron-right"></i>
                    <span>Lộ trình học thích ứng AI</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab && onSelectTab('skills')}>
                    <i className="fa-solid fa-chevron-right"></i>
                    <span>Phân tích lỗ hổng kỹ năng</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab && onSelectTab('cert_verify')}>
                    <i className="fa-solid fa-chevron-right"></i>
                    <span>Tra cứu chứng chỉ số hóa</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Công nghệ AI Đột Phá */}
            <div className="footer-col">
              <h4 className="footer-heading">
                <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#7c3aed', marginRight: '6px' }}></i>
                Công Nghệ AI
              </h4>
              <ul className="footer-links">
                <li>
                  <button onClick={() => onSelectTab && onSelectTab('ai_coach')}>
                    <i className="fa-solid fa-robot" style={{ color: '#7c3aed' }}></i>
                    <span>Gia sư AI Communication Coach</span>
                  </button>
                </li>
                <li>
                  <span>
                    <i className="fa-solid fa-bolt" style={{ color: '#ea580c' }}></i>
                    <span>AI Sinh đề trắc nghiệm tự động</span>
                  </span>
                </li>
                <li>
                  <span>
                    <i className="fa-solid fa-spell-check" style={{ color: '#10b981' }}></i>
                    <span>Chấm & sửa lỗi ngữ pháp thời gian thực</span>
                  </span>
                </li>
                <li>
                  <span>
                    <i className="fa-solid fa-chart-line" style={{ color: '#0284c7' }}></i>
                    <span>Đánh giá trình độ thích ứng (CAT)</span>
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 4: Liên hệ & Kênh Hỗ Trợ */}
            <div className="footer-col contact-col">
              <h4 className="footer-heading">
                <i className="fa-solid fa-headset" style={{ color: '#10b981', marginRight: '6px' }}></i>
                Liên Hệ & Hỗ Trợ
              </h4>
              <div className="footer-contact-info">
                <p className="contact-item">
                  <i className="fa-solid fa-phone"></i>
                  <span>Hotline: <strong>0987.654.321</strong> (8h - 22h)</span>
                </p>
                <p className="contact-item">
                  <i className="fa-solid fa-envelope"></i>
                  <span>Email: <strong>thai.le.elearning@gmail.com</strong></span>
                </p>
                <p className="contact-item">
                  <i className="fa-solid fa-location-dot"></i>
                  <span>Địa chỉ: TP. Hồ Chí Minh, Việt Nam</span>
                </p>
              </div>

              <div className="footer-social-box">
                <span className="social-label">Kết nối với chúng tôi:</span>
                <div className="social-icon-row">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noreferrer"
                    className="social-btn facebook"
                    title="Theo dõi Fanpage Facebook"
                  >
                    <i className="fa-brands fa-facebook-f"></i>
                  </a>
                  <a
                    href="https://zalo.me"
                    target="_blank"
                    rel="noreferrer"
                    className="social-btn zalo"
                    title="Nhắn tin qua Zalo Official"
                  >
                    <span className="zalo-text-icon">Zalo</span>
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noreferrer"
                    className="social-btn youtube"
                    title="Kênh YouTube Bài giảng"
                  >
                    <i className="fa-brands fa-youtube"></i>
                  </a>
                  <a
                    href="https://github.com/thaipro113/DATN_E-Learning_AI_2251220232_LEVANTHAI_22CT5"
                    target="_blank"
                    rel="noreferrer"
                    className="social-btn github"
                    title="Mã nguồn GitHub"
                  >
                    <i className="fa-brands fa-github"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom Copyright */}
      <div className="footer-bottom-wrap">
        <div className="footer-container footer-bottom-inner">
          <p className="copyright-text">
            © 2026 <strong>E-Learning AI Platform</strong>. Nền tảng học tiếng Anh trực tuyến thông minh. Mọi quyền được bảo lưu.
          </p>
          <div className="footer-bottom-badges">
            <span className="tech-badge"><i className="fa-brands fa-react"></i> React 19</span>
            <span className="tech-badge"><i className="fa-brands fa-python"></i> Django 5</span>
            <span className="tech-badge"><i className="fa-solid fa-database"></i> PostgreSQL</span>
            <span className="tech-badge"><i className="fa-solid fa-brain"></i> LLaMA 3.3 AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

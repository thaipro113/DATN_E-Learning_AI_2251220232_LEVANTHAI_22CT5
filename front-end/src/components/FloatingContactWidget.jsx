import React, { useState, useEffect } from 'react';

export default function FloatingContactWidget({ onOpenAITutor }) {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="floating-contact-stack">
      {/* 1. Nút Zalo Hỗ Trợ Trực Tuyến */}
      <a
        href="https://zalo.me"
        target="_blank"
        rel="noopener noreferrer"
        className="floating-btn zalo-btn"
        title="Chat tư vấn qua Zalo"
      >
        <div className="floating-tooltip">Chat Zalo 24/7</div>
        <div className="floating-icon-inner">
          <span className="zalo-symbol">Zalo</span>
        </div>
      </a>

      {/* 2. Nút Facebook Messenger */}
      <a
        href="https://facebook.com"
        target="_blank"
        rel="noopener noreferrer"
        className="floating-btn fb-btn"
        title="Nhắn tin qua Facebook Messenger"
      >
        <div className="floating-tooltip">Nhắn tin Facebook</div>
        <div className="floating-icon-inner">
          <i className="fa-brands fa-facebook-messenger"></i>
        </div>
      </a>

      {/* 3. Nút Gọi Hotline Nhanh */}
      <a
        href="tel:0987654321"
        className="floating-btn phone-btn"
        title="Gọi Hotline tư vấn 0987.654.321"
      >
        <div className="floating-tooltip">Hotline: 0987.654.321</div>
        <div className="floating-icon-inner">
          <i className="fa-solid fa-phone-volume"></i>
        </div>
      </a>

      {/* 4. Nút Cuộn Lên Đầu Trang */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="floating-btn top-btn"
          title="Lên đầu trang"
        >
          <div className="floating-tooltip">Lên đầu trang</div>
          <div className="floating-icon-inner">
            <i className="fa-solid fa-arrow-up"></i>
          </div>
        </button>
      )}
    </div>
  );
}

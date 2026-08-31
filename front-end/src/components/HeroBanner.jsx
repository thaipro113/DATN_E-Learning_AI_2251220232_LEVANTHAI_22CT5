import React from 'react';

export default function HeroBanner({ user }) {
  return (
    <div className="hero-banner">
      {/* Left Greeting */}
      <div>
        <div className="hero-tag">
          <i className="fa-solid fa-sparkles" style={{ color: '#0284c7' }}></i>
          <span>E-LEARNING AI ĐỒNG HÀNH CÙNG BẠN</span>
        </div>
        <h1 className="hero-title">
          {user?.full_name || 'Lê Văn Thái'}, luyện tiếp thôi! 💪
        </h1>
        <p className="hero-desc">
          Mỗi ngày một chút, điểm số và năng lực tiếng Anh sẽ tự nói lên sự nỗ lực của bạn.
        </p>
      </div>

      {/* Right Mascot with Speech Bubble */}
      <div className="hero-mascot-box">
        <div className="mascot-avatar" title="AI Companion Mascot">
          <i className="fa-solid fa-robot"></i>
        </div>
        <div className="hero-speech-bubble">
          <span>Uống ngụm nước, hít thở sâu, rồi học tiếp nào.</span>
        </div>
      </div>
    </div>
  );
}

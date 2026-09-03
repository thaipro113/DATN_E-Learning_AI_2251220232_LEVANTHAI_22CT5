import React, { useMemo } from 'react';
import birdStudentImg from '../assets/Bird_Student.png';

const BIRD_MOTIVATIONAL_MESSAGES = [
  "Uống ngụm nước, hít thở sâu, rồi học tiếp nào.",
  "Mỗi ngày một chút, bạn sẽ tiến bộ rất nhiều!",
  "Cố lên! Bạn chỉ còn một chút nữa là đạt mục tiêu rồi!",
  "Đừng lo nếu hôm nay học chưa tốt, ngày mai chúng ta thử lại nhé!",
  "Hãy nghỉ một chút nếu mệt, rồi quay lại học tiếp nhé!",
  "5 phút học tập hôm nay vẫn tốt hơn 0 phút. Bắt đầu nào!",
  "Bạn đang tiến bộ đấy, tiếp tục duy trì nhé!",
  "Sai không sao, quan trọng là bạn hiểu tại sao mình sai.",
  "Cùng AI luyện thêm một chút nhé!",
  "Mục tiêu CEFR của bạn đang chờ phía trước!",
  "Học đều mỗi ngày sẽ giúp bạn tiến xa hơn.",
  "Nào, cùng chinh phục thêm một bài học nữa nhé!"
];

export default function HeroBanner({ user }) {
  // Chọn ngẫu nhiên một câu động viên mỗi lần vào Dashboard hoặc refresh
  const randomMessage = useMemo(() => {
    return BIRD_MOTIVATIONAL_MESSAGES[
      Math.floor(Math.random() * BIRD_MOTIVATIONAL_MESSAGES.length)
    ];
  }, []);

  const displayName = user?.full_name || 'Lê Văn Thái';

  return (
    <div className="hero-banner dashboard-greeting-card">
      {/* Left Column: Greeting & Motivation */}
      <div className="dashboard-greeting-left">
        <div className="hero-tag">
          <i className="fa-solid fa-sparkles" style={{ color: '#0284c7' }}></i>
          <span>E-LEARNING AI ĐỒNG HÀNH CÙNG BẠN</span>
        </div>
        <h1 className="hero-title">
          Chào bạn, {displayName}!
        </h1>
        <p className="hero-desc">
          Hôm nay chúng ta tiếp tục chinh phục tiếng Anh nhé. Lộ trình thích ứng thông minh luôn sẵn sàng hỗ trợ bạn.
        </p>
      </div>

      {/* Right Column: Bird Mascot with Friendly Speech Bubble */}
      <div className="dashboard-mascot-wrapper">
        {/* Speech Bubble from Bird */}
        <div className="bird-message" title="Lời nhắn từ AI Companion">
          <span>{randomMessage}</span>
        </div>

        {/* Bird Mascot */}
        <div className="dashboard-bird-container">
          <img
            src={birdStudentImg}
            alt="Bird Student Mascot"
            className="dashboard-bird"
            onError={(e) => {
              e.target.src = '/Bird_Student.png';
            }}
          />
        </div>
      </div>
    </div>
  );
}

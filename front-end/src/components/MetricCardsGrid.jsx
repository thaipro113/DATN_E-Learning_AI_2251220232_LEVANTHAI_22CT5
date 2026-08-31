import React, { useState } from 'react';

export default function MetricCardsGrid({ learningPath, skillGaps, user }) {
  const [currentScore, setCurrentScore] = useState(650);
  const [targetScore, setTargetScore] = useState(800);

  return (
    <div className="metric-grid">
      {/* Card 1: ĐIỂM SỐ CỦA BẠN */}
      <div className="metric-card">
        <div className="metric-card-title">ĐIỂM SỐ CỦA BẠN</div>
        
        {/* Điểm hiện tại */}
        <div style={{ marginBottom: '14px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Điểm thi thử hiện tại (CEFR {user?.level || 'B1'})
          </span>
          <div className="metric-level-box">
            <button
              className="metric-btn-circle"
              onClick={() => setCurrentScore(Math.max(0, currentScore - 50))}
            >
              <i className="fa-solid fa-minus"></i>
            </button>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {currentScore}
            </span>
            <button
              className="metric-btn-circle"
              onClick={() => setCurrentScore(Math.min(990, currentScore + 50))}
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
            Bạn tự đánh giá — làm đề thi thử để tự cập nhật
          </span>
        </div>

        {/* Điểm mục tiêu */}
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Điểm mục tiêu (CEFR {learningPath?.target_level || 'B2'})
          </span>
          <div className="metric-level-box">
            <button
              className="metric-btn-circle"
              onClick={() => setTargetScore(Math.max(0, targetScore - 50))}
            >
              <i className="fa-solid fa-minus"></i>
            </button>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-primary)' }}>
              {targetScore}
            </span>
            <button
              className="metric-btn-circle"
              onClick={() => setTargetScore(Math.min(990, targetScore + 50))}
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
          <a
            href="#preset"
            style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: '600' }}
          >
            Đặt bằng preset [500/650/750/850/900] →
          </a>
        </div>
      </div>

      {/* Card 2: ĐIỂM CÒN THIẾU / PHÂN TÍCH KỸ NĂNG */}
      <div className="metric-card">
        <div className="metric-card-title">ĐIỂM CÒN THIẾU</div>
        <div className="donut-circle-container">
          <div className="donut-circle-ring">
            <i className="fa-solid fa-bullseye" style={{ color: '#e11d48' }}></i>
          </div>
          <span className="donut-label">
            {targetScore > currentScore ? `Còn thiếu ${targetScore - currentScore} điểm` : 'Đã đạt mục tiêu!'}
          </span>
        </div>
      </div>

      {/* Card 3: SỐ NGÀY ĐẾN NGÀY THI / LỘ TRÌNH AI */}
      <div className="metric-card">
        <div className="metric-card-title">SỐ NGÀY ĐẾN NGÀY THI</div>
        <div className="calendar-target-box">
          <div className="calendar-icon-soft">
            <i className="fa-regular fa-calendar-check" style={{ color: '#0284c7' }}></i>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Chưa đặt ngày thi
          </span>
          <button className="btn-set-date">
            <i className="fa-regular fa-calendar"></i>
            <span>Đặt ngày thi</span>
          </button>
        </div>
      </div>

      {/* Card 4: ĐỘNG LỰC HỌC */}
      <div className="metric-card">
        <div className="metric-card-title">ĐỘNG LỰC HỌC</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Chuỗi ngày */}
          <div className="motivation-item">
            <div className="motivation-icon-circle orange">
              <i className="fa-solid fa-fire"></i>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                Chuỗi ngày
              </span>
              <strong style={{ fontSize: '0.95rem', color: '#ea580c' }}>3 ngày</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', display: 'block' }}>
                Dài nhất 3 ngày
              </span>
            </div>
          </div>

          {/* XP trọn đời */}
          <div className="motivation-item">
            <div className="motivation-icon-circle cyan">
              <i className="fa-solid fa-bullseye"></i>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                XP trọn đời
              </span>
              <strong style={{ fontSize: '0.95rem', color: '#0891b2' }}>380 XP</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', display: 'block' }}>
                Tích lũy từ khi bắt đầu
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

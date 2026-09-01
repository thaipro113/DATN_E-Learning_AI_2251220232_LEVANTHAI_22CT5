import React, { useState } from 'react';

export default function MetricCardsGrid({ learningPath, skillGaps, user, onSelectTab }) {
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
          <span
            onClick={() => onSelectTab && onSelectTab('quizzes')}
            style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer' }}
          >
            Làm bài thi thử để cập nhật điểm →
          </span>
        </div>
      </div>

      {/* Card 2: ĐIỂM CÒN THIẾU / PHÂN TÍCH KỸ NĂNG (Click chuyển sang trang Lỗ hổng Kỹ năng) */}
      <div
        className="metric-card"
        onClick={() => onSelectTab && onSelectTab('skills')}
        style={{ cursor: 'pointer' }}
        title="Xem chi tiết phân tích lỗ hổng kỹ năng"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="metric-card-title">ĐIỂM CÒN THIẾU & KỸ NĂNG</div>
          <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}></i>
        </div>
        <div className="donut-circle-container">
          <div className="donut-circle-ring">
            <i className="fa-solid fa-bullseye" style={{ color: '#e11d48' }}></i>
          </div>
          <span className="donut-label" style={{ fontWeight: '700', color: '#0284c7' }}>
            {targetScore > currentScore ? `Còn thiếu ${targetScore - currentScore} điểm` : 'Đã đạt mục tiêu!'}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '2px' }}>
            Bấm để xem ma trận 6 kỹ năng →
          </span>
        </div>
      </div>

      {/* Card 3: SỐ NGÀY ĐẾN NGÀY THI / LỘ TRÌNH AI (Click chuyển sang Lộ trình AI) */}
      <div
        className="metric-card"
        onClick={() => onSelectTab && onSelectTab('path')}
        style={{ cursor: 'pointer' }}
        title="Xem chi tiết lộ trình thích ứng 5 chặng"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="metric-card-title">LỘ TRÌNH HỌC TẬP AI</div>
          <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}></i>
        </div>
        <div className="calendar-target-box">
          <div className="calendar-icon-soft">
            <i className="fa-solid fa-compass" style={{ color: '#6366f1' }}></i>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
            Đang học chặng 2/5 (40%)
          </span>
          <button className="btn-set-date" style={{ backgroundColor: '#6366f1' }}>
            <i className="fa-solid fa-route"></i>
            <span>Vào xem lộ trình</span>
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

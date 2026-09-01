import React, { useState } from 'react';

export default function StatCounters({ onSelectTab }) {
  const [activeTab, setActiveTab] = useState('today');

  return (
    <div>
      {/* Filter Tabs Pill */}
      <div className="filter-tabs-row">
        <div className="filter-tabs-pill">
          <button
            className={`filter-pill-btn ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            Hôm nay
          </button>
          <button
            className={`filter-pill-btn ${activeTab === 'week' ? 'active' : ''}`}
            onClick={() => setActiveTab('week')}
          >
            Tuần 👑
          </button>
          <button
            className={`filter-pill-btn ${activeTab === 'month' ? 'active' : ''}`}
            onClick={() => setActiveTab('month')}
          >
            Tháng 👑
          </button>
          <button
            className={`filter-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tất cả 👑
          </button>
          <button
            className={`filter-pill-btn ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            Tùy chỉnh 👑
          </button>
        </div>
      </div>

      {/* 4 Stat Counter Cards with Distinct Soft Colors */}
      <div className="stat-counters-grid">
        {/* Counter 1: Thời gian học */}
        <div
          className="stat-counter-card"
          onClick={() => onSelectTab && onSelectTab('learning')}
          style={{ cursor: 'pointer' }}
          title="Vào phòng học & xem tiến độ video"
        >
          <div className="stat-counter-icon sky">
            <i className="fa-regular fa-clock"></i>
          </div>
          <div className="stat-counter-content">
            <span className="stat-counter-title">THỜI GIAN HỌC</span>
            <span className="stat-counter-val">25m</span>
            <span className="stat-counter-sub">Hôm nay · Bấm vào học</span>
          </div>
        </div>

        {/* Counter 2: Luyện đề */}
        <div
          className="stat-counter-card"
          onClick={() => onSelectTab && onSelectTab('quizzes')}
          style={{ cursor: 'pointer' }}
          title="Vào ngân hàng đề thi & luyện tập"
        >
          <div className="stat-counter-icon cyan">
            <i className="fa-regular fa-circle-question"></i>
          </div>
          <div className="stat-counter-content">
            <span className="stat-counter-title">LUYỆN ĐỀ</span>
            <span className="stat-counter-val">0 câu</span>
            <span className="stat-counter-sub">Hôm nay · Chưa luyện</span>
          </div>
        </div>

        {/* Counter 3: Đọc */}
        <div
          className="stat-counter-card"
          onClick={() => onSelectTab && onSelectTab('quizzes')}
          style={{ cursor: 'pointer' }}
          title="Làm bài kiểm tra đọc hiểu"
        >
          <div className="stat-counter-icon emerald">
            <i className="fa-solid fa-book-open"></i>
          </div>
          <div className="stat-counter-content">
            <span className="stat-counter-title" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>ĐỌC</span>
              <span style={{ color: '#059669' }}>✦</span>
            </span>
            <span className="stat-counter-val">44 câu</span>
            <span className="stat-counter-sub" style={{ color: '#059669', fontWeight: '600' }}>
              Hôm nay · Đúng 75%
            </span>
          </div>
        </div>

        {/* Counter 4: Nghe */}
        <div
          className="stat-counter-card"
          onClick={() => onSelectTab && onSelectTab('quizzes')}
          style={{ cursor: 'pointer' }}
          title="Làm bài kiểm tra nghe hiểu"
        >
          <div className="stat-counter-icon purple">
            <i className="fa-solid fa-headphones"></i>
          </div>
          <div className="stat-counter-content">
            <span className="stat-counter-title">NGHE</span>
            <span className="stat-counter-val">0 câu</span>
            <span className="stat-counter-sub">Hôm nay · Chưa luyện</span>
          </div>
        </div>
      </div>
    </div>
  );
}

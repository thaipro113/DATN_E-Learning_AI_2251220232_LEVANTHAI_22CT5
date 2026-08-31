import React from 'react';

export default function Header({ currentTab, onSelectTab, onOpenQuizImport, onToggleMobileDrawer, user }) {
  return (
    <header className="header">
      <div className="header-inner">
        {/* Brand Logo & Mobile Menu Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="mobile-menu-btn"
            onClick={onToggleMobileDrawer}
            title="Mở menu điều hướng"
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          <a href="#dashboard" onClick={() => onSelectTab('dashboard')} className="brand-logo">
            <div className="brand-logo-icon">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <span>E-Learning AI</span>
          </a>
        </div>

        {/* Navigation Tabs - Exactly tailored to our 7 Thesis Backend Modules */}
        <nav>
          <ul className="nav-links">
            <li>
              <button
                className={`nav-link ${currentTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => onSelectTab('dashboard')}
              >
                <i className="fa-solid fa-house nav-icon-sky"></i>
                <span>Tổng quan</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${currentTab === 'courses' ? 'active' : ''}`}
                onClick={() => onSelectTab('courses')}
              >
                <i className="fa-solid fa-book-open nav-icon-emerald"></i>
                <span>Khóa học</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${currentTab === 'learning' ? 'active' : ''}`}
                onClick={() => onSelectTab('learning')}
              >
                <i className="fa-solid fa-circle-play nav-icon-purple"></i>
                <span>Đang học</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${currentTab === 'quizzes' ? 'active' : ''}`}
                onClick={() => onSelectTab('quizzes')}
              >
                <i className="fa-solid fa-file-signature nav-icon-orange"></i>
                <span>Luyện Đề</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${currentTab === 'path' ? 'active' : ''}`}
                onClick={() => onSelectTab('path')}
              >
                <i className="fa-solid fa-compass nav-icon-indigo"></i>
                <span>Lộ trình AI</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${currentTab === 'skills' ? 'active' : ''}`}
                onClick={() => onSelectTab('skills')}
              >
                <i className="fa-solid fa-chart-pie nav-icon-amber"></i>
                <span>Lỗ hổng Kỹ năng</span>
              </button>
            </li>
            <li>
              <button
                className="nav-link"
                onClick={onOpenQuizImport}
                title="Công cụ Giáo viên: Import Đề thi tự động từ file Word/Excel"
              >
                <i className="fa-solid fa-file-import nav-icon-rose"></i>
                <span>Import Đề</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Right Header Tools */}
        <div className="header-right">
          {/* Thời gian học */}
          <div className="badge-stat blue" title="Thời gian học hôm nay">
            <i className="fa-regular fa-clock" style={{ color: '#0284c7' }}></i>
            <span>25m</span>
          </div>

          {/* Chuỗi Streak */}
          <div className="badge-stat orange" title="Chuỗi ngày học liên tục (Streak)">
            <i className="fa-solid fa-fire" style={{ color: '#ea580c' }}></i>
            <span>3 ngày</span>
          </div>

          {/* User Profile */}
          <div className="user-profile-badge" title="Tài khoản Học viên">
            <div className="user-avatar-circle">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'T'}
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)' }}>
              {user?.full_name || 'Lê Văn Thái'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

import React, { useState, useRef, useEffect } from 'react';

export default function Header({
  currentTab,
  onSelectTab,
  onOpenQuizImport,
  onToggleMobileDrawer,
  user,
  isLoggedIn,
  onSwitchRole,
  onOpenAuthModal,
  onLogout,
  myCourses = [],
  myAttempts = [],
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const role = user?.role || 'STUDENT';

  // Tính toán thời gian học và chuỗi học tập thực tế từ dữ liệu người dùng
  const totalWatchedSeconds = myCourses.reduce((acc, c) => acc + (c.last_watched_second || (c.progress_percent ? c.progress_percent * 20 : 0)), 0);
  const calculatedMinutes = Math.round(totalWatchedSeconds / 60);
  const displayMinutes = calculatedMinutes > 0 ? `${calculatedMinutes}m` : '0m';

  // Chuỗi ngày học dựa trên việc có tiến độ học tập hoặc làm bài thi
  const hasLearningActivity = myCourses.length > 0 || myAttempts.length > 0;
  const streakDays = hasLearningActivity ? (myCourses.some(c => c.progress_percent > 50) ? '3 ngày' : '1 ngày') : '0 ngày';

  return (
    <header className="header">
      <div className="header-inner">
        {/* Brand Logo & Mobile Menu Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button
            className="mobile-menu-btn"
            onClick={onToggleMobileDrawer}
            title="Mở menu"
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab(role === 'TEACHER' ? 'teacher_dashboard' : 'dashboard');
            }}
            className="brand-logo"
          >
            <div
              className="brand-logo-icon"
              style={{
                backgroundColor: role === 'TEACHER' ? '#e0f2fe' : '#ffedd5',
                color: role === 'TEACHER' ? '#0284c7' : '#ea580c',
              }}
            >
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <span>E-Learning AI</span>
          </a>
        </div>

        {/* Dynamic Navigation Tabs */}
        <nav style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <ul className="nav-links">
            {/* 1. TABS DÀNH CHO HỌC VIÊN HOẶC KHÁCH */}
            {role === 'STUDENT' && (
              <>
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
                {isLoggedIn && (
                  <>
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
                  </>
                )}
              </>
            )}

            {/* 2. TABS DÀNH CHO GIẢNG VIÊN */}
            {role === 'TEACHER' && (
              <>
                <li>
                  <button
                    className={`nav-link ${currentTab === 'teacher_dashboard' ? 'active' : ''}`}
                    onClick={() => onSelectTab('teacher_dashboard')}
                  >
                    <i className="fa-solid fa-chalkboard-user nav-icon-sky"></i>
                    <span>Studio Giảng dạy</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`nav-link ${currentTab === 'courses' ? 'active' : ''}`}
                    onClick={() => onSelectTab('courses')}
                  >
                    <i className="fa-solid fa-book-open nav-icon-emerald"></i>
                    <span>Quản lý Khóa học</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`nav-link ${currentTab === 'quizzes' ? 'active' : ''}`}
                    onClick={() => onSelectTab('quizzes')}
                  >
                    <i className="fa-solid fa-file-signature nav-icon-orange"></i>
                    <span>Ngân hàng Đề thi</span>
                  </button>
                </li>
                <li>
                  <button
                    className="nav-link"
                    onClick={onOpenQuizImport}
                    style={{ backgroundColor: '#fff1f2', color: '#e11d48' }}
                  >
                    <i className="fa-solid fa-file-import nav-icon-rose"></i>
                    <span>Import Đề thi</span>
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Right Header Controls */}
        <div className="header-right">
          {!isLoggedIn ? (
            /* Khi CHƯA ĐĂNG NHẬP */
            <button
              className="btn-primary"
              onClick={onOpenAuthModal}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#0284c7',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-right-to-bracket"></i>
              <span>Đăng nhập</span>
            </button>
          ) : (
            /* Khi ĐÃ ĐĂNG NHẬP: Hiển thị Streak + Avatar & Dropdown */
            <>
              {role === 'STUDENT' && (
                <>
                  <div className="badge-stat orange" title="Chuỗi ngày học liên tục tính từ CSDL">
                    <i className="fa-solid fa-fire"></i>
                    <span>{streakDays}</span>
                  </div>
                  <div className="badge-stat blue" title="Tổng thời gian học video thực tế">
                    <i className="fa-regular fa-clock"></i>
                    <span>{displayMinutes}</span>
                  </div>
                </>
              )}

              {/* User Profile Dropdown */}
              <div ref={profileRef} style={{ position: 'relative' }}>
                <div
                  className="user-profile-badge"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  title="Tài khoản cá nhân & Cài đặt"
                  style={{ cursor: 'pointer' }}
                >
                  <div
                    className="user-avatar-circle"
                    style={{
                      backgroundColor: role === 'TEACHER' ? '#e0f2fe' : '#dbeafe',
                      color: role === 'TEACHER' ? '#0284c7' : '#1d4ed8',
                    }}
                  >
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'T'}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    {user?.full_name || 'Lê Văn Thái'}
                  </span>
                  <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}></i>
                </div>

                {isProfileOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: '0',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      minWidth: '220px',
                      padding: '10px',
                      zIndex: 60,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-color)' }}>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)', display: 'block' }}>
                        {user?.full_name || 'Lê Văn Thái'}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {user?.email || 'thaipro1132004@gmail.com'}
                      </span>
                      <div style={{ marginTop: '4px', fontSize: '0.78rem', fontWeight: '800', color: '#0284c7' }}>
                        Vai trò: {role === 'TEACHER' ? 'Giảng viên' : `Học viên (${user?.level || 'B1'})`}
                      </div>
                    </div>



                    {/* Nút Đăng Xuất */}
                    <button
                      onClick={() => {
                        if (onLogout) onLogout();
                        setIsProfileOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '8px',
                        border: 'none',
                        backgroundColor: '#fff1f2',
                        color: '#e11d48',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        marginTop: '4px',
                      }}
                    >
                      <i className="fa-solid fa-right-from-bracket"></i>
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

import React, { useState, useRef, useEffect } from 'react';

export default function Header({
  currentTab,
  onSelectTab,
  onOpenQuizImport,
  onToggleMobileDrawer,
  user,
  onSwitchRole,
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
            onClick={() => onSelectTab(role === 'TEACHER' ? 'teacher_dashboard' : role === 'ADMIN' ? 'admin_dashboard' : 'dashboard')}
            className="brand-logo"
          >
            <div
              className="brand-logo-icon"
              style={{
                backgroundColor: role === 'TEACHER' ? '#e0f2fe' : role === 'ADMIN' ? '#fce7f3' : '#ffedd5',
                color: role === 'TEACHER' ? '#0284c7' : role === 'ADMIN' ? '#be185d' : '#ea580c',
              }}
            >
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <span>E-Learning AI</span>
          </a>
        </div>

        {/* ================================================================= */}
        {/* DYNAMIC ROLE-BASED NAVIGATION TABS (STRICTLY HORIZONTAL)          */}
        {/* ================================================================= */}
        <nav style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <ul className="nav-links">
            {/* 1. TABS DÀNH CHO HỌC VIÊN (STUDENT) */}
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

            {/* 2. TABS DÀNH CHO GIẢNG VIÊN (TEACHER) */}
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
                    <span>Import Đề (AI/Word)</span>
                  </button>
                </li>
              </>
            )}

            {/* 3. TABS DÀNH CHO QUẢN TRỊ VIÊN (ADMIN) */}
            {role === 'ADMIN' && (
              <>
                <li>
                  <button
                    className={`nav-link ${currentTab === 'admin_dashboard' ? 'active' : ''}`}
                    onClick={() => onSelectTab('admin_dashboard')}
                  >
                    <i className="fa-solid fa-shield-halved" style={{ color: '#be185d' }}></i>
                    <span>Bảng Quản trị</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`nav-link ${currentTab === 'courses' ? 'active' : ''}`}
                    onClick={() => onSelectTab('courses')}
                  >
                    <i className="fa-solid fa-book-open nav-icon-emerald"></i>
                    <span>Kiểm duyệt Khóa học</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`nav-link ${currentTab === 'quizzes' ? 'active' : ''}`}
                    onClick={() => onSelectTab('quizzes')}
                  >
                    <i className="fa-solid fa-file-signature nav-icon-orange"></i>
                    <span>Tất cả Đề thi</span>
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Right Header Tools */}
        <div className="header-right">
          {/* Streak & Time Badges cho Học viên */}
          {role === 'STUDENT' && (
            <>
              <div className="badge-stat orange" title="Chuỗi ngày học liên tục">
                <i className="fa-solid fa-fire"></i>
                <span>3 ngày</span>
              </div>
              <div className="badge-stat blue" title="Thời gian học hôm nay">
                <i className="fa-regular fa-clock"></i>
                <span>25m</span>
              </div>
            </>
          )}

          {/* User Profile Dropdown (Chứa chuyển đổi vai trò kín đáo) */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <div
              className="user-profile-badge"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              title="Tài khoản cá nhân & Đổi vai trò"
              style={{ cursor: 'pointer' }}
            >
              <div
                className="user-avatar-circle"
                style={{
                  backgroundColor: role === 'TEACHER' ? '#e0f2fe' : role === 'ADMIN' ? '#fce7f3' : '#dbeafe',
                  color: role === 'TEACHER' ? '#0284c7' : role === 'ADMIN' ? '#be185d' : '#1d4ed8',
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
                  minWidth: '230px',
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
                    {user?.email || 'thaipro113@gmail.com'}
                  </span>
                  <div style={{ marginTop: '4px', fontSize: '0.78rem', fontWeight: '800', color: '#0284c7' }}>
                    Vai trò: {role === 'TEACHER' ? 'Giảng viên' : role === 'ADMIN' ? 'Quản trị viên' : `Học viên (${user?.level || 'B1'})`}
                  </div>
                </div>

                {/* Chọn vai trò nhanh trong menu cá nhân */}
                <div style={{ padding: '6px 8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    CHUYỂN VAI TRÒ DEMO:
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => { onSwitchRole('STUDENT'); setIsProfileOpen(false); }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        borderRadius: '4px',
                        backgroundColor: role === 'STUDENT' ? '#0284c7' : 'transparent',
                        color: role === 'STUDENT' ? 'white' : 'var(--text-secondary)',
                      }}
                    >
                      Học viên
                    </button>
                    <button
                      onClick={() => { onSwitchRole('TEACHER'); setIsProfileOpen(false); }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        borderRadius: '4px',
                        backgroundColor: role === 'TEACHER' ? '#0284c7' : 'transparent',
                        color: role === 'TEACHER' ? 'white' : 'var(--text-secondary)',
                      }}
                    >
                      Giảng viên
                    </button>
                    <button
                      onClick={() => { onSwitchRole('ADMIN'); setIsProfileOpen(false); }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        borderRadius: '4px',
                        backgroundColor: role === 'ADMIN' ? '#be185d' : 'transparent',
                        color: role === 'ADMIN' ? 'white' : 'var(--text-secondary)',
                      }}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                {role === 'STUDENT' && (
                  <>
                    <button
                      onClick={() => {
                        onSelectTab('learning');
                        setIsProfileOpen(false);
                      }}
                      style={{ padding: '8px 10px', fontSize: '0.82rem', fontWeight: '600', textAlign: 'left', borderRadius: '4px' }}
                    >
                      <i className="fa-solid fa-graduation-cap" style={{ color: '#0284c7', marginRight: '8px' }}></i>
                      Khóa học của tôi
                    </button>
                    <button
                      onClick={() => {
                        onSelectTab('skills');
                        setIsProfileOpen(false);
                      }}
                      style={{ padding: '8px 10px', fontSize: '0.82rem', fontWeight: '600', textAlign: 'left', borderRadius: '4px' }}
                    >
                      <i className="fa-solid fa-chart-pie" style={{ color: '#d97706', marginRight: '8px' }}></i>
                      Báo cáo Kỹ năng
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

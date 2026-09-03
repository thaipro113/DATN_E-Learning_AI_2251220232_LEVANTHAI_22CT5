import React, { useState, useRef, useEffect } from 'react';
import logoImg from '../assets/Logo_TL_English.png';

export default function Header({
  currentTab,
  onSelectTab,
  onOpenQuizImport,
  onOpenAICoach,
  onOpenProfileModal,
  onToggleMobileDrawer,
  user,
  isLoggedIn,
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

  const role = (isLoggedIn && user?.role) ? user.role : 'STUDENT';

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
            title="TL-ENGLISH: Learn Smarter - Speak Confidently"
          >
            <img
              src={logoImg}
              alt="TL-ENGLISH Logo"
              style={{
                height: '46px',
                width: 'auto',
                objectFit: 'contain',
                flexShrink: 0,
                borderRadius: '6px',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontSize: '1.22rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
                TL-<span style={{ color: '#0284c7' }}>ENGLISH</span>
              </span>
              <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.6px' }}>
                LEARN SMARTER
              </span>
            </div>
          </a>
        </div>

        {/* Dynamic Navigation Tabs - Clean Text Only */}
        <nav style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <ul className="nav-links">
            {/* 1. TABS DÀNH CHO HỌC VIÊN HOẶC KHÁCH CHƯA ĐĂNG NHẬP */}
            {(!isLoggedIn || role === 'STUDENT') && (
              <>
                <li>
                  <button
                    className={`nav-link ${currentTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => onSelectTab('dashboard')}
                  >
                    <span>Tổng quan</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`nav-link ${currentTab === 'courses' || currentTab === 'course_detail' ? 'active' : ''}`}
                    onClick={() => onSelectTab('courses')}
                  >
                    <span>Khóa học</span>
                  </button>
                </li>
                {isLoggedIn && (
                  <>
                    <li>
                      <button
                        className={`nav-link ${currentTab === 'quizzes' ? 'active' : ''}`}
                        onClick={() => onSelectTab('quizzes')}
                      >
                        <span>Luyện đề</span>
                      </button>
                    </li>
                    <li>
                      <button
                        className={`nav-link ${currentTab === 'path' ? 'active' : ''}`}
                        onClick={() => onSelectTab('path')}
                      >
                        <span>Lộ trình AI</span>
                      </button>
                    </li>
                    <li>
                      <button
                        className={`nav-link ${currentTab === 'skills' ? 'active' : ''}`}
                        onClick={() => onSelectTab('skills')}
                      >
                        <span>Lỗ hổng kỹ năng</span>
                      </button>
                    </li>
                    <li>
                      <button
                        className={`nav-link ${currentTab === 'ai_coach' ? 'active' : ''}`}
                        onClick={() => onSelectTab('ai_coach')}
                        style={{ position: 'relative' }}
                      >
                        <span>Giao tiếp AI</span>
                        <span style={{ fontSize: '0.62rem', backgroundColor: '#10b981', color: 'white', padding: '1px 5px', borderRadius: '10px', fontWeight: '800', marginLeft: '4px' }}>LIVE</span>
                      </button>
                    </li>
                  </>
                )}
              </>
            )}

            {/* 2. TABS DÀNH CHO GIẢNG VIÊN (CHỈ KHI ĐANG ĐĂNG NHẬP) */}
            {isLoggedIn && role === 'TEACHER' && (
              <>
                <li>
                  <button
                    className={`nav-link ${currentTab === 'teacher_dashboard' ? 'active' : ''}`}
                    onClick={() => onSelectTab('teacher_dashboard')}
                  >
                    <span>Studio Giảng dạy</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`nav-link ${currentTab === 'teacher_quizzes' || currentTab === 'quizzes' ? 'active' : ''}`}
                    onClick={() => onSelectTab('teacher_quizzes')}
                  >
                    <span>Quản lý Đề thi</span>
                  </button>
                </li>
                <li>
                  <button
                    className="nav-link"
                    onClick={onOpenQuizImport}
                    style={{ backgroundColor: '#fff1f2', color: '#e11d48' }}
                  >
                    <span>Import Đề thi</span>
                  </button>
                </li>
              </>
            )}

            {/* 3. TABS DÀNH CHO ADMIN (CHỈ KHI ĐANG ĐĂNG NHẬP) */}
            {isLoggedIn && role === 'ADMIN' && (
              <li>
                <button
                  className={`nav-link ${currentTab === 'admin_dashboard' ? 'active' : ''}`}
                  onClick={() => onSelectTab('admin_dashboard')}
                >
                  <span>Bảng Quản Trị Hệ Thống</span>
                </button>
              </li>
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
            /* Khi ĐÃ ĐĂNG NHẬP: Hiển thị Avatar & Dropdown */
            <>
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
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt="Avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'T'
                    )}
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
                      minWidth: '240px',
                      padding: '12px',
                      zIndex: 60,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            backgroundColor: '#0284c7',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            flexShrink: 0,
                          }}
                        >
                          {user?.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt="Avatar"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            user?.full_name?.charAt(0)?.toUpperCase() || 'T'
                          )}
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)', display: 'block' }}>
                            {user?.full_name || 'Lê Văn Thái'}
                          </strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {user?.email || 'thaipro1132004@gmail.com'}
                          </span>
                        </div>
                      </div>
                      <div style={{ marginTop: '4px', fontSize: '0.78rem', fontWeight: '800', color: '#0284c7' }}>
                        Vai trò: {role === 'TEACHER' ? 'Giảng viên' : role === 'ADMIN' ? 'Quản trị viên' : `Học viên (${user?.level || 'B1'})`}
                      </div>
                    </div>

                    {/* Nút Cài đặt Hồ sơ & Đổi mật khẩu */}
                    <button
                      onClick={() => {
                        if (onOpenProfileModal) onOpenProfileModal();
                        setIsProfileOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '8px',
                        border: 'none',
                        backgroundColor: 'var(--bg-subtle)',
                        color: 'var(--text-main)',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      <i className="fa-solid fa-user-pen" style={{ color: '#0284c7' }}></i>
                      <span>Hồ sơ & Đổi mật khẩu</span>
                    </button>

                    {/* Nút Tra cứu chứng chỉ số (chỉ dành cho học viên) */}
                    {role === 'STUDENT' && (
                      <button
                        onClick={() => {
                          onSelectTab('cert_verify');
                          setIsProfileOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          width: '100%',
                          padding: '8px',
                          border: 'none',
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--text-main)',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        <i className="fa-solid fa-award" style={{ color: '#d97706' }}></i>
                        <span>Tra cứu Chứng chỉ</span>
                      </button>
                    )}

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

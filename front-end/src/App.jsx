import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import MetricCardsGrid from './components/MetricCardsGrid';
import StatCounters from './components/StatCounters';
import RecommendedCoursesSection from './components/RecommendedCoursesSection';
import CourseCatalogView from './components/CourseCatalogView';
import MyLearningView from './components/MyLearningView';
import QuizExamView from './components/QuizExamView';
import AdaptivePathView from './components/AdaptivePathView';
import SkillGapsView from './components/SkillGapsView';
import TeacherDashboardView from './components/TeacherDashboardView';
import AdminDashboardView from './components/AdminDashboardView';
import FloatingAITutor from './components/FloatingAITutor';
import QuizImportModal from './components/QuizImportModal';
import MobileBottomNav from './components/MobileBottomNav';
import AuthModal from './components/AuthModal';
import { recommendationAPI, courseAPI } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isQuizImportOpen, setIsQuizImportOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Trạng thái Đăng nhập (Mặc định ban đầu chưa đăng nhập -> hiển thị nút Đăng nhập)
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return Boolean(localStorage.getItem('access_token'));
  });

  // User state with Role (STUDENT / TEACHER / ADMIN)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user_info');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        // Fallback
      }
    }
    return {
      full_name: 'Lê Văn Thái',
      email: 'thaipro1132004@gmail.com',
      role: 'STUDENT',
      level: 'B1',
    };
  });

  // Learning Path state
  const [learningPath, setLearningPath] = useState({
    title: 'Lộ trình Chinh phục B2 Upper-Intermediate',
    target_level: 'B2',
    progress_percentage: 40,
    total_steps: 5,
    completed_steps: 2,
  });

  // Skill Gaps state
  const [skillGaps, setSkillGaps] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [courses, setCourses] = useState([]);

  // Fetch initial data from backend if available
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pathRes, gapsRes, recsRes, coursesRes] = await Promise.allSettled([
          recommendationAPI.getMyLearningPath(),
          recommendationAPI.getSkillGaps(),
          recommendationAPI.getRecommendedCourses(),
          courseAPI.getCourses(),
        ]);

        if (pathRes.status === 'fulfilled' && pathRes.value.data?.data) {
          setLearningPath(pathRes.value.data.data);
        }
        if (gapsRes.status === 'fulfilled' && gapsRes.value.data?.data) {
          setSkillGaps(gapsRes.value.data.data);
        }
        if (recsRes.status === 'fulfilled' && recsRes.value.data?.data) {
          setRecommendations(recsRes.value.data.data);
        }
        if (coursesRes.status === 'fulfilled' && coursesRes.value.data?.data?.results) {
          setCourses(coursesRes.value.data.data.results);
        }
      } catch (e) {
        console.log('Backend data connection ready.');
      }
    };
    fetchData();
  }, [isLoggedIn]);

  // Xử lý Đăng nhập thành công
  const handleLoginSuccess = (loggedInUser) => {
    setIsLoggedIn(true);
    setUser(loggedInUser);
    localStorage.setItem('user_info', JSON.stringify(loggedInUser));

    if (loggedInUser.role === 'TEACHER') {
      setCurrentTab('teacher_dashboard');
    } else if (loggedInUser.role === 'ADMIN') {
      setCurrentTab('admin_dashboard');
    } else {
      setCurrentTab('dashboard');
    }
  };

  // Xử lý Đăng xuất
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    setCurrentTab('dashboard');
  };

  // Chuyển đổi vai trò linh hoạt
  const handleSwitchRole = (newRole) => {
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    localStorage.setItem('user_info', JSON.stringify(updatedUser));

    if (newRole === 'TEACHER') {
      setCurrentTab('teacher_dashboard');
    } else if (newRole === 'ADMIN') {
      setCurrentTab('admin_dashboard');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleEnrollCourse = (course) => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    alert(`Bạn đã ghi danh thành công khóa học: ${course.title}!`);
    setCurrentTab('learning');
  };

  const handleSelectTab = (tab) => {
    if (!isLoggedIn && (tab === 'learning' || tab === 'path' || tab === 'skills')) {
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentTab(tab);
    setIsMobileDrawerOpen(false);
  };

  return (
    <div className="app-container">
      {/* 1. Header Bar with Dynamic Role Navigation & Login / Profile controls */}
      <Header
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenQuizImport={() => {
          setIsQuizImportOpen(true);
          setIsMobileDrawerOpen(false);
        }}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        user={user}
        isLoggedIn={isLoggedIn}
        onSwitchRole={handleSwitchRole}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Mobile Drawer Menu */}
      <div
        className={`mobile-drawer-overlay ${isMobileDrawerOpen ? 'open' : ''}`}
        onClick={() => setIsMobileDrawerOpen(false)}
      />
      <div className={`mobile-drawer ${isMobileDrawerOpen ? 'open' : ''}`}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
              <div className="brand-logo-icon" style={{ width: '30px', height: '30px', fontSize: '0.9rem' }}>
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
              <span>E-Learning AI</span>
            </div>
            <button onClick={() => setIsMobileDrawerOpen(false)} style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Mobile Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className={`nav-link ${currentTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleSelectTab('dashboard')}>
              <i className="fa-solid fa-house nav-icon-sky"></i>
              <span>Tổng quan</span>
            </button>
            <button className={`nav-link ${currentTab === 'courses' ? 'active' : ''}`} onClick={() => handleSelectTab('courses')}>
              <i className="fa-solid fa-book-open nav-icon-emerald"></i>
              <span>Khóa học</span>
            </button>

            {isLoggedIn && user.role === 'STUDENT' && (
              <>
                <button className={`nav-link ${currentTab === 'learning' ? 'active' : ''}`} onClick={() => handleSelectTab('learning')}>
                  <i className="fa-solid fa-circle-play nav-icon-purple"></i>
                  <span>Đang học</span>
                </button>
                <button className={`nav-link ${currentTab === 'quizzes' ? 'active' : ''}`} onClick={() => handleSelectTab('quizzes')}>
                  <i className="fa-solid fa-file-signature nav-icon-orange"></i>
                  <span>Luyện đề</span>
                </button>
                <button className={`nav-link ${currentTab === 'path' ? 'active' : ''}`} onClick={() => handleSelectTab('path')}>
                  <i className="fa-solid fa-compass nav-icon-indigo"></i>
                  <span>Lộ trình AI</span>
                </button>
                <button className={`nav-link ${currentTab === 'skills' ? 'active' : ''}`} onClick={() => handleSelectTab('skills')}>
                  <i className="fa-solid fa-chart-pie" style={{ color: '#d97706' }}></i>
                  <span>Lỗ hổng Kỹ năng</span>
                </button>
              </>
            )}

            {isLoggedIn && user.role === 'TEACHER' && (
              <>
                <button className={`nav-link ${currentTab === 'teacher_dashboard' ? 'active' : ''}`} onClick={() => handleSelectTab('teacher_dashboard')}>
                  <i className="fa-solid fa-chalkboard-user nav-icon-sky"></i>
                  <span>Studio Giảng dạy</span>
                </button>
                <button className={`nav-link ${currentTab === 'quizzes' ? 'active' : ''}`} onClick={() => handleSelectTab('quizzes')}>
                  <i className="fa-solid fa-file-signature nav-icon-orange"></i>
                  <span>Ngân hàng Đề thi</span>
                </button>
                <button className="nav-link" onClick={() => { setIsQuizImportOpen(true); setIsMobileDrawerOpen(false); }}>
                  <i className="fa-solid fa-file-import nav-icon-rose"></i>
                  <span>Import Đề thi</span>
                </button>
              </>
            )}

            {isLoggedIn && user.role === 'ADMIN' && (
              <>
                <button className={`nav-link ${currentTab === 'admin_dashboard' ? 'active' : ''}`} onClick={() => handleSelectTab('admin_dashboard')}>
                  <i className="fa-solid fa-shield-halved" style={{ color: '#be185d' }}></i>
                  <span>Bảng Quản trị</span>
                </button>
                <button className={`nav-link ${currentTab === 'quizzes' ? 'active' : ''}`} onClick={() => handleSelectTab('quizzes')}>
                  <i className="fa-solid fa-file-signature nav-icon-orange"></i>
                  <span>Đề thi toàn trường</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Drawer Bottom Login / Logout */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {!isLoggedIn ? (
            <button
              onClick={() => {
                setIsAuthModalOpen(true);
                setIsMobileDrawerOpen(false);
              }}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.88rem' }}
            >
              <i className="fa-solid fa-right-to-bracket"></i>
              <span>Đăng nhập hệ thống</span>
            </button>
          ) : (
            <button
              onClick={() => {
                handleLogout();
                setIsMobileDrawerOpen(false);
              }}
              className="btn-outline"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.88rem', color: '#dc2626' }}
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              <span>Đăng xuất ({user.full_name})</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Content Area */}
      <main className="main-content">
        {/* ==================== A. STUDENT / GUEST VIEWS ==================== */}
        {(!isLoggedIn || user.role === 'STUDENT') && (
          <>
            {currentTab === 'dashboard' && (
              <>
                <HeroBanner onExploreClick={() => setCurrentTab('courses')} />
                <MetricCardsGrid onOpenSkills={() => handleSelectTab('skills')} onOpenPath={() => handleSelectTab('path')} />
                <StatCounters onSelectTab={handleSelectTab} />
                <RecommendedCoursesSection recommendations={recommendations} onEnroll={handleEnrollCourse} />
              </>
            )}

            {currentTab === 'courses' && (
              <CourseCatalogView courses={courses} onEnroll={handleEnrollCourse} />
            )}

            {currentTab === 'learning' && (
              <MyLearningView user={user} />
            )}

            {currentTab === 'quizzes' && (
              <QuizExamView />
            )}

            {currentTab === 'path' && (
              <AdaptivePathView learningPath={learningPath} onNavigateToCourse={() => setCurrentTab('learning')} />
            )}

            {currentTab === 'skills' && (
              <SkillGapsView skillGaps={skillGaps} onNavigateToPath={() => setCurrentTab('path')} />
            )}
          </>
        )}

        {/* ==================== B. TEACHER VIEWS ==================== */}
        {isLoggedIn && user.role === 'TEACHER' && (
          <>
            {currentTab === 'teacher_dashboard' && (
              <TeacherDashboardView onOpenQuizImport={() => setIsQuizImportOpen(true)} />
            )}

            {currentTab === 'courses' && (
              <CourseCatalogView courses={courses} onEnroll={handleEnrollCourse} />
            )}

            {currentTab === 'quizzes' && (
              <QuizExamView />
            )}
          </>
        )}

        {/* ==================== C. ADMIN VIEWS ==================== */}
        {isLoggedIn && user.role === 'ADMIN' && (
          <>
            {currentTab === 'admin_dashboard' && (
              <AdminDashboardView />
            )}

            {currentTab === 'courses' && (
              <CourseCatalogView courses={courses} onEnroll={handleEnrollCourse} />
            )}

            {currentTab === 'quizzes' && (
              <QuizExamView />
            )}
          </>
        )}
      </main>

      {/* 3. Floating Interactive AI English Tutor Widget */}
      <FloatingAITutor userLevel={user.level} />

      {/* 4. Quiz Import Tool Modal for Teachers */}
      <QuizImportModal
        isOpen={isQuizImportOpen}
        onClose={() => setIsQuizImportOpen(false)}
      />

      {/* 5. Authentication Modal with Quick-Fill Demo */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 6. Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        role={isLoggedIn ? user.role : 'STUDENT'}
      />
    </div>
  );
}

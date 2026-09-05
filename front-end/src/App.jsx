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
import TeacherQuizManagerView from './components/TeacherQuizManagerView';
import FloatingAITutor from './components/FloatingAITutor';
import QuizImportModal from './components/QuizImportModal';
import MobileBottomNav from './components/MobileBottomNav';
import AuthModal from './components/AuthModal';
import UserProfileModal from './components/UserProfileModal';
import AuthPageView from './components/AuthPageView';
import UserProfileView from './components/UserProfileView';
import CertificateVerifyView from './components/CertificateVerifyView';
import GuestUdemyHomeView from './components/GuestUdemyHomeView';
import CourseDetailModal from './components/CourseDetailModal';
import CourseDetailFullView from './components/CourseDetailFullView';
import PaymentCheckoutModal from './components/PaymentCheckoutModal';
import AdminDashboardView from './components/AdminDashboardView';
import AICommunicationView from './components/AICommunicationView';
import Footer from './components/Footer';
import FloatingContactWidget from './components/FloatingContactWidget';
import { cleanCourseTitle } from './utils/media';
import { authAPI, recommendationAPI, courseAPI, learningAPI, assessmentAPI } from './services/api';

export default function App() {
  // Phân tích URL hash (hỗ trợ cả các tab chính và đường dẫn trực tiếp #/courses/:slug)
  const parseHash = () => {
    const rawHash = window.location.hash.replace('#/', '').replace('#', '');
    if (rawHash.startsWith('courses/') || rawHash.startsWith('course/')) {
      const slug = rawHash.replace(/^(courses|course)\//, '');
      return { tab: 'course_detail', slug };
    }
    const validTabs = [
      'dashboard', 'courses', 'learning', 'quizzes', 'path', 'skills', 
      'ai_coach', 'teacher_dashboard', 'teacher_quizzes', 'admin_dashboard', 
      'cert_verify', 'login', 'register', 'profile'
    ];
    return { tab: validTabs.includes(rawHash) ? rawHash : 'dashboard', slug: null };
  };

  const initialRoute = parseHash();
  const [currentTab, setCurrentTab] = useState(() => {
    const savedUser = localStorage.getItem('user_info');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u.role === 'ADMIN' && (initialRoute.tab === 'dashboard' || !initialRoute.tab)) {
          return 'admin_dashboard';
        }
      } catch (e) {}
    }
    return initialRoute.tab;
  });
  const [courseSlug, setCourseSlug] = useState(initialRoute.slug);
  const [isQuizImportOpen, setIsQuizImportOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Khóa học đang chọn để học trong MyLearningView
  const [selectedCourseToLearn, setSelectedCourseToLearn] = useState(null);

  // Khóa học đang thanh toán (Paid courses)
  const [checkoutCourse, setCheckoutCourse] = useState(null);

  // Khóa học đang chờ ghi danh sau khi đăng nhập
  const [pendingEnrollCourse, setPendingEnrollCourse] = useState(null);

  // Modal Chi tiết khóa học
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAICoachOpen, setIsAICoachOpen] = useState(false);

  // Trạng thái Đăng nhập từ localStorage Token
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return Boolean(localStorage.getItem('access_token'));
  });

  // User Profile
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user_info');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {}
    }
    return {
      full_name: 'Lê Văn Thái',
      email: 'thaipro1132004@gmail.com',
      role: 'STUDENT',
      level: 'B1',
    };
  });

  // Tự động kiểm tra và đồng bộ Profile từ CSDL mỗi khi F5 / mở lại trang
  useEffect(() => {
    const syncUserProfileOnLoad = async () => {
      const token = localStorage.getItem('access_token');
      if (token && !token.startsWith('demo_token')) {
        try {
          const res = await authAPI.getProfile();
          const liveUser = res.data?.data || res.data;
          if (liveUser) {
            setUser(liveUser);
            setIsLoggedIn(true);
            localStorage.setItem('user_info', JSON.stringify(liveUser));
            if (liveUser.role === 'ADMIN' && (window.location.hash === '#/dashboard' || window.location.hash === '#dashboard' || !window.location.hash)) {
              setCurrentTab('admin_dashboard');
            }
          }
        } catch (err) {
          if (err.response?.status === 401) {
            handleLogout();
          }
        }
      } else if (token) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    };

    syncUserProfileOnLoad();
  }, []);

  // Dữ liệu SỐNG từ Database PostgreSQL
  const [learningPath, setLearningPath] = useState(null);
  const [skillGaps, setSkillGaps] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);

  // Đồng bộ Hash URL và ngắt phát âm Speech Synthesis khi tab thay đổi
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (currentTab === 'course_detail' && courseSlug) {
      window.location.hash = `#/courses/${courseSlug}`;
    } else {
      window.location.hash = `#/${currentTab}`;
    }
  }, [currentTab, courseSlug]);

  useEffect(() => {
    const handleHashChange = () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      const { tab, slug } = parseHash();
      setCurrentTab(tab);
      setCourseSlug(slug);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch toàn bộ dữ liệu thật từ Backend API
  const fetchAllLiveData = async () => {
    try {
      const [pathRes, gapsRes, recsRes, coursesRes, myCoursesRes, attemptsRes] = await Promise.allSettled([
        recommendationAPI.getMyLearningPath(),
        recommendationAPI.getSkillGaps(),
        recommendationAPI.getRecommendedCourses(),
        courseAPI.getCourses(),
        learningAPI.getMyCourses(),
        assessmentAPI.getMyAttempts(),
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
      if (coursesRes.status === 'fulfilled' && coursesRes.value.data) {
        const resList = coursesRes.value.data.results || coursesRes.value.data.data?.results || coursesRes.value.data.data || coursesRes.value.data;
        if (Array.isArray(resList)) {
          setCourses(resList);
        }
      }
      if (myCoursesRes.status === 'fulfilled' && myCoursesRes.value.data) {
        const myList =
          myCoursesRes.value.data.results ||
          myCoursesRes.value.data.data?.results ||
          myCoursesRes.value.data.data ||
          myCoursesRes.value.data;
        if (Array.isArray(myList)) {
          setMyCourses(myList);
        }
      }
      if (attemptsRes.status === 'fulfilled' && attemptsRes.value.data?.data) {
        setMyAttempts(attemptsRes.value.data.data);
      }
    } catch (e) {
      console.log('API loaded with fallback state.');
    }
  };

  useEffect(() => {
    fetchAllLiveData();
  }, [isLoggedIn, user?.level]);

  // Xử lý Ghi danh / Mua khóa học
  const handleEnrollCourse = async (course) => {
    if (!isLoggedIn) {
      setPendingEnrollCourse(course);
      setIsAuthModalOpen(true);
      return;
    }

    // Nếu khóa học có phí -> Mở Checkout modal
    const isFree = course.is_free || Number(course.price) === 0;
    if (!isFree) {
      setCheckoutCourse(course);
      return;
    }

    // Khóa học miễn phí -> Ghi danh và vào học ngay lập tức
    try {
      await learningAPI.enrollCourse(course.id);
    } catch (e) {}

    setSelectedCourseToLearn(course);
    setCurrentTab('learning');
    fetchAllLiveData();
  };

  // Xử lý Thanh toán thành công cho khóa học có phí
  const handlePaymentSuccess = async (course) => {
    try {
      await learningAPI.enrollCourse(course.id);
    } catch (e) {}

    setSelectedCourseToLearn(course);
    setCurrentTab('learning');
    fetchAllLiveData();
  };

  // Chuyển thẳng vào phòng học của khóa học đó
  const handleNavigateToLearning = (course) => {
    setSelectedCourseToLearn(course);
    setCurrentTab('learning');
  };

  // Xử lý Đăng nhập thành công
  const handleLoginSuccess = async (loggedInUser) => {
    setIsLoggedIn(true);
    setUser(loggedInUser);
    localStorage.setItem('user_info', JSON.stringify(loggedInUser));

    // Nếu trước đó người dùng bấm Ghi danh khi chưa đăng nhập
    if (pendingEnrollCourse) {
      const courseToEnroll = pendingEnrollCourse;
      setPendingEnrollCourse(null);

      const isFree = courseToEnroll.is_free || Number(courseToEnroll.price) === 0;
      if (!isFree) {
        setCheckoutCourse(courseToEnroll);
      } else {
        try {
          await learningAPI.enrollCourse(courseToEnroll.id);
        } catch (e) {}
        setSelectedCourseToLearn(courseToEnroll);
        setCurrentTab('learning');
      }
    } else {
      if (loggedInUser.role === 'ADMIN') {
        setCurrentTab('admin_dashboard');
      } else if (loggedInUser.role === 'TEACHER') {
        setCurrentTab('teacher_dashboard');
      } else {
        setCurrentTab('dashboard');
      }
    }
    fetchAllLiveData();
  };

  // Xử lý Đăng xuất
  const handleLogout = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsLoggedIn(false);
    setUser(null);
    setMyCourses([]);
    setMyAttempts([]);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    setCurrentTab('dashboard');
  };

  // Chuyển đổi vai trò
  const handleSwitchRole = (newRole) => {
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    localStorage.setItem('user_info', JSON.stringify(updatedUser));

    if (newRole === 'ADMIN') {
      setCurrentTab('admin_dashboard');
    } else if (newRole === 'TEACHER') {
      setCurrentTab('teacher_dashboard');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleSelectTab = (tab) => {
    if (!isLoggedIn && (tab === 'learning' || tab === 'path' || tab === 'skills')) {
      setIsAuthModalOpen(true);
      return;
    }
    const targetTab = (user?.role === 'ADMIN' && tab === 'dashboard') ? 'admin_dashboard' : tab;
    setCurrentTab(targetTab);
    setIsMobileDrawerOpen(false);
  };

  const handleOpenCourseDetail = (course) => {
    setSelectedCourseForDetail(course);
    setIsDetailModalOpen(true);
  };

  // Tên hiển thị của Tab cho Breadcrumbs
  const tabNames = {
    dashboard: 'Tổng quan',
    courses: 'Danh mục Khóa học',
    learning: 'Đang học',
    quizzes: 'Luyện Đề Thi',
    path: 'Luyện Lỗi Sai AI',
    skills: 'Luyện Lỗi Sai AI',
    ai_coach: 'Phòng Luyện Giao Tiếp AI',
    teacher_dashboard: 'Studio Giảng dạy',
    teacher_quizzes: 'Quản lý Đề thi',
    admin_dashboard: 'Quản trị Hệ thống',
    cert_verify: 'Tra cứu Chứng chỉ số',
    login: 'Đăng nhập',
    register: 'Đăng ký tài khoản',
    profile: 'Hồ sơ cá nhân',
  };

  // Tự động chuyển hướng nếu vào #/login hoặc #/register khi ĐÃ ĐĂNG NHẬP
  useEffect(() => {
    if (isLoggedIn && (currentTab === 'login' || currentTab === 'register')) {
      handleSelectTab(user?.role === 'TEACHER' ? 'teacher_dashboard' : user?.role === 'ADMIN' ? 'admin_dashboard' : 'dashboard');
    }
  }, [isLoggedIn, currentTab, user?.role]);

  // Tự động chuyển hướng đến #/login nếu vào #/profile hoặc #/cert_verify khi CHƯA ĐĂNG NHẬP
  useEffect(() => {
    if (!isLoggedIn && (currentTab === 'profile' || currentTab === 'cert_verify')) {
      handleSelectTab('login');
    }
  }, [isLoggedIn, currentTab]);

  return (
    <div className="app-container">
      {/* 1. Header Navigation Bar */}
      <Header
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenQuizImport={() => {
          setIsQuizImportOpen(true);
          setIsMobileDrawerOpen(false);
        }}
        onOpenAICoach={() => setIsAICoachOpen(true)}
        onOpenProfileModal={() => handleSelectTab('profile')}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        user={user}
        isLoggedIn={isLoggedIn}
        onSwitchRole={handleSwitchRole}
        onOpenAuthModal={(mode = 'login') => handleSelectTab(mode === 'register' ? 'register' : 'login')}
        onLogout={handleLogout}
        myCourses={myCourses}
        myAttempts={myAttempts}
      />

      {/* Mobile Drawer Menu */}
      <div
        className={`mobile-drawer-overlay ${isMobileDrawerOpen ? 'open' : ''}`}
        onClick={() => setIsMobileDrawerOpen(false)}
      />

      <div className={`mobile-drawer ${isMobileDrawerOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#ffedd5',
                  color: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                }}
              >
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
              <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>TL-ENGLISH</strong>
            </div>

            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              style={{ fontSize: '1.2rem', color: 'var(--text-muted)', padding: '4px', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Mobile Links - Clean Text Only */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className={`nav-link ${currentTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleSelectTab('dashboard')}>
              <span>Tổng quan</span>
            </button>
            <button className={`nav-link ${currentTab === 'courses' ? 'active' : ''}`} onClick={() => handleSelectTab('courses')}>
              <span>Khóa học</span>
            </button>

            {isLoggedIn && user.role === 'STUDENT' && (
              <>
                <button className={`nav-link ${currentTab === 'quizzes' ? 'active' : ''}`} onClick={() => handleSelectTab('quizzes')}>
                  <span>Luyện đề</span>
                </button>
                <button className={`nav-link ${currentTab === 'path' || currentTab === 'skills' ? 'active' : ''}`} onClick={() => handleSelectTab('path')}>
                  <span>Luyện Lỗi Sai AI</span>
                </button>
                <button className={`nav-link ${currentTab === 'ai_coach' ? 'active' : ''}`} onClick={() => handleSelectTab('ai_coach')}>
                  <span>Giao tiếp AI</span>
                </button>
              </>
            )}

            {isLoggedIn && user.role === 'TEACHER' && (
              <>
                <button className={`nav-link ${currentTab === 'teacher_dashboard' ? 'active' : ''}`} onClick={() => handleSelectTab('teacher_dashboard')}>
                  <span>Studio Giảng dạy</span>
                </button>
                <button className={`nav-link ${currentTab === 'teacher_quizzes' || currentTab === 'quizzes' ? 'active' : ''}`} onClick={() => handleSelectTab('teacher_quizzes')}>
                  <span>Quản lý Đề thi</span>
                </button>
                <button className="nav-link" onClick={() => { setIsQuizImportOpen(true); setIsMobileDrawerOpen(false); }}>
                  <span>Import Đề thi</span>
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
                handleSelectTab('login');
                setIsMobileDrawerOpen(false);
              }}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.88rem' }}
            >
              <i className="fa-solid fa-right-to-bracket"></i>
              <span>Đăng nhập hệ thống</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  handleSelectTab('profile');
                  setIsMobileDrawerOpen(false);
                }}
                className="btn-outline"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <i className="fa-regular fa-user"></i>
                <span>Hồ sơ cá nhân</span>
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileDrawerOpen(false);
                }}
                className="btn-outline"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.88rem', color: '#dc2626' }}
              >
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
                <span>Đăng xuất ({user.full_name})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Main Content Area */}
      <main className={`main-content ${currentTab === 'admin_dashboard' || (user?.role === 'ADMIN' && currentTab === 'dashboard') ? 'full-width-admin' : ''}`}>
        {/* Breadcrumb Bar with Back Button when in Subviews */}
        {currentTab !== 'dashboard' && currentTab !== 'teacher_dashboard' && currentTab !== 'admin_dashboard' && currentTab !== 'course_detail' && currentTab !== 'login' && currentTab !== 'register' && currentTab !== 'profile' && !(user?.role === 'ADMIN' && currentTab === 'dashboard') && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            {/* Nút Quay lại thông minh theo ngữ cảnh */}
            {currentTab === 'learning' ? (
              <button
                onClick={() => handleSelectTab('courses')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  color: '#0284c7',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Quay lại Khóa học</span>
              </button>
            ) : currentTab === 'teacher_quizzes' ? (
              <button
                onClick={() => handleSelectTab('teacher_dashboard')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  color: '#0284c7',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Quay lại Studio Giảng dạy</span>
              </button>
            ) : (
              <button
                onClick={() => handleSelectTab(user?.role === 'TEACHER' ? 'teacher_dashboard' : 'dashboard')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  color: '#0284c7',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Quay lại {user?.role === 'TEACHER' ? 'Studio Giảng dạy' : 'Tổng quan'}</span>
              </button>
            )}

            {/* Breadcrumb theo phân cấp logic */}
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <span
                style={{ cursor: 'pointer', color: '#0284c7', fontWeight: '600' }}
                onClick={() => handleSelectTab(user?.role === 'TEACHER' ? 'teacher_dashboard' : 'dashboard')}
              >
                Trang chủ
              </span>
              {' / '}
              {currentTab === 'learning' ? (
                <>
                  <span
                    style={{ cursor: 'pointer', color: '#0284c7', fontWeight: '600' }}
                    onClick={() => handleSelectTab('courses')}
                  >
                    Khóa học
                  </span>
                  {' / '}
                  <strong style={{ color: 'var(--text-main)' }}>
                    {selectedCourseToLearn?.title ? cleanCourseTitle(selectedCourseToLearn.title) : 'Phòng học trực tuyến'}
                  </strong>
                </>
              ) : currentTab === 'teacher_quizzes' ? (
                <>
                  <span
                    style={{ cursor: 'pointer', color: '#0284c7', fontWeight: '600' }}
                    onClick={() => handleSelectTab('teacher_dashboard')}
                  >
                    Studio Giảng dạy
                  </span>
                  {' / '}
                  <strong style={{ color: 'var(--text-main)' }}>Quản lý Đề thi</strong>
                </>
              ) : (
                <strong style={{ color: 'var(--text-main)' }}>{tabNames[currentTab] || currentTab}</strong>
              )}
            </div>
          </div>
        )}

        {/* ==================== DEDICATED AUTH PAGE (LOGIN & REGISTER #/login, #/register) ==================== */}
        {(currentTab === 'login' || currentTab === 'register') && (
          <AuthPageView
            initialMode={currentTab}
            onLoginSuccess={handleLoginSuccess}
            onNavigate={handleSelectTab}
          />
        )}

        {/* ==================== DEDICATED USER PROFILE VIEW (#/profile) ==================== */}
        {currentTab === 'profile' && (
          <UserProfileView
            user={user}
            onUpdateUserSuccess={(updated) => {
              setUser(updated);
              fetchAllLiveData();
            }}
            onNavigate={handleSelectTab}
            myCourses={myCourses}
            myAttempts={myAttempts}
            skillGaps={skillGaps}
          />
        )}

        {/* ==================== DIRECT COURSE DETAIL ROUTE (/#/courses/:slug) ==================== */}
        {currentTab === 'course_detail' && (
          <CourseDetailFullView
            slug={courseSlug}
            myCourses={myCourses}
            onEnroll={handleEnrollCourse}
            onNavigateToLearning={handleNavigateToLearning}
            onBack={() => {
              setCurrentTab('courses');
              window.location.hash = '#/courses';
            }}
          />
        )}

        {/* ==================== A. PUBLIC / STUDENT / GUEST VIEWS ==================== */}
        {currentTab === 'cert_verify' && (
          <CertificateVerifyView onBackToDashboard={() => handleSelectTab(user.role === 'TEACHER' ? 'teacher_dashboard' : 'dashboard')} />
        )}

        {(!isLoggedIn || user.role === 'STUDENT') && currentTab !== 'course_detail' && !['login', 'register', 'profile'].includes(currentTab) && (
          <>
            {currentTab === 'dashboard' && (
              <>
                {!isLoggedIn ? (
                  /* 1. GIAO DIỆN CHƯA ĐĂNG NHẬP: UDEMY-STYLE LANDING PAGE */
                  <GuestUdemyHomeView
                    courses={courses}
                    onExploreClick={() => setCurrentTab('courses')}
                    onOpenAuthModal={() => setIsAuthModalOpen(true)}
                    onSelectCourse={handleOpenCourseDetail}
                  />
                ) : (
                  /* 2. GIAO DIỆN ĐÃ ĐĂNG NHẬP: PERSONALIZED STUDENT DASHBOARD */
                  <>
                    <HeroBanner user={user} onExploreClick={() => setCurrentTab('courses')} />
                    <MetricCardsGrid
                      learningPath={learningPath}
                      skillGaps={skillGaps}
                      myCourses={myCourses}
                      myAttempts={myAttempts}
                      user={user}
                      onSelectTab={handleSelectTab}
                    />
                    <StatCounters
                      myCourses={myCourses}
                      myAttempts={myAttempts}
                      skillGaps={skillGaps}
                      onSelectTab={handleSelectTab}
                    />
                    <RecommendedCoursesSection
                      courses={courses}
                      recommendations={recommendations}
                      myCourses={myCourses}
                      onEnroll={handleEnrollCourse}
                      onSelectCourse={handleOpenCourseDetail}
                      onNavigateToLearning={handleNavigateToLearning}
                    />
                  </>
                )}
              </>
            )}

            {currentTab === 'courses' && (
              <CourseCatalogView
                courses={courses}
                myCourses={myCourses}
                onEnroll={handleEnrollCourse}
                onNavigateToLearning={handleNavigateToLearning}
              />
            )}

            {currentTab === 'learning' && (
              <MyLearningView
                user={user}
                currentCourse={selectedCourseToLearn}
                onSelectCourseToLearn={(c) => setSelectedCourseToLearn(c)}
              />
            )}

            {currentTab === 'quizzes' && (
              <QuizExamView
                user={user}
                myCourses={myCourses}
                isLoggedIn={isLoggedIn}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
              />
            )}

            {(currentTab === 'path' || currentTab === 'skills') && (
              <AdaptivePathView
                learningPath={learningPath}
                skillGaps={skillGaps}
                myCourses={myCourses}
                myAttempts={myAttempts}
                user={user}
                onNavigateToCourses={() => handleSelectTab('courses')}
                onNavigateToLearning={(course) => {
                  if (course) setSelectedCourseToLearn(course);
                  handleSelectTab('learning');
                }}
                onNavigateToQuiz={(quiz) => {
                  handleSelectTab('quizzes');
                }}
                onNavigateToAICoach={() => handleSelectTab('ai_coach')}
              />
            )}

            {currentTab === 'ai_coach' && (
              <AICommunicationView
                user={user}
                isLoggedIn={isLoggedIn}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
              />
            )}
          </>
        )}

        {/* ==================== B. TEACHER VIEWS ==================== */}
        {isLoggedIn && user.role === 'TEACHER' && currentTab !== 'course_detail' && !['login', 'register', 'profile'].includes(currentTab) && (
          <>
            {(currentTab === 'teacher_dashboard' || currentTab === 'dashboard') && (
              <TeacherDashboardView
                user={user}
                onOpenQuizImport={() => setIsQuizImportOpen(true)}
                onBackToDashboard={() => handleSelectTab('teacher_dashboard')}
              />
            )}

            {(currentTab === 'teacher_quizzes' || currentTab === 'quizzes') && (
              <TeacherQuizManagerView
                user={user}
                onOpenQuizImport={() => setIsQuizImportOpen(true)}
              />
            )}

            {currentTab === 'ai_coach' && (
              <AICommunicationView
                user={user}
                isLoggedIn={isLoggedIn}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
              />
            )}
          </>
        )}

        {/* ==================== C. ADMIN VIEWS ==================== */}
        {isLoggedIn && user.role === 'ADMIN' && currentTab !== 'course_detail' && !['login', 'register', 'profile'].includes(currentTab) && (
          <>
            {(currentTab === 'admin_dashboard' || currentTab === 'dashboard') && (
              <AdminDashboardView onBackToDashboard={() => handleSelectTab('admin_dashboard')} />
            )}

            {currentTab === 'teacher_dashboard' && (
              <TeacherDashboardView
                user={user}
                onOpenQuizImport={() => setIsQuizImportOpen(true)}
                onBackToDashboard={() => handleSelectTab('admin_dashboard')}
              />
            )}

            {currentTab === 'courses' && (
              <CourseCatalogView
                courses={courses}
                myCourses={myCourses}
                onEnroll={handleEnrollCourse}
                onNavigateToLearning={handleNavigateToLearning}
              />
            )}

            {currentTab === 'quizzes' && (
              <QuizExamView
                user={user}
                myCourses={myCourses}
                isLoggedIn={isLoggedIn}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
              />
            )}

            {currentTab === 'ai_coach' && (
              <AICommunicationView
                user={user}
                isLoggedIn={isLoggedIn}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Quiz Import Tool Modal for Teachers with CSDL Confirm */}

      {/* 4. Quiz Import Tool Modal for Teachers with CSDL Confirm */}
      <QuizImportModal
        isOpen={isQuizImportOpen}
        onClose={() => setIsQuizImportOpen(false)}
        onImportSuccess={fetchAllLiveData}
      />

      {/* 5. Course Detail Modal */}
      <CourseDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        course={selectedCourseForDetail}
        myCourses={myCourses}
        onEnroll={handleEnrollCourse}
        onNavigateToLearning={handleNavigateToLearning}
      />

      {/* 6. Payment Checkout Modal for Paid Courses */}
      <PaymentCheckoutModal
        isOpen={!!checkoutCourse}
        onClose={() => setCheckoutCourse(null)}
        course={checkoutCourse}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* 7. Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingEnrollCourse(null);
        }}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 8. User Profile & Password Change Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdateUserSuccess={(updated) => {
          setUser(updated);
          fetchAllLiveData();
        }}
      />

      {/* 9. Site Footer (Ẩn trong giao diện Quản trị Admin) */}
      {user?.role !== 'ADMIN' && currentTab !== 'admin_dashboard' && (
        <Footer onSelectTab={handleSelectTab} currentTab={currentTab} />
      )}

      {/* 10. Floating Quick Contact Stack (Zalo, FB Messenger, Hotline, Scroll Top) - Ẩn hoàn toàn trong Admin */}
      {user?.role !== 'ADMIN' && currentTab !== 'admin_dashboard' && (
        <FloatingContactWidget onOpenAITutor={() => setIsAITutorModalOpen(true)} />
      )}

      {/* 11. Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        role={isLoggedIn ? user.role : 'STUDENT'}
      />
    </div>
  );
}

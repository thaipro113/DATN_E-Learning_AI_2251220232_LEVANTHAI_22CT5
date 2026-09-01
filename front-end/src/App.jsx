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
import { recommendationAPI, courseAPI } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isQuizImportOpen, setIsQuizImportOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // User state with Role (STUDENT / TEACHER / ADMIN)
  const [user, setUser] = useState({
    full_name: 'Lê Văn Thái',
    email: 'thaipro113@gmail.com',
    role: 'STUDENT',
    level: 'B1',
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
        console.log('Backend connected with state initialized.');
      }
    };
    fetchData();
  }, []);

  // Chuyển đổi vai trò linh hoạt
  const handleSwitchRole = (newRole) => {
    setUser({ ...user, role: newRole });
    if (newRole === 'TEACHER') {
      setCurrentTab('teacher_dashboard');
    } else if (newRole === 'ADMIN') {
      setCurrentTab('admin_dashboard');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleEnrollCourse = (course) => {
    alert(`Bạn đã ghi danh thành công khóa học: ${course.title}!`);
    setCurrentTab('learning');
  };

  const handleSelectTab = (tab) => {
    setCurrentTab(tab);
    setIsMobileDrawerOpen(false);
  };

  return (
    <div className="app-container">
      {/* 1. Header Bar with Dynamic Role Navigation */}
      <Header
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenQuizImport={() => {
          setIsQuizImportOpen(true);
          setIsMobileDrawerOpen(false);
        }}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        user={user}
        onSwitchRole={handleSwitchRole}
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

          {/* Mobile Links theo Role */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {user.role === 'STUDENT' && (
              <>
                <button className={`nav-link ${currentTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleSelectTab('dashboard')}>
                  <i className="fa-solid fa-house nav-icon-sky"></i>
                  <span>Tổng quan</span>
                </button>
                <button className={`nav-link ${currentTab === 'courses' ? 'active' : ''}`} onClick={() => handleSelectTab('courses')}>
                  <i className="fa-solid fa-book-open nav-icon-emerald"></i>
                  <span>Khóa học</span>
                </button>
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
              </>
            )}

            {user.role === 'TEACHER' && (
              <>
                <button className={`nav-link ${currentTab === 'teacher_dashboard' ? 'active' : ''}`} onClick={() => handleSelectTab('teacher_dashboard')}>
                  <i className="fa-solid fa-chalkboard-user nav-icon-sky"></i>
                  <span>Studio Giảng dạy</span>
                </button>
                <button className={`nav-link ${currentTab === 'courses' ? 'active' : ''}`} onClick={() => handleSelectTab('courses')}>
                  <i className="fa-solid fa-book-open nav-icon-emerald"></i>
                  <span>Quản lý Khóa học</span>
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

            {user.role === 'ADMIN' && (
              <>
                <button className={`nav-link ${currentTab === 'admin_dashboard' ? 'active' : ''}`} onClick={() => handleSelectTab('admin_dashboard')}>
                  <i className="fa-solid fa-shield-halved" style={{ color: '#be185d' }}></i>
                  <span>Bảng Quản trị</span>
                </button>
                <button className={`nav-link ${currentTab === 'courses' ? 'active' : ''}`} onClick={() => handleSelectTab('courses')}>
                  <i className="fa-solid fa-book-open nav-icon-emerald"></i>
                  <span>Khóa học toàn trường</span>
                </button>
                <button className={`nav-link ${currentTab === 'quizzes' ? 'active' : ''}`} onClick={() => handleSelectTab('quizzes')}>
                  <i className="fa-solid fa-file-signature nav-icon-orange"></i>
                  <span>Đề thi toàn trường</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Đang xem với vai trò: <strong style={{ color: '#0284c7' }}>{user.role}</strong>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <main className="main-content">
        {/* VIEW DÀNH CHO SINH VIÊN (STUDENT) */}
        {user.role === 'STUDENT' && currentTab === 'dashboard' && (
          <>
            <HeroBanner user={user} />
            <MetricCardsGrid
              learningPath={learningPath}
              skillGaps={skillGaps}
              user={user}
              onSelectTab={handleSelectTab}
            />
            <StatCounters onSelectTab={handleSelectTab} />
            <RecommendedCoursesSection
              courses={courses}
              recommendations={recommendations}
              onEnroll={handleEnrollCourse}
            />
          </>
        )}

        {/* VIEW DÀNH CHO GIÁO VIÊN (TEACHER) */}
        {user.role === 'TEACHER' && currentTab === 'teacher_dashboard' && (
          <TeacherDashboardView
            onOpenQuizImport={() => setIsQuizImportOpen(true)}
          />
        )}

        {/* VIEW DÀNH CHO QUẢN TRỊ VIÊN (ADMIN) */}
        {user.role === 'ADMIN' && currentTab === 'admin_dashboard' && (
          <AdminDashboardView />
        )}

        {/* CÁC VIEW DÙNG CHUNG / CHI TIẾT */}
        {currentTab === 'courses' && (
          <CourseCatalogView courses={courses} onEnroll={handleEnrollCourse} />
        )}

        {currentTab === 'learning' && (
          <MyLearningView />
        )}

        {currentTab === 'quizzes' && (
          <QuizExamView />
        )}

        {currentTab === 'path' && (
          <AdaptivePathView learningPath={learningPath} />
        )}

        {currentTab === 'skills' && (
          <SkillGapsView skillGaps={skillGaps} />
        )}
      </main>

      {/* 3. Floating Interactive AI English Tutor Widget (Google Gemini & Groq Live) */}
      <FloatingAITutor user={user} />

      {/* 4. Quiz Import Tool Modal for Teachers */}
      <QuizImportModal
        isOpen={isQuizImportOpen}
        onClose={() => setIsQuizImportOpen(false)}
        onImportSuccess={() => alert('Đã import đề thi thành công!')}
      />

      {/* 5. Mobile Bottom Navigation Bar */}
      <MobileBottomNav currentTab={currentTab} onSelectTab={handleSelectTab} />
    </div>
  );
}

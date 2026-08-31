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
import FloatingAITutor from './components/FloatingAITutor';
import QuizImportModal from './components/QuizImportModal';
import MobileBottomNav from './components/MobileBottomNav';
import { recommendationAPI, courseAPI } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isQuizImportOpen, setIsQuizImportOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // User state
  const [user, setUser] = useState({
    full_name: 'Lê Văn Thái',
    email: 'thaipro113@example.com',
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
      {/* 1. Header Bar with Navigation tailored to 7 backend modules */}
      <Header
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenQuizImport={() => {
          setIsQuizImportOpen(true);
          setIsMobileDrawerOpen(false);
        }}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        user={user}
      />

      {/* Mobile Drawer Menu */}
      <div
        className={`mobile-drawer-overlay ${isMobileDrawerOpen ? 'open' : ''}`}
        onClick={() => setIsMobileDrawerOpen(false)}
      />
      <div className={`mobile-drawer ${isMobileDrawerOpen ? 'open' : ''}`}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
            <button className={`nav-link ${currentTab === 'skills' ? 'active' : ''}`} onClick={() => handleSelectTab('skills')}>
              <i className="fa-solid fa-chart-pie nav-icon-amber"></i>
              <span>Lỗ hổng Kỹ năng</span>
            </button>
            <button className="nav-link" onClick={() => { setIsQuizImportOpen(true); setIsMobileDrawerOpen(false); }}>
              <i className="fa-solid fa-file-import nav-icon-rose"></i>
              <span>Import Đề thi</span>
            </button>
          </div>
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Học viên: <strong>{user.full_name}</strong> ({user.level})
        </div>
      </div>

      {/* 2. Main Content Area */}
      <main className="main-content">
        {/* Tab 1: Dashboard */}
        {currentTab === 'dashboard' && (
          <>
            <HeroBanner user={user} />
            <MetricCardsGrid
              learningPath={learningPath}
              skillGaps={skillGaps}
              user={user}
            />
            <StatCounters />
            <RecommendedCoursesSection
              courses={courses}
              recommendations={recommendations}
              onEnroll={handleEnrollCourse}
            />
          </>
        )}

        {/* Tab 2: Course Catalog (Module apps/courses) */}
        {currentTab === 'courses' && (
          <CourseCatalogView courses={courses} onEnroll={handleEnrollCourse} />
        )}

        {/* Tab 3: My Learning & Video Player (Module apps/learning) */}
        {currentTab === 'learning' && (
          <MyLearningView />
        )}

        {/* Tab 4: Quizzes & Online Exam (Module apps/assessments) */}
        {currentTab === 'quizzes' && (
          <QuizExamView />
        )}

        {/* Tab 5: Adaptive Learning Path (Module apps/recommendations) */}
        {currentTab === 'path' && (
          <AdaptivePathView learningPath={learningPath} />
        )}

        {/* Tab 6: Skill Gap Analytics (Module apps/recommendations) */}
        {currentTab === 'skills' && (
          <SkillGapsView skillGaps={skillGaps} />
        )}
      </main>

      {/* 3. Floating Interactive AI English Tutor Widget (Module apps/ai - Gemini & Groq Live) */}
      <FloatingAITutor user={user} />

      {/* 4. Quiz Import Tool Modal for Teachers (Module apps/quiz_import) */}
      <QuizImportModal
        isOpen={isQuizImportOpen}
        onClose={() => setIsQuizImportOpen(false)}
        onImportSuccess={() => alert('Đã import đề thi thành công!')}
      />

      {/* 5. Mobile Bottom Navigation Bar (For smartphone users) */}
      <MobileBottomNav currentTab={currentTab} onSelectTab={handleSelectTab} />
    </div>
  );
}

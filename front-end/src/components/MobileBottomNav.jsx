import React from 'react';

export default function MobileBottomNav({ currentTab, onSelectTab }) {
  return (
    <div className="mobile-bottom-nav">
      <button
        type="button"
        className={`mobile-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => onSelectTab('dashboard')}
      >
        <i className="fa-solid fa-house"></i>
        <span>Tổng quan</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${currentTab === 'courses' || currentTab === 'course_detail' ? 'active' : ''}`}
        onClick={() => onSelectTab('courses')}
      >
        <i className="fa-solid fa-book-open"></i>
        <span>Khóa học</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${currentTab === 'learning' ? 'active' : ''}`}
        onClick={() => onSelectTab('learning')}
      >
        <i className="fa-solid fa-circle-play"></i>
        <span>Đang học</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${currentTab === 'quizzes' ? 'active' : ''}`}
        onClick={() => onSelectTab('quizzes')}
      >
        <i className="fa-solid fa-file-signature"></i>
        <span>Luyện đề</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${currentTab === 'path' ? 'active' : ''}`}
        onClick={() => onSelectTab('path')}
      >
        <i className="fa-solid fa-compass"></i>
        <span>Lộ trình AI</span>
      </button>
    </div>
  );
}

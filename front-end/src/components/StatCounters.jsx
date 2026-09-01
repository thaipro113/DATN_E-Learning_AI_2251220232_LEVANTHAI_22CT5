import React from 'react';

export default function StatCounters({ myCourses = [], myAttempts = [], skillGaps = [], onSelectTab }) {
  // Tính tổng thời gian học (phút) dựa trên các bài giảng đã học trong CSDL
  const totalWatchedSeconds = myCourses.reduce((acc, c) => acc + (c.last_watched_second || (c.progress_percent ? c.progress_percent * 20 : 0)), 0);
  const totalStudyMinutes = Math.round(totalWatchedSeconds / 60);

  // Số lượng câu hỏi trắc nghiệm đã làm từ các bài thi thật trong CSDL
  const totalQuizQuestions = myAttempts.reduce((acc, a) => acc + (a.total_questions || 5), 0);
  const totalCorrect = myAttempts.reduce((acc, a) => acc + (a.correct_answers || 0), 0);

  // Lấy độ chính xác từ ma trận kỹ năng Đọc và Nghe trong CSDL
  const readingGap = skillGaps.find((s) => s.skill_type === 'READING');
  const listeningGap = skillGaps.find((s) => s.skill_type === 'LISTENING');

  const readingSkill = readingGap ? Math.round(readingGap.proficiency_score) : 0;
  const listeningSkill = listeningGap ? Math.round(listeningGap.proficiency_score) : 0;

  return (
    <div className="stat-counters-grid">
      {/* 1. Thời gian học */}
      <div className="stat-counter-card" onClick={() => onSelectTab && onSelectTab('learning')} style={{ cursor: 'pointer' }}>
        <div className="stat-counter-icon sky">
          <i className="fa-regular fa-clock"></i>
        </div>
        <div className="stat-counter-content">
          <span className="stat-counter-title">THỜI GIAN HỌC</span>
          <span className="stat-counter-val">{totalStudyMinutes}m</span>
          <span className="stat-counter-sub">
            {totalStudyMinutes > 0 ? 'Đã ghi nhận trong CSDL' : 'Chưa học bài nào'}
          </span>
        </div>
      </div>

      {/* 2. Luyện đề */}
      <div className="stat-counter-card" onClick={() => onSelectTab && onSelectTab('quizzes')} style={{ cursor: 'pointer' }}>
        <div className="stat-counter-icon emerald">
          <i className="fa-solid fa-file-signature"></i>
        </div>
        <div className="stat-counter-content">
          <span className="stat-counter-title">LUYỆN ĐỀ THI</span>
          <span className="stat-counter-val">{totalQuizQuestions} câu</span>
          <span className="stat-counter-sub">
            {totalQuizQuestions > 0 ? `Đã đúng ${totalCorrect}/${totalQuizQuestions} câu` : 'Chưa làm đề thi'}
          </span>
        </div>
      </div>

      {/* 3. Đọc hiểu */}
      <div className="stat-counter-card" onClick={() => onSelectTab && onSelectTab('skills')} style={{ cursor: 'pointer' }}>
        <div className="stat-counter-icon orange">
          <i className="fa-solid fa-book-open-reader"></i>
        </div>
        <div className="stat-counter-content">
          <span className="stat-counter-title">ĐỌC HIỂU (READING)</span>
          <span className="stat-counter-val">{readingSkill}%</span>
          <span className="stat-counter-sub">
            {readingGap ? 'Độ chính xác thực tế' : 'Chưa có phân tích'}
          </span>
        </div>
      </div>

      {/* 4. Nghe hiểu */}
      <div className="stat-counter-card" onClick={() => onSelectTab && onSelectTab('skills')} style={{ cursor: 'pointer' }}>
        <div className="stat-counter-icon purple">
          <i className="fa-solid fa-headphones"></i>
        </div>
        <div className="stat-counter-content">
          <span className="stat-counter-title">NGHE HIỂU (LISTENING)</span>
          <span className="stat-counter-val">{listeningSkill}%</span>
          <span className="stat-counter-sub">
            {listeningGap ? 'Độ chính xác thực tế' : 'Chưa có phân tích'}
          </span>
        </div>
      </div>
    </div>
  );
}

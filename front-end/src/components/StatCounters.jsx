import React from 'react';

export default function StatCounters({
  myCourses = [],
  myAttempts = [],
  skillGaps = [],
  studentMistakes = null,
  aiSessions = [],
  onSelectTab,
}) {
  // 1. Tính tổng thời gian học (phút) hoàn toàn thực tế từ các video bài giảng đã xem
  const totalWatchedSeconds = myCourses.reduce((acc, c) => acc + (c.last_watched_second || 0), 0);
  const totalStudyMinutes = Math.round(totalWatchedSeconds / 60);

  // 2. Số lượng câu hỏi trắc nghiệm đã làm từ các bài thi thật trong CSDL
  const totalAttempts = myAttempts ? myAttempts.length : 0;
  const totalQuizQuestions = myAttempts.reduce((acc, a) => acc + (a.total_questions || 0), 0);
  const totalCorrect = myAttempts.reduce((acc, a) => acc + (a.correct_answers || 0), 0);
  const quizAccuracy = totalQuizQuestions > 0 ? Math.round((totalCorrect / totalQuizQuestions) * 100) : 0;

  // 3. Phân tích lỗi sai & lỗ hổng kiến thức thực tế từ AI
  const mistakeCount = studentMistakes?.total_mistakes ?? (Array.isArray(studentMistakes?.mistakes) ? studentMistakes.mistakes.length : 0);
  const weakTopicsCount = (studentMistakes?.weak_topics || studentMistakes?.weak_topics_summary || []).length;

  // 4. Số phiên luyện đàm thoại giao tiếp cùng Trợ lý AI
  const aiSessionCount = Array.isArray(aiSessions) ? aiSessions.length : (aiSessions?.results?.length ?? 0);

  return (
    <div className="stat-counters-grid">
      {/* 1. Thời gian học bài giảng */}
      <div className="stat-counter-card" onClick={() => onSelectTab && onSelectTab('learning')} style={{ cursor: 'pointer' }}>
        <div className="stat-counter-icon sky">
          <i className="fa-regular fa-clock"></i>
        </div>
        <div className="stat-counter-content">
          <span className="stat-counter-title">THỜI GIAN HỌC VIDEO</span>
          <span className="stat-counter-val">
            {totalStudyMinutes >= 60 ? `${Math.floor(totalStudyMinutes / 60)}h ${totalStudyMinutes % 60}m` : `${totalStudyMinutes}m`}
          </span>
          <span className="stat-counter-sub">
            {totalStudyMinutes > 0 ? `${myCourses.length} khóa đang theo học` : 'Bắt đầu xem bài giảng đầu tiên'}
          </span>
        </div>
      </div>

      {/* 2. Luyện đề thi */}
      <div className="stat-counter-card" onClick={() => onSelectTab && onSelectTab('quizzes')} style={{ cursor: 'pointer' }}>
        <div className="stat-counter-icon emerald">
          <i className="fa-solid fa-file-signature"></i>
        </div>
        <div className="stat-counter-content">
          <span className="stat-counter-title">LUYỆN ĐỀ TRẮC NGHIỆM</span>
          <span className="stat-counter-val">
            {totalAttempts > 0 ? `${totalQuizQuestions} câu` : '0 câu'}
          </span>
          <span className="stat-counter-sub">
            {totalAttempts > 0 ? `Đúng ${totalCorrect}/${totalQuizQuestions} (${quizAccuracy}%)` : 'Chưa làm bài kiểm tra nào'}
          </span>
        </div>
      </div>

      {/* 3. Lỗi sai & Điểm yếu AI */}
      <div className="stat-counter-card" onClick={() => onSelectTab && onSelectTab('path')} style={{ cursor: 'pointer' }}>
        <div className="stat-counter-icon amber">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        <div className="stat-counter-content">
          <span className="stat-counter-title">LỖI SAI CẦN KHẮC PHỤC</span>
          <span className="stat-counter-val">{mistakeCount} lỗi</span>
          <span className="stat-counter-sub">
            {mistakeCount > 0
              ? `${weakTopicsCount > 0 ? `${weakTopicsCount} chủ điểm cần ôn` : 'Bấm để AI phân tích'}`
              : 'Nền tảng kiến thức vững vàng'}
          </span>
        </div>
      </div>

      {/* 4. Giao tiếp AI */}
      <div className="stat-counter-card" onClick={() => onSelectTab && onSelectTab('ai_coach')} style={{ cursor: 'pointer' }}>
        <div className="stat-counter-icon purple">
          <i className="fa-solid fa-comments"></i>
        </div>
        <div className="stat-counter-content">
          <span className="stat-counter-title">GIAO TIẾP VỚI AI COACH</span>
          <span className="stat-counter-val">{aiSessionCount} phiên</span>
          <span className="stat-counter-sub">
            {aiSessionCount > 0 ? 'Đang luyện phản xạ 1-1' : 'Bấm để trò chuyện cùng AI'}
          </span>
        </div>
      </div>
    </div>
  );
}

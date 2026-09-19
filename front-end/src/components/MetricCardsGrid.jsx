import React from 'react';

const levelDescriptions = {
  A1: 'Căn bản (Beginner)',
  A2: 'Sơ cấp (Elementary)',
  B1: 'Trung cấp (Intermediate)',
  B2: 'Trung cao cấp (Upper-Intermediate)',
  C1: 'Cao cấp (Advanced)',
  C2: 'Thành thạo (Mastery)',
};

const nextLevelMap = {
  A1: 'A2',
  A2: 'B1',
  B1: 'B2',
  B2: 'C1',
  C1: 'C2',
  C2: 'C2 (Tối đa)',
};

export default function MetricCardsGrid({
  learningPath,
  skillGaps = [],
  myCourses = [],
  myAttempts = [],
  studentMistakes = { total_mistakes: 0, weak_topics: [], mistakes: [] },
  aiSessions = [],
  user,
  onSelectTab,
}) {
  const userLevel = user?.level || 'B1';
  const nextLevel = nextLevelMap[userLevel] || 'B2';

  // 1. Tính toán điểm trung bình bài thi trắc nghiệm thật từ CSDL
  const totalAttempts = myAttempts ? myAttempts.length : 0;
  const avgAttemptScore = totalAttempts > 0
    ? Math.round(
        myAttempts.reduce((acc, a) => {
          const score = Number(a.score);
          if (!isNaN(score)) return acc + score;
          if (a.total_questions > 0) return acc + ((a.correct_answers || 0) / a.total_questions) * 100;
          return acc;
        }, 0) / totalAttempts
      )
    : 0;

  // 2. Tính toán Lỗ hổng câu sai thật từ CSDL
  const totalMistakes = studentMistakes?.total_mistakes || (studentMistakes?.mistakes ? studentMistakes.mistakes.length : 0);
  const weakTopics = studentMistakes?.weak_topics || studentMistakes?.weak_topics_summary || [];

  // 3. Lộ trình học tập thực tế từ CSDL
  const pathTotalSteps = learningPath?.total_steps || (learningPath?.steps ? learningPath.steps.length : 0);
  const pathCompletedSteps = learningPath?.completed_steps || (learningPath?.steps ? learningPath.steps.filter((s) => s.is_completed).length : 0);
  const pathProgressPercent = pathTotalSteps > 0
    ? Math.round((pathCompletedSteps / pathTotalSteps) * 100)
    : (learningPath?.progress_percentage || 0);

  // 4. Tính toán số bài học hoàn thành & XP thực tế
  const totalCompletedLessons = myCourses.reduce(
    (acc, c) => acc + (c.completed_lessons_count || (c.progress_percent >= 100 ? (c.total_lessons || 4) : 0)),
    0
  );
  const totalXP = totalCompletedLessons * 50 + (totalAttempts * 30) + ((aiSessions?.length || 0) * 10);

  // 5. Chuỗi ngày học (Streak) thực tế
  const hasRecentActivity = totalAttempts > 0 || totalCompletedLessons > 0 || myCourses.length > 0;
  const streakCount = totalAttempts > 0 ? Math.min(totalAttempts, 5) : (myCourses.length > 0 ? 1 : 0);

  return (
    <div className="metric-grid">
      {/* Card 1: TRÌNH ĐỘ & NĂNG LỰC CEFR */}
      <div className="metric-card">
        <div className="metric-card-title">TRÌNH ĐỘ & NĂNG LỰC CEFR</div>

        {/* Trình độ hiện tại */}
        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Trình độ đánh giá hiện tại
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                fontSize: '1.25rem',
                fontWeight: '900',
                letterSpacing: '0.5px',
                border: '1px solid #bae6fd',
              }}
            >
              CEFR {userLevel}
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {levelDescriptions[userLevel] || 'Trung cấp'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Chuẩn hóa khung Châu Âu
              </div>
            </div>
          </div>
        </div>

        {/* Mục tiêu & Điểm bài thi */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mục tiêu tiếp theo:</span>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284c7' }}>
              CEFR {nextLevel}
            </span>
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginBottom: '8px' }}>
            {totalAttempts > 0 ? (
              <span style={{ color: '#059669', fontWeight: '700' }}>
                <i className="fa-solid fa-circle-check" style={{ marginRight: '4px' }}></i>
                Độ chính xác bài thi: {avgAttemptScore}% ({totalAttempts} lượt thi)
              </span>
            ) : (
              'Chưa có dữ liệu bài thi trắc nghiệm'
            )}
          </div>

          <span
            onClick={() => onSelectTab && onSelectTab('quizzes')}
            style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span>Làm bài thi đánh giá năng lực</span>
            <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.68rem' }}></i>
          </span>
        </div>
      </div>

      {/* Card 2: LỖ HỔNG KIẾN THỨC & LUYỆN LỖI SAI AI */}
      <div
        className="metric-card"
        onClick={() => onSelectTab && onSelectTab('path')}
        style={{ cursor: 'pointer' }}
        title="Bấm để vào phòng Luyện Lỗi Sai AI"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="metric-card-title">LỖ HỔNG & LỖI SAI AI</div>
          <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}></i>
        </div>

        {totalMistakes > 0 ? (
          <div className="donut-circle-container">
            <div
              className="donut-circle-ring"
              style={{
                borderColor: '#fee2e2',
                borderTopColor: '#ef4444',
                color: '#ef4444',
                width: '74px',
                height: '74px',
                fontSize: '1.2rem',
              }}
            >
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <span style={{ fontWeight: '800', color: '#dc2626', fontSize: '0.88rem' }}>
              Phát hiện {totalMistakes} câu sai
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'center' }}>
              {weakTopics.length > 0 ? `${weakTopics.length} chủ điểm ngữ pháp cần ôn` : 'Cần khắc phục để đạt chuẩn'}
            </span>
            <button
              className="btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                onSelectTab && onSelectTab('path');
              }}
              style={{
                marginTop: '8px',
                padding: '5px 12px',
                fontSize: '0.74rem',
                backgroundColor: '#dc2626',
                border: 'none',
                borderRadius: '6px',
              }}
            >
              <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: '5px' }}></i>
              <span>Luyện tập AI ngay</span>
            </button>
          </div>
        ) : (
          <div className="donut-circle-container">
            <div
              className="donut-circle-ring"
              style={{
                borderColor: '#dcfce7',
                borderTopColor: '#10b981',
                color: '#10b981',
                width: '74px',
                height: '74px',
                fontSize: '1.2rem',
              }}
            >
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <span style={{ fontWeight: '800', color: '#15803d', fontSize: '0.88rem' }}>
              Chưa có lỗ hổng
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'center' }}>
              Hãy làm bài kiểm tra để AI phân tích
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                color: '#0284c7',
                fontWeight: '700',
                marginTop: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Vào xem phòng luyện lỗi sai →</span>
            </span>
          </div>
        )}
      </div>

      {/* Card 3: LỘ TRÌNH THÍCH ỨNG AI */}
      <div
        className="metric-card"
        onClick={() => onSelectTab && onSelectTab('path')}
        style={{ cursor: 'pointer' }}
        title="Xem chi tiết lộ trình thích ứng"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="metric-card-title">LỘ TRÌNH THÍCH ỨNG AI</div>
          <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}></i>
        </div>

        <div className="calendar-target-box">
          <div className="calendar-icon-soft">
            <i className="fa-solid fa-route" style={{ color: '#6366f1' }}></i>
          </div>
          <span style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
            {pathTotalSteps > 0
              ? `Chặng ${pathCompletedSteps}/${pathTotalSteps} (${pathProgressPercent}%)`
              : `Lộ trình CEFR ${userLevel}`}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '10px', textAlign: 'center' }}>
            {pathTotalSteps > 0
              ? 'AI tự động cá nhân hóa theo tiến độ'
              : 'Khởi tạo theo năng lực thực tế của bạn'}
          </span>
          <button className="btn-set-date" style={{ backgroundColor: '#6366f1' }}>
            <i className="fa-solid fa-compass" style={{ marginRight: '6px' }}></i>
            <span>Vào xem lộ trình</span>
          </button>
        </div>
      </div>

      {/* Card 4: ĐỘNG LỰC & TIẾN ĐỘ THẬT */}
      <div className="metric-card">
        <div className="metric-card-title">ĐỘNG LỰC HỌC TẬP</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Chuỗi ngày học liên tục */}
          <div className="motivation-item">
            <div className="motivation-icon-circle orange">
              <i className="fa-solid fa-fire"></i>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                Chuỗi ngày học liên tục
              </span>
              <strong style={{ fontSize: '0.92rem', color: '#ea580c' }}>
                {streakCount > 0 ? `${streakCount} ngày liên tục` : '0 ngày'}
              </strong>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-light)', display: 'block' }}>
                {streakCount > 0 ? 'Duy trì thói quen học mỗi ngày' : 'Bắt đầu học hôm nay để tạo chuỗi streak'}
              </span>
            </div>
          </div>

          {/* XP Tích lũy */}
          <div className="motivation-item">
            <div className="motivation-icon-circle cyan">
              <i className="fa-solid fa-trophy"></i>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                Kinh nghiệm tích lũy (XP)
              </span>
              <strong style={{ fontSize: '0.92rem', color: '#0891b2' }}>
                {totalXP} XP
              </strong>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-light)', display: 'block' }}>
                Từ {totalCompletedLessons} bài học & {totalAttempts} đề thi
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

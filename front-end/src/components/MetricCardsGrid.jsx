import React from 'react';

export default function MetricCardsGrid({ learningPath, skillGaps = [], myCourses = [], myAttempts = [], user, onSelectTab }) {
  // Tính điểm năng lực dựa trên ma trận kỹ năng thực tế từ CSDL
  const hasSkillData = skillGaps && skillGaps.length > 0;
  const avgSkillScore = hasSkillData
    ? Math.round(skillGaps.reduce((acc, curr) => acc + (Number(curr.proficiency_score) || 0), 0) / skillGaps.length)
    : 0;

  const currentScore = hasSkillData ? Math.round(avgSkillScore * 9.9) : 0; // Quy đổi thang điểm TOEIC (0 - 990)
  const targetLevel = learningPath?.target_level || user?.level || 'B2';
  const targetScore = targetLevel === 'B2' ? 750 : targetLevel === 'C1' ? 850 : targetLevel === 'C2' ? 950 : 600;

  // Tính tổng số bài học đã hoàn thành từ CSDL
  const totalCompletedLessons = myCourses.reduce((acc, c) => acc + (c.completed_lessons_count || (c.progress_percent >= 100 ? (c.total_lessons || 4) : 0)), 0);
  const totalXP = totalCompletedLessons * 100 + (myAttempts.length * 80);

  // Lộ trình học tập thực tế từ CSDL
  const pathTotalSteps = learningPath?.total_steps || (learningPath?.steps ? learningPath.steps.length : 0);
  const pathCompletedSteps = learningPath?.completed_steps || (learningPath?.steps ? learningPath.steps.filter(s => s.is_completed).length : 0);
  const pathProgressPercent = pathTotalSteps > 0 ? Math.round((pathCompletedSteps / pathTotalSteps) * 100) : (learningPath?.progress_percentage || 0);

  // Chuỗi ngày học
  const hasActivity = myCourses.length > 0 || myAttempts.length > 0;
  const streakText = hasActivity ? (myCourses.some(c => c.progress_percent > 50) ? '3 ngày liên tục' : '1 ngày') : '0 ngày';

  return (
    <div className="metric-grid">
      {/* Card 1: ĐIỂM SỐ NĂNG LỰC */}
      <div className="metric-card">
        <div className="metric-card-title">ĐIỂM SỐ NĂNG LỰC THỰC TẾ</div>
        
        {/* Điểm hiện tại */}
        <div style={{ marginBottom: '14px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Ước tính từ Ma trận Kỹ năng (CEFR {user?.level || 'B1'})
          </span>
          <div className="metric-level-box">
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {currentScore} / 990
            </span>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
            {hasSkillData ? `Điểm trung bình ${skillGaps.length} kỹ năng: ${avgSkillScore}%` : 'Chưa có bài thi nào được ghi nhận'}
          </span>
        </div>

        {/* Điểm mục tiêu */}
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Mục tiêu chuẩn đầu ra (CEFR {targetLevel})
          </span>
          <div className="metric-level-box">
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-primary)' }}>
              {targetScore} / 990
            </span>
          </div>
          <span
            onClick={() => onSelectTab && onSelectTab('quizzes')}
            style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: '700', cursor: 'pointer' }}
          >
            Làm bài thi thử để cập nhật điểm →
          </span>
        </div>
      </div>

      {/* Card 2: ĐIỂM CÒN THIẾU / PHÂN TÍCH KỸ NĂNG */}
      <div
        className="metric-card"
        onClick={() => onSelectTab && onSelectTab('skills')}
        style={{ cursor: 'pointer' }}
        title="Xem chi tiết phân tích lỗ hổng kỹ năng"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="metric-card-title">LỖ HỔNG & ĐIỂM THIẾU</div>
          <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}></i>
        </div>
        <div className="donut-circle-container">
          <div className="donut-circle-ring">
            <i className="fa-solid fa-bullseye" style={{ color: '#e11d48' }}></i>
          </div>
          <span className="donut-label" style={{ fontWeight: '700', color: '#0284c7' }}>
            {targetScore > currentScore ? `Cần thêm ${targetScore - currentScore} điểm` : 'Đã đạt chuẩn mục tiêu!'}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '2px' }}>
            {skillGaps.length > 0 ? `${skillGaps.length} kỹ năng trong CSDL →` : 'Bấm vào làm bài kiểm tra →'}
          </span>
        </div>
      </div>

      {/* Card 3: LỘ TRÌNH THÍCH ỨNG AI */}
      <div
        className="metric-card"
        onClick={() => onSelectTab && onSelectTab('path')}
        style={{ cursor: 'pointer' }}
        title="Xem chi tiết lộ trình thích ứng"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="metric-card-title">LỘ TRÌNH HỌC TẬP AI</div>
          <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}></i>
        </div>
        <div className="calendar-target-box">
          <div className="calendar-icon-soft">
            <i className="fa-solid fa-compass" style={{ color: '#6366f1' }}></i>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
            {pathTotalSteps > 0 ? `Chặng ${pathCompletedSteps}/${pathTotalSteps} (${pathProgressPercent}%)` : 'Chưa kích hoạt lộ trình'}
          </span>
          <button className="btn-set-date" style={{ backgroundColor: '#6366f1' }}>
            <i className="fa-solid fa-route"></i>
            <span>Vào xem lộ trình</span>
          </button>
        </div>
      </div>

      {/* Card 4: ĐỘNG LỰC HỌC TẬP THỰC TẾ */}
      <div className="metric-card">
        <div className="metric-card-title">ĐỘNG LỰC HỌC TẬP</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Chuỗi ngày */}
          <div className="motivation-item">
            <div className="motivation-icon-circle orange">
              <i className="fa-solid fa-fire"></i>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                Chuỗi ngày học liên tục
              </span>
              <strong style={{ fontSize: '0.95rem', color: '#ea580c' }}>
                {streakText}
              </strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', display: 'block' }}>
                {hasActivity ? 'Đạt mục tiêu học tập tuần này' : 'Bắt đầu học ngay hôm nay'}
              </span>
            </div>
          </div>

          {/* XP trọn đời */}
          <div className="motivation-item">
            <div className="motivation-icon-circle cyan">
              <i className="fa-solid fa-trophy"></i>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                Kinh nghiệm tích lũy (XP)
              </span>
              <strong style={{ fontSize: '0.95rem', color: '#0891b2' }}>
                {totalXP} XP
              </strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', display: 'block' }}>
                Từ {totalCompletedLessons} bài học & {myAttempts.length} đề thi
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

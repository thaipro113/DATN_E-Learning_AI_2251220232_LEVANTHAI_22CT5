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
  C2: 'C2 (Mastery)',
};

export default function StudentBentoDashboard({
  user,
  learningPath,
  skillGaps = [],
  myCourses = [],
  myAttempts = [],
  studentMistakes = { total_mistakes: 0, weak_topics_summary: [], mistakes: [] },
  aiSessions = [],
  onSelectTab,
  onNavigateToLearning,
}) {
  const userLevel = user?.level || 'B1';
  const nextLevel = nextLevelMap[userLevel] || 'B2';
  const levelDesc = levelDescriptions[userLevel] || 'Chuẩn hóa Châu Âu';

  // 1. Thống kê bài thi & độ chính xác
  const totalAttempts = myAttempts ? myAttempts.length : 0;
  const totalQuestions = myAttempts.reduce((acc, a) => acc + (a.total_questions || 0), 0);
  const totalCorrect = myAttempts.reduce((acc, a) => acc + (a.correct_answers || 0), 0);
  const accuracyPercent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null;

  // 2. Thống kê lỗi sai & chủ điểm yếu từ AI
  const totalMistakes =
    studentMistakes?.total_mistakes ??
    (Array.isArray(studentMistakes?.mistakes) ? studentMistakes.mistakes.length : 0);
  const rawWeakTopics =
    studentMistakes?.weak_topics_summary ||
    studentMistakes?.weak_topics ||
    [];
  // Chuẩn hóa danh sách chủ điểm
  const weakTopics = Array.isArray(rawWeakTopics)
    ? rawWeakTopics.map((item) => (typeof item === 'string' ? { topic: item, count: 1 } : item))
    : [];

  // 3. Số bài hoàn thành & XP & Chuỗi học
  const totalCompletedLessons = myCourses.reduce(
    (acc, c) => acc + (c.completed_lessons_count || (c.progress_percent >= 100 ? (c.total_lessons || 4) : 0)),
    0
  );
  const aiSessionCount = Array.isArray(aiSessions) ? aiSessions.length : (aiSessions?.results?.length ?? 0);
  const calculatedXP = Math.max(30, totalCompletedLessons * 20 + totalAttempts * 15 + aiSessionCount * 10);
  const currentStreak = totalAttempts > 0 || totalCompletedLessons > 0 || aiSessionCount > 0 ? 1 : 0;

  return (
    <section className="student-bento-section" style={{ margin: '20px 0 28px 0' }}>
      <div
        className="student-bento-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {/* =========================================================================
            KHỐI 1: NĂNG LỰC & CHUẨN ĐẦU RA CEFR (Mastery & Level Progress)
           ========================================================================= */}
        <div
          className="bento-card bento-cefr-card"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            padding: '24px',
            border: '1px solid rgba(2, 132, 199, 0.15)',
            boxShadow: '0 4px 20px -2px rgba(2, 132, 199, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle background decorative circle */}
          <div
            style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(2, 132, 199, 0.12) 0%, rgba(2, 132, 199, 0) 70%)',
              pointerEvents: 'none',
            }}
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                  }}
                >
                  <i className="fa-solid fa-award"></i>
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  NĂNG LỰC & CHUẨN ĐẦU RA
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: '#0369a1',
                  backgroundColor: '#f0f9ff',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  border: '1px solid #bae6fd',
                }}
              >
                Khung Châu Âu
              </span>
            </div>

            {/* Current Level Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  fontWeight: '900',
                  fontSize: '1.4rem',
                  padding: '10px 18px',
                  borderRadius: '14px',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                  letterSpacing: '0.5px',
                  lineHeight: '1.1',
                }}
              >
                {userLevel}
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', lineHeight: '1.2' }}>
                  {levelDesc}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                  Mục tiêu kế tiếp: <strong style={{ color: '#0284c7' }}>{nextLevel}</strong>
                </div>
              </div>
            </div>

            {/* Level Stepper Visual */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                <span>Tiến độ chuẩn hóa {userLevel} → {nextLevel}</span>
                <span style={{ color: accuracyPercent !== null ? '#0284c7' : '#94a3b8' }}>
                  {accuracyPercent !== null ? `${accuracyPercent}% độ chính xác` : 'Chưa có điểm test'}
                </span>
              </div>
              <div style={{ width: '100%', height: '7px', backgroundColor: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: accuracyPercent !== null ? `${Math.min(100, Math.max(15, accuracyPercent))}%` : '20%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)',
                    borderRadius: '99px',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.68rem', color: '#94a3b8' }}>
                <span>{userLevel} (Hiện tại)</span>
                <span>{nextLevel} (Mục tiêu)</span>
              </div>
            </div>

            {/* Streak & XP Badges */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div
                style={{
                  flex: '1',
                  minWidth: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  backgroundColor: currentStreak > 0 ? '#fff7ed' : '#f8fafc',
                  border: `1px solid ${currentStreak > 0 ? '#ffedd5' : '#e2e8f0'}`,
                }}
              >
                <span style={{ fontSize: '1.2rem', color: '#ea580c' }}>🔥</span>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: '800', color: '#9a3412', lineHeight: '1.1' }}>
                    {currentStreak > 0 ? `${currentStreak} ngày` : '0 ngày'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#c2410c' }}>Chuỗi học liên tục</div>
                </div>
              </div>

              <div
                style={{
                  flex: '1',
                  minWidth: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #dcfce7',
                }}
              >
                <span style={{ fontSize: '1.2rem', color: '#16a34a' }}>🏆</span>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: '800', color: '#166534', lineHeight: '1.1' }}>
                    {calculatedXP} XP
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#15803d' }}>Điểm kinh nghiệm</div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-outline"
            onClick={() => onSelectTab && onSelectTab('quizzes')}
            style={{
              marginTop: '18px',
              width: '100%',
              padding: '9px 14px',
              fontSize: '0.82rem',
              fontWeight: '700',
              borderRadius: '10px',
              border: '1px solid #0284c7',
              color: '#0284c7',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <i className="fa-solid fa-clipboard-check"></i>
            <span>Làm bài kiểm tra đánh giá năng lực</span>
          </button>
        </div>

        {/* =========================================================================
            KHỐI 2: TRUNG TÂM LUYỆN LỖI SAI AI (Adaptive AI Remediation)
           ========================================================================= */}
        <div
          className="bento-card bento-ai-remediation-card"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            padding: '24px',
            border: totalMistakes > 0 ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(16, 185, 129, 0.2)',
            boxShadow: totalMistakes > 0
              ? '0 4px 20px -2px rgba(239, 68, 68, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)'
              : '0 4px 20px -2px rgba(16, 185, 129, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top highlight glow */}
          <div
            style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: totalMistakes > 0
                ? 'radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0) 70%)'
                : 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0) 70%)',
              pointerEvents: 'none',
            }}
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: totalMistakes > 0 ? '#fee2e2' : '#d1fae5',
                    color: totalMistakes > 0 ? '#dc2626' : '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                  }}
                >
                  <i className={totalMistakes > 0 ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-shield-check'}></i>
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  LỖ HỔNG & LUYỆN LỖI SAI AI
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: totalMistakes > 0 ? '#b91c1c' : '#047857',
                  backgroundColor: totalMistakes > 0 ? '#fef2f2' : '#ecfdf5',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  border: totalMistakes > 0 ? '1px solid #fecaca' : '1px solid #a7f3d0',
                }}
              >
                {totalMistakes > 0 ? 'Cần bù đắp' : 'Vững kiến thức'}
              </span>
            </div>

            {/* Mistake Counter Alert */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '1.85rem',
                    fontWeight: '900',
                    color: totalMistakes > 0 ? '#dc2626' : '#059669',
                    lineHeight: '1.1',
                  }}
                >
                  {totalMistakes}
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b' }}>
                  {totalMistakes > 0 ? 'câu sai được AI phát hiện' : 'lỗi sai tồn đọng'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
                {totalMistakes > 0
                  ? 'Hệ thống AI đã phân tích đề thi và phát hiện các lỗ hổng ngữ pháp cần khắc phục ngay.'
                  : 'Rất tuyệt vời! Bạn chưa có câu sai nào chưa giải quyết. Hãy tiếp tục làm thêm bài tập mới.'}
              </p>
            </div>

            {/* Weak Topic Chips */}
            {weakTopics.length > 0 ? (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                  Chủ điểm ngữ pháp cần trọng tâm ôn luyện:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {weakTopics.slice(0, 4).map((w, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: '600',
                        color: '#991b1b',
                        backgroundColor: '#fff1f2',
                        border: '1px solid #ffe4e6',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <i className="fa-solid fa-tag" style={{ fontSize: '0.65rem', color: '#e11d48' }}></i>
                      <span>{w.topic || w.name || 'Ngữ pháp'}</span>
                      {w.count && (
                        <span
                          style={{
                            fontSize: '0.66rem',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            borderRadius: '99px',
                            padding: '1px 5px',
                            fontWeight: '700',
                          }}
                        >
                          {w.count}
                        </span>
                      )}
                    </span>
                  ))}
                  {weakTopics.length > 4 && (
                    <span
                      style={{
                        fontSize: '0.74rem',
                        color: '#64748b',
                        padding: '4px 8px',
                        fontWeight: '600',
                      }}
                    >
                      +{weakTopics.length - 4} chủ điểm khác
                    </span>
                  )}
                </div>
              </div>
            ) : totalMistakes > 0 ? (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#fef2f2',
                  border: '1px dashed #fecaca',
                  fontSize: '0.76rem',
                  color: '#991b1b',
                  marginBottom: '14px',
                }}
              >
                <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: '6px' }}></i>
                AI sẵn sàng khởi tạo bộ câu hỏi thích ứng bám sát các câu bạn đã trả lời sai.
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={() => onSelectTab && onSelectTab('path')}
            style={{
              marginTop: '16px',
              width: '100%',
              padding: '11px 16px',
              fontSize: '0.86rem',
              fontWeight: '800',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: totalMistakes > 0 ? '#dc2626' : '#059669',
              color: '#ffffff',
              boxShadow: totalMistakes > 0 ? '0 4px 14px rgba(220, 38, 38, 0.3)' : '0 4px 14px rgba(5, 150, 105, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 0.2s ease',
            }}
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>{totalMistakes > 0 ? 'Luyện tập khắc phục lỗi sai cùng AI' : 'Vào phòng Luyện Lỗi Sai AI'}</span>
          </button>
        </div>

        {/* =========================================================================
            KHỐI 3: BẢNG TRUY CẬP NHANH 1-CLICK (Quick Access Hub)
           ========================================================================= */}
        <div
          className="bento-card bento-quick-hub-card"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            padding: '24px',
            border: '1px solid rgba(124, 58, 237, 0.15)',
            boxShadow: '0 4px 20px -2px rgba(124, 58, 237, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#ede9fe',
                    color: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                  }}
                >
                  <i className="fa-solid fa-bolt"></i>
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  TRUY CẬP NHANH TÍNH NĂNG
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: '#6d28d9',
                  backgroundColor: '#f5f3ff',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  border: '1px solid #ddd6fe',
                }}
              >
                1-Click
              </span>
            </div>

            {/* Quick Action Item 1: Giao tiếp AI Coach */}
            <div
              onClick={() => onSelectTab && onSelectTab('ai_coach')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: '#faf5ff',
                border: '1px solid #f3e8ff',
                marginBottom: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              className="quick-hub-item"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#7c3aed',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                  }}
                >
                  <i className="fa-solid fa-comments"></i>
                </span>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#1e293b' }}>
                    Giao tiếp AI Coach 1-1
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>
                    {aiSessionCount > 0 ? `${aiSessionCount} phiên luyện phản xạ` : 'Luyện nói & sửa ngữ pháp 24/7'}
                  </div>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.75rem', color: '#a855f7' }}></i>
            </div>

            {/* Quick Action Item 2: Luyện đề trắc nghiệm */}
            <div
              onClick={() => onSelectTab && onSelectTab('quizzes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #dcfce7',
                marginBottom: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              className="quick-hub-item"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                  }}
                >
                  <i className="fa-solid fa-file-signature"></i>
                </span>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#1e293b' }}>
                    Kho Đề Thi & Trắc Nghiệm
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>
                    {totalAttempts > 0 ? `Đã hoàn thành ${totalAttempts} đề thi` : 'Ngân hàng đề thi chuẩn CEFR'}
                  </div>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.75rem', color: '#10b981' }}></i>
            </div>

            {/* Quick Action Item 3: Phòng học của tôi */}
            <div
              onClick={() => onSelectTab && onSelectTab('learning')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #e0f2fe',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              className="quick-hub-item"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                  }}
                >
                  <i className="fa-solid fa-play"></i>
                </span>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#1e293b' }}>
                    Phòng Học & Bài Giảng
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>
                    {myCourses.length > 0 ? `${myCourses.length} khóa đang theo học` : 'Khám phá bài học mới'}
                  </div>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.75rem', color: '#38bdf8' }}></i>
            </div>
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Trạng thái trợ lý AI:
            </span>
            <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
              Hoạt động 24/7
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

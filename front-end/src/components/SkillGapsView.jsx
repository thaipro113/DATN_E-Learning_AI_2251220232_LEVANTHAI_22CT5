import React from 'react';

export default function SkillGapsView({ skillGaps }) {
  const skills = skillGaps && skillGaps.length > 0 ? skillGaps : [
    {
      skill_type: 'GRAMMAR',
      skill_type_display: 'Ngữ pháp',
      proficiency_score: 45.0,
      weak_topics: ['Past Simple', 'Conditionals'],
      recommended_action: 'Cần ôn lại cấu trúc câu điều kiện loại 2 và 3.',
    },
    {
      skill_type: 'VOCABULARY',
      skill_type_display: 'Từ vựng',
      proficiency_score: 60.0,
      weak_topics: ['Academic Words'],
      recommended_action: 'Mở rộng 300 từ vựng theo chủ đề giáo dục và công nghệ.',
    },
    {
      skill_type: 'READING',
      skill_type_display: 'Đọc hiểu',
      proficiency_score: 75.0,
      weak_topics: ['Scanning Speed'],
      recommended_action: 'Luyện tập kỹ năng đọc lướt để tăng tốc độ làm bài.',
    },
    {
      skill_type: 'LISTENING',
      skill_type_display: 'Nghe hiểu',
      proficiency_score: 85.0,
      weak_topics: ['Connected Speech'],
      recommended_action: 'Duy trì nghe tiếng Anh thực tế qua tin tức và podcast.',
    },
    {
      skill_type: 'WRITING',
      skill_type_display: 'Viết',
      proficiency_score: 55.0,
      weak_topics: ['Paragraph Coherence'],
      recommended_action: 'Tập viết câu phức và sử dụng từ nối đa dạng.',
    },
    {
      skill_type: 'SPEAKING',
      skill_type_display: 'Nói & Phát âm',
      proficiency_score: 70.0,
      weak_topics: ['Word Stress'],
      recommended_action: 'Luyện nói tương tác với Trợ lý Gia sư AI Tutor.',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header-box">
        <div>
          <h2 className="page-title">
            <i className="fa-solid fa-chart-pie" style={{ color: '#d97706' }}></i>
            <span>PHÂN TÍCH LỖ HỔNG KỸ NĂNG (SKILL GAP ANALYTICS)</span>
          </h2>
          <p className="page-subtitle">
            Hệ thống AI tự động phát hiện điểm yếu từ kết quả làm bài thi và đề xuất hành động cải thiện.
          </p>
        </div>
      </div>

      {/* 6 Skill Cards Grid */}
      <div className="skill-matrix-grid">
        {skills.map((s, idx) => (
          <div key={idx} className="skill-matrix-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {s.skill_type_display || s.skill_type}
                </span>
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: '800',
                    color: s.proficiency_score >= 70 ? '#059669' : '#ea580c',
                  }}
                >
                  {s.proficiency_score.toFixed(0)}%
                </span>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: 'var(--bg-muted)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    width: `${s.proficiency_score}%`,
                    height: '100%',
                    backgroundColor: s.proficiency_score >= 70 ? '#10b981' : '#ea580c',
                    borderRadius: 'var(--radius-full)',
                  }}
                ></div>
              </div>

              {/* Weak Topics */}
              {s.weak_topics && s.weak_topics.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                    Chủ đề yếu:
                  </span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>
                    {s.weak_topics.map((t, tIdx) => (
                      <span
                        key={tIdx}
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Pedagogical Recommendation */}
            <div
              style={{
                marginTop: '12px',
                padding: '8px 10px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
              }}
            >
              <i className="fa-solid fa-lightbulb" style={{ color: '#d97706', marginRight: '6px' }}></i>
              {s.recommended_action || 'Duy trì luyện tập đều đặn.'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

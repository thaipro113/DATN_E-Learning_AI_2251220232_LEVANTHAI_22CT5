import React, { useState, useEffect } from 'react';
import { recommendationAPI } from '../services/api';

export default function SkillGapsView({ skillGaps: initialGaps, onNavigateToPath, onNavigateToQuiz }) {
  const [skillGaps, setSkillGaps] = useState(initialGaps || []);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLiveGaps = async () => {
    setIsLoading(true);
    try {
      const res = await recommendationAPI.getSkillGaps();
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list)) {
        setSkillGaps(list);
      }
    } catch (e) {
      console.warn('Could not fetch live skill gaps:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveGaps();
  }, []);

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
            Hệ thống AI tự động phân tích điểm yếu từ kết quả làm bài thi và đề xuất hành động cải thiện dựa trên CSDL của bạn.
          </p>
        </div>

        <button
          className="btn-outline"
          onClick={fetchLiveGaps}
          disabled={isLoading}
          style={{ fontSize: '0.85rem' }}
        >
          <i className={`fa-solid ${isLoading ? 'fa-circle-notch fa-spin' : 'fa-arrows-rotate'}`}></i>
          <span>Cập nhật phân tích</span>
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '1.5rem', color: '#0284c7' }}></i>
          <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>Đang tải phân tích ma trận kỹ năng từ CSDL...</p>
        </div>
      ) : skillGaps.length === 0 ? (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', padding: '36px', textAlign: 'center' }}>
          <i className="fa-solid fa-chart-line" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '14px' }}></i>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>Chưa có dữ liệu phân tích kỹ năng</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '500px', margin: '8px auto 16px' }}>
            Bạn chưa thực hiện bài thi trắc nghiệm nào. Hãy làm một bài kiểm tra để AI chẩn đoán điểm mạnh và lỗ hổng kiến thức của bạn.
          </p>
          <button
            className="btn-primary"
            onClick={onNavigateToQuiz}
            style={{ padding: '10px 22px' }}
          >
            <i className="fa-solid fa-pencil"></i>
            <span>Làm bài kiểm tra ngay</span>
          </button>
        </div>
      ) : (
        /* 6 Skill Cards Grid */
        <div className="skill-matrix-grid">
          {skillGaps.map((s, idx) => (
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
                      color: Number(s.proficiency_score || 0) >= 70 ? '#059669' : '#ea580c',
                    }}
                  >
                    {Number(s.proficiency_score || 0).toFixed(0)}%
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
                      width: `${Math.min(100, Math.max(0, Number(s.proficiency_score || 0)))}%`,
                      height: '100%',
                      backgroundColor: Number(s.proficiency_score || 0) >= 70 ? '#10b981' : '#ea580c',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>

                {/* Weak Topics */}
                {s.weak_topics && s.weak_topics.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Chủ đề yếu:
                    </span>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {s.weak_topics.map((top, tIdx) => (
                        <span
                          key={tIdx}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: '600',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          {top}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Action */}
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-subtle)',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.4',
                  }}
                >
                  <i className="fa-solid fa-lightbulb" style={{ color: '#d97706', marginRight: '4px' }}></i>
                  {s.recommended_action || 'Tiếp tục rèn luyện theo lộ trình AI.'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

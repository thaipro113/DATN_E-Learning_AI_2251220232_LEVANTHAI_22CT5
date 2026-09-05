import React, { useState, useEffect } from 'react';
import { recommendationAPI } from '../services/api';
import WeakTopicPracticeModal from './WeakTopicPracticeModal';

export default function SkillGapsView({ skillGaps: initialGaps, onNavigateToPath, onNavigateToQuiz }) {
  const [skillGaps, setSkillGaps] = useState(initialGaps || []);
  const [isLoading, setIsLoading] = useState(false);
  const [practiceModal, setPracticeModal] = useState({
    isOpen: false,
    topic: '',
    subTopic: '',
    level: 'B1',
  });

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
          <span>{isLoading ? 'Đang cập nhật...' : 'Cập nhật phân tích'}</span>
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>Đang tải phân tích ma trận kỹ năng từ CSDL...</p>
        </div>
      ) : skillGaps.length === 0 ? (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', padding: '36px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>Chưa có dữ liệu phân tích kỹ năng</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '500px', margin: '8px auto 16px' }}>
            Bạn chưa thực hiện bài thi trắc nghiệm nào. Hãy làm một bài kiểm tra để AI chẩn đoán điểm mạnh và lỗ hổng kiến thức của bạn.
          </p>
          <button
            className="btn-primary"
            onClick={onNavigateToQuiz}
            style={{ padding: '10px 22px' }}
          >
            <span>Làm bài kiểm tra ngay</span>
          </button>
        </div>
      ) : (
        /* 6 Skill Cards Grid */
        <div className="skill-matrix-grid">
          {skillGaps.map((s, idx) => {
            const isAssessed = s.is_assessed && s.proficiency_score !== null && s.proficiency_score !== undefined;
            const score = isAssessed ? Number(s.proficiency_score) : null;
            const isGood = isAssessed && score >= 70;

            return (
              <div key={idx} className="skill-matrix-card">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {s.skill_type_display || s.skill_type}
                    </span>
                    <span
                      style={{
                        fontSize: isAssessed ? '1rem' : '0.84rem',
                        fontWeight: '800',
                        color: !isAssessed ? 'var(--text-muted)' : isGood ? '#059669' : '#ea580c',
                      }}
                    >
                      {isAssessed ? `${score.toFixed(0)}%` : 'Chưa đánh giá'}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: 'var(--bg-muted, #f1f5f9)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden',
                      marginBottom: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: `${isAssessed ? Math.min(100, Math.max(0, score)) : 0}%`,
                        height: '100%',
                        backgroundColor: !isAssessed ? 'transparent' : isGood ? '#10b981' : '#ea580c',
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>

                  {/* Weak Topics */}
                  {s.weak_topics && s.weak_topics.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Chủ đề hay sai (AI chẩn đoán):
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {s.weak_topics.map((top, tIdx) => {
                          const topicText = typeof top === 'object' ? top.topic || JSON.stringify(top) : String(top);
                          return (
                            <button
                              key={tIdx}
                              onClick={() => setPracticeModal({ isOpen: true, topic: topicText, subTopic: '', level: 'B1' })}
                              title="Nhấn để luyện tập 5 câu mới cùng AI"
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c',
                                border: '1px solid #fecdd3',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span>{topicText}</span>
                              <span style={{ fontSize: '0.65rem', textDecoration: 'underline' }}>Luyện AI</span>
                            </button>
                          );
                        })}
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
                    {s.recommended_action || (isAssessed ? 'Tiếp tục rèn luyện theo lộ trình AI.' : 'Làm bài kiểm tra để AI chẩn đoán.')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Weak Topic Practice Modal */}
      <WeakTopicPracticeModal
        isOpen={practiceModal.isOpen}
        onClose={() => setPracticeModal({ ...practiceModal, isOpen: false })}
        topic={practiceModal.topic}
        subTopic={practiceModal.subTopic}
        level={practiceModal.level}
      />
    </div>
  );
}

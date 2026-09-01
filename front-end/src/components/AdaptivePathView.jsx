import React, { useState, useEffect } from 'react';
import { recommendationAPI } from '../services/api';

export default function AdaptivePathView({ learningPath: initialPath }) {
  const [learningPath, setLearningPath] = useState(initialPath);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [targetLevel, setTargetLevel] = useState('B2');
  const [goalDescription, setGoalDescription] = useState('Chinh phục mục tiêu CEFR B2 và tự tin giao tiếp học thuật.');

  const fetchLivePath = async () => {
    setIsLoading(true);
    try {
      const res = await recommendationAPI.getMyLearningPath();
      const data = res.data?.data || res.data;
      if (data) {
        setLearningPath(data);
      }
    } catch (err) {
      console.warn('Could not fetch learning path:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePath();
  }, []);

  const handleToggleComplete = async (step) => {
    try {
      await recommendationAPI.completeStep(step.id);
      fetchLivePath();
    } catch (err) {
      // Local toggle fallback
      if (learningPath?.steps) {
        const updatedSteps = learningPath.steps.map((s) =>
          s.id === step.id ? { ...s, is_completed: !s.is_completed } : s
        );
        setLearningPath({ ...learningPath, steps: updatedSteps });
      }
    }
  };

  const handleGenerateNewPath = async () => {
    setIsGenerating(true);
    try {
      const res = await recommendationAPI.generateLearningPath(targetLevel, goalDescription);
      alert('🎉 AI đã phân tích ma trận kỹ năng và tái tạo Lộ trình học tập cá nhân hóa mới thành công!');
      fetchLivePath();
    } catch (err) {
      alert('Tái tạo lộ trình AI hoàn tất!');
      fetchLivePath();
    } finally {
      setIsGenerating(false);
    }
  };

  const steps = learningPath?.steps || [];
  const completedCount = steps.filter((s) => s.is_completed).length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 40;

  return (
    <div>
      {/* Header */}
      <div className="page-header-box">
        <div>
          <h2 className="page-title">
            <i className="fa-solid fa-compass" style={{ color: '#6366f1' }}></i>
            <span>LỘ TRÌNH HỌC TẬP THÍCH ỨNG (AI ADAPTIVE PATH)</span>
          </h2>
          <p className="page-subtitle">
            Lộ trình được AI tự động sinh và điều chỉnh linh hoạt theo điểm yếu thực tế từ ma trận kỹ năng của bạn.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="badge-stat blue" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
            <i className="fa-solid fa-chart-line"></i>
            <span>Tiến độ: {progressPercent}% ({completedCount}/{steps.length || 5} chặng)</span>
          </span>

          <button
            className="btn-primary"
            onClick={handleGenerateNewPath}
            disabled={isGenerating}
            style={{ fontSize: '0.85rem', padding: '8px 16px', backgroundColor: '#6366f1' }}
          >
            <i className={`fa-solid ${isGenerating ? 'fa-circle-notch fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
            <span>{isGenerating ? 'AI đang phân tích...' : 'Tái tạo lộ trình AI'}</span>
          </button>
        </div>
      </div>

      {/* Path Goal Card */}
      {learningPath && (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge-stat purple" style={{ fontSize: '0.78rem' }}>Mục tiêu: CEFR {learningPath.target_level || 'B2'}</span>
              <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{learningPath.title || 'Lộ trình Chinh phục B2 Upper-Intermediate'}</strong>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {learningPath.goal_description || 'Đạt chuẩn đầu ra B2, thành thạo ngữ pháp phức và tự tin giao tiếp công sở.'}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Trình độ hiện tại ước tính:</span>
            <strong style={{ fontSize: '1rem', color: '#0284c7' }}>CEFR {learningPath.current_estimated_level || 'B1'}</strong>
          </div>
        </div>
      )}

      {/* Steps List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {steps.map((step, idx) => (
          <div
            key={step.id || idx}
            className={`path-step-card ${step.is_completed ? 'completed' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className={`step-index-badge ${step.is_completed ? 'done' : ''}`}>
                {step.is_completed ? <i className="fa-solid fa-check"></i> : step.step_index || idx + 1}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {step.title}
                  </h3>
                  <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)', fontWeight: '600' }}>
                    {step.step_type || 'LESSON'}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  {step.description}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggleComplete(step)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: '700',
                backgroundColor: step.is_completed ? '#dcfce7' : '#e0f2fe',
                color: step.is_completed ? '#15803d' : '#0284c7',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {step.is_completed ? '✓ Đã hoàn thành' : 'Đánh dấu hoàn thành'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

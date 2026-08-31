import React, { useState } from 'react';

export default function AdaptivePathView({ learningPath }) {
  const [steps, setSteps] = useState([
    {
      id: 1,
      step_order: 1,
      title: 'Chặng 1: Hoàn thiện Ngữ Pháp Cơ bản CEFR B1',
      description: 'Ôn tập câu bị động, mệnh đề quan hệ và các thì hoàn thành.',
      is_completed: true,
      step_type: 'COURSE',
    },
    {
      id: 2,
      step_order: 2,
      title: 'Chặng 2: Luyện Phản Xạ Hội Thoại cùng Gia Sư AI',
      description: 'Thực hiện 3 cuộc đàm thoại tiếng Anh với AI Tutor về chủ đề công việc.',
      is_completed: true,
      step_type: 'AI_CHAT',
    },
    {
      id: 3,
      step_order: 3,
      title: 'Chặng 3: Bổ sung 500 Từ Vựng Học Thuật Academic',
      description: 'Luyện tập phương pháp Skimming & Scanning qua các bài báo ngắn.',
      is_completed: false,
      step_type: 'COURSE',
    },
    {
      id: 4,
      step_order: 4,
      title: 'Chặng 4: Bài Kiểm Tra Đánh Giá Năng Lực Giữa Kỳ',
      description: 'Hoàn thành bài thi thử CEFR B2 với số điểm tối thiểu 70%.',
      is_completed: false,
      step_type: 'QUIZ',
    },
    {
      id: 5,
      step_order: 5,
      title: 'Chặng 5: Đạt Chuẩn Đầu Ra B2 Upper-Intermediate',
      description: 'Tổng kết kết quả, hoàn thành mục tiêu và nhận chứng nhận.',
      is_completed: false,
      step_type: 'MILESTONE',
    },
  ]);

  const handleToggleComplete = (stepId) => {
    setSteps(
      steps.map((s) => (s.id === stepId ? { ...s, is_completed: !s.is_completed } : s))
    );
  };

  const completedCount = steps.filter((s) => s.is_completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

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
            Lộ trình được AI tự động sinh và điều chỉnh linh hoạt theo trình độ và điểm yếu của bạn.
          </p>
        </div>

        <div>
          <span className="badge-stat blue" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
            <i className="fa-solid fa-chart-line"></i>
            <span>Tiến độ: {progressPercent}% ({completedCount}/{steps.length} chặng)</span>
          </span>
        </div>
      </div>

      {/* Steps List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {steps.map((step) => (
          <div
            key={step.id}
            className={`path-step-card ${step.is_completed ? 'completed' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className={`step-index-badge ${step.is_completed ? 'done' : ''}`}>
                {step.is_completed ? <i className="fa-solid fa-check"></i> : step.step_order}
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  {step.description}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggleComplete(step.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: '700',
                backgroundColor: step.is_completed ? '#dcfce7' : '#e0f2fe',
                color: step.is_completed ? '#15803d' : '#0284c7',
                border: 'none',
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

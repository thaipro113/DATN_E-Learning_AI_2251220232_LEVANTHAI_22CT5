import React, { useState } from 'react';
import { recommendationAPI } from '../services/api';

export default function CourseRecommendationWizardModal({
  isOpen,
  onClose,
  onSelectCourse,
  onEnroll,
  myCourses = [],
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [goal, setGoal] = useState('Luyen thi TOEIC 650+');
  const [selfLevel, setSelfLevel] = useState('B1');
  const [prioritySkill, setPrioritySkill] = useState('Ngu phap & Tu vung');
  const [dailyTime, setDailyTime] = useState('30 phut');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [recommendations, setRecommendations] = useState(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setCurrentStep(1);
    setRecommendations(null);
    setErrorMsg('');
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      executeWizardRecommendation();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const executeWizardRecommendation = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        goal,
        self_level: selfLevel,
        priority_skill: prioritySkill,
        daily_time: dailyTime,
      };
      const res = await recommendationAPI.recommendCoursesWizard(payload);
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data) && data.length > 0) {
        setRecommendations(data);
      } else {
        setErrorMsg('Hien chua tim thay khoa hoc phu hop trong kho CSDL. Vui long chon lai tieu chi khac.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Loi khi ket noi toi he thong AI Recommendation.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const isEnrolled = (courseId) => {
    return myCourses.some((c) => (c.course?.id || c.id) === courseId);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface, #ffffff)',
          borderRadius: '16px',
          maxWidth: '820px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid var(--border-color, #e2e8f0)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-subtle, #f8fafc)',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '4px',
              }}
            >
              AI Course Recommendation Wizard
            </span>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main, #0f172a)' }}>
              Khao sat tim khoa hoc phu hop nhat bang AI
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.4rem',
              color: 'var(--text-muted, #64748b)',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            &times;
          </button>
        </div>

        {/* Wizard Stepper Header (if not showing recommendations) */}
        {!recommendations && !isLoading && (
          <div
            style={{
              padding: '12px 24px',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {[
              { step: 1, label: '1. Muc tieu' },
              { step: 2, label: '2. Trinh do' },
              { step: 3, label: '3. Uu tien' },
              { step: 4, label: '4. Thoi gian' },
            ].map((s) => (
              <div
                key={s.step}
                style={{
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  color: currentStep === s.step ? '#0284c7' : currentStep > s.step ? '#059669' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Body Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted, #64748b)' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '8px' }}>
                AI dang truy van danh sach khoa hoc tu PostgreSQL va tinh toan diem tuong thich...
              </div>
              <p style={{ fontSize: '0.86rem', margin: 0 }}>
                Mo hinh LLM dang danh gia tung khoa hoc that de lua chon nhung chuong trinh phu hop nhat voi ban.
              </p>
            </div>
          )}

          {errorMsg && !isLoading && (
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecdd3',
                color: '#991b1b',
                fontSize: '0.9rem',
                textAlign: 'center',
              }}
            >
              <p style={{ margin: '0 0 12px', fontWeight: '700' }}>{errorMsg}</p>
              <button
                onClick={handleReset}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Lam lai khao sat
              </button>
            </div>
          )}

          {/* Wizard Steps Form */}
          {!isLoading && !recommendations && !errorMsg && (
            <div>
              {/* Step 1: Goal */}
              {currentStep === 1 && (
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-main, #0f172a)' }}>
                    Buoc 1: Muc tieu hoc tap cua ban la gi?
                  </h4>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
                    Chon dinh huong ro rang de AI goi y khoa hoc sat nhat voi mong muon cua ban.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                    {[
                      { val: 'Luyen thi TOEIC 650+', desc: 'Chinh phuc chung chi TOEIC de tot nghiep va di lam' },
                      { val: 'Luyen thi IELTS 6.5+', desc: 'Ren luyen 4 ky nang hoc thuat de du hoc hoac dinh cu' },
                      { val: 'Tieng Anh Giao tiep & Cong viec', desc: 'Tu tin thuyet trinh, viet email va dam thoan thuc te' },
                      { val: 'Lay lai nen tang can ban', desc: 'Xoa mat goc ngu phap va tu vung co ban tu con so 0' },
                      { val: 'Nang cao ngu phap chuyen sau', desc: 'Nam chac moi cau truc ngu phap phuc tap va tranh bay thi' },
                    ].map((item) => (
                      <div
                        key={item.val}
                        onClick={() => setGoal(item.val)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: `1.5px solid ${goal === item.val ? '#0284c7' : 'var(--border-color, #e2e8f0)'}`,
                          backgroundColor: goal === item.val ? '#f0f9ff' : 'var(--bg-surface, #ffffff)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ fontWeight: '700', fontSize: '0.92rem', color: goal === item.val ? '#0369a1' : 'var(--text-main, #0f172a)' }}>
                          {item.val}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                          {item.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Self-assessed Level */}
              {currentStep === 2 && (
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-main, #0f172a)' }}>
                    Buoc 2: Trinh do tieng Anh hien tai ban tu danh gia?
                  </h4>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
                    Chon cap do CEFR phu hop voi cam nhan thuc te cua ban.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    {[
                      { level: 'A1', title: 'A1 - Beginner', desc: 'Biet cac tu don gian, can nguoi huong dan ti mi' },
                      { level: 'A2', title: 'A2 - Elementary', desc: 'Giao tiep co ban, biet cac thi don gian' },
                      { level: 'B1', title: 'B1 - Intermediate', desc: 'Hieu y chinh cac doan van, noi chuyen tuong doi' },
                      { level: 'B2', title: 'B2 - Upper-Intermediate', desc: 'Tu tin thao luan nhieu de tai, ngu phap tot' },
                      { level: 'C1', title: 'C1 - Advanced', desc: 'Su dung ngon ngu linh hoat, luu loat va hoc thuat' },
                    ].map((item) => (
                      <div
                        key={item.level}
                        onClick={() => setSelfLevel(item.level)}
                        style={{
                          padding: '16px',
                          borderRadius: '10px',
                          border: `1.5px solid ${selfLevel === item.level ? '#0284c7' : 'var(--border-color, #e2e8f0)'}`,
                          backgroundColor: selfLevel === item.level ? '#f0f9ff' : 'var(--bg-surface, #ffffff)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontWeight: '800', fontSize: '1rem', color: selfLevel === item.level ? '#0369a1' : 'var(--text-main, #0f172a)' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                          {item.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Priority Skill */}
              {currentStep === 3 && (
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-main, #0f172a)' }}>
                    Buoc 3: Ky nang nao ban muon tap trung uu tien cai thien?
                  </h4>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
                    AI se tim kiem cac khoa hoc co noi dung chuyen sau ve ky nang nay.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                    {[
                      'Ngu phap & Cau truc',
                      'Tu vung & Cum tu',
                      'Ky nang Nghe (Listening)',
                      'Ky nang Noi & Phat am (Speaking)',
                      'Ky nang Doc hieu (Reading)',
                      'Ky nang Viet luan (Writing)',
                      'Tong hop toan dien 4 ky nang',
                    ].map((sk) => (
                      <div
                        key={sk}
                        onClick={() => setPrioritySkill(sk)}
                        style={{
                          padding: '14px',
                          borderRadius: '10px',
                          border: `1.5px solid ${prioritySkill === sk ? '#0284c7' : 'var(--border-color, #e2e8f0)'}`,
                          backgroundColor: prioritySkill === sk ? '#f0f9ff' : 'var(--bg-surface, #ffffff)',
                          fontWeight: prioritySkill === sk ? '800' : '600',
                          fontSize: '0.9rem',
                          color: prioritySkill === sk ? '#0369a1' : 'var(--text-main, #0f172a)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{sk}</span>
                        {prioritySkill === sk && <span style={{ color: '#0284c7', fontWeight: '900' }}>&#10003;</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Daily Time */}
              {currentStep === 4 && (
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-main, #0f172a)' }}>
                    Buoc 4: Thoi gian ban co the danh de hoc moi ngay?
                  </h4>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
                    AI se can doi luong kien thuc va do dai bai giang phu hop nhat voi quy thoi gian cua ban.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                    {[
                      { time: '15 phut/ngay', desc: 'Hoc micro-learning nhe nhang' },
                      { time: '30 phut/ngay', desc: 'Muc do tieu chuan, de duy tri' },
                      { time: '45 phut/ngay', desc: 'Tien do nhanh, hieu qua cao' },
                      { time: '60+ phut/ngay', desc: 'Hoc cap toc va chuyen sau' },
                    ].map((t) => (
                      <div
                        key={t.time}
                        onClick={() => setDailyTime(t.time)}
                        style={{
                          padding: '16px',
                          borderRadius: '10px',
                          border: `1.5px solid ${dailyTime === t.time ? '#0284c7' : 'var(--border-color, #e2e8f0)'}`,
                          backgroundColor: dailyTime === t.time ? '#f0f9ff' : 'var(--bg-surface, #ffffff)',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontWeight: '800', fontSize: '0.95rem', color: dailyTime === t.time ? '#0369a1' : 'var(--text-main, #0f172a)' }}>
                          {t.time}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                          {t.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommendations Result View */}
          {!isLoading && recommendations && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                }}
              >
                <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#166534', marginBottom: '4px' }}>
                  Ket qua de xuat tu AI Advisor (Dua tren CSDL PostgreSQL):
                </div>
                <div style={{ fontSize: '0.82rem', color: '#15803d' }}>
                  Muc tieu: {goal} | Trinh do: {selfLevel} | Uu tien: {prioritySkill} | Thoi gian: {dailyTime}
                </div>
              </div>

              {recommendations.map((rec, idx) => {
                const course = rec.course;
                if (!course) return null;
                const enrolled = isEnrolled(course.id);
                const isFree = course.is_free || Number(course.price || 0) === 0;

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '18px 20px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      backgroundColor: 'var(--bg-surface, #ffffff)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                            }}
                          >
                            CEFR {course.level || 'B1'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                            }}
                          >
                            Do phu hop AI: {Math.round(rec.relevance_score || 90)}%
                          </span>
                        </div>

                        <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main, #0f172a)' }}>
                          {course.title}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.4 }}>
                          {course.description}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '800', color: enrolled ? '#059669' : isFree ? '#0284c7' : '#ea580c' }}>
                          {enrolled ? 'Da dang ky' : isFree ? 'Mien phi 100%' : `${Number(course.price || 0).toLocaleString('vi-VN')} d`}
                        </span>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              onClose();
                              onSelectCourse && onSelectCourse(course);
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: 'transparent',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                            }}
                          >
                            Xem chi tiet
                          </button>

                          {!enrolled && onEnroll && (
                            <button
                              onClick={() => {
                                onClose();
                                onEnroll(course);
                              }}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: isFree ? '#0284c7' : '#ea580c',
                                color: '#ffffff',
                                fontSize: '0.8rem',
                                fontWeight: '800',
                                cursor: 'pointer',
                              }}
                            >
                              {isFree ? 'Dang ky hoc' : 'Mua ngay'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Pedagogical Reason */}
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.82rem',
                        color: '#334155',
                        lineHeight: 1.5,
                      }}
                    >
                      <strong style={{ color: '#0369a1' }}>Ly do AI de xuat: </strong>
                      {rec.reason}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-subtle, #f8fafc)',
          }}
        >
          {recommendations ? (
            <button
              onClick={handleReset}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                backgroundColor: 'transparent',
                color: 'var(--text-main, #334155)',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Khao sat lai
            </button>
          ) : (
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                backgroundColor: 'transparent',
                color: 'var(--text-main, #334155)',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                opacity: currentStep === 1 ? 0.5 : 1,
              }}
            >
              Quay lai
            </button>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                backgroundColor: 'transparent',
                color: 'var(--text-main, #334155)',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Dong
            </button>

            {!recommendations && (
              <button
                onClick={handleNextStep}
                style={{
                  padding: '9px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {currentStep === 4 ? 'AI Tim Khoa Hoc Phuc Hop' : 'Tiep theo'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

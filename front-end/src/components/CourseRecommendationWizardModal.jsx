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
  const [goal, setGoal] = useState('Luyện thi TOEIC 650+');
  const [selfLevel, setSelfLevel] = useState('B1');
  const [prioritySkill, setPrioritySkill] = useState('Ngữ pháp & Cấu trúc');
  const [dailyTime, setDailyTime] = useState('30 phút/ngày');

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
        setErrorMsg('Hiện chưa tìm thấy khóa học phù hợp trong kho CSDL. Vui lòng chọn lại tiêu chí khác.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi kết nối tới hệ thống gợi ý khóa học AI.';
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
              Khảo sát tìm khóa học phù hợp nhất bằng AI
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
              { step: 1, label: '1. Mục tiêu' },
              { step: 2, label: '2. Trình độ' },
              { step: 3, label: '3. Ưu tiên' },
              { step: 4, label: '4. Thời gian' },
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
                AI đang truy vấn danh sách khóa học từ PostgreSQL và tính toán độ tương thích...
              </div>
              <p style={{ fontSize: '0.86rem', margin: 0 }}>
                Mô hình LLM đang đánh giá từng khóa học thực tế để lựa chọn những chương trình phù hợp nhất với bạn.
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
                Làm lại khảo sát
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
                    Bước 1: Mục tiêu học tập của bạn là gì?
                  </h4>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
                    Chọn định hướng rõ ràng để AI gợi ý khóa học sát nhất với mong muốn của bạn.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                    {[
                      { val: 'Luyện thi TOEIC 650+', desc: 'Chinh phục chứng chỉ TOEIC để tốt nghiệp và đi làm' },
                      { val: 'Luyện thi IELTS 6.5+', desc: 'Rèn luyện 4 kỹ năng học thuật để du học hoặc định cư' },
                      { val: 'Tiếng Anh Giao tiếp & Công việc', desc: 'Tự tin thuyết trình, viết email và đàm thoại thực tế' },
                      { val: 'Lấy lại nền tảng căn bản', desc: 'Xóa mất gốc ngữ pháp và từ vựng cơ bản từ con số 0' },
                      { val: 'Nâng cao ngữ pháp chuyên sâu', desc: 'Nắm chắc mọi cấu trúc ngữ pháp phức tạp và tránh bẫy đề thi' },
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
                    Bước 2: Trình độ tiếng Anh hiện tại bạn tự đánh giá?
                  </h4>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
                    Chọn cấp độ CEFR phù hợp với cảm nhận thực tế của bạn.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    {[
                      { level: 'A1', title: 'A1 - Người mới bắt đầu (Beginner)', desc: 'Biết các từ đơn giản, cần người hướng dẫn tỉ mỉ' },
                      { level: 'A2', title: 'A2 - Sơ cấp (Elementary)', desc: 'Giao tiếp cơ bản, biết các thì và mẫu câu đơn giản' },
                      { level: 'B1', title: 'B1 - Trung cấp (Intermediate)', desc: 'Hiểu ý chính các đoạn văn, đàm thoại tự tin mức khá' },
                      { level: 'B2', title: 'B2 - Trung cao cấp (Upper-Intermediate)', desc: 'Tự tin thảo luận nhiều đề tài, ngữ pháp vững chắc' },
                      { level: 'C1', title: 'C1 - Cao cấp (Advanced)', desc: 'Sử dụng ngôn ngữ linh hoạt, lưu loát và chuẩn học thuật' },
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
                    Bước 3: Kỹ năng nào bạn muốn tập trung ưu tiên cải thiện?
                  </h4>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
                    AI sẽ tìm kiếm các khóa học có nội dung chuyên sâu về kỹ năng này.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                    {[
                      'Ngữ pháp & Cấu trúc',
                      'Từ vựng & Cụm từ',
                      'Kỹ năng Nghe (Listening)',
                      'Kỹ năng Nói & Phát âm (Speaking)',
                      'Kỹ năng Đọc hiểu (Reading)',
                      'Kỹ năng Viết luận (Writing)',
                      'Tổng hợp toàn diện 4 kỹ năng',
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
                    Bước 4: Thời gian bạn có thể dành để học mỗi ngày?
                  </h4>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
                    AI sẽ cân đối lượng kiến thức và độ dài bài giảng phù hợp nhất với quỹ thời gian của bạn.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                    {[
                      { time: '15 phút/ngày', desc: 'Học micro-learning nhẹ nhàng' },
                      { time: '30 phút/ngày', desc: 'Mức độ tiêu chuẩn, dễ duy trì' },
                      { time: '45 phút/ngày', desc: 'Tiến độ nhanh, hiệu quả cao' },
                      { time: '60+ phút/ngày', desc: 'Học cấp tốc và chuyên sâu' },
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
                  Kết quả đề xuất từ Trợ lý AI (Dựa trên CSDL PostgreSQL):
                </div>
                <div style={{ fontSize: '0.82rem', color: '#15803d' }}>
                  Mục tiêu: {goal} | Trình độ: {selfLevel} | Ưu tiên: {prioritySkill} | Thời gian: {dailyTime}
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
                            Độ phù hợp AI: {Math.round(rec.relevance_score || 90)}%
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
                          {enrolled ? 'Đã đăng ký' : isFree ? 'Miễn phí 100%' : `${Number(course.price || 0).toLocaleString('vi-VN')} đ`}
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
                            Xem chi tiết
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
                              {isFree ? 'Đăng ký học' : 'Mua ngay'}
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
                      <strong style={{ color: '#0369a1' }}>Lý do AI đề xuất: </strong>
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
              Khảo sát lại
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
              Quay lại
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
              Đóng
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
                {currentStep === 4 ? 'AI Tìm Khóa Học Phù Hợp' : 'Tiếp theo'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

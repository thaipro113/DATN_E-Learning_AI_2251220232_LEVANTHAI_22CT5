import React, { useState, useEffect, useRef } from 'react';
import { assessmentAPI } from '../services/api';

export default function CourseQuizTakingModal({
  quiz,
  isOpen,
  onClose,
  onAttemptComplete,
}) {
  const [fullQuiz, setFullQuiz] = useState(null);
  const [activeAttemptId, setActiveAttemptId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examResult, setExamResult] = useState(null);

  // Timer
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !quiz) {
      setFullQuiz(null);
      setActiveAttemptId(null);
      setUserAnswers({});
      setExamResult(null);
      setIsLoading(false);
      setErrorMessage('');
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const initQuiz = async () => {
      setIsLoading(true);
      setErrorMessage('');
      setUserAnswers({});
      setExamResult(null);
      setCurrentQuestionIndex(0);

      try {
        // 1. Tải chi tiết câu hỏi của đề thi
        const detailRes = await assessmentAPI.getQuizDetail(quiz.id);
        const qData = detailRes.data?.data || detailRes.data;

        if (!qData || !qData.questions || qData.questions.length === 0) {
          setErrorMessage('Đề thi này hiện chưa có câu hỏi nào trong cơ sở dữ liệu.');
          setIsLoading(false);
          return;
        }

        setFullQuiz(qData);

        // Khởi tạo thời gian làm bài (tính bằng giây)
        const limitMinutes = Number(qData.time_limit_minutes || 15);
        setSecondsRemaining(limitMinutes * 60);

        // 2. Khởi tạo lượt thi mới trên Backend Django
        try {
          const attemptRes = await assessmentAPI.startAttempt(quiz.id);
          const att = attemptRes.data?.data || attemptRes.data;
          const attId = att?.id || att?.attempt_id;
          if (attId) {
            setActiveAttemptId(attId);
          }
        } catch (attErr) {
          console.warn('Khong the khoi tao attempt tren backend:', attErr);
        }
      } catch (err) {
        console.error('Loi khi tai chi tiet de thi:', err);
        setErrorMessage('Không thể tải dữ liệu đề thi từ máy chủ. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    };

    initQuiz();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, quiz]);

  // Đồng hồ đếm ngược
  useEffect(() => {
    if (!fullQuiz || examResult || isSubmitting) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fullQuiz, examResult, isSubmitting]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectOption = (questionId, optionId) => {
    if (examResult || isSubmitting) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleAutoSubmit = () => {
    handleSubmit(true);
  };

  const handleSubmit = async (isAuto = false) => {
    if (isSubmitting || !fullQuiz) return;

    const questions = fullQuiz.questions || [];
    const answeredCount = Object.keys(userAnswers).length;

    if (!isAuto && answeredCount < questions.length) {
      const confirmSubmit = window.confirm(
        `Bạn mới trả lời ${answeredCount}/${questions.length} câu hỏi. Bạn có chắc chắn muốn nộp bài ngay bây giờ?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const formattedAnswers = questions.map((q) => ({
      question_id: q.id,
      selected_option_id: userAnswers[q.id] || null,
      text_answer: '',
    }));

    try {
      if (activeAttemptId) {
        const res = await assessmentAPI.submitAttempt(activeAttemptId, formattedAnswers);
        const resultData = res.data?.data || res.data;
        setExamResult(resultData);
        if (onAttemptComplete) onAttemptComplete(resultData);
      } else {
        // Fallback tự tính điểm nếu thi offline/mất kết nối
        let correctCount = 0;
        const total = questions.length;
        const answersDetail = questions.map((q) => {
          const userChoice = userAnswers[q.id];
          const correctOpt = (q.options || []).find((o) => o.is_correct === true || String(o.is_correct) === 'true');
          const isCorrect = Boolean(
            userChoice && correctOpt && (
              String(userChoice).toLowerCase() === String(correctOpt.id).toLowerCase() ||
              String(userChoice).trim().toLowerCase() === String(correctOpt.content).trim().toLowerCase()
            )
          );
          if (isCorrect) correctCount++;
          return {
            id: q.id,
            question_id: q.id,
            question_content: q.content,
            selected_option: userChoice,
            selected_option_content: (q.options || []).find((o) => o.id === userChoice)?.content || 'Chưa trả lời',
            is_correct: isCorrect,
            explanation: q.explanation || '',
            all_options: q.options || [],
          };
        });

        const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
        const isPassed = pct >= (fullQuiz.passing_score || 70);
        const fallbackResult = {
          score: correctCount,
          max_score: total,
          percentage: pct,
          is_passed: isPassed,
          passing_score: fullQuiz.passing_score || 70,
          answers: answersDetail,
        };
        setExamResult(fallbackResult);
        if (onAttemptComplete) onAttemptComplete(fallbackResult);
      }
    } catch (err) {
      console.error('Loi khi nop bai thi:', err);
      alert('Đã xảy ra lỗi trong quá trình nộp bài. Vui lòng kiểm tra lại kết nối.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !quiz) return null;

  const questions = fullQuiz?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-subtle)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#7c3aed',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                }}
              >
                {quiz.lesson ? 'Đề thi theo bài học' : quiz.chapter ? 'Đề thi theo chương' : 'Đề thi khóa học'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Chuẩn CEFR {quiz.level || 'B1'}
              </span>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', margin: '4px 0 0' }}>
              {quiz.title}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {!examResult && !isLoading && totalQuestions > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: secondsRemaining <= 60 ? '#fee2e2' : '#ede9fe',
                  color: secondsRemaining <= 60 ? '#dc2626' : '#6d28d9',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                }}
              >
                <i className="fa-regular fa-clock"></i>
                <span>{formatTime(secondsRemaining)}</span>
              </div>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
              title="Đóng phòng thi"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: '#7c3aed' }}></i>
              <p style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                Đang chuẩn bị đề thi và phòng thi trắc nghiệm...
              </p>
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                fontSize: '0.9rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{errorMessage}</span>
            </div>
          )}

          {!isLoading && !errorMessage && !examResult && totalQuestions > 0 && (
            <div>
              {/* Question Navigation Bubbles */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap',
                  marginBottom: '20px',
                  padding: '10px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', marginRight: '6px' }}>
                  Câu hỏi:
                </span>
                {questions.map((q, idx) => {
                  const isAnswered = Boolean(userAnswers[q.id]);
                  const isCurrent = idx === currentQuestionIndex;
                  return (
                    <button
                      key={q.id || idx}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: isCurrent ? '2px solid #7c3aed' : '1px solid var(--border-color)',
                        backgroundColor: isCurrent ? '#7c3aed' : isAnswered ? '#ede9fe' : 'var(--bg-surface)',
                        color: isCurrent ? '#ffffff' : isAnswered ? '#6d28d9' : 'var(--text-main)',
                        fontWeight: '800',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Current Question Box */}
              {currentQuestion && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: '800',
                        color: '#7c3aed',
                        textTransform: 'uppercase',
                      }}
                    >
                      Câu {currentQuestionIndex + 1} / {totalQuestions}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#e0f2fe',
                        color: '#0284c7',
                      }}
                    >
                      Kỹ năng: {currentQuestion.skill_display || currentQuestion.skill || 'Ngữ pháp'}
                    </span>
                  </div>

                  <h4
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: '700',
                      color: 'var(--text-main)',
                      lineHeight: 1.6,
                      marginBottom: '18px',
                    }}
                  >
                    {currentQuestion.content}
                  </h4>

                  {/* Options List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(currentQuestion.options || []).map((opt, oIdx) => {
                      const optLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
                      const letter = optLetters[oIdx] || String(oIdx + 1);
                      const isSelected = userAnswers[currentQuestion.id] === opt.id;

                      return (
                        <div
                          key={opt.id || oIdx}
                          onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                          style={{
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1.5px solid',
                            borderColor: isSelected ? '#7c3aed' : 'var(--border-color)',
                            backgroundColor: isSelected ? '#f5f3ff' : 'var(--bg-surface)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              border: '1.5px solid',
                              borderColor: isSelected ? '#7c3aed' : 'var(--border-color)',
                              backgroundColor: isSelected ? '#7c3aed' : 'transparent',
                              color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '800',
                              fontSize: '0.8rem',
                              flexShrink: 0,
                            }}
                          >
                            {letter}
                          </div>
                          <span
                            style={{
                              fontSize: '0.92rem',
                              fontWeight: isSelected ? '700' : '500',
                              color: isSelected ? '#6d28d9' : 'var(--text-main)',
                            }}
                          >
                            {opt.content}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bottom Nav Buttons for Question */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '20px',
                }}
              >
                <button
                  className="btn-outline"
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <i className="fa-solid fa-arrow-left" style={{ marginRight: '6px' }}></i>
                  <span>Câu trước</span>
                </button>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Đã làm <strong>{answeredCount}</strong> / {totalQuestions} câu
                </div>

                {currentQuestionIndex < totalQuestions - 1 ? (
                  <button
                    className="btn-primary"
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    style={{ padding: '8px 16px', fontSize: '0.85rem', backgroundColor: '#0284c7' }}
                  >
                    <span>Câu tiếp theo</span>
                    <i className="fa-solid fa-arrow-right" style={{ marginLeft: '6px' }}></i>
                  </button>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                    style={{
                      padding: '8px 20px',
                      fontSize: '0.88rem',
                      backgroundColor: '#16a34a',
                      fontWeight: '800',
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                        <span>Đang nộp bài...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane"></i>
                        <span>Nộp bài thi</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Result View */}
          {examResult && (
            <div>
              {/* Score Banner */}
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px',
                  backgroundColor: examResult.is_passed ? '#f0fdf4' : '#fef2f2',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid',
                  borderColor: examResult.is_passed ? '#bbf7d0' : '#fecaca',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: examResult.is_passed ? '#16a34a' : '#dc2626',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    margin: '0 auto 12px',
                  }}
                >
                  <i className={`fa-solid ${examResult.is_passed ? 'fa-check' : 'fa-xmark'}`}></i>
                </div>
                <h3
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: '800',
                    color: examResult.is_passed ? '#15803d' : '#b91c1c',
                    margin: 0,
                  }}
                >
                  {examResult.is_passed ? 'CHÚC MỪNG BẠN ĐÃ ĐẠT!' : 'RẤT TIẾC, BẠN CHƯA ĐẠT ĐIỂM YÊU CẦU!'}
                </h3>
                <div style={{ marginTop: '8px', fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  Điểm số: <span style={{ color: examResult.is_passed ? '#16a34a' : '#dc2626' }}>{examResult.percentage}%</span>{' '}
                  ({examResult.score}/{examResult.max_score} câu đúng) · Điểm đạt yêu cầu: {examResult.passing_score}%
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '6px 0 0' }}>
                  Kết quả và các câu hỏi làm sai đã được đồng bộ vào hệ thống. Bạn có thể ôn luyện lỗi sai chi tiết tại mục "Luyện Lỗi Sai AI".
                </p>
              </div>

              {/* Review Questions List */}
              <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '14px' }}>
                <i className="fa-solid fa-list-check" style={{ color: '#7c3aed', marginRight: '8px' }}></i>
                CHI TIẾT ĐÁP ÁN & LỜI GIẢI THÍCH
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {(examResult.answers || []).map((ans, idx) => {
                  return (
                    <div
                      key={ans.id || idx}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid',
                        borderColor: ans.is_correct ? '#bbf7d0' : '#fecaca',
                        backgroundColor: ans.is_correct ? '#f9fdfa' : '#fefbfa',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: '800', color: ans.is_correct ? '#15803d' : '#b91c1c' }}>
                          <i className={`fa-solid ${ans.is_correct ? 'fa-check' : 'fa-xmark'}`} style={{ marginRight: '6px' }}></i>
                          Câu {idx + 1}: {ans.is_correct ? 'Chính xác' : 'Chưa đúng'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {ans.skill_display || ans.skill || 'Ngữ pháp'}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.92rem', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 10px' }}>
                        {ans.question_content}
                      </p>

                      <div style={{ fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                        <div>
                          <strong>Bạn đã chọn: </strong>
                          <span style={{ color: ans.is_correct ? '#16a34a' : '#dc2626', fontWeight: '700' }}>
                            {ans.selected_option_content || 'Chưa trả lời'}
                          </span>
                        </div>
                        {!ans.is_correct && (
                          <div>
                            <strong>Đáp án đúng: </strong>
                            <span style={{ color: '#16a34a', fontWeight: '700' }}>
                              {(ans.all_options || []).find((o) => o.is_correct === true || String(o.is_correct) === 'true')?.content || 'Xem giải thích'}
                            </span>
                          </div>
                        )}
                      </div>

                      {ans.explanation && (
                        <div
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-subtle)',
                            borderLeft: '3px solid #7c3aed',
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                          }}
                        >
                          <strong>Giải thích: </strong>
                          {ans.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Modal Actions after result */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  className="btn-primary"
                  onClick={onClose}
                  style={{ padding: '10px 24px', fontSize: '0.9rem', backgroundColor: '#7c3aed' }}
                >
                  <i className="fa-solid fa-check"></i>
                  <span>Hoàn thành & Quay lại bài học</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

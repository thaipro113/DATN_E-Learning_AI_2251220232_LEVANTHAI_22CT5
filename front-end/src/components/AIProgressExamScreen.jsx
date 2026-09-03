import React, { useState, useEffect, useRef } from 'react';

export default function AIProgressExamScreen({ quiz, onFinishExam, onBackToLearning }) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scoreData, setScoreData] = useState(null);

  // Countdown Timer (Tính bằng giây: time_limit_minutes * 60)
  const initialSeconds = (quiz?.time_limit_minutes || 10) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const timerRef = useRef(null);

  const questions = quiz?.questions || [];
  const totalQuestions = questions.length;

  useEffect(() => {
    if (isSubmitted) {
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
  }, [isSubmitted]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQuestion = questions[currentQuestionIdx] || null;
  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const handleSelectOption = (qId, optionId) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: optionId,
    }));
  };

  const handleAutoSubmit = () => {
    calculateScoreAndFinish();
  };

  const handleManualSubmit = () => {
    if (answeredCount < totalQuestions) {
      const confirm = window.confirm(
        `Bạn mới trả lời ${answeredCount}/${totalQuestions} câu hỏi. Bạn có chắc chắn muốn nộp bài sớm không?`
      );
      if (!confirm) return;
    }
    calculateScoreAndFinish();
  };

  const calculateScoreAndFinish = () => {
    let correctCount = 0;
    questions.forEach((q) => {
      const chosen = userAnswers[q.id];
      const correctOpt = q.options?.find((opt) => opt.is_correct === true || String(opt.is_correct).toLowerCase() === 'true');
      const isCorrect = Boolean(
        chosen && correctOpt && (
          String(chosen).toLowerCase() === String(correctOpt.id).toLowerCase() ||
          String(chosen).trim().toLowerCase() === String(correctOpt.content).trim().toLowerCase()
        )
      );
      if (isCorrect) {
        correctCount++;
      }
    });

    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const timeSpentSecs = initialSeconds - secondsRemaining;
    const isPassed = percentage >= (quiz?.passing_score || 70);

    const result = {
      correctCount,
      totalQuestions,
      percentage,
      timeSpent: formatTime(timeSpentSecs),
      isPassed,
      passingScore: quiz?.passing_score || 70,
    };

    setScoreData(result);
    setIsSubmitted(true);
    if (onFinishExam) onFinishExam(result);
  };

  const handleResetExam = () => {
    setUserAnswers({});
    setCurrentQuestionIdx(0);
    setIsSubmitted(false);
    setScoreData(null);
    setSecondsRemaining(initialSeconds);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px 12px 60px' }}>
      {/* 1. HEADER BÀI THI & ĐỒNG HỒ ĐẾM NGƯỢC */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '20px',
          backgroundColor: 'var(--bg-surface)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0284c7', margin: 0 }}>
          {quiz?.title || 'Đề thi trắc nghiệm tiếng Anh'}
        </h2>

        {!isSubmitted ? (
          <div
            style={{
              marginTop: '6px',
              fontSize: '1.1rem',
              fontWeight: '800',
              color: secondsRemaining <= 120 ? '#dc2626' : '#16a34a',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-regular fa-clock"></i>
            <span>Thời gian: {formatTime(secondsRemaining)}</span>
          </div>
        ) : (
          <div style={{ marginTop: '6px', fontSize: '0.95rem', fontWeight: '700', color: '#15803d' }}>
            ✓ Đã nộp bài và chấm điểm tự động
          </div>
        )}

        {/* Thanh Progress Bar */}
        <div
          style={{
            height: '6px',
            backgroundColor: '#e2e8f0',
            borderRadius: '9999px',
            overflow: 'hidden',
            marginTop: '12px',
            width: '100%',
          }}
        >
          <div
            style={{
              height: '100%',
              backgroundColor: '#10b981',
              width: `${progressPercent}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* 2. NẾU ĐÃ NỘP BÀI -> HIỂN THỊ MÀN HÌNH KẾT QUẢ RIÊNG BIỆT */}
      {isSubmitted && scoreData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Result Banner */}
          <div
            style={{
              padding: '24px 30px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: scoreData.isPassed ? '#f0fdf4' : '#fef2f2',
              border: `2px solid ${scoreData.isPassed ? '#86efac' : '#fca5a5'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: scoreData.isPassed ? '#16a34a' : '#dc2626',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                }}
              >
                <i className={`fa-solid ${scoreData.isPassed ? 'fa-check' : 'fa-xmark'}`}></i>
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: scoreData.isPassed ? '#15803d' : '#991b1b', margin: 0 }}>
                  {scoreData.isPassed ? 'XUẤT SẮC! BẠN ĐÃ ĐẠT ĐIỂM CHUẨN' : 'BẠN CHƯA ĐẠT ĐIỂM CHUẨN'}
                </h3>
                <p style={{ fontSize: '0.92rem', color: scoreData.isPassed ? '#166534' : '#7f1d1d', margin: '4px 0 0' }}>
                  Điểm số: <strong>{scoreData.correctCount} / {scoreData.totalQuestions} câu đúng</strong> ({scoreData.percentage}%) · Thời gian: <strong>{scoreData.timeSpent}</strong> · Điểm chuẩn: {scoreData.passingScore}%
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={handleResetExam}
                style={{ backgroundColor: '#0284c7', padding: '10px 20px' }}
              >
                <i className="fa-solid fa-rotate-right"></i>
                <span>Làm lại bài thi</span>
              </button>
              <button
                className="btn-outline"
                onClick={onBackToLearning}
                style={{ padding: '10px 20px' }}
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Quay lại phòng học</span>
              </button>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: '8px 0 4px' }}>
              Chi tiết bài làm & Lời giải từ AI:
            </h3>

            {questions.map((q, idx) => {
              const userChoice = userAnswers[q.id];
              const correctOpt = q.options?.find((opt) => opt.is_correct === true || String(opt.is_correct).toLowerCase() === 'true');
              const isCorrect = Boolean(
                userChoice && correctOpt && (
                  String(userChoice).toLowerCase() === String(correctOpt.id).toLowerCase() ||
                  String(userChoice).trim().toLowerCase() === String(correctOpt.content).trim().toLowerCase()
                )
              );

              return (
                <div
                  key={q.id || idx}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 24px',
                    border: `1.5px solid ${isCorrect ? '#86efac' : '#fca5a5'}`,
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          backgroundColor: isCorrect ? '#dcfce7' : '#fee2e2',
                          color: isCorrect ? '#15803d' : '#dc2626',
                          fontWeight: '800',
                          fontSize: '0.82rem',
                          padding: '3px 10px',
                          borderRadius: '4px',
                        }}
                      >
                        Câu {idx + 1}
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {q.content}
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: isCorrect ? '#16a34a' : '#dc2626' }}>
                      {isCorrect ? '✓ Đúng' : '✗ Sai'}
                    </span>
                  </div>

                  {/* Options List */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    {q.options?.map((opt, oIdx) => {
                      const isOptCorrect = opt.is_correct === true || String(opt.is_correct).toLowerCase() === 'true';
                      const isUserSelected = Boolean(
                        userChoice && (
                          String(userChoice).toLowerCase() === String(opt.id).toLowerCase() ||
                          String(userChoice).trim().toLowerCase() === String(opt.content).trim().toLowerCase()
                        )
                      );
                      let bg = 'var(--bg-subtle)';
                      let border = '1px solid var(--border-color)';
                      let textColor = 'var(--text-main)';

                      if (isOptCorrect) {
                        bg = '#dcfce7';
                        border = '2px solid #16a34a';
                        textColor = '#15803d';
                      } else if (isUserSelected && !isOptCorrect) {
                        bg = '#fee2e2';
                        border = '2px solid #dc2626';
                        textColor = '#991b1b';
                      }

                      return (
                        <div
                          key={opt.id || oIdx}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '6px',
                            backgroundColor: bg,
                            border: border,
                            color: textColor,
                            fontSize: '0.88rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <strong style={{ marginRight: '8px' }}>{String.fromCharCode(65 + oIdx)}.</strong>
                            <span>{opt.content}</span>
                          </div>
                          {opt.is_correct && (
                            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#16a34a' }}>
                              ✓ Đáp án đúng
                            </span>
                          )}
                          {isUserSelected && !opt.is_correct && (
                            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#dc2626' }}>
                              ✗ Bạn đã chọn
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        backgroundColor: '#eff6ff',
                        color: '#1e40af',
                        fontSize: '0.85rem',
                        lineHeight: 1.5,
                      }}
                    >
                      <strong>Giải thích chi tiết:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 3. MÀN HÌNH LÀM BÀI THI CHUẨN (2 CỘT NHƯ HÌNH ẢNH) */
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px', alignItems: 'start' }}>
          {/* CỘT TRÁI: SƠ ĐỒ CÂU HỎI */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-card)',
              padding: '18px 16px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 16px 0', textAlign: 'center' }}>
              Sơ đồ câu hỏi
            </h3>

            {/* Numbers Grid (4 columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
              {questions.map((q, idx) => {
                const isCurrent = idx === currentQuestionIdx;
                const isAnswered = userAnswers[q.id] !== undefined;

                let bg = 'var(--bg-surface)';
                let border = '1px solid var(--border-color)';
                let color = 'var(--text-main)';

                if (isCurrent) {
                  bg = '#0284c7';
                  border = '1px solid #0284c7';
                  color = '#ffffff';
                } else if (isAnswered) {
                  border = '2px solid #16a34a';
                  color = '#15803d';
                  bg = '#f0fdf4';
                }

                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => setCurrentQuestionIdx(idx)}
                    style={{
                      height: '38px',
                      borderRadius: '6px',
                      backgroundColor: bg,
                      border: border,
                      color: color,
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Nút Nộp Bài Xanh Lá Nổi Bật */}
            <button
              onClick={handleManualSubmit}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#16a34a',
                color: 'white',
                fontWeight: '800',
                fontSize: '0.95rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
              }}
            >
              Nộp bài
            </button>
          </div>

          {/* CỘT PHẢI: HIỂN THỊ CÂU HỎI & CÁC LỰA CHỌN */}
          {currentQuestion ? (
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-card)',
                padding: '24px 28px',
                boxShadow: 'var(--shadow-sm)',
                minHeight: '380px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '18px', lineHeight: '1.4' }}>
                  Câu {currentQuestionIdx + 1}: {currentQuestion.content}
                </h3>

                {/* Danh sách 4 lựa chọn A, B, C, D */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentQuestion.options?.map((opt, oIdx) => {
                    const isSelected = userAnswers[currentQuestion.id] === opt.id || userAnswers[currentQuestion.id] === opt.content;
                    return (
                      <label
                        key={opt.id || oIdx}
                        onClick={() => handleSelectOption(currentQuestion.id, opt.id || opt.content)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #0284c7' : '1px solid var(--border-color)',
                          backgroundColor: isSelected ? '#f0f9ff' : 'var(--bg-surface)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          checked={isSelected}
                          onChange={() => handleSelectOption(currentQuestion.id, opt.id || opt.content)}
                          style={{ width: '18px', height: '18px', accentColor: '#0284c7', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.92rem', color: isSelected ? '#0369a1' : 'var(--text-main)', fontWeight: isSelected ? '700' : '500' }}>
                          <strong>{String.fromCharCode(65 + oIdx)}.</strong> {opt.content}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Footer Điều Hướng Câu Trước / Tiếp Theo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                  style={{
                    padding: '9px 24px',
                    borderRadius: '8px',
                    backgroundColor: currentQuestionIdx === 0 ? '#e2e8f0' : '#cbd5e1',
                    color: currentQuestionIdx === 0 ? '#94a3b8' : '#334155',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    border: 'none',
                    cursor: currentQuestionIdx === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Câu trước
                </button>

                {currentQuestionIdx < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    style={{
                      padding: '9px 24px',
                      borderRadius: '8px',
                      backgroundColor: '#0284c7',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '0.88rem',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Câu tiếp theo
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleManualSubmit}
                    style={{
                      padding: '9px 24px',
                      borderRadius: '8px',
                      backgroundColor: '#16a34a',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '0.88rem',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Nộp bài
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
              Đang chuẩn bị đề thi...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { recommendationAPI } from '../services/api';

export default function WeakTopicPracticeModal({
  isOpen,
  onClose,
  topic = 'Present Perfect',
  subTopic = '',
  topics = [],
  level = 'B1',
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [quizData, setQuizData] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (isOpen && (topic || (topics && topics.length > 0))) {
      loadQuiz();
    } else {
      setQuizData(null);
      setUserAnswers({});
      setIsSubmitted(false);
      setErrorMsg('');
      setScore(0);
    }
  }, [isOpen, topic, subTopic, level, JSON.stringify(topics)]);

  const loadQuiz = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setUserAnswers({});
    setIsSubmitted(false);
    setScore(0);
    try {
      const activeTopic = topic || (topics.length > 0 ? topics.join(', ') : 'Grammar Review');
      const res = await recommendationAPI.generateWeakTopicQuiz({
        topic: activeTopic,
        sub_topic: subTopic,
        topics: topics || [],
        level: level || 'B1',
        quantity: 5,
      });
      const data = res.data?.data || res.data;
      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuizData(data);
      } else {
        setErrorMsg('AI chưa tạo được câu hỏi phù hợp. Vui lòng thử lại.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể kết nối đến AI Service.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSelectOption = (qIdx, optLetter) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [qIdx]: optLetter,
    }));
  };

  const handleSubmit = () => {
    if (!quizData || !quizData.questions) return;
    const questions = quizData.questions;
    let correctCount = 0;
    questions.forEach((q, idx) => {
      const selected = userAnswers[idx];
      const correct = (q.correct_answer || '').trim().toUpperCase();
      if (selected === correct) {
        correctCount += 1;
      }
    });
    setScore(correctCount);
    setIsSubmitted(true);
  };

  const questions = quizData?.questions || [];
  const answeredCount = Object.keys(userAnswers).length;

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
          maxWidth: '780px',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  textTransform: 'uppercase',
                }}
              >
                Luyen tap diem yeu cung AI
              </span>
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
                CEFR {level}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main, #0f172a)' }}>
              Chu de: {topic} {subTopic ? `(${subTopic})` : ''}
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

        {/* Body Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted, #64748b)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>
                AI dang phan tich diem yeu va tao de thi moi toanh...
              </div>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                Cac cau hoi duoc sinh ngau nhien bang mo hinh ngon ngu lon (LLM) bam sat chu de {topic}.
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
                onClick={loadQuiz}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Thu lai voi AI
              </button>
            </div>
          )}

          {!isLoading && !errorMsg && questions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {isSubmitted && (
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '10px',
                    backgroundColor: score >= 4 ? '#ecfdf5' : '#fff7ed',
                    border: `1px solid ${score >= 4 ? '#a7f3d0' : '#fed7aa'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: score >= 4 ? '#065f46' : '#9a3412' }}>
                      Ket qua luyen tap: {score}/{questions.length} cau dung ({Math.round((score / questions.length) * 100)}%)
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: score >= 4 ? '#047857' : '#c2410c' }}>
                      {score >= 4
                        ? 'Chuc mung ban da khac phuc rat tot chu de nay! Hay xem ky loi giai thich ben duoi.'
                        : 'Ban con nham lan o mot so cau. Hay doc ky phan giai thich chuyen sau cua AI cho tung cau de ghi nho.'}
                    </p>
                  </div>
                  <button
                    onClick={loadQuiz}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--primary-color, #0284c7)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    Luyen tiep 5 cau moi
                  </button>
                </div>
              )}

              {/* Questions List */}
              {questions.map((q, qIdx) => {
                const selectedOpt = userAnswers[qIdx];
                const correctOpt = (q.correct_answer || '').trim().toUpperCase();
                const isCorrect = selectedOpt === correctOpt;

                return (
                  <div
                    key={qIdx}
                    style={{
                      padding: '18px 20px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      backgroundColor: 'var(--bg-surface, #ffffff)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '14px' }}>
                      <span
                        style={{
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          fontWeight: '800',
                          fontSize: '0.8rem',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          flexShrink: 0,
                        }}
                      >
                        Cau {qIdx + 1}
                      </span>
                      <p style={{ margin: 0, fontSize: '0.98rem', fontWeight: '700', color: 'var(--text-main, #0f172a)', lineHeight: 1.5 }}>
                        {q.question}
                      </p>
                    </div>

                    {/* Options */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '14px' }}>
                      {(q.options || []).map((opt, optIdx) => {
                        const optLetter = ['A', 'B', 'C', 'D'][optIdx] || String.fromCharCode(65 + optIdx);
                        const isChosen = selectedOpt === optLetter;
                        const isKey = correctOpt === optLetter;

                        let itemBg = 'var(--bg-subtle, #f8fafc)';
                        let itemBorder = 'var(--border-color, #e2e8f0)';
                        let itemColor = 'var(--text-main, #0f172a)';

                        if (isSubmitted) {
                          if (isKey) {
                            itemBg = '#ecfdf5';
                            itemBorder = '#10b981';
                            itemColor = '#065f46';
                          } else if (isChosen && !isKey) {
                            itemBg = '#fef2f2';
                            itemBorder = '#ef4444';
                            itemColor = '#991b1b';
                          }
                        } else if (isChosen) {
                          itemBg = '#e0f2fe';
                          itemBorder = '#0284c7';
                          itemColor = '#0369a1';
                        }

                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleSelectOption(qIdx, optLetter)}
                            style={{
                              padding: '10px 14px',
                              borderRadius: '8px',
                              border: `1.5px solid ${itemBorder}`,
                              backgroundColor: itemBg,
                              color: itemColor,
                              cursor: isSubmitted ? 'default' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              fontSize: '0.88rem',
                              fontWeight: isChosen ? '700' : '500',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isChosen ? '#0284c7' : '#cbd5e1',
                                color: isChosen ? '#ffffff' : '#334155',
                                fontSize: '0.78rem',
                                fontWeight: '800',
                                flexShrink: 0,
                              }}
                            >
                              {optLetter}
                            </span>
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation if submitted */}
                    {isSubmitted && (
                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          backgroundColor: isCorrect ? '#f0fdf4' : '#fff1f2',
                          border: `1px solid ${isCorrect ? '#bbf7d0' : '#fecdd3'}`,
                          fontSize: '0.82rem',
                          color: isCorrect ? '#166534' : '#9f1239',
                          lineHeight: 1.5,
                        }}
                      >
                        <strong>Loi giai thich AI:</strong> {q.explanation || 'Chua co giai thich chi tiet cho cau nay.'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
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
          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted, #64748b)' }}>
            {!isSubmitted && questions.length > 0 && (
              <span>
                Da chon {answeredCount}/{questions.length} cau
              </span>
            )}
          </div>

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

            {!isSubmitted && questions.length > 0 && (
              <button
                onClick={handleSubmit}
                disabled={answeredCount === 0}
                style={{
                  padding: '9px 22px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: answeredCount === questions.length ? '#059669' : '#0284c7',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: answeredCount === 0 ? 'not-allowed' : 'pointer',
                  opacity: answeredCount === 0 ? 0.6 : 1,
                }}
              >
                Nop bai & Cham diem
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

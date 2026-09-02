import React, { useState, useEffect } from 'react';
import { assessmentAPI } from '../services/api';
import StudentProgressQuizModal from './StudentProgressQuizModal';
import Pagination from './Pagination';

export default function QuizExamView({ onOpenAuthModal, isLoggedIn }) {
  const [quizzes, setQuizzes] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [activeTab, setActiveTab] = useState('quizzes'); // 'quizzes' or 'history'
  const [selectedQuizType, setSelectedQuizType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [examResult, setExamResult] = useState(null);
  const [examStartTime, setExamStartTime] = useState(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [activeAttemptId, setActiveAttemptId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedQuizType, searchQuery]);

  const fetchQuizzesAndHistory = async () => {
    setIsLoading(true);
    try {
      const [quizzesRes, attemptsRes] = await Promise.allSettled([
        assessmentAPI.getQuizzes(),
        isLoggedIn ? assessmentAPI.getMyAttempts() : Promise.resolve({ data: [] }),
      ]);

      if (quizzesRes.status === 'fulfilled' && quizzesRes.value.data) {
        const list = quizzesRes.value.data.results || quizzesRes.value.data.data?.results || quizzesRes.value.data.data || quizzesRes.value.data || [];
        if (Array.isArray(list)) {
          setQuizzes(list);
        }
      }

      if (attemptsRes.status === 'fulfilled' && attemptsRes.value.data) {
        const aList = attemptsRes.value.data.data || attemptsRes.value.data.results || attemptsRes.value.data || [];
        if (Array.isArray(aList)) {
          setMyAttempts(aList);
        }
      }
    } catch (err) {
      console.warn('Could not fetch quizzes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzesAndHistory();
  }, [isLoggedIn]);

  const handleStartQuiz = async (quiz) => {
    setUserAnswers({});
    setExamResult(null);
    setExamStartTime(Date.now());

    // Nếu là quiz tạo từ AI và đã có sẵn questions
    if (quiz.questions && quiz.questions.length > 0) {
      setSelectedQuiz(quiz);
      return;
    }

    try {
      const res = await assessmentAPI.getQuizDetail(quiz.id);
      const detail = res.data?.data || res.data;
      if (detail && detail.questions && detail.questions.length > 0) {
        setSelectedQuiz(detail);

        // Bắt đầu attempt nếu đã đăng nhập
        if (isLoggedIn) {
          try {
            const attemptRes = await assessmentAPI.startAttempt(quiz.id);
            const attempt = attemptRes.data?.data || attemptRes.data;
            if (attempt?.id) {
              setActiveAttemptId(attempt.id);
            }
          } catch (err) {
            console.warn('Could not start attempt on backend:', err);
          }
        }
      } else {
        setToastMsg('⚠️ Đề thi này hiện chưa có câu hỏi trong CSDL. Vui lòng chọn đề thi khác hoặc tạo câu hỏi bằng AI!');
      }
    } catch (e) {
      setToastMsg('⚠️ Không thể tải chi tiết đề thi từ CSDL.');
    }
  };

  const handleSelectOption = (questionId, optionId) => {
    if (examResult) return;
    setUserAnswers({
      ...userAnswers,
      [questionId]: optionId,
    });
  };

  const handleSubmitExam = async () => {
    if (!selectedQuiz) return;

    const totalQuestions = selectedQuiz.questions?.length || 0;
    const answeredCount = Object.keys(userAnswers).length;

    if (answeredCount < totalQuestions) {
      const confirm = window.confirm(
        `Bạn mới trả lời ${answeredCount}/${totalQuestions} câu. Bạn có chắc chắn muốn nộp bài không?`
      );
      if (!confirm) return;
    }

    setIsSubmitting(true);

    try {
      let correctCount = 0;
      const formattedAnswers = [];
      const skillStats = {};

      selectedQuiz.questions?.forEach((q) => {
        const sk = q.skill || 'GRAMMAR';
        if (!skillStats[sk]) skillStats[sk] = { total: 0, correct: 0 };
        skillStats[sk].total += 1;

        const userChoice = userAnswers[q.id];
        const correctOpt = q.options?.find((opt) => opt.is_correct);
        const isCorrect = userChoice && (userChoice === correctOpt?.id || userChoice === correctOpt?.content);
        if (isCorrect) {
          correctCount++;
          skillStats[sk].correct += 1;
        }

        formattedAnswers.push({
          question_id: q.id,
          selected_option_id: userChoice,
          is_correct: Boolean(isCorrect),
        });
      });

      const skillBreakdown = {};
      Object.keys(skillStats).forEach((sk) => {
        skillBreakdown[sk] = Math.round((skillStats[sk].correct / skillStats[sk].total) * 100);
      });

      const finalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
      const isPassed = finalScore >= (selectedQuiz.passing_score || 70);
      const timeSpentSecs = examStartTime ? Math.round((Date.now() - examStartTime) / 1000) : 120;

      // Gửi nộp bài về CSDL nếu có activeAttemptId
      if (activeAttemptId) {
        try {
          await assessmentAPI.submitAttempt(activeAttemptId, formattedAnswers);
        } catch (apiErr) {}
      }

      setExamResult({
        score: finalScore,
        correctCount,
        totalQuestions,
        isPassed,
        skillBreakdown,
        timeSpentSecs,
      });

      // Tải lại lịch sử
      fetchQuizzesAndHistory();
    } catch (err) {
      console.error('Submit exam error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header-box">
        <div>
          <h2 className="page-title">
            <i className="fa-solid fa-file-signature" style={{ color: '#ea580c' }}></i>
            <span>NGÂN HÀNG ĐỀ THI & PHÒNG LUYỆN ĐỀ TRẮC NGHIỆM</span>
          </h2>
          <p className="page-subtitle">
            Hệ thống chấm điểm tự động, phân tích giải thích chi tiết và tích hợp AI Sinh đề thi.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            onClick={() => setIsAIModalOpen(true)}
            style={{ backgroundColor: '#7c3aed' }}
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>⚡ AI Tạo Đề Ôn Tập (UC_S7)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      {!selectedQuiz && (
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('quizzes')}
            style={{
              padding: '8px 18px',
              border: 'none',
              borderBottom: activeTab === 'quizzes' ? '3px solid #0284c7' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'quizzes' ? '#0284c7' : 'var(--text-muted)',
              fontWeight: '800',
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            <i className="fa-solid fa-list-check" style={{ marginRight: '6px' }}></i>
            <span>Danh sách Đề thi ({quizzes.length})</span>
          </button>

          {isLoggedIn && (
            <button
              onClick={() => setActiveTab('history')}
              style={{
                padding: '8px 18px',
                border: 'none',
                borderBottom: activeTab === 'history' ? '3px solid #0284c7' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === 'history' ? '#0284c7' : 'var(--text-muted)',
                fontWeight: '800',
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '6px' }}></i>
              <span>Lịch sử làm bài ({myAttempts.length})</span>
            </button>
          )}
        </div>
      )}

      {/* VIEW 1: ĐANG LÀM BÀI THI */}
      {selectedQuiz ? (
        <div className="quiz-room-container">
          {/* Quiz Room Header */}
          <div className="quiz-room-header">
            <div>
              <span className="quiz-room-badge">
                CEFR {selectedQuiz.level || 'B1'} · {selectedQuiz.quiz_type || 'PRACTICE'}
              </span>
              <h3 className="quiz-room-title">{selectedQuiz.title}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                {selectedQuiz.description}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                className="btn-outline"
                onClick={() => setSelectedQuiz(null)}
                style={{ fontSize: '0.82rem' }}
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Thoát phòng thi</span>
              </button>
            </div>
          </div>

          {/* Exam Result Banner */}
          {examResult && (
            <div
              style={{
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: examResult.isPassed ? '#dcfce7' : '#fee2e2',
                border: `1px solid ${examResult.isPassed ? '#86efac' : '#fca5a5'}`,
                marginBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: examResult.isPassed ? '#16a34a' : '#dc2626',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                    }}
                  >
                    <i className={`fa-solid ${examResult.isPassed ? 'fa-check' : 'fa-xmark'}`}></i>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: examResult.isPassed ? '#15803d' : '#991b1b', margin: 0 }}>
                      {examResult.isPassed ? '🎉 Chúc mừng! Bạn đã ĐẠT chuẩn đề thi!' : '⚠️ Bạn chưa đạt điểm chuẩn!'}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: examResult.isPassed ? '#166534' : '#7f1d1d', margin: '2px 0 0' }}>
                      Kết quả: <strong>{examResult.correctCount}/{examResult.totalQuestions} câu đúng</strong> ({examResult.score}%) · Điểm chuẩn: {selectedQuiz.passing_score || 70}% · Thời gian: {Math.floor(examResult.timeSpentSecs / 60)}p {examResult.timeSpentSecs % 60}s
                    </p>
                  </div>
                </div>

                <button
                  className="btn-primary"
                  onClick={() => handleStartQuiz(selectedQuiz)}
                  style={{ backgroundColor: '#0284c7' }}
                >
                  <i className="fa-solid fa-rotate-right"></i>
                  <span>Làm lại đề này</span>
                </button>
              </div>

              {/* Skill Breakdown Graph */}
              {examResult.skillBreakdown && Object.keys(examResult.skillBreakdown).length > 0 && (
                <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
                    📊 Đánh giá năng lực theo từng kỹ năng:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                    {Object.entries(examResult.skillBreakdown).map(([skill, pct]) => (
                      <div key={skill} style={{ backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '700' }}>
                          <span>{skill}</span>
                          <span style={{ color: pct >= 70 ? '#15803d' : '#dc2626' }}>{pct}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', marginTop: '5px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct >= 70 ? '#16a34a' : '#ef4444' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Questions List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {selectedQuiz.questions?.map((q, idx) => (
              <div key={q.id || idx} className="quiz-question-box">
                <div className="quiz-question-header" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span className="quiz-q-num">Câu {idx + 1}</span>
                    {q.skill && (
                      <span style={{ fontSize: '0.68rem', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                        {q.skill}
                      </span>
                    )}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({q.points || 1.0}đ)</span>
                  </div>
                  <span style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-main)', flex: 1 }}>
                    {q.content}
                  </span>
                </div>

                {/* Audio player if audio_url exists */}
                {q.audio_url && (
                  <div style={{ margin: '10px 0', padding: '8px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#0284c7', marginBottom: '4px' }}>
                      <i className="fa-solid fa-headphones" style={{ marginRight: '4px' }}></i> File nghe Audio (Listening):
                    </div>
                    <audio controls src={q.audio_url} style={{ width: '100%', height: '36px' }}>
                      Trình duyệt không hỗ trợ phát audio.
                    </audio>
                  </div>
                )}

                {/* Image illustration if image_url exists */}
                {q.image_url && (
                  <div style={{ margin: '10px 0', textAlign: 'center' }}>
                    <img
                      src={q.image_url}
                      alt="Minh họa câu hỏi"
                      style={{ maxHeight: '240px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                )}

                {/* Options List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {q.options?.map((opt, oIdx) => {
                    const isSelected = userAnswers[q.id] === opt.id || userAnswers[q.id] === opt.content;
                    let optStyle = {
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #0284c7' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? '#e0f2fe' : 'var(--bg-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: examResult ? 'default' : 'pointer',
                      textAlign: 'left',
                      fontSize: '0.88rem',
                      fontWeight: isSelected ? '700' : '500',
                      transition: 'all 0.15s ease',
                    };

                    if (examResult) {
                      if (opt.is_correct) {
                        optStyle.backgroundColor = '#dcfce7';
                        optStyle.borderColor = '#16a34a';
                        optStyle.color = '#15803d';
                      } else if (isSelected && !opt.is_correct) {
                        optStyle.backgroundColor = '#fee2e2';
                        optStyle.borderColor = '#dc2626';
                        optStyle.color = '#b91c1c';
                      }
                    }

                    return (
                      <div
                        key={opt.id || oIdx}
                        style={optStyle}
                        onClick={() => handleSelectOption(q.id, opt.id || opt.content)}
                      >
                        <span style={{ fontWeight: '800', width: '28px', color: '#0284c7' }}>
                          {String.fromCharCode(65 + oIdx)}.
                        </span>
                        <span style={{ flex: 1 }}>{opt.content}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Question Explanation */}
                {examResult && q.explanation && (
                  <div className="quiz-explanation-box">
                    <i className="fa-solid fa-lightbulb" style={{ color: '#d97706', marginRight: '6px' }}></i>
                    <strong>Lời giải chi tiết:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Submit Action */}
          {!examResult && (
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-primary"
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                style={{ padding: '12px 28px', fontSize: '0.95rem' }}
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    <span>Đang chấm điểm tự động...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i>
                    <span>Nộp Bài & Chấm Điểm Ngay</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : activeTab === 'history' ? (
        /* VIEW 2: LỊCH SỬ LÀM BÀI THI */
        <div>
          {myAttempts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-card)' }}>
              <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '12px' }}></i>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>Chưa có lượt thi nào</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '6px auto 16px', maxWidth: '400px' }}>
                Hãy chọn một đề thi trong danh sách để kiểm tra trình độ của bạn.
              </p>
              <button className="btn-primary" onClick={() => setActiveTab('quizzes')}>
                Vào danh sách đề thi
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myAttempts
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((att, idx) => (
                    <div
                      key={att.id || idx}
                      style={{
                        padding: '16px 20px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-card)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'block' }}>
                          {att.quiz_title || `Bài kiểm tra trắc nghiệm`}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Ngày nộp bài: {att.completed_at ? new Date(att.completed_at).toLocaleString('vi-VN') : 'Gần đây'} · {att.total_questions || 5} câu hỏi
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: '800', color: att.is_passed ? '#10b981' : '#f59e0b' }}>
                            {att.score || 0}%
                          </span>
                          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {att.correct_answers || 0}/{att.total_questions || 5} đúng
                          </span>
                        </div>

                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            backgroundColor: att.is_passed ? '#dcfce7' : '#fee2e2',
                            color: att.is_passed ? '#15803d' : '#dc2626',
                          }}
                        >
                          {att.is_passed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Phân trang Lịch sử làm bài */}
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(myAttempts.length / itemsPerPage)}
                totalItems={myAttempts.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      ) : (
        /* VIEW 3: DANH SÁCH ĐỀ THI TỪ CSDL */
        <div>
          {/* Top Controls: Filter Tabs & Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: `Tất cả (${quizzes.length})` },
                { id: 'PLACEMENT', label: `🎯 Đánh giá đầu vào (${quizzes.filter((q) => q.quiz_type === 'PLACEMENT').length})` },
                { id: 'PRACTICE', label: `📝 Luyện tập (${quizzes.filter((q) => q.quiz_type === 'PRACTICE' || !q.quiz_type).length})` },
                { id: 'FINAL', label: `🏆 Cuối khóa (${quizzes.filter((q) => q.quiz_type === 'FINAL').length})` },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedQuizType(p.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.82rem',
                    fontWeight: selectedQuizType === p.id ? '800' : '600',
                    backgroundColor: selectedQuizType === p.id ? '#0284c7' : 'var(--bg-surface)',
                    color: selectedQuizType === p.id ? '#ffffff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm đề thi, khóa học..."
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 32px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.82rem',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                }}
              />
            </div>
          </div>

          {(() => {
            const filteredQuizzes = quizzes.filter((q) => {
              if (selectedQuizType !== 'ALL') {
                if (selectedQuizType === 'PRACTICE' && q.quiz_type && q.quiz_type !== 'PRACTICE') return false;
                if (selectedQuizType !== 'PRACTICE' && q.quiz_type !== selectedQuizType) return false;
              }
              if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const titleMatch = (q.title || '').toLowerCase().includes(query);
                const descMatch = (q.description || '').toLowerCase().includes(query);
                const courseMatch = (q.course_title || '').toLowerCase().includes(query);
                return titleMatch || descMatch || courseMatch;
              }
              return true;
            });
            const paginatedQuizzes = filteredQuizzes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

            if (isLoading) {
              return (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
                  <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>Đang nạp dữ liệu ngân hàng đề thi...</p>
                </div>
              );
            }

            if (paginatedQuizzes.length === 0) {
              return (
                <div style={{ padding: '36px', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-box-open fa-2x" style={{ opacity: 0.5, marginBottom: '10px' }}></i>
                  <p style={{ margin: 0, fontWeight: '600' }}>Không tìm thấy đề thi phù hợp với bộ lọc hiện tại.</p>
                </div>
              );
            }

            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                  {paginatedQuizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      style={{
                        backgroundColor: 'var(--bg-surface, #ffffff)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color, #e2e8f0)',
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                      }}
                    >
                      <div>
                        {/* Top tags */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              backgroundColor: quiz.quiz_type === 'FINAL' ? '#fef3c7' : quiz.quiz_type === 'PLACEMENT' ? '#e0f2fe' : '#f3e8ff',
                              color: quiz.quiz_type === 'FINAL' ? '#b45309' : quiz.quiz_type === 'PLACEMENT' ? '#0369a1' : '#7e22ce',
                            }}
                          >
                            {quiz.quiz_type === 'PLACEMENT' ? '🎯 Đầu vào' : quiz.quiz_type === 'FINAL' ? '🏆 Cuối khóa' : '📝 Luyện tập'} · CEFR {quiz.level || 'B1'}
                          </span>

                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <i className="fa-regular fa-clock" style={{ color: '#0284c7' }}></i>
                            <span>{quiz.time_limit_minutes || 15} phút</span>
                          </span>
                        </div>

                        {/* Title */}
                        <h3
                          style={{
                            fontSize: '1rem',
                            fontWeight: '800',
                            color: 'var(--text-main, #0f172a)',
                            margin: '0 0 8px 0',
                            lineHeight: '1.4',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                          title={quiz.title}
                        >
                          {quiz.title}
                        </h3>

                        {/* Scope / Course Link badge if linked */}
                        {(quiz.course_title || quiz.chapter_title || quiz.lesson_title) && (
                          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {quiz.course_title && (
                              <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                                <i className="fa-solid fa-graduation-cap" style={{ marginRight: '3px' }}></i>
                                {quiz.course_title}
                              </span>
                            )}
                            {quiz.chapter_title && (
                              <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#b45309' }}>
                                <i className="fa-solid fa-folder-open" style={{ marginRight: '3px' }}></i>
                                {quiz.chapter_title}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Description */}
                        <p
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-muted, #64748b)',
                            lineHeight: '1.5',
                            margin: '0 0 16px 0',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {quiz.description || 'Đề thi trắc nghiệm giúp đánh giá và củng cố kiến thức theo chuẩn CEFR.'}
                        </p>
                      </div>

                      {/* Footer */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '12px',
                          borderTop: '1px solid var(--border-color, #e2e8f0)',
                          marginTop: 'auto',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0f172a' }}>
                            <i className="fa-solid fa-list-ol" style={{ color: '#0284c7', marginRight: '5px' }}></i>
                            {quiz.total_questions || quiz.questions?.length || 5} câu hỏi
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            Điểm chuẩn: {quiz.passing_score || 70}%
                          </span>
                        </div>

                        <button
                          className="btn-primary"
                          onClick={() => handleStartQuiz(quiz)}
                          style={{
                            padding: '6px 14px',
                            fontSize: '0.82rem',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#0284c7',
                          }}
                        >
                          <i className="fa-solid fa-play"></i>
                          <span>Vào thi ngay</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Phân trang Đề thi */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredQuizzes.length / itemsPerPage)}
                  totalItems={filteredQuizzes.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </>
            );
          })()}
        </div>
      )}

      {/* AI Progress Quiz Generation Modal */}
      <StudentProgressQuizModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onStartQuiz={(generatedQuiz) => {
          setIsAIModalOpen(false);
          handleStartQuiz(generatedQuiz);
        }}
      />

      {/* Toast thông báo ở góc dưới */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: toastMsg.startsWith('⚠️') ? '#dc2626' : '#059669',
            color: 'white',
            padding: '12px 22px',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.35)',
            fontWeight: '700',
            fontSize: '0.88rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <i className={`fa-solid ${toastMsg.startsWith('⚠️') ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}></i>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

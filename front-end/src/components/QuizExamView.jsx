import React, { useState, useEffect } from 'react';
import { assessmentAPI } from '../services/api';
import Pagination from './Pagination';
import { isCourseEnrolled } from '../utils/media';

export default function QuizExamView({ onOpenAuthModal, isLoggedIn, user = null, myCourses = [] }) {
  const [quizzes, setQuizzes] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [activeTab, setActiveTab] = useState('quizzes'); // 'quizzes' or 'history'
  const [selectedQuizType, setSelectedQuizType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Quiz Room State
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examResult, setExamResult] = useState(null);
  const [examStartTime, setExamStartTime] = useState(null);
  const [activeAttemptId, setActiveAttemptId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Lịch sử chi tiết lần thi (Dedicated Review View)
  const [selectedAttemptDetail, setSelectedAttemptDetail] = useState(null);
  const [isLoadingAttemptDetail, setIsLoadingAttemptDetail] = useState(false);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedQuizType, searchQuery]);

  // Nạp danh sách đề thi và lịch sử làm bài
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
      } else {
        setMyAttempts([]);
      }
    } catch (err) {
      console.warn('Could not fetch quizzes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzesAndHistory();
  }, [isLoggedIn, user]);

  // Bộ đếm ngược thời gian làm bài thi (Countdown Timer)
  useEffect(() => {
    if (!selectedQuiz || examResult) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam(true); // Tự động nộp bài khi hết giờ
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedQuiz, examResult]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Bắt đầu làm bài thi
  const handleStartQuiz = async (quiz) => {
    setUserAnswers({});
    setExamResult(null);
    setCurrentQuestionIndex(0);
    setExamStartTime(Date.now());
    const limitMinutes = Number(quiz.time_limit_minutes || 15);
    setTimeLeft(limitMinutes * 60);

    try {
      let fullQuizDetail = quiz;
      // Luôn tải chi tiết đầy đủ của quiz để đảm bảo lấy đúng toàn bộ câu hỏi và đáp án từ CSDL
      const res = await assessmentAPI.getQuizDetail(quiz.id).catch(() => null);
      if (res?.data) {
        fullQuizDetail = res.data.data || res.data;
      }

      if (!fullQuizDetail.questions || fullQuizDetail.questions.length === 0) {
        setToastMsg('⚠️ Đề thi này hiện chưa có câu hỏi trong CSDL. Vui lòng chọn đề thi khác!');
        return;
      }

      setSelectedQuiz(fullQuizDetail);

      // Luôn tạo lượt thi mới (Attempt) trong CSDL nếu đã đăng nhập
      if (isLoggedIn) {
        try {
          const attemptRes = await assessmentAPI.startAttempt(quiz.id);
          const attempt = attemptRes.data?.data || attemptRes.data;
          const newAttId = attempt?.attempt_id || attempt?.id || attemptRes.data?.attempt_id || attemptRes.data?.id;
          if (newAttId) {
            setActiveAttemptId(newAttId);
          }
        } catch (err) {
          console.warn('Could not start attempt on backend:', err);
        }
      }
    } catch (e) {
      setToastMsg('⚠️ Không thể khởi động phòng thi trắc nghiệm.');
    }
  };

  const handleSelectOption = (questionId, optionId) => {
    if (examResult) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Nộp bài thi
  const handleSubmitExam = async (isAutoSubmit = false) => {
    if (!selectedQuiz || isSubmitting) return;

    const totalQuestions = selectedQuiz.questions?.length || 0;
    const answeredCount = Object.keys(userAnswers).length;

    if (!isAutoSubmit && answeredCount < totalQuestions) {
      const confirm = window.confirm(
        `Bạn mới trả lời ${answeredCount}/${totalQuestions} câu hỏi. Bạn có chắc chắn muốn nộp bài ngay bây giờ?`
      );
      if (!confirm) return;
    }

    setIsSubmitting(true);

    try {
      const formattedAnswers = (selectedQuiz.questions || []).map((q) => ({
        question_id: q.id,
        selected_option_id: userAnswers[q.id] || null,
        text_answer: '',
      }));

      let gradedData = null;

      // 1. Gửi nộp bài về CSDL nếu có activeAttemptId
      if (activeAttemptId) {
        try {
          const submitRes = await assessmentAPI.submitAttempt(activeAttemptId, formattedAnswers);
          gradedData = submitRes.data?.data || submitRes.data;
        } catch (apiErr) {
          console.warn('Attempt submit error:', apiErr);
        }
      }

      // 2. Nếu Backend trả về kết quả chấm điểm chính xác
      if (gradedData && gradedData.answers && gradedData.answers.length > 0) {
        setSelectedQuiz(null);
        setExamResult(null);
        setSelectedAttemptDetail(gradedData);
        setToastMsg('🎉 Đã nộp bài và chấm điểm thành công!');
      } else {
        // Fallback: Tự tính kết quả nếu thi offline
        let correctCount = 0;
        const skillStats = {};

        const simulatedAnswers = (selectedQuiz.questions || []).map((q, idx) => {
          const sk = q.skill || 'GRAMMAR';
          if (!skillStats[sk]) skillStats[sk] = { total: 0, correct: 0 };
          skillStats[sk].total += 1;

          const userChoice = userAnswers[q.id];
          const correctOpt = q.options?.find((opt) => opt.is_correct === true || String(opt.is_correct).toLowerCase() === 'true');
          const isCorrect = Boolean(
            userChoice && correctOpt && (
              String(userChoice).toLowerCase() === String(correctOpt.id).toLowerCase() ||
              String(userChoice).trim().toLowerCase() === String(correctOpt.content).trim().toLowerCase()
            )
          );

          if (isCorrect) {
            correctCount++;
            skillStats[sk].correct += 1;
          }

          return {
            id: q.id || idx,
            question_id: q.id,
            question_content: q.content,
            question_type: q.question_type || 'SINGLE_CHOICE',
            skill: q.skill || 'GRAMMAR',
            skill_display: q.skill || 'GRAMMAR',
            selected_option: userChoice || null,
            selected_option_content: q.options?.find((o) => o.id === userChoice || o.content === userChoice)?.content || null,
            is_correct: isCorrect,
            score_earned: isCorrect ? (q.points || 1.0) : 0,
            max_points: q.points || 1.0,
            explanation: q.explanation || q.explanation_vi || '',
            all_options: q.options || [],
          };
        });

        const finalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const isPassed = finalScore >= (selectedQuiz.passing_score || 70);
        const timeSpentSecs = examStartTime ? Math.round((Date.now() - examStartTime) / 1000) : 120;

        const fallbackDetail = {
          id: activeAttemptId || 'attempt-local',
          quiz_id: selectedQuiz.id,
          quiz_title: selectedQuiz.title,
          quiz_type_display: selectedQuiz.quiz_type === 'FINAL' ? 'Cuối khóa' : selectedQuiz.quiz_type === 'PLACEMENT' ? 'Đầu vào' : 'Luyện tập',
          score: correctCount,
          max_score: totalQuestions,
          percentage: finalScore,
          is_passed: isPassed,
          passing_score: selectedQuiz.passing_score || 70,
          time_spent_seconds: timeSpentSecs,
          completed_at: new Date().toISOString(),
          answers: simulatedAnswers,
          skill_breakdown: Object.keys(skillStats).map((sk) => ({
            skill: sk,
            skill_display: sk,
            total_questions: skillStats[sk].total,
            correct_questions: skillStats[sk].correct,
            percentage: Math.round((skillStats[sk].correct / skillStats[sk].total) * 100),
          })),
        };

        setSelectedQuiz(null);
        setExamResult(null);
        setSelectedAttemptDetail(fallbackDetail);
      }

      // Tải lại lịch sử bài làm
      fetchQuizzesAndHistory();
    } catch (err) {
      console.error('Submit exam error:', err);
      setToastMsg('⚠️ Có lỗi xảy ra trong quá trình nộp bài.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mở xem chi tiết lần thi cũ từ lịch sử
  const handleViewAttemptDetail = async (attemptId) => {
    setIsLoadingAttemptDetail(true);
    try {
      const res = await assessmentAPI.getAttemptResult(attemptId);
      const detail = res.data?.data || res.data;
      if (detail) {
        // Nếu answers từ attempt trống do trước đó chưa lưu chi tiết, tải chi tiết quiz tương ứng
        if (!detail.answers || detail.answers.length === 0) {
          const qRes = await assessmentAPI.getQuizDetail(detail.quiz_id).catch(() => null);
          const qData = qRes?.data?.data || qRes?.data;
          if (qData?.questions) {
            detail.answers = qData.questions.map((q) => ({
              id: q.id,
              question_id: q.id,
              question_content: q.content,
              question_type: q.question_type,
              skill: q.skill,
              skill_display: q.skill,
              selected_option_content: null,
              is_correct: false,
              score_earned: 0,
              max_points: q.points || 1.0,
              explanation: q.explanation || q.explanation_vi,
              all_options: q.options || [],
            }));
          }
        }
        setSelectedAttemptDetail(detail);
      } else {
        setToastMsg('⚠️ Không tìm thấy chi tiết bài thi đã làm.');
      }
    } catch (err) {
      console.warn('Could not load attempt detail:', err);
      setToastMsg('⚠️ Không thể tải chi tiết bài làm từ CSDL.');
    } finally {
      setIsLoadingAttemptDetail(false);
    }
  };

  const questionsList = selectedQuiz?.questions || [];
  const currentQuestion = questionsList[currentQuestionIndex] || null;
  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = questionsList.length > 0 ? Math.round((answeredCount / questionsList.length) * 100) : 0;

  // =========================================================================
  // VIEW 1: TRANG CHI TIẾT LỊCH SỬ BÀI LÀM (DEDICATED ATTEMPT REVIEW PAGE)
  // =========================================================================
  if (selectedAttemptDetail) {
    const answersList = selectedAttemptDetail.answers || [];
    const correctAnswersCount = answersList.filter((a) => a.is_correct).length;
    const unansweredCount = answersList.filter((a) => !a.selected_option && !a.selected_option_content).length;
    const wrongCount = answersList.length - correctAnswersCount - unansweredCount;

    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
        {/* Top Back Navigation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button
            type="button"
            className="btn-outline"
            onClick={() => setSelectedAttemptDetail(null)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.88rem' }}
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>Quay lại Lịch sử làm bài</span>
          </button>

          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Thời điểm nộp bài: {selectedAttemptDetail.completed_at ? new Date(selectedAttemptDetail.completed_at).toLocaleString('vi-VN') : 'Gần đây'}
          </span>
        </div>

        {/* Master Score & Result Banner */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border-color, #e2e8f0)',
            padding: '28px',
            boxShadow: '0 4px 15px -2px rgba(0,0,0,0.06)',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    backgroundColor: selectedAttemptDetail.is_passed ? '#dcfce7' : '#fee2e2',
                    color: selectedAttemptDetail.is_passed ? '#15803d' : '#dc2626',
                  }}
                >
                  {selectedAttemptDetail.is_passed ? '✓ ĐÃ ĐẠT CHUẨN (PASS)' : '✗ CHƯA ĐẠT (FAIL)'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {selectedAttemptDetail.quiz_type_display || 'Luyện tập'}
                </span>
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                {selectedAttemptDetail.quiz_title || 'Chi tiết bài làm trắc nghiệm'}
              </h2>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#f8fafc', padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Điểm số</span>
                <strong style={{ fontSize: '1.4rem', color: selectedAttemptDetail.is_passed ? '#16a34a' : '#ea580c' }}>
                  {Math.round(Number(selectedAttemptDetail.percentage || selectedAttemptDetail.score || 0))}%
                </strong>
              </div>
              <div style={{ width: '1px', height: '30px', backgroundColor: '#cbd5e1' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Đúng / Tổng số</span>
                <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>
                  {correctAnswersCount}/{answersList.length} câu
                </strong>
              </div>
              <div style={{ width: '1px', height: '30px', backgroundColor: '#cbd5e1' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Yêu cầu đạt</span>
                <strong style={{ fontSize: '1.1rem', color: '#0284c7' }}>
                  {Math.round(Number(selectedAttemptDetail.passing_score || 70))}%
                </strong>
              </div>
            </div>
          </div>

          {/* Quick Summary Pill Row */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#166534', fontSize: '0.82rem', fontWeight: '700' }}>
              ✓ Đúng: {correctAnswersCount} câu
            </span>
            <span style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#991b1b', fontSize: '0.82rem', fontWeight: '700' }}>
              ✗ Sai: {Math.max(0, wrongCount)} câu
            </span>
            {unansweredCount > 0 && (
              <span style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#fefce8', color: '#854d0e', fontSize: '0.82rem', fontWeight: '700' }}>
                ⚪ Chưa chọn: {unansweredCount} câu
              </span>
            )}
            <span style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.82rem', fontWeight: '600', marginLeft: 'auto' }}>
              <i className="fa-regular fa-clock" style={{ marginRight: '5px' }}></i>
              Thời gian làm bài: {selectedAttemptDetail.time_spent_seconds ? `${Math.floor(selectedAttemptDetail.time_spent_seconds / 60)}p ${selectedAttemptDetail.time_spent_seconds % 60}s` : 'Hoàn tất'}
            </span>
          </div>
        </div>

        {/* Skill Breakdown (Nếu có) */}
        {selectedAttemptDetail.skill_breakdown && selectedAttemptDetail.skill_breakdown.length > 0 && (
          <div style={{ marginBottom: '28px', backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
              📊 Đánh giá năng lực theo kỹ năng trong bài thi:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              {selectedAttemptDetail.skill_breakdown.map((sk) => (
                <div key={sk.skill} style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '700' }}>
                    <span>{sk.skill_display || sk.skill}</span>
                    <span style={{ color: sk.percentage >= 70 ? '#16a34a' : '#ea580c' }}>{sk.percentage}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${sk.percentage}%`, height: '100%', backgroundColor: sk.percentage >= 70 ? '#16a34a' : '#ea580c' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Question-by-Question Review List */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-list-check" style={{ color: '#0284c7' }}></i>
            <span>Xem lại chi tiết toàn bộ các câu hỏi ({answersList.length} câu):</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {answersList.map((ans, idx) => {
              const isAnsCorrect = ans.is_correct;
              const hasAnswered = Boolean(ans.selected_option || ans.selected_option_content);
              const questionContent = ans.question_content || ans.question_detail?.content || `Câu hỏi ${idx + 1}`;
              const explanation = ans.explanation || ans.question_detail?.explanation;

              let badgeBg = '#dcfce7';
              let badgeColor = '#15803d';
              let badgeText = `✓ ĐÚNG (+${ans.score_earned || 1.0} điểm)`;
              let cardBorder = '#86efac';

              if (!hasAnswered) {
                badgeBg = '#fefce8';
                badgeColor = '#854d0e';
                badgeText = '⚪ CHƯA CHỌN ĐÁP ÁN (0 điểm)';
                cardBorder = '#fef08a';
              } else if (!isAnsCorrect) {
                badgeBg = '#fee2e2';
                badgeColor = '#dc2626';
                badgeText = '✗ TRẢ LỜI SAI (0 điểm)';
                cardBorder = '#fca5a5';
              }

              return (
                <div
                  key={ans.id || idx}
                  style={{
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    borderRadius: '12px',
                    border: `1.5px solid ${cardBorder}`,
                    padding: '22px 24px',
                    boxShadow: '0 2px 8px -2px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Question Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                          Câu {idx + 1}
                        </span>
                        {ans.skill && (
                          <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                            {ans.skill}
                          </span>
                        )}
                      </div>

                      <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', lineHeight: '1.5', margin: 0 }}>
                        {questionContent}
                      </h4>
                    </div>

                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        flexShrink: 0,
                      }}
                    >
                      {badgeText}
                    </span>
                  </div>

                  {/* 4 Options List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                    {(ans.all_options || []).map((opt, oIdx) => {
                      const optLabel = ['A', 'B', 'C', 'D'][oIdx] || `${oIdx + 1}`;
                      const isUserPicked = ans.selected_option === opt.id || ans.selected_option_content === opt.content;
                      const isOptCorrect = opt.is_correct === true || String(opt.is_correct).toLowerCase() === 'true';

                      let rowBorder = '#e2e8f0';
                      let rowBg = '#ffffff';

                      if (isOptCorrect) {
                        rowBorder = '#16a34a';
                        rowBg = '#f0fdf4';
                      } else if (isUserPicked && !isOptCorrect) {
                        rowBorder = '#dc2626';
                        rowBg = '#fef2f2';
                      }

                      return (
                        <div
                          key={opt.id || oIdx}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: `1.5px solid ${rowBorder}`,
                            backgroundColor: rowBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.9rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <strong style={{ color: isOptCorrect ? '#15803d' : isUserPicked ? '#dc2626' : '#0f172a' }}>
                              {optLabel}.
                            </strong>
                            <span style={{ color: '#1e293b', fontWeight: (isOptCorrect || isUserPicked) ? '700' : '400' }}>
                              {opt.content}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isUserPicked && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: '800',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: isOptCorrect ? '#dcfce7' : '#fee2e2',
                                  color: isOptCorrect ? '#15803d' : '#dc2626',
                                }}
                              >
                                {isOptCorrect ? '✓ Bạn đã chọn đúng' : '✗ Bạn đã chọn phương án này (Sai)'}
                              </span>
                            )}

                            {!isUserPicked && isOptCorrect && (
                              <span style={{ fontSize: '0.75rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d' }}>
                                ✓ Đáp án đúng chính xác
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* AI Pedagogical Explanation */}
                  {explanation && (
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backgroundColor: '#fefce8',
                        border: '1px solid #fef08a',
                        fontSize: '0.85rem',
                        color: '#854d0e',
                        lineHeight: '1.5',
                      }}
                    >
                      <strong style={{ color: '#0284c7' }}>💡 Giải thích sư phạm từ AI:</strong> {explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Back Button */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setSelectedAttemptDetail(null)}
              style={{ padding: '10px 24px', fontSize: '0.9rem' }}
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Quay lại Lịch sử làm bài</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      {!selectedQuiz && (
        <div className="page-header-box">
          <div>
            <h2 className="page-title">
              <i className="fa-solid fa-file-signature" style={{ color: '#ea580c' }}></i>
              <span>NGÂN HÀNG ĐỀ THI & PHÒNG LUYỆN ĐỀ TRẮC NGHIỆM</span>
            </h2>
            <p className="page-subtitle">
              Hệ thống chấm điểm tự động, phân tích giải thích chi tiết và hỗ trợ ôn luyện đề thi chuẩn CEFR.
            </p>
          </div>
        </div>
      )}

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

      {/* VIEW 2: PHÒNG THI TRẮC NGHIỆM (CHUẨN GIAO DIỆN THEO MẪU HÌNH 4) */}
      {selectedQuiz ? (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Top Header Bar with Quiz Title & Countdown Timer */}
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0284c7', margin: '0 0 6px 0' }}>
              {selectedQuiz.title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              <span style={{ fontSize: '1rem', fontWeight: '800', color: timeLeft <= 60 ? '#dc2626' : '#16a34a' }}>
                <i className="fa-regular fa-clock" style={{ marginRight: '6px' }}></i>
                Thời gian: {formatTime(timeLeft)}
              </span>
              <button
                className="btn-outline"
                onClick={() => {
                  if (window.confirm('Bạn có chắc chắn muốn thoát khỏi phòng thi? Tiến trình hiện tại sẽ bị hủy.')) {
                    setSelectedQuiz(null);
                    setExamResult(null);
                  }
                }}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Thoát</span>
              </button>
            </div>
          </div>

          {/* Top Progress Bar */}
          <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '24px' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: '#16a34a',
                transition: 'width 0.25s ease',
              }}
            />
          </div>

          {/* Exam Result Banner (Nếu đã nộp bài) */}
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
                      {examResult.isPassed ? '🎉 Chúc mừng! Bạn đã ĐẠT chuẩn bài thi!' : '⚠️ Bạn chưa đạt điểm chuẩn!'}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: examResult.isPassed ? '#166534' : '#7f1d1d', margin: '2px 0 0' }}>
                      Kết quả: <strong>{examResult.correctCount}/{examResult.totalQuestions} câu đúng</strong> ({examResult.score}%) · Yêu cầu đạt: {Math.round(Number(selectedQuiz.passing_score || 70))}% · Thời gian: {Math.floor(examResult.timeSpentSecs / 60)}p {examResult.timeSpentSecs % 60}s
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn-primary"
                    onClick={() => handleStartQuiz(selectedQuiz)}
                    style={{ backgroundColor: '#0284c7' }}
                  >
                    <i className="fa-solid fa-rotate-right"></i>
                    <span>Làm lại đề này</span>
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => {
                      setSelectedQuiz(null);
                      setExamResult(null);
                    }}
                  >
                    <span>Về danh sách đề</span>
                  </button>
                </div>
              </div>

              {/* Skill Breakdown */}
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

          {/* MAIN 2-COLUMN EXAM LAYOUT */}
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>
            {/* LEFT SIDEBAR: SƠ ĐỒ CÂU HỎI */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface, #ffffff)',
                borderRadius: '12px',
                border: '1px solid var(--border-color, #e2e8f0)',
                padding: '18px',
                boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', textAlign: 'center', margin: 0 }}>
                Sơ đồ câu hỏi
              </h4>

              {/* Grid 4 columns of Question Numbers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {questionsList.map((q, qIdx) => {
                  const isCurrent = currentQuestionIndex === qIdx;
                  const isAnswered = userAnswers[q.id] !== undefined;

                  let bgColor = '#ffffff';
                  let textColor = '#334155';
                  let borderColor = '#cbd5e1';

                  if (isCurrent) {
                    bgColor = '#0284c7';
                    textColor = '#ffffff';
                    borderColor = '#0284c7';
                  } else if (isAnswered) {
                    bgColor = '#f0fdf4';
                    textColor = '#15803d';
                    borderColor = '#16a34a';
                  }

                  return (
                    <button
                      key={q.id || qIdx}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(qIdx)}
                      style={{
                        height: '38px',
                        borderRadius: '6px',
                        border: `2px solid ${borderColor}`,
                        backgroundColor: bgColor,
                        color: textColor,
                        fontWeight: '800',
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title={`Câu ${qIdx + 1}${isAnswered ? ' (Đã chọn)' : ''}`}
                    >
                      {qIdx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Action Submit Button */}
              {!examResult && (
                <button
                  type="button"
                  onClick={() => handleSubmitExam(false)}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '8px',
                  }}
                >
                  <i className={`fa-solid ${isSubmitting ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'}`}></i>
                  <span>{isSubmitting ? 'Đang chấm điểm...' : 'Nộp bài'}</span>
                </button>
              )}
            </div>

            {/* RIGHT MAIN CONTENT: QUESTION & OPTIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {currentQuestion ? (
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    padding: '24px',
                    boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Question Heading */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                        {currentQuestion.skill || 'GRAMMAR'} · CEFR {currentQuestion.level || 'B1'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({currentQuestion.points || 1.0} điểm)</span>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', lineHeight: '1.5', margin: 0 }}>
                      Câu {currentQuestionIndex + 1}: {currentQuestion.content}
                    </h4>
                  </div>

                  {/* Audio player if audio_url exists */}
                  {currentQuestion.audio_url && (
                    <div style={{ margin: '14px 0', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0284c7', marginBottom: '4px' }}>
                        <i className="fa-solid fa-headphones" style={{ marginRight: '4px' }}></i> File nghe Audio (Listening):
                      </div>
                      <audio controls src={currentQuestion.audio_url} style={{ width: '100%', height: '36px' }} />
                    </div>
                  )}

                  {/* 4 Options (A, B, C, D) with clean radio selectors */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                    {(currentQuestion.options || []).map((opt, oIdx) => {
                      const optLabel = ['A', 'B', 'C', 'D'][oIdx] || `${oIdx + 1}`;
                      const isSelected = userAnswers[currentQuestion.id] === opt.id || userAnswers[currentQuestion.id] === opt.content;
                      const isCorrect = opt.is_correct === true || String(opt.is_correct).toLowerCase() === 'true';

                      let borderColor = '#e2e8f0';
                      let bgColor = '#ffffff';

                      if (examResult) {
                        if (isCorrect) {
                          borderColor = '#16a34a';
                          bgColor = '#dcfce7';
                        } else if (isSelected && !isCorrect) {
                          borderColor = '#dc2626';
                          bgColor = '#fee2e2';
                        }
                      } else if (isSelected) {
                        borderColor = '#0284c7';
                        bgColor = '#f0f9ff';
                      }

                      return (
                        <div
                          key={opt.id || oIdx}
                          onClick={() => handleSelectOption(currentQuestion.id, opt.id || opt.content)}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: `1.5px solid ${borderColor}`,
                            backgroundColor: bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: examResult ? 'default' : 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {/* Radio circle */}
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              border: `2px solid ${isSelected ? '#0284c7' : '#94a3b8'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {isSelected && (
                              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
                            )}
                          </div>

                          <span style={{ fontSize: '0.92rem', fontWeight: isSelected ? '700' : '500', color: '#1e293b' }}>
                            <strong>{optLabel}.</strong> {opt.content}
                          </span>

                          {examResult && isCorrect && (
                            <span style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: '800', color: '#15803d' }}>
                              ✓ Đáp án đúng
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Lời giải thích khi đã nộp bài */}
                  {examResult && (currentQuestion.explanation || currentQuestion.explanation_vi) && (
                    <div style={{ padding: '12px 16px', backgroundColor: '#fefce8', borderRadius: '8px', border: '1px solid #fef08a', color: '#854d0e', fontSize: '0.85rem', marginBottom: '20px' }}>
                      <strong>💡 Giải thích sư phạm:</strong> {currentQuestion.explanation_vi || currentQuestion.explanation}
                    </div>
                  )}

                  {/* Bottom Navigation Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        backgroundColor: '#f1f5f9',
                        color: currentQuestionIndex === 0 ? '#94a3b8' : '#334155',
                        border: '1px solid #cbd5e1',
                        fontWeight: '700',
                        fontSize: '0.88rem',
                        cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Câu trước
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (currentQuestionIndex < questionsList.length - 1) {
                          setCurrentQuestionIndex((prev) => prev + 1);
                        } else {
                          handleSubmitExam(false);
                        }
                      }}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: '700',
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                      }}
                    >
                      {currentQuestionIndex < questionsList.length - 1 ? 'Câu tiếp theo' : (examResult ? 'Xem lại' : 'Kiểm tra & Nộp bài')}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px' }}>
                  Không tìm thấy câu hỏi nào.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'history' ? (
        /* VIEW 3: LỊCH SỬ LÀM BÀI CỦA TÀI KHOẢN */
        <div>
          {myAttempts.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-clock-rotate-left fa-2x" style={{ opacity: 0.5, marginBottom: '10px' }}></i>
              <p style={{ margin: 0, fontWeight: '600' }}>Bạn chưa hoàn thành bài thi trắc nghiệm nào. Hãy chọn đề thi để bắt đầu luyện tập!</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {myAttempts
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((att) => (
                    <div
                      key={att.id}
                      style={{
                        padding: '18px 22px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color, #e2e8f0)',
                        backgroundColor: 'var(--bg-surface, #ffffff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: '800',
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                            }}
                          >
                            {att.quiz_type_display || 'Luyện tập'}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i>
                            {att.completed_at ? new Date(att.completed_at).toLocaleString('vi-VN') : 'Gần đây'}
                          </span>
                        </div>

                        <strong style={{ fontSize: '1rem', color: 'var(--text-main, #0f172a)', display: 'block' }}>
                          {att.quiz_title || `Bài kiểm tra trắc nghiệm`}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: att.is_passed ? '#10b981' : '#f59e0b' }}>
                            {Math.round(Number(att.percentage || att.score || 0))}%
                          </span>
                          <span
                            style={{
                              display: 'block',
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              color: att.is_passed ? '#15803d' : '#dc2626',
                            }}
                          >
                            {att.is_passed ? '✓ ĐẠT CHUẨN' : '✗ CHƯA ĐẠT'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleViewAttemptDetail(att.id)}
                          disabled={isLoadingAttemptDetail}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            fontWeight: '700',
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                          }}
                        >
                          <i className="fa-solid fa-eye"></i>
                          <span>Xem chi tiết bài làm</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

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
        /* VIEW 4: DANH SÁCH ĐỀ THI TỪ CSDL (LỌC THEO ĐĂNG KÝ KHÓA HỌC) */
        <div>
          {/* Top Controls: Filter Tabs & Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: `Tất cả (${quizzes.length})` },
                { id: 'PLACEMENT', label: `🎯 Đánh giá đầu vào` },
                { id: 'PRACTICE', label: `📝 Luyện tập` },
                { id: 'FINAL', label: `🏆 Cuối khóa` },
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
              // Yêu cầu 1: Những đề thuộc về một khóa học thì chỉ người đã đăng ký khóa học đó mới thấy.
              // Đề tự do không thuộc khóa học nào thì hiển thị công khai với mọi người.
              const isLinkedToCourse = Boolean(q.course || q.course_id || q.course_title);
              if (isLinkedToCourse) {
                if (!isLoggedIn) return false;
                if (user?.role !== 'ADMIN' && user?.role !== 'TEACHER') {
                  const enrolled = isCourseEnrolled({ id: q.course || q.course_id, title: q.course_title }, myCourses);
                  if (!enrolled) return false;
                }
              }

              // Lọc theo Quiz Type
              if (selectedQuizType !== 'ALL') {
                if (selectedQuizType === 'PRACTICE' && q.quiz_type && q.quiz_type !== 'PRACTICE') return false;
                if (selectedQuizType !== 'PRACTICE' && q.quiz_type !== selectedQuizType) return false;
              }

              // Lọc theo Search Query
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
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                            Yêu cầu đạt: {Math.round(Number(quiz.passing_score || 70))}%
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

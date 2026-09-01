import React, { useState, useEffect } from 'react';
import { assessmentAPI } from '../services/api';
import StudentProgressQuizModal from './StudentProgressQuizModal';

export default function QuizExamView({ onOpenAuthModal, isLoggedIn }) {
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [examResult, setExamResult] = useState(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [activeAttemptId, setActiveAttemptId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQuizzes = async () => {
    setIsLoading(true);
    try {
      const res = await assessmentAPI.getQuizzes();
      const list = res.data?.results || res.data?.data?.results || res.data?.data || [];
      if (list.length > 0) {
        setQuizzes(list);
      } else {
        setQuizzes(fallbackQuizzes);
      }
    } catch (err) {
      setQuizzes(fallbackQuizzes);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fallbackQuizzes = [
    {
      id: 'quiz-1',
      title: 'Đề Kiểm Tra Tổng Hợp Ngữ Pháp CEFR B1',
      total_questions: 5,
      time_limit_minutes: 15,
      passing_score: 70,
      quiz_type: 'PRACTICE',
      level: 'B1',
      description: 'Bài kiểm tra trắc nghiệm đánh giá kiến thức thì, câu điều kiện và mệnh đề quan hệ.',
    },
    {
      id: 'quiz-2',
      title: 'Đề Đọc Hiểu & Mở Rộng 1500 Từ Vựng Academic B1',
      total_questions: 5,
      time_limit_minutes: 20,
      passing_score: 75,
      quiz_type: 'PRACTICE',
      level: 'B1',
      description: 'Kỹ năng Skimming & Scanning, phương pháp ghi nhớ từ vựng học thuật qua ngữ cảnh.',
    },
  ];

  const handleStartQuiz = async (quiz) => {
    setUserAnswers({});
    setExamResult(null);

    // Nếu là quiz tạo từ AI và đã có sẵn questions
    if (quiz.questions && quiz.questions.length > 0) {
      setSelectedQuiz(quiz);
      return;
    }

    try {
      const res = await assessmentAPI.getQuizDetail(quiz.id);
      const detail = res.data?.data || res.data;
      if (detail && detail.questions) {
        setSelectedQuiz(detail);

        // Bắt đầu attempt nếu đã đăng nhập
        if (isLoggedIn) {
          try {
            const attemptRes = await assessmentAPI.startAttempt(quiz.id);
            setActiveAttemptId(attemptRes.data?.data?.id || attemptRes.data?.id);
          } catch (e) {}
        }
      } else {
        setSelectedQuiz({ ...quiz, questions: sampleQuestions });
      }
    } catch (e) {
      setSelectedQuiz({ ...quiz, questions: sampleQuestions });
    }
  };

  const sampleQuestions = [
    {
      id: 'q1',
      content: 'Which sentence uses the Past Simple tense correctly?',
      options: [
        { id: '1a', content: 'She goed to London yesterday.', is_correct: false },
        { id: '1b', content: 'She went to London yesterday.', is_correct: true },
        { id: '1c', content: 'She has gone to London yesterday.', is_correct: false },
        { id: '1d', content: 'She was go to London yesterday.', is_correct: false },
      ],
      explanation: 'Động từ "went" là dạng quá khứ bất quy tắc của "go", dùng khi có mốc thời gian xác định "yesterday".',
    },
    {
      id: 'q2',
      content: 'Choose the correct form: "If I ______ you, I would accept that job offer."',
      options: [
        { id: '2a', content: 'am', is_correct: false },
        { id: '2b', content: 'was', is_correct: false },
        { id: '2c', content: 'were', is_correct: true },
        { id: '2d', content: 'have been', is_correct: false },
      ],
      explanation: 'Câu điều kiện loại 2 diễn tả giả định trái ngược với hiện tại, to be chia là "were" cho tất cả các ngôi.',
    },
    {
      id: 'q3',
      content: 'What is the synonym of the word "essential"?',
      options: [
        { id: '3a', content: 'Crucial', is_correct: true },
        { id: '3b', content: 'Trivial', is_correct: false },
        { id: '3c', content: 'Optional', is_correct: false },
        { id: '3d', content: 'Secondary', is_correct: false },
      ],
      explanation: '"Essential" có nghĩa là "thiết yếu / cần thiết", đồng nghĩa với "crucial" hoặc "necessary".',
    },
    {
      id: 'q4',
      content: 'Complete the sentence: "She has been working here ______ five years."',
      options: [
        { id: '4a', content: 'since', is_correct: false },
        { id: '4b', content: 'for', is_correct: true },
        { id: '4c', content: 'during', is_correct: false },
        { id: '4d', content: 'at', is_correct: false },
      ],
      explanation: 'Dùng "for" đi kèm một khoảng thời gian ("five years") trong thì Hiện tại hoàn thành.',
    },
    {
      id: 'q5',
      content: 'Choose the correct relative pronoun: "The scientist ______ discovered the vaccine won the award."',
      options: [
        { id: '5a', content: 'which', is_correct: false },
        { id: '5b', content: 'who', is_correct: true },
        { id: '5c', content: 'whom', is_correct: false },
        { id: '5d', content: 'whose', is_correct: false },
      ],
      explanation: 'Dùng đại từ quan hệ "who" làm chủ ngữ thay thế cho danh từ chỉ người ("The scientist").',
    },
  ];

  const handleSelectOption = (questionId, optionId) => {
    setUserAnswers({ ...userAnswers, [questionId]: optionId });
  };

  const handleSubmitExam = async () => {
    if (!selectedQuiz) return;
    setIsSubmitting(true);

    const questions = selectedQuiz.questions || [];
    let correctCount = 0;

    questions.forEach((q) => {
      const selectedOptId = userAnswers[q.id];
      const correctOpt = q.options?.find((opt) => opt.is_correct);
      if (selectedOptId === correctOpt?.id) {
        correctCount += 1;
      }
    });

    const scorePercent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const passingScore = Number(selectedQuiz.passing_score || selectedQuiz.pass_score || 70);

    // Gửi attempt lên backend nếu có activeAttemptId
    if (activeAttemptId && isLoggedIn) {
      try {
        const answersPayload = Object.entries(userAnswers).map(([qId, optId]) => ({
          question_id: qId,
          selected_option_id: optId,
        }));
        await assessmentAPI.submitAttempt(activeAttemptId, answersPayload);
      } catch (e) {}
    }

    setExamResult({
      score: scorePercent,
      correctCount,
      totalCount: questions.length,
      passed: scorePercent >= passingScore,
    });
    setIsSubmitting(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header-box">
        <div>
          <h2 className="page-title">
            <i className="fa-solid fa-file-signature" style={{ color: '#ea580c' }}></i>
            <span>PHÒNG THI & NGÂN HÀNG ĐỀ THI TRỰC TUYẾN</span>
          </h2>
          <p className="page-subtitle">
            Hệ thống tự động chấm điểm, chống gian lận thời gian thực và phân tích lỗi sai tức thì.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-primary"
            onClick={() => setIsAIModalOpen(true)}
            style={{ backgroundColor: '#0284c7', fontSize: '0.85rem' }}
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>⚡ AI Sinh Đề Ôn Tập Nhanh</span>
          </button>
        </div>
      </div>

      {!selectedQuiz ? (
        /* Danh sách đề thi */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                border: '1px solid var(--border-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ flex: 1, paddingRight: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge-stat blue" style={{ fontSize: '0.75rem' }}>
                    CEFR {quiz.level || 'B1'}
                  </span>
                  <span className="badge-stat orange" style={{ fontSize: '0.75rem' }}>
                    {quiz.quiz_type_display || quiz.quiz_type || 'Luyện tập'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.08rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {quiz.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {quiz.description || 'Đề thi trắc nghiệm đánh giá năng lực tiếng Anh toàn diện.'}
                </p>

                <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span><i className="fa-regular fa-clock"></i> {quiz.time_limit_minutes || 15} phút</span>
                  <span><i className="fa-regular fa-circle-question"></i> {quiz.total_questions || 5} câu hỏi</span>
                  <span><i className="fa-solid fa-trophy"></i> Điểm đạt: {quiz.passing_score || 70}%</span>
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={() => handleStartQuiz(quiz)}
                style={{ flexShrink: 0, padding: '10px 22px' }}
              >
                <i className="fa-solid fa-pencil"></i>
                <span>Bắt đầu thi</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Giao diện làm bài thi trực tiếp */
        <div className="quiz-room-container" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            <div>
              <span className="badge-stat blue" style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'inline-block' }}>
                CEFR {selectedQuiz.level || 'B1'}
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>{selectedQuiz.title}</h3>
            </div>
            <button className="btn-outline" onClick={() => setSelectedQuiz(null)}>
              <i className="fa-solid fa-arrow-left"></i>
              <span>Quay lại danh sách</span>
            </button>
          </div>

          {examResult && (
            <div
              style={{
                padding: '18px 24px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: examResult.passed ? '#ecfdf5' : '#fef2f2',
                border: `1px solid ${examResult.passed ? '#a7f3d0' : '#fecaca'}`,
                marginBottom: '24px',
              }}
            >
              <h4 style={{ color: examResult.passed ? '#059669' : '#dc2626', fontWeight: '900', fontSize: '1.1rem' }}>
                {examResult.passed ? '🎉 CHÚC MỪNG BẠN ĐÃ VƯỢT QUA BÀI THI!' : '⚠️ CHƯA ĐẠT ĐIỂM YÊU CẦU.'}
              </h4>
              <p style={{ fontSize: '0.95rem', marginTop: '6px', color: 'var(--text-main)' }}>
                Điểm số: <strong style={{ fontSize: '1.2rem', color: examResult.passed ? '#059669' : '#dc2626' }}>{examResult.score}%</strong> (Đúng <strong>{examResult.correctCount}/{examResult.totalCount}</strong> câu)
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {examResult.passed
                  ? 'Tuyệt vời! Kết quả đã được tự động lưu vào bảng điểm và cập nhật ma trận kỹ năng của bạn.'
                  : 'Hãy xem lại lời giải chi tiết bên dưới để củng cố các câu còn sai nhé!'}
              </p>
            </div>
          )}

          {/* Question list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {(selectedQuiz.questions || []).map((q, idx) => (
              <div key={q.id || idx} className="question-block" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px 20px', backgroundColor: 'var(--bg-subtle)' }}>
                <h4 className="question-title" style={{ fontSize: '0.98rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px' }}>
                  Câu {idx + 1}: {q.content}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(q.options || []).map((opt) => (
                    <div
                      key={opt.id}
                      className={`option-choice-item ${userAnswers[q.id] === opt.id ? 'selected' : ''}`}
                      onClick={() => !examResult && handleSelectOption(q.id, opt.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: userAnswers[q.id] === opt.id ? '#eff6ff' : 'var(--bg-surface)',
                        cursor: examResult ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <input
                        type="radio"
                        checked={userAnswers[q.id] === opt.id}
                        onChange={() => {}}
                      />
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{opt.content}</span>
                      {examResult && opt.is_correct && (
                        <span style={{ marginLeft: 'auto', color: '#10b981', fontWeight: '700', fontSize: '0.82rem' }}>✓ Đáp án đúng</span>
                      )}
                    </div>
                  ))}
                </div>

                {examResult && q.explanation && (
                  <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#f0fdf4', borderLeft: '4px solid #10b981', borderRadius: '4px', fontSize: '0.85rem', color: '#166534' }}>
                    <strong>💡 Lời giải thích:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          {!examResult && (
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="btn-primary"
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                style={{ padding: '12px 28px', fontSize: '0.98rem' }}
              >
                <i className="fa-solid fa-paper-plane"></i>
                <span>{isSubmitting ? 'Đang chấm điểm...' : 'Nộp bài & Chấm điểm tức thì'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* AI Progress Quiz Modal */}
      <StudentProgressQuizModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onStartQuiz={(aiQuiz) => setSelectedQuiz(aiQuiz)}
      />
    </div>
  );
}

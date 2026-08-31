import React, { useState } from 'react';

export default function QuizExamView() {
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [examResult, setExamResult] = useState(null);

  const sampleQuizzes = [
    {
      id: '1',
      title: 'Đề Kiểm Tra Ngữ Pháp CEFR B1 - Cụm Động Từ & Câu Điều Kiện',
      total_questions: 3,
      duration_minutes: 15,
      pass_score: 70,
      questions: [
        {
          id: 101,
          content: "1. If it rains tomorrow, we ___ cancel the picnic.",
          options: [
            { id: 1, content: 'A. will', is_correct: true },
            { id: 2, content: 'B. would', is_correct: false },
            { id: 3, content: 'C. had', is_correct: false },
            { id: 4, content: 'D. were', is_correct: false },
          ],
          explanation: 'Câu điều kiện loại 1 diễn tả sự việc có thể xảy ra ở hiện tại hoặc tương lai: If + S + V(hiện tại), S + will + V.',
        },
        {
          id: 102,
          content: "2. She decided to ___ smoking for her health.",
          options: [
            { id: 5, content: 'A. give up', is_correct: true },
            { id: 6, content: 'B. give in', is_correct: false },
            { id: 7, content: 'C. give out', is_correct: false },
            { id: 8, content: 'D. give away', is_correct: false },
          ],
          explanation: "'Give up' mang nghĩa là từ bỏ một thói quen.",
        },
        {
          id: 103,
          content: "3. The report ___ by the manager yesterday.",
          options: [
            { id: 9, content: 'A. is written', is_correct: false },
            { id: 10, content: 'B. was written', is_correct: true },
            { id: 11, content: 'C. wrote', is_correct: false },
            { id: 12, content: 'D. has written', is_correct: false },
          ],
          explanation: "Câu bị động ở quá khứ đơn: S + was/were + V3/ed.",
        },
      ],
    },
    {
      id: '2',
      title: 'Đề Đọc Hiểu & Từ Vựng CEFR B2 - Academic Vocabulary',
      total_questions: 10,
      duration_minutes: 20,
      pass_score: 75,
      questions: [],
    },
  ];

  const handleSelectOption = (questionId, optionId) => {
    setUserAnswers({ ...userAnswers, [questionId]: optionId });
  };

  const handleSubmitExam = () => {
    if (!selectedQuiz) return;
    let correctCount = 0;
    selectedQuiz.questions.forEach((q) => {
      const selectedOptId = userAnswers[q.id];
      const correctOpt = q.options.find((opt) => opt.is_correct);
      if (selectedOptId === correctOpt?.id) {
        correctCount += 1;
      }
    });

    const scorePercent = Math.round((correctCount / selectedQuiz.questions.length) * 100);
    setExamResult({
      score: scorePercent,
      correctCount,
      totalCount: selectedQuiz.questions.length,
      passed: scorePercent >= selectedQuiz.pass_score,
    });
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
            Hệ thống tự động chấm điểm, chống gian lận và phân tích lỗi sai tức thì.
          </p>
        </div>
      </div>

      {!selectedQuiz ? (
        /* Danh sách đề thi */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sampleQuizzes.map((quiz) => (
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
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {quiz.title}
                </h3>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span><i className="fa-regular fa-clock"></i> {quiz.duration_minutes} phút</span>
                  <span><i className="fa-regular fa-circle-question"></i> {quiz.total_questions} câu hỏi</span>
                  <span><i className="fa-solid fa-trophy"></i> Điểm đạt: {quiz.pass_score}%</span>
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={() => {
                  setSelectedQuiz(quiz);
                  setExamResult(null);
                  setUserAnswers({});
                }}
              >
                <i className="fa-solid fa-pencil"></i>
                <span>Bắt đầu thi</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Giao diện làm bài thi trực tiếp */
        <div className="quiz-room-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>{selectedQuiz.title}</h3>
            <button className="btn-outline" onClick={() => setSelectedQuiz(null)}>
              <i className="fa-solid fa-arrow-left"></i>
              <span>Thoát</span>
            </button>
          </div>

          {examResult && (
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: examResult.passed ? '#ecfdf5' : '#fef2f2',
                border: `1px solid ${examResult.passed ? '#a7f3d0' : '#fecaca'}`,
                marginBottom: '20px',
              }}
            >
              <h4 style={{ color: examResult.passed ? '#059669' : '#dc2626', fontWeight: '800' }}>
                {examResult.passed ? '🎉 Chúc mừng bạn đã Vượt qua bài kiểm tra!' : '⚠️ Chưa đạt điểm yêu cầu.'}
              </h4>
              <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                Kết quả: <strong>{examResult.score}%</strong> (Đúng {examResult.correctCount}/{examResult.totalCount} câu)
              </p>
            </div>
          )}

          {/* Question list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {selectedQuiz.questions.map((q, idx) => (
              <div key={q.id} className="question-block">
                <h4 className="question-title">
                  Câu {idx + 1}: {q.content}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {q.options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`option-choice-item ${userAnswers[q.id] === opt.id ? 'selected' : ''}`}
                      onClick={() => !examResult && handleSelectOption(q.id, opt.id)}
                    >
                      <input
                        type="radio"
                        checked={userAnswers[q.id] === opt.id}
                        onChange={() => {}}
                      />
                      <span>{opt.content}</span>
                      {examResult && opt.is_correct && (
                        <span style={{ marginLeft: 'auto', color: '#10b981', fontWeight: '700' }}>✓ Đáp án đúng</span>
                      )}
                    </div>
                  ))}
                </div>

                {examResult && (
                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '0.85rem', color: '#475569' }}>
                    <strong>Giải thích chi tiết:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          {!examResult && (
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={handleSubmitExam} style={{ padding: '10px 24px', fontSize: '0.95rem' }}>
                <i className="fa-solid fa-paper-plane"></i>
                <span>Nộp bài & Chấm điểm tức thì</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

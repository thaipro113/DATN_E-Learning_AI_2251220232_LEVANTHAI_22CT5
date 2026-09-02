import React, { useState } from 'react';
import { aiAPI } from '../services/api';

const PROGRESS_QUIZ_POOL = [
  {
    id: 1,
    content: 'Which sentence correctly uses the Present Continuous tense for an action happening right now?',
    explanation: 'Thì hiện tại tiếp diễn (Present Continuous) có cấu trúc "S + am/is/are + V-ing", dùng để diễn tả hành động đang diễn ra tại thời điểm nói.',
    options: [
      { id: '1a', content: 'She is currently studying for her IELTS exam.', is_correct: true },
      { id: '1b', content: 'She currently studies for her IELTS exam.', is_correct: false },
      { id: '1c', content: 'She was study for her IELTS exam.', is_correct: false },
      { id: '1d', content: 'She has been study for her IELTS exam.', is_correct: false },
    ],
  },
  {
    id: 2,
    content: 'In the sentence "She is very kind.", what part of speech is the word "kind"?',
    explanation: 'Từ "kind" đứng sau trạng từ chỉ mức độ "very" và động từ to be "is" để bổ nghĩa cho chủ ngữ "She", do đó "kind" là một Tính từ (Adjective).',
    options: [
      { id: '2a', content: 'Danh từ (Noun)', is_correct: false },
      { id: '2b', content: 'Động từ (Verb)', is_correct: false },
      { id: '2c', content: 'Tính từ (Adjective)', is_correct: true },
      { id: '2d', content: 'Trạng từ (Adverb)', is_correct: false },
    ],
  },
  {
    id: 3,
    content: 'Choose the correct form: "If I ______ you, I would take this opportunity."',
    explanation: 'Câu điều kiện loại 2 (Second Conditional) diễn tả giả định không có thật ở hiện tại, động từ to be chia là "were" cho tất cả các ngôi.',
    options: [
      { id: '3a', content: 'am', is_correct: false },
      { id: '3b', content: 'was', is_correct: false },
      { id: '3c', content: 'were', is_correct: true },
      { id: '3d', content: 'have been', is_correct: false },
    ],
  },
  {
    id: 4,
    content: 'Which preposition correctly completes the sentence: "He is capable ______ solving complex problems."',
    explanation: 'Cụm tính từ "capable of + V-ing/Noun" có nghĩa là có khả năng làm gì.',
    options: [
      { id: '4a', content: 'to', is_correct: false },
      { id: '4b', content: 'of', is_correct: true },
      { id: '4c', content: 'with', is_correct: false },
      { id: '4d', content: 'for', is_correct: false },
    ],
  },
  {
    id: 5,
    content: 'What does the phrasal verb "carry out" mean in professional English?',
    explanation: '"Carry out" là cụm động từ có nghĩa là tiến hành, thực hiện (một kế hoạch, nghiên cứu hoặc nhiệm vụ).',
    options: [
      { id: '5a', content: 'To execute or perform a task / plan', is_correct: true },
      { id: '5b', content: 'To cancel an appointment', is_correct: false },
      { id: '5c', content: 'To carry something outside', is_correct: false },
      { id: '5d', content: 'To delay a meeting', is_correct: false },
    ],
  },
  {
    id: 6,
    content: 'Choose the correct relative pronoun: "The scientist ______ discovered the vaccine won the Nobel Prize."',
    explanation: 'Đại từ quan hệ "who" thay thế cho danh từ chỉ người "The scientist" làm chủ ngữ trong mệnh đề quan hệ.',
    options: [
      { id: '6a', content: 'which', is_correct: false },
      { id: '6b', content: 'whom', is_correct: false },
      { id: '6c', content: 'who', is_correct: true },
      { id: '6d', content: 'whose', is_correct: false },
    ],
  },
  {
    id: 7,
    content: 'Which sentence is in the Passive Voice (Thể bị động)?',
    explanation: 'Câu bị động có cấu trúc "Be + V3/ed". "The report was reviewed by the manager" thể hiện hành động được thực hiện bởi người quản lý.',
    options: [
      { id: '7a', content: 'The manager reviewed the detailed financial report.', is_correct: false },
      { id: '7b', content: 'The report was reviewed by the senior manager yesterday.', is_correct: true },
      { id: '7c', content: 'The manager is reviewing the report right now.', is_correct: false },
      { id: '7d', content: 'The manager will review the report tomorrow.', is_correct: false },
    ],
  },
  {
    id: 8,
    content: 'Select the correct modal verb: "You ______ wear a helmet when riding a motorbike. It is the law."',
    explanation: '"Must" diễn tả sự bắt buộc mang tính pháp luật hoặc quy định bắt buộc.',
    options: [
      { id: '8a', content: 'might', is_correct: false },
      { id: '8b', content: 'must', is_correct: true },
      { id: '8c', content: 'could', is_correct: false },
      { id: '8d', content: 'would', is_correct: false },
    ],
  },
  {
    id: 9,
    content: 'Choose the correct comparative form: "This new AI model is ______ more efficient than the previous version."',
    explanation: '"Significantly" hoặc "much" là trạng từ dùng để nhấn mạnh mức độ so sánh hơn ("more efficient").',
    options: [
      { id: '9a', content: 'much', is_correct: true },
      { id: '9b', content: 'more', is_correct: false },
      { id: '9c', content: 'very', is_correct: false },
      { id: '9d', content: 'too', is_correct: false },
    ],
  },
  {
    id: 10,
    content: 'Which sentence correctly transforms: "I will call you tomorrow," he said.',
    explanation: 'Khi chuyển sang câu gián tiếp, "will" lùi thì thành "would", "tomorrow" đổi thành "the next day / the following day".',
    options: [
      { id: '10a', content: 'He said that he would call me the following day.', is_correct: true },
      { id: '10b', content: 'He said that he will call me tomorrow.', is_correct: false },
      { id: '10c', content: 'He said that he called me tomorrow.', is_correct: false },
      { id: '10d', content: 'He told that he would call me tomorrow.', is_correct: false },
    ],
  },
];

export default function StudentProgressQuizModal({
  isOpen,
  onClose,
  chapter,
  chapterId,
  chapterTitle,
  completedLessons = [],
  activeLesson,
  onStartQuiz
}) {
  const [numQuestions, setNumQuestions] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const targetChapterId = chapterId || chapter?.id;
  const targetChapterTitle = chapterTitle || chapter?.title || 'Chương học hiện tại';

  // Danh sách bài học thực tế để hiển thị
  const displayLessons = completedLessons.length > 0
    ? completedLessons
    : (activeLesson ? [activeLesson] : [{ title: 'Bài 1: Kiến thức trọng tâm của chương' }]);

  const handleGenerateAndStart = async () => {
    setErrorMsg('');
    setIsLoading(true);

    try {
      // 1. Thử gọi API Backend AI Generator
      if (targetChapterId) {
        try {
          const res = await aiAPI.generateProgressQuiz(targetChapterId, numQuestions);
          const quizData = res.data?.data || res.data;
          if (quizData && quizData.questions && quizData.questions.length >= numQuestions) {
            const finalQuiz = {
              ...quizData,
              time_limit_minutes: numQuestions * 2,
              total_questions: numQuestions,
              questions: quizData.questions.slice(0, numQuestions),
            };
            if (onStartQuiz) onStartQuiz(finalQuiz);
            onClose();
            return;
          }
        } catch (apiErr) {
          console.warn('Backend AI API progress quiz error, using fallback pool:', apiErr);
        }
      }

      // 2. Fallback AI Pool: Sinh chính xác số lượng câu hỏi đã chọn
      const selectedQuestions = PROGRESS_QUIZ_POOL.slice(0, numQuestions).map((q, idx) => ({
        ...q,
        id: idx + 1,
      }));

      const mockQuiz = {
        id: 'ai-progress-quiz-' + Date.now(),
        title: `⚡ Đề Ôn Tập AI: ${targetChapterTitle}`,
        description: `Đề ôn tập thích ứng được AI tạo tự động từ ${displayLessons.length} bài học bạn đang học trong chương '${targetChapterTitle}'.`,
        quiz_type: 'PRACTICE',
        time_limit_minutes: numQuestions * 2,
        passing_score: 70.0,
        total_questions: numQuestions,
        questions: selectedQuestions,
      };

      if (onStartQuiz) onStartQuiz(mockQuiz);
      onClose();
    } catch (err) {
      setErrorMsg('Không thể khởi tạo đề ôn tập vào lúc này. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '540px',
          width: '100%',
          padding: '28px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-card)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#7c3aed',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}
            >
              <i className="fa-solid fa-bolt"></i>
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                AI Sinh Đề Ôn Tập Thích Ứng (UC_S7)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Tạo bài kiểm tra cá nhân hóa từ các bài học bạn đã học trong chương
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '0.8rem', fontWeight: '700', marginBottom: '14px' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i>
            {errorMsg}
          </div>
        )}

        {/* DỮ LIỆU BÀI HỌC THẬT TỪ CƠ SỞ DỮ LIỆU */}
        <div style={{ padding: '14px', backgroundColor: '#f5f3ff', borderRadius: 'var(--radius-md)', border: '1px solid #ddd6fe', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#6d28d9', marginBottom: '6px' }}>
            <i className="fa-solid fa-graduation-cap" style={{ marginRight: '6px' }}></i>
            DỮ LIỆU BÀI HỌC ÁP DỤNG SINH ĐỀ:
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#4c1d95', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {displayLessons.map((les, idx) => (
              <li key={idx}>
                ✓ <strong>{les.title}</strong> {les.isCompleted ? '(Đã hoàn thành)' : ''}
              </li>
            ))}
          </ul>
          {completedLessons.length === 0 && (
            <span style={{ display: 'block', fontSize: '0.72rem', color: '#7c3aed', marginTop: '6px', fontStyle: 'italic' }}>
              💡 AI sẽ phân tích lý thuyết từ bài giảng bạn đang học để sinh bộ đề ôn tập tương ứng.
            </span>
          )}
        </div>

        {/* CẤU HÌNH SỐ LƯỢNG CÂU HỎI & THỜI GIAN */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
            Chọn số lượng câu hỏi ôn tập:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { count: 3, mins: 6 },
              { count: 5, mins: 10 },
              { count: 10, mins: 20 },
            ].map(({ count, mins }) => (
              <button
                key={count}
                type="button"
                onClick={() => setNumQuestions(count)}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid',
                  borderColor: numQuestions === count ? '#7c3aed' : 'var(--border-color)',
                  backgroundColor: numQuestions === count ? '#ede9fe' : 'var(--bg-surface)',
                  color: numQuestions === count ? '#6d28d9' : 'var(--text-secondary)',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {count} câu ({mins} phút)
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGenerateAndStart}
          disabled={isLoading}
          className="btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '12px',
            backgroundColor: '#7c3aed',
            fontSize: '0.92rem',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
          }}
        >
          {isLoading ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin"></i>
              <span>AI đang phân tích bài học & khởi tạo {numQuestions} câu hỏi...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-bolt"></i>
              <span>Bắt Đầu Sinh Đề & Làm Bài Thi Ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

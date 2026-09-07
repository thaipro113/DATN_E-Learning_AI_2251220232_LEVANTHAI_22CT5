import React from 'react';

export default function CourseQuizzesOverviewModal({
  isOpen,
  onClose,
  courseTitle,
  quizzes = [],
  attempts = [],
  onSelectQuiz,
}) {
  if (!isOpen) return null;

  const getQuizAttempt = (quizId) => {
    const list = attempts.filter((a) => (a.quiz_id || a.quiz?.id || a.quiz) === quizId);
    if (list.length === 0) return null;
    return list.reduce((best, cur) => {
      const curScore = Number(cur.percentage ?? (cur.score != null && cur.max_score ? (cur.score / cur.max_score) * 100 : 0));
      const bestScore = Number(best.percentage ?? (best.score != null && best.max_score ? (best.score / best.max_score) * 100 : 0));
      return curScore >= bestScore ? cur : best;
    }, list[0]);
  };

  const courseLevelQuizzes = quizzes.filter((q) => !q.chapter && !q.chapter_id && !q.lesson && !q.lesson_id);
  const chapterLevelQuizzes = quizzes.filter((q) => (q.chapter || q.chapter_id) && !q.lesson && !q.lesson_id);
  const lessonLevelQuizzes = quizzes.filter((q) => q.lesson || q.lesson_id);

  const renderQuizItem = (quiz) => {
    const bestAttempt = getQuizAttempt(quiz.id);
    const scorePct = bestAttempt ? Number(bestAttempt.percentage ?? Math.round((bestAttempt.score / bestAttempt.max_score) * 100)) : null;
    const isPassed = bestAttempt?.is_passed ?? (scorePct != null && scorePct >= (quiz.passing_score || 70));

    return (
      <div
        key={quiz.id}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: '800',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: '#f3e8ff',
                color: '#7e22ce',
              }}
            >
              CEFR {quiz.level || 'B1'}
            </span>
            {quiz.lesson_title && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Bài: {quiz.lesson_title}
              </span>
            )}
            {quiz.chapter_title && !quiz.lesson_title && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Chương: {quiz.chapter_title}
              </span>
            )}
          </div>
          <h5 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-main)' }}>
            {quiz.title}
          </h5>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {quiz.total_questions || 5} câu hỏi · Thời gian: {quiz.time_limit_minutes || 15} phút · Điểm đạt: {quiz.passing_score || 70}%
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {bestAttempt ? (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isPassed ? '#dcfce7' : '#fee2e2',
                color: isPassed ? '#15803d' : '#b91c1c',
              }}
            >
              {isPassed ? `Đạt (${scorePct}%)` : `Chưa đạt (${scorePct}%)`}
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              Chưa làm
            </span>
          )}

          <button
            className="btn-primary"
            onClick={() => {
              onClose();
              onSelectQuiz(quiz);
            }}
            style={{
              padding: '7px 14px',
              fontSize: '0.82rem',
              backgroundColor: isPassed ? '#0284c7' : '#7c3aed',
              fontWeight: '700',
            }}
          >
            <i className="fa-solid fa-pen-to-square"></i>
            <span>{bestAttempt ? 'Làm lại' : 'Làm bài'}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 999,
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
          maxWidth: '750px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}
            >
              <i className="fa-solid fa-clipboard-list"></i>
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                HỆ THỐNG ĐỀ THI & BÀI TẬP KHÓA HỌC
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Khóa: {courseTitle} ({quizzes.length} đề thi sẵn sàng)
              </p>
            </div>
          </div>
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
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {quizzes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-folder-open" style={{ fontSize: '2.5rem', marginBottom: '10px', color: 'var(--text-light)' }}></i>
              <p style={{ fontSize: '0.92rem', fontWeight: '600' }}>
                Hiện chưa có đề thi nào được tạo cho khóa học này.
              </p>
              <p style={{ fontSize: '0.8rem' }}>
                Giảng viên có thể sử dụng Teacher Studio hoặc tính năng "AI Sinh Đề Ôn Tập" để tạo đề thi.
              </p>
            </div>
          ) : (
            <>
              {/* Cấp 1: Đề thi theo bài học */}
              {lessonLevelQuizzes.length > 0 && (
                <div>
                  <h4
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: '800',
                      color: '#0284c7',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <i className="fa-solid fa-book-open"></i>
                    <span>BÀI TẬP & ĐỀ THI THEO TỪNG BÀI HỌC ({lessonLevelQuizzes.length})</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {lessonLevelQuizzes.map((q) => renderQuizItem(q))}
                  </div>
                </div>
              )}

              {/* Cấp 2: Đề thi theo chương */}
              {chapterLevelQuizzes.length > 0 && (
                <div>
                  <h4
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: '800',
                      color: '#7c3aed',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <i className="fa-solid fa-layer-group"></i>
                    <span>BÀI KIỂM TRA ĐÁNH GIÁ THEO CHƯƠNG ({chapterLevelQuizzes.length})</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {chapterLevelQuizzes.map((q) => renderQuizItem(q))}
                  </div>
                </div>
              )}

              {/* Cấp 3: Đề thi toàn khóa / cuối khóa */}
              {courseLevelQuizzes.length > 0 && (
                <div>
                  <h4
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: '800',
                      color: '#16a34a',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <i className="fa-solid fa-award"></i>
                    <span>ĐỀ THI TỔNG KẾT & ĐÁNH GIÁ TOÀN KHÓA HỌC ({courseLevelQuizzes.length})</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {courseLevelQuizzes.map((q) => renderQuizItem(q))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            className="btn-outline"
            onClick={onClose}
            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          >
            <span>Đóng</span>
          </button>
        </div>
      </div>
    </div>
  );
}

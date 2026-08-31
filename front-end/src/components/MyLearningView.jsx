import React, { useState } from 'react';

export default function MyLearningView() {
  const [activeLesson, setActiveLesson] = useState({
    id: 1,
    title: 'Bài 1: Các Thì Quá Khứ Cơ Bản & Cách Ứng Dụng',
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    completed: true,
  });

  const lessons = [
    { id: 1, title: 'Bài 1: Các Thì Quá Khứ Cơ Bản & Cách Ứng Dụng', duration: '12:30', completed: true },
    { id: 2, title: 'Bài 2: Mệnh Đề Quan Hệ & Câu Điều Kiện Loại 2', duration: '15:45', completed: true },
    { id: 3, title: 'Bài 3: Cụm Động Từ (Phrasal Verbs) Phổ Biến', duration: '18:10', completed: false },
    { id: 4, title: 'Bài 4: Kỹ Năng Nghe & Nhận Diện Trọng Âm Từ', duration: '14:20', completed: false },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-box">
        <div>
          <h2 className="page-title">
            <i className="fa-solid fa-circle-play" style={{ color: '#7c3aed' }}></i>
            <span>PHÒNG HỌC & TIẾN ĐỘ KHÓA HỌC</span>
          </h2>
          <p className="page-subtitle">
            Khóa học đang học: <strong>Ngữ Pháp & Giao Tiếp Toàn Diện (CEFR B1-B2)</strong> (Tiến độ: 50%)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge-stat blue">
            <i className="fa-solid fa-award"></i>
            <span>Chứng chỉ: 50% hoàn thành</span>
          </span>
        </div>
      </div>

      {/* Video Player & Lesson List Container */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Left: Video Player Box */}
        <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-card)' }}>
          <div
            style={{
              width: '100%',
              height: '340px',
              backgroundColor: '#0f172a',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.2rem',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <i className="fa-solid fa-play-circle" style={{ fontSize: '3.5rem', color: '#38bdf8' }}></i>
            <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>{activeLesson.title}</span>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {activeLesson.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Học lý thuyết, xem ví dụ và làm bài tập củng cố kiến thức cuối bài.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Chapter / Lesson List */}
        <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-card)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '12px', color: 'var(--text-main)' }}>
            NỘI DUNG CHƯƠNG TRÌNH ({lessons.length} bài học)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => setActiveLesson(lesson)}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid',
                  borderColor: activeLesson.id === lesson.id ? '#0284c7' : 'var(--border-color)',
                  backgroundColor: activeLesson.id === lesson.id ? '#e0f2fe' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i
                    className={lesson.completed ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle-play'}
                    style={{ color: lesson.completed ? '#10b981' : '#64748b' }}
                  ></i>
                  <span style={{ fontSize: '0.85rem', fontWeight: activeLesson.id === lesson.id ? '700' : '500' }}>
                    {lesson.title}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{lesson.duration}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

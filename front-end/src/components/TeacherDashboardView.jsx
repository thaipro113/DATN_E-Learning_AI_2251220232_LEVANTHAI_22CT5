import React, { useState } from 'react';
import TeacherGradebookView from './TeacherGradebookView';
import TeacherAIQuizModal from './TeacherAIQuizModal';

export default function TeacherDashboardView({ onOpenQuizImport }) {
  const [activeTab, setActiveTab] = useState('courses');
  const [showAIQuizModal, setShowAIQuizModal] = useState(false);

  // Dữ liệu khóa học của giáo viên
  const [courses, setCourses] = useState([
    {
      id: '1',
      title: 'Ngữ Pháp Tiếng Anh Nền Tảng (CEFR A1-A2)',
      category: 'Ngữ pháp',
      students_count: 142,
      lessons_count: 12,
      status: 'PUBLISHED',
      price: 0,
    },
    {
      id: '2',
      title: 'Luyện Phản Xạ Giao Tiếp Tiếng Anh Trung Cấp (CEFR B1)',
      category: 'Giao tiếp & Nói',
      students_count: 89,
      lessons_count: 18,
      status: 'PUBLISHED',
      price: 0,
    },
  ]);

  // Form tạo khóa học mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Ngữ pháp');
  const [newLevel, setNewLevel] = useState('B1');

  const handleCreateCourse = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newCourse = {
      id: String(Date.now()),
      title: newTitle,
      category: newCategory,
      students_count: 0,
      lessons_count: 0,
      status: 'DRAFT',
      price: 0,
    };
    setCourses([...courses, newCourse]);
    setNewTitle('');
    setShowCreateModal(false);
    alert('Tạo khóa học mới thành công!');
  };

  return (
    <div>
      {/* Header Banner Dành Riêng Cho Giảng Viên */}
      <div
        style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#dbeafe',
              color: '#1d4ed8',
              fontSize: '0.75rem',
              fontWeight: '800',
              marginBottom: '8px',
            }}
          >
            <i className="fa-solid fa-chalkboard-user"></i>
            <span>TEACHER STUDIO & QUẢN LÝ GIẢNG DẠY</span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>
            Không gian Giảng viên - Thầy Lê Văn Thái 👨‍🏫
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>
            Quản lý chương trình giảng dạy, ngân hàng đề thi AI và theo dõi kết quả học tập của sinh viên.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Nút Kích Hoạt AI Quiz Generator cho Giáo Viên (UC_T4) */}
          <button
            className="btn-primary"
            onClick={() => setShowAIQuizModal(true)}
            style={{
              backgroundColor: '#7c3aed',
              padding: '10px 16px',
              fontSize: '0.85rem',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
            }}
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>AI Sinh Đề Thi (UC_T4)</span>
          </button>

          <button
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{ padding: '10px 16px', fontSize: '0.85rem' }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>Tạo khóa học mới</span>
          </button>

          <button
            className="btn-primary"
            onClick={onOpenQuizImport}
            style={{ backgroundColor: '#e11d48', padding: '10px 16px', fontSize: '0.85rem' }}
          >
            <i className="fa-solid fa-file-import"></i>
            <span>Import Đề thi (Word/Excel)</span>
          </button>
        </div>
      </div>

      {/* 4 Thẻ Thống kê Giáo viên */}
      <div className="stat-counters-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-counter-card">
          <div className="stat-counter-icon sky">
            <i className="fa-solid fa-book-open"></i>
          </div>
          <div className="stat-counter-content">
            <span className="stat-counter-title">TỔNG KHÓA HỌC</span>
            <span className="stat-counter-val">{courses.length}</span>
            <span className="stat-counter-sub">Đang hoạt động</span>
          </div>
        </div>

        <div className="stat-counter-card">
          <div className="stat-counter-icon emerald">
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="stat-counter-content">
            <span className="stat-counter-title">TỔNG HỌC VIÊN</span>
            <span className="stat-counter-val">231</span>
            <span className="stat-counter-sub">Đã ghi danh</span>
          </div>
        </div>

        <div className="stat-counter-card">
          <div className="stat-counter-icon purple">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <div className="stat-counter-content">
            <span className="stat-counter-title">AI QUIZ GENERATOR</span>
            <span className="stat-counter-val" style={{ color: '#7c3aed' }}>SẴN SÀNG</span>
            <span className="stat-counter-sub">Gemini + Groq Gateway</span>
          </div>
        </div>

        <div className="stat-counter-card">
          <div className="stat-counter-icon orange">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div className="stat-counter-content">
            <span className="stat-counter-title">TỶ LỆ HOÀN THÀNH</span>
            <span className="stat-counter-val">78%</span>
            <span className="stat-counter-sub">Học viên qua môn</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs cho Giáo Viên */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('courses')}
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: '700',
            backgroundColor: activeTab === 'courses' ? '#0284c7' : 'var(--bg-surface)',
            color: activeTab === 'courses' ? '#ffffff' : 'var(--text-secondary)',
            border: '1px solid',
            borderColor: activeTab === 'courses' ? '#0284c7' : 'var(--border-color)',
          }}
        >
          <i className="fa-solid fa-book-open" style={{ marginRight: '6px' }}></i>
          Quản lý Khóa học ({courses.length})
        </button>

        <button
          onClick={() => setActiveTab('gradebook')}
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: '700',
            backgroundColor: activeTab === 'gradebook' ? '#0284c7' : 'var(--bg-surface)',
            color: activeTab === 'gradebook' ? '#ffffff' : 'var(--text-secondary)',
            border: '1px solid',
            borderColor: activeTab === 'gradebook' ? '#0284c7' : 'var(--border-color)',
          }}
        >
          <i className="fa-solid fa-graduation-cap" style={{ marginRight: '6px' }}></i>
          Sổ điểm Học viên (Gradebook)
        </button>
      </div>

      {/* Tab 1: Quản lý khóa học */}
      {activeTab === 'courses' && (
        <div className="quiz-room-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
              <i className="fa-solid fa-list-check" style={{ color: '#0284c7', marginRight: '8px' }}></i>
              Danh Sách Khóa Học Của Bạn
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Hỗ trợ quản lý chương, bài giảng video và tài liệu đính kèm
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {courses.map((course) => (
              <div
                key={course.id}
                style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: course.status === 'PUBLISHED' ? '#dcfce7' : '#fef3c7',
                        color: course.status === 'PUBLISHED' ? '#15803d' : '#b45309',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                      }}
                    >
                      {course.status === 'PUBLISHED' ? 'ĐANG PHÁT HÀNH' : 'BẢN NHÁP'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: '700' }}>
                      {course.category}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {course.title}
                  </h4>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span><i className="fa-solid fa-users"></i> {course.students_count} học viên</span>
                    <span><i className="fa-solid fa-play-circle"></i> {course.lessons_count} bài học</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn-outline"
                    onClick={() => setShowAIQuizModal(true)}
                    style={{ color: '#7c3aed', borderColor: '#ddd6fe' }}
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    <span>AI Sinh đề</span>
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => alert(`Chỉnh sửa chương, bài học và video cho khóa học: ${course.title}`)}
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                    <span>Soạn bài học</span>
                  </button>
                  <button
                    className="btn-primary"
                    onClick={onOpenQuizImport}
                  >
                    <i className="fa-solid fa-file-import"></i>
                    <span>Import đề</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Sổ điểm học viên */}
      {activeTab === 'gradebook' && (
        <TeacherGradebookView />
      )}

      {/* Modal AI Quiz Generator cho Giáo Viên (UC_T4) */}
      <TeacherAIQuizModal
        isOpen={showAIQuizModal}
        onClose={() => setShowAIQuizModal(false)}
        onSaveToBank={(questions) => console.log('Saved questions to bank:', questions)}
      />

      {/* Modal Tạo Khóa Học Mới */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Tạo Khóa Học Tiếng Anh Mới</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ fontSize: '1.1rem' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Tiêu đề khóa học:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Chinh Phục Ngữ Pháp CEFR B2..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Danh mục:
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="Ngữ pháp">Ngữ pháp</option>
                  <option value="Từ vựng & Đọc">Từ vựng & Đọc</option>
                  <option value="Giao tiếp & Nói">Giao tiếp & Nói</option>
                  <option value="Luyện thi Tổng hợp">Luyện thi Tổng hợp</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Trình độ CEFR:
                </label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="A1">A1 Beginner</option>
                  <option value="A2">A2 Elementary</option>
                  <option value="B1">B1 Intermediate</option>
                  <option value="B2">B2 Upper-Intermediate</option>
                  <option value="C1">C1 Advanced</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-outline" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Tạo khóa học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

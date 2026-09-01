import React, { useState } from 'react';

export default function AdminDashboardView() {
  const [activeAdminNav, setActiveAdminNav] = useState('overview');

  // Dữ liệu thống kê hệ thống thực tế
  const stats = {
    completed_progress: 28,
    total_users: 14,
    total_lessons: 69,
    total_courses: 6,
    total_quizzes: 15,
    completion_rate: 68,
  };

  // Dữ liệu phân bổ bài học theo từng khóa học cho biểu đồ tròn (Donut Chart)
  const courseDistribution = [
    { title: 'Grammar for Beginner - A1', lessons: 14, color: '#06b6d4' },
    { title: 'Grammar for Beginners - A2', lessons: 18, color: '#f59e0b' },
    { title: 'Vocabulary for Beginners - B1', lessons: 16, color: '#f43f5e' },
    { title: 'Pronunciation & Speaking', lessons: 11, color: '#8b5cf6' },
    { title: 'Toeic Reading - Listening', lessons: 10, color: '#3b82f6' },
  ];

  // Dữ liệu biểu đồ cột (Bar Chart)
  const barData = [
    { label: 'Tiến trình', value: 28, max: 70, color: '#38bdf8' },
    { label: 'Người dùng', value: 14, max: 70, color: '#2dd4bf' },
    { label: 'Bài học', value: 69, max: 70, color: '#fde047' },
    { label: 'Khóa học', value: 6, max: 70, color: '#c084fc' },
    { label: 'Đề thi', value: 15, max: 70, color: '#fb923c' },
  ];

  // Danh sách thành viên hoàn thành tiến độ & điểm thi
  const recentActivities = [
    { user: 'thaipro1132004', course: 'Vocabulary for Beginners', lesson: 'Từ vựng về gia đình', score: '9.5/10', date: '31/08/2026' },
    { user: 'thaipro1132004', course: 'Grammar for Beginner - A1', lesson: 'Cấu trúc câu cơ bản', score: '8.0/10', date: '30/08/2026' },
    { user: 'nguyenvana_22', course: 'Toeic Reading - Listening', lesson: 'Chiến thuật Part 5', score: '7.5/10', date: '29/08/2026' },
    { user: 'lethimai_99', course: 'Pronunciation & Speaking', lesson: 'Nguyên âm đôi trong IPA', score: '9.0/10', date: '28/08/2026' },
    { user: 'tranminhduc', course: 'Grammar for Beginners - A2', lesson: 'Thì Quá khứ tiếp diễn', score: '6.5/10', date: '27/08/2026' },
  ];

  // Danh sách toàn bộ người dùng hệ thống
  const [users, setUsers] = useState([
    { id: 1, full_name: 'Lê Văn Thái', email: 'thaipro113@gmail.com', role: 'STUDENT', is_active: true, created_at: '2026-08-30' },
    { id: 2, full_name: 'Thầy Nguyễn Văn An', email: 'teacher.an@elearning.edu.vn', role: 'TEACHER', is_active: true, created_at: '2026-08-25' },
    { id: 3, full_name: 'Cô Trần Thị Mai', email: 'teacher.mai@elearning.edu.vn', role: 'TEACHER', is_active: true, created_at: '2026-08-26' },
    { id: 4, full_name: 'Trần Minh Đức', email: 'duc.student@gmail.com', role: 'STUDENT', is_active: false, created_at: '2026-08-28' },
  ]);

  const handleToggleStatus = (userId) => {
    setUsers(users.map((u) => (u.id === userId ? { ...u, is_active: !u.is_active } : u)));
  };

  const handleChangeRole = (userId, newRole) => {
    setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
  };

  return (
    <div>
      {/* 4 Thẻ Chỉ Số Thống Kê Chính */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            backgroundColor: '#0284c7',
            color: '#ffffff',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1 }}>{stats.completed_progress}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', marginTop: '6px', opacity: 0.9 }}>
              Tiến trình hoàn thành
            </div>
          </div>
          <div style={{ fontSize: '2rem', opacity: 0.85 }}>
            <i className="fa-solid fa-circle-check"></i>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#059669',
            color: '#ffffff',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1 }}>{users.length}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', marginTop: '6px', opacity: 0.9 }}>
              Tài khoản người dùng
            </div>
          </div>
          <div style={{ fontSize: '2rem', opacity: 0.85 }}>
            <i className="fa-solid fa-users"></i>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#0ea5e9',
            color: '#ffffff',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1 }}>{stats.total_lessons}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', marginTop: '6px', opacity: 0.9 }}>
              Số bài học
            </div>
          </div>
          <div style={{ fontSize: '2rem', opacity: 0.85 }}>
            <i className="fa-solid fa-book"></i>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ea580c',
            color: '#ffffff',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1 }}>{stats.total_courses}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', marginTop: '6px', opacity: 0.9 }}>
              Số khóa học
            </div>
          </div>
          <div style={{ fontSize: '2rem', opacity: 0.85 }}>
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs cho Admin */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveAdminNav('overview')}
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: '700',
            backgroundColor: activeAdminNav === 'overview' ? '#be185d' : 'var(--bg-surface)',
            color: activeAdminNav === 'overview' ? '#ffffff' : 'var(--text-secondary)',
            border: '1px solid',
            borderColor: activeAdminNav === 'overview' ? '#be185d' : 'var(--border-color)',
          }}
        >
          <i className="fa-solid fa-chart-line" style={{ marginRight: '6px' }}></i>
          Báo cáo Thống kê & Biểu đồ
        </button>

        <button
          onClick={() => setActiveAdminNav('users')}
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: '700',
            backgroundColor: activeAdminNav === 'users' ? '#be185d' : 'var(--bg-surface)',
            color: activeAdminNav === 'users' ? '#ffffff' : 'var(--text-secondary)',
            border: '1px solid',
            borderColor: activeAdminNav === 'users' ? '#be185d' : 'var(--border-color)',
          }}
        >
          <i className="fa-solid fa-users-gear" style={{ marginRight: '6px' }}></i>
          Quản trị Người dùng & Phân quyền ({users.length})
        </button>

        <button
          onClick={() => setActiveAdminNav('system')}
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: '700',
            backgroundColor: activeAdminNav === 'system' ? '#be185d' : 'var(--bg-surface)',
            color: activeAdminNav === 'system' ? '#ffffff' : 'var(--text-secondary)',
            border: '1px solid',
            borderColor: activeAdminNav === 'system' ? '#be185d' : 'var(--border-color)',
          }}
        >
          <i className="fa-solid fa-server" style={{ marginRight: '6px' }}></i>
          Hệ thống & AI Engine Quota
        </button>
      </div>

      {/* ================================================================= */}
      {/* SUB-TAB 1: TỔNG QUAN & BIỂU ĐỒ (BAR CHART & DONUT CHART)          */}
      {/* ================================================================= */}
      {activeAdminNav === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Bar Chart */}
            <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    Thống kê học tập
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Phân tích tiến trình hoàn thành và nội dung toàn sàn
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '16px', textAlign: 'right' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block' }}>
                      TIẾN TRÌNH HOÀN THÀNH
                    </span>
                    <strong style={{ fontSize: '1.1rem', color: '#0284c7' }}>{stats.completion_rate}%</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block' }}>
                      TỔNG NGƯỜI DÙNG
                    </span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{users.length}</strong>
                  </div>
                </div>
              </div>

              {/* Bars */}
              <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingTop: '20px', borderBottom: '1px solid var(--border-color)' }}>
                {barData.map((item, idx) => {
                  const heightPercent = Math.min(100, Math.round((item.value / item.max) * 100));
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-main)' }}>{item.value}</span>
                      <div
                        style={{
                          width: '46px',
                          height: `${heightPercent}%`,
                          backgroundColor: item.color,
                          borderRadius: '4px 4px 0 0',
                        }}
                      ></div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Donut Chart */}
            <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Số lượng bài học theo khóa học
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Phân bổ 69 bài giảng trên 5 khóa học chính
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'conic-gradient(#06b6d4 0% 20%, #f59e0b 20% 46%, #f43f5e 46% 69%, #8b5cf6 69% 85%, #3b82f6 85% 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--bg-surface)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800' }}>
                    69 bài
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
                {courseDistribution.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '10px', height: '10px', backgroundColor: c.color, borderRadius: '2px' }}></div>
                      <span style={{ color: 'var(--text-secondary)' }}>{c.title}</span>
                    </div>
                    <strong>{c.lessons} bài</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Table */}
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)', padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '14px' }}>
              Danh sách thành viên hoàn thành tiến độ & Điểm kiểm tra gần đây
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px 10px' }}>User</th>
                    <th style={{ padding: '8px 10px' }}>Course</th>
                    <th style={{ padding: '8px 10px' }}>Lesson / Quiz</th>
                    <th style={{ padding: '8px 10px' }}>Score</th>
                    <th style={{ padding: '8px 10px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.map((act, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px', fontWeight: '700', color: '#0284c7' }}>{act.user}</td>
                      <td style={{ padding: '10px' }}>{act.course}</td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{act.lesson}</td>
                      <td style={{ padding: '10px', fontWeight: '800', color: '#059669' }}>{act.score}</td>
                      <td style={{ padding: '10px', color: 'var(--text-light)' }}>{act.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 2: QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN                        */}
      {/* ================================================================= */}
      {activeAdminNav === 'users' && (
        <div className="quiz-room-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>
              <i className="fa-solid fa-users-gear" style={{ color: '#be185d', marginRight: '8px' }}></i>
              Danh Sách Người Dùng & Phân Quyền Vai Trò
            </h3>
            <button className="btn-primary" onClick={() => alert('Mở form tạo tài khoản mới!')} style={{ fontSize: '0.8rem' }}>
              <i className="fa-solid fa-user-plus"></i> Thêm tài khoản
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 14px' }}>Họ và Tên</th>
                  <th style={{ padding: '10px 14px' }}>Email</th>
                  <th style={{ padding: '10px 14px' }}>Vai Trò (Role)</th>
                  <th style={{ padding: '10px 14px' }}>Trạng Thái</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '700' }}>{u.full_name}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '700' }}
                      >
                        <option value="STUDENT">STUDENT (Học viên)</option>
                        <option value="TEACHER">TEACHER (Giáo viên)</option>
                        <option value="ADMIN">ADMIN (Quản trị)</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          backgroundColor: u.is_active ? '#dcfce7' : '#fee2e2',
                          color: u.is_active ? '#15803d' : '#dc2626',
                        }}
                      >
                        {u.is_active ? 'HOẠT ĐỘNG' : 'ĐÃ KHÓA'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          backgroundColor: u.is_active ? '#fef2f2' : '#ecfdf5',
                          color: u.is_active ? '#dc2626' : '#15803d',
                          border: '1px solid',
                          borderColor: u.is_active ? '#fecaca' : '#a7f3d0',
                        }}
                      >
                        {u.is_active ? 'Khóa' : 'Mở khóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 3: GIÁM SÁT HỆ THỐNG & AI ENGINE                          */}
      {/* ================================================================= */}
      {activeAdminNav === 'system' && (
        <div className="quiz-room-container">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px' }}>
            <i className="fa-solid fa-server" style={{ color: '#0284c7', marginRight: '8px' }}></i>
            Giám Sát Hạ Tầng Backend & Tình Trạng API AI
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#047857' }}>POSTGRESQL DATABASE</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#065f46', marginTop: '4px' }}>KẾT NỐI ỔN ĐỊNH</div>
              <span style={{ fontSize: '0.75rem', color: '#047857' }}>Latency: 12ms · 7 Apps Migrated</span>
            </div>

            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1d4ed8' }}>GOOGLE GEMINI 3.6 FLASH</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e40af', marginTop: '4px' }}>PRIMARY PROVIDER</div>
              <span style={{ fontSize: '0.75rem', color: '#1d4ed8' }}>250K TPM Quota · Sửa lỗi ngữ pháp</span>
            </div>

            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#be185d' }}>GROQ LLM (QWEN/LLAMA)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#9d174d', marginTop: '4px' }}>FALLBACK READY</div>
              <span style={{ fontSize: '0.75rem', color: '#be185d' }}>14,400 Req/Day · Dự phòng 100%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';

export default function TeacherGradebookView() {
  const [selectedCourse, setSelectedCourse] = useState('ALL');

  const students = [
    {
      id: 1,
      name: 'Lê Văn Thái',
      email: 'thaipro113@gmail.com',
      course: 'Ngữ Pháp Tiếng Anh Nền Tảng (A1-A2)',
      progress: 100,
      quiz_score: 95,
      status: 'COMPLETED',
      certificate_issued: true,
      last_active: '31/08/2026',
    },
    {
      id: 2,
      name: 'Nguyễn Văn An',
      email: 'an.nguyen@gmail.com',
      course: 'Luyện Phản Xạ Giao Tiếp (B1)',
      progress: 65,
      quiz_score: 80,
      status: 'LEARNING',
      certificate_issued: false,
      last_active: '30/08/2026',
    },
    {
      id: 3,
      name: 'Trần Thị Mai',
      email: 'mai.tran@gmail.com',
      course: 'Ngữ Pháp Tiếng Anh Nền Tảng (A1-A2)',
      progress: 40,
      quiz_score: 70,
      status: 'LEARNING',
      certificate_issued: false,
      last_active: '28/08/2026',
    },
    {
      id: 4,
      name: 'Phạm Hoàng Nam',
      email: 'nam.pham@gmail.com',
      course: 'Luyện Phản Xạ Giao Tiếp (B1)',
      progress: 100,
      quiz_score: 88,
      status: 'COMPLETED',
      certificate_issued: true,
      last_active: '29/08/2026',
    },
  ];

  return (
    <div className="quiz-room-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
            <i className="fa-solid fa-graduation-cap" style={{ color: '#0284c7', marginRight: '8px' }}></i>
            Sổ Điểm & Báo Cáo Học Viên Theo Khóa Học
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Theo dõi tiến độ bài giảng, điểm thi trắc nghiệm và trạng thái cấp chứng chỉ
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-primary" onClick={() => alert('Xuất file bảng điểm Excel thành công!')} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            <i className="fa-solid fa-file-excel"></i>
            <span>Xuất Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '10px 14px' }}>Học Viên</th>
              <th style={{ padding: '10px 14px' }}>Khóa Học Đang Học</th>
              <th style={{ padding: '10px 14px' }}>Tiến Độ</th>
              <th style={{ padding: '10px 14px' }}>Điểm Đề Thi</th>
              <th style={{ padding: '10px 14px' }}>Trạng Thái</th>
              <th style={{ padding: '10px 14px' }}>Chứng Chỉ</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 14px' }}>
                  <strong style={{ display: 'block', color: 'var(--text-main)' }}>{s.name}</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.email}</span>
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{s.course}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '80px', height: '6px', backgroundColor: 'var(--bg-muted)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${s.progress}%`, height: '100%', backgroundColor: s.progress === 100 ? '#10b981' : '#0284c7' }}></div>
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '0.8rem' }}>{s.progress}%</span>
                  </div>
                </td>
                <td style={{ padding: '12px 14px', fontWeight: '800', color: s.quiz_score >= 80 ? '#059669' : '#ea580c' }}>
                  {s.quiz_score}%
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      backgroundColor: s.status === 'COMPLETED' ? '#dcfce7' : '#e0f2fe',
                      color: s.status === 'COMPLETED' ? '#15803d' : '#0284c7',
                    }}
                  >
                    {s.status === 'COMPLETED' ? 'HOÀN THÀNH' : 'ĐANG HỌC'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {s.certificate_issued ? (
                    <span style={{ color: '#d97706', fontWeight: '700', fontSize: '0.8rem' }}>
                      <i className="fa-solid fa-award" style={{ marginRight: '4px' }}></i>
                      Đã cấp
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>Chưa cấp</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

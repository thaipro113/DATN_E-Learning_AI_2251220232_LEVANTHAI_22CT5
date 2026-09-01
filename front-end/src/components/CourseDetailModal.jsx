import React from 'react';

export default function CourseDetailModal({ isOpen, onClose, course, onEnroll }) {
  if (!isOpen || !course) return null;

  const sampleChapters = [
    {
      id: 1,
      title: 'Chương 1: Khởi Động & Nền Tảng Ngữ Pháp',
      lessons: [
        { id: 1, title: 'Bài 1: Các Thì Quá Khứ Cơ Bản', duration: '12:30', is_preview: true },
        { id: 2, title: 'Bài 2: Mệnh Đề Quan Hệ & Rút Gọn', duration: '15:45', is_preview: false },
        { id: 3, title: 'Bài 3: Cụm Động Từ (Phrasal Verbs)', duration: '18:10', is_preview: false },
      ],
    },
    {
      id: 2,
      title: 'Chương 2: Luyện Phản Xạ Giao Tiếp Thực Chiến',
      lessons: [
        { id: 4, title: 'Bài 4: Hội thoại Giao tiếp Công sở', duration: '20:15', is_preview: false },
        { id: 5, title: 'Bài 5: Thuyết trình & Đàm phán bằng Tiếng Anh', duration: '22:00', is_preview: false },
      ],
    },
  ];

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
        zIndex: 110,
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '780px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: course.bgColor || '#f0f9ff',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span
              style={{
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: '800',
                backgroundColor: 'var(--bg-surface)',
                color: '#0284c7',
              }}
            >
              Trình độ {course.level || 'B1'}
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '6px' }}>
              {course.title}
            </h2>
          </div>
          <button onClick={onClose} style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Mô tả & Thông tin giảng viên */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '6px', color: 'var(--text-main)' }}>
                GIỚI THIỆU KHÓA HỌC
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {course.description || 'Khóa học được thiết kế chuẩn sư phạm quốc tế, kết hợp thực hành và sửa lỗi thời gian thực bằng Trí tuệ Nhân tạo AI.'}
              </p>
            </div>

            <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px' }}>
                GIẢNG VIÊN PHỤ TRÁCH
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="user-avatar-circle" style={{ width: '32px', height: '32px' }}>
                  T
                </div>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block' }}>Thầy Lê Văn Thái</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Giảng viên Tiếng Anh</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chương trình giảng dạy chi tiết */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '12px', color: 'var(--text-main)' }}>
              CHƯƠNG TRÌNH HỌC ({sampleChapters.length} Chương · 5 Bài học Video)
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sampleChapters.map((ch) => (
                <div key={ch.id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-subtle)', fontWeight: '700', fontSize: '0.85rem' }}>
                    {ch.title}
                  </div>
                  <div>
                    {ch.lessons.map((les) => (
                      <div
                        key={les.id}
                        style={{
                          padding: '10px 14px',
                          borderTop: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.82rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <i className="fa-regular fa-circle-play" style={{ color: '#0284c7' }}></i>
                          <span>{les.title}</span>
                          {les.is_preview && (
                            <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: '700' }}>
                              Học thử miễn phí
                            </span>
                          )}
                        </div>
                        <span style={{ color: 'var(--text-light)' }}>{les.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Học phí:</span>
            <strong style={{ fontSize: '1.2rem', color: '#059669' }}>
              {course.is_free || course.price === 0 ? 'Miễn phí' : `${course.price?.toLocaleString()} đ`}
            </strong>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-outline" onClick={onClose}>
              Đóng
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                onEnroll(course);
                onClose();
              }}
              style={{ padding: '8px 20px', fontSize: '0.9rem' }}
            >
              <i className="fa-solid fa-play"></i>
              <span>Ghi danh & Bắt đầu học ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

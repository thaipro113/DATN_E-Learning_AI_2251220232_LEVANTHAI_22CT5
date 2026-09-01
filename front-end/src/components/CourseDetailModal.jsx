import React, { useState, useEffect } from 'react';
import { courseAPI } from '../services/api';

export default function CourseDetailModal({ isOpen, onClose, course, onEnroll }) {
  const [courseDetail, setCourseDetail] = useState(course);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !course) return;

    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const identifier = course.slug || course.id;
        const res = await courseAPI.getCourseDetail(identifier);
        const data = res.data?.data || res.data;
        if (data) {
          setCourseDetail(data);
        }
      } catch (err) {
        setCourseDetail(course);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, course]);

  if (!isOpen || !course) return null;

  const currentData = courseDetail || course;
  const chapters = currentData.chapters || [];
  const teacher = currentData.teacher || {};

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
        {/* Header with Image Banner */}
        <div style={{ position: 'relative', height: '180px', backgroundColor: '#0284c7', overflow: 'hidden' }}>
          {currentData.thumbnail_url ? (
            <img
              src={currentData.thumbnail_url}
              alt={currentData.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => (e.target.style.display = 'none')}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '3rem' }}>
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
          )}

          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.3) 100%)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              color: '#ffffff',
            }}
          >
            <span
              style={{
                alignSelf: 'flex-start',
                padding: '3px 10px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '800',
                backgroundColor: '#38bdf8',
                color: '#0f172a',
                marginBottom: '6px',
              }}
            >
              CEFR {currentData.level || 'B1'}
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#ffffff', margin: 0 }}>
              {currentData.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              fontSize: '1rem',
            }}
          >
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
                {currentData.description || 'Khóa học được thiết kế chuẩn sư phạm quốc tế, kết hợp thực hành và sửa lỗi thời gian thực bằng Trí tuệ Nhân tạo AI.'}
              </p>
            </div>

            <div style={{ padding: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px' }}>
                GIẢNG VIÊN PHỤ TRÁCH
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="user-avatar-circle" style={{ width: '36px', height: '36px', fontSize: '0.9rem', backgroundColor: '#dbeafe', color: '#0284c7' }}>
                  {teacher.full_name ? teacher.full_name.charAt(0).toUpperCase() : 'G'}
                </div>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)', display: 'block' }}>
                    {teacher.full_name || 'Thầy Nguyễn Văn An'}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {teacher.email || 'teacher@elearning.edu.vn'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chương trình giảng dạy chi tiết */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '12px', color: 'var(--text-main)' }}>
              CHƯƠNG TRÌNH HỌC ({chapters.length} Chương · {currentData.total_lessons || 4} Bài học Video)
            </h4>

            {isLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span style={{ marginLeft: '8px' }}>Đang tải giáo trình từ CSDL...</span>
              </div>
            ) : chapters.length === 0 ? (
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Khóa học bao gồm 4 bài giảng video trọng tâm và bài tập ôn luyện chuẩn CEFR.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {chapters.map((ch, idx) => (
                  <div key={ch.id || idx} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-subtle)', fontWeight: '800', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      {ch.title}
                    </div>
                    <div>
                      {(ch.lessons || []).map((les, lIdx) => (
                        <div
                          key={les.id || lIdx}
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
                            <span style={{ color: 'var(--text-main)' }}>{les.title}</span>
                            {les.is_preview && (
                              <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: '700' }}>
                                Học thử miễn phí
                              </span>
                            )}
                          </div>
                          <span style={{ color: 'var(--text-muted)' }}>{les.duration_minutes || 15} phút</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Học phí khóa học:</span>
            <strong style={{ fontSize: '1.2rem', color: '#059669' }}>
              {currentData.is_free || Number(currentData.price) === 0
                ? 'Miễn phí 100%'
                : `${Number(currentData.price || 0).toLocaleString('vi-VN')} đ`}
            </strong>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-outline" onClick={onClose}>
              Đóng
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                onEnroll(currentData);
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

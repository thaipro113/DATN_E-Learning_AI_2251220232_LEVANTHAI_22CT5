import React, { useState, useEffect } from 'react';
import { courseAPI } from '../services/api';

export default function CourseDetailModal({ isOpen, onClose, course, onEnroll, onNavigateToLearning, myCourses = [] }) {
  const [courseDetail, setCourseDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !course) return;

    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const res = await courseAPI.getCourseDetail(course.slug || course.id);
        const data = res.data?.data || res.data;
        if (data) {
          setCourseDetail(data);
        } else {
          setCourseDetail(course);
        }
      } catch (err) {
        console.warn('Could not load course detail API:', err);
        setCourseDetail(course);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, course]);

  if (!isOpen || !course) return null;

  const currentData = courseDetail || course;
  const isEnrolled = myCourses.some((m) => (m.course?.id || m.id) === currentData.id);
  const isFree = currentData.is_free || Number(currentData.price) === 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 120,
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '750px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Banner Header */}
        <div
          style={{
            position: 'relative',
            height: '200px',
            backgroundColor: '#0284c7',
            overflow: 'hidden',
          }}
        >
          {currentData.thumbnail_url ? (
            <img
              src={currentData.thumbnail_url}
              alt={currentData.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '3rem' }}>
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
          )}

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '20px 24px',
              background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95), transparent)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: '800',
                backgroundColor: '#ffffff',
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
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {currentData.description || 'Khóa học được thiết kế chuẩn đầu ra CEFR với bài giảng chi tiết và bài tập ôn luyện phong phú.'}
              </p>
            </div>

            {/* Teacher Info Card */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                GIẢNG VIÊN PHỤ TRÁCH
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                  }}
                >
                  {currentData.teacher?.full_name ? currentData.teacher.full_name.charAt(0).toUpperCase() : 'G'}
                </div>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block' }}>
                    {currentData.teacher?.full_name || 'Giảng viên chuyên môn'}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {currentData.teacher?.email || 'teacher@elearning.edu.vn'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chương trình học (Curriculum) */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '10px', color: 'var(--text-main)' }}>
              CHƯƠNG TRÌNH HỌC ({currentData.chapters?.length || 1} Chương · {currentData.chapters?.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0) || 1} Bài học Video)
            </h4>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span style={{ marginLeft: '8px' }}>Đang nạp giáo trình từ CSDL...</span>
              </div>
            ) : !currentData.chapters || currentData.chapters.length === 0 ? (
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Giáo trình đang được cập nhật.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentData.chapters.map((ch, idx) => (
                  <div
                    key={ch.id || idx}
                    style={{
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'var(--bg-subtle)',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        color: 'var(--text-main)',
                      }}
                    >
                      {ch.title}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
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
            <strong style={{ fontSize: '1.2rem', color: isFree ? '#059669' : '#ea580c' }}>
              {isFree
                ? 'Miễn phí 100%'
                : `${Number(currentData.price || 0).toLocaleString('vi-VN')} đ`}
            </strong>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-outline" onClick={onClose}>
              Đóng
            </button>

            {isEnrolled ? (
              <button
                className="btn-primary"
                onClick={() => {
                  if (onNavigateToLearning) onNavigateToLearning(currentData);
                  onClose();
                }}
                style={{ padding: '8px 22px', fontSize: '0.9rem', backgroundColor: '#059669' }}
              >
                <i className="fa-solid fa-circle-play"></i>
                <span>✓ Vào học ngay</span>
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={() => {
                  onEnroll(currentData);
                  onClose();
                }}
                style={{
                  padding: '8px 22px',
                  fontSize: '0.9rem',
                  backgroundColor: isFree ? '#0284c7' : '#ea580c',
                }}
              >
                <i className={`fa-solid ${isFree ? 'fa-play' : 'fa-cart-shopping'}`}></i>
                <span>{isFree ? 'Ghi danh miễn phí' : `Mua khóa học (${Number(currentData.price || 0).toLocaleString()} đ)`}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

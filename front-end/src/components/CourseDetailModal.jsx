import React, { useState, useEffect } from 'react';
import { courseAPI } from '../services/api';
import { getYouTubeEmbedUrl, isYouTubeUrl } from '../utils/media';

export default function CourseDetailModal({ isOpen, onClose, course, onEnroll, onNavigateToLearning, myCourses = [] }) {
  const [courseDetail, setCourseDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activePreviewLesson, setActivePreviewLesson] = useState(null);

  useEffect(() => {
    if (!isOpen || !course) return;

    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const res = await courseAPI.getCourseDetail(course.slug || course.id);
        const data = res.data?.data || res.data;
        if (data) {
          setCourseDetail(data);
          // Find first preview lesson if available
          const firstPreview = (data.chapters || [])
            .flatMap((ch) => ch.lessons || [])
            .find((les) => les.is_preview);
          setActivePreviewLesson(firstPreview || null);
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
          maxWidth: '1060px',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
        }}
      >
        {/* Banner Header OR Active Preview Player */}
        {activePreviewLesson && activePreviewLesson.video_url ? (
          <div style={{ backgroundColor: '#0f172a', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '10px 18px', backgroundColor: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
                <span style={{ backgroundColor: '#10b981', color: 'white', padding: '3px 10px', borderRadius: '4px', fontWeight: '800', fontSize: '0.75rem' }}>
                  🎬 Đang xem thử bài giảng
                </span>
                <strong style={{ color: '#f1f5f9', fontSize: '0.95rem' }}>{activePreviewLesson.title}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {currentData.slug && (
                  <button
                    onClick={() => {
                      window.location.hash = `#/courses/${currentData.slug}`;
                      onClose();
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                    title="Mở toàn trang theo đường dẫn URL"
                  >
                    <i className="fa-solid fa-up-right-from-square" style={{ marginRight: '4px' }}></i>
                    Mở toàn trang (URL)
                  </button>
                )}
                <button
                  onClick={onClose}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
            </div>

            <div style={{ height: '460px', width: '100%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isYouTubeUrl(activePreviewLesson.video_url) ? (
                <iframe
                  src={getYouTubeEmbedUrl(activePreviewLesson.video_url)}
                  title={activePreviewLesson.title}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={activePreviewLesson.video_url}
                  controls
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}
            </div>
          </div>
        ) : (
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
                padding: '16px 20px',
                background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95), transparent)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                  }}
                >
                  CEFR {currentData.level || 'B1'}
                </span>
                {currentData.slug && (
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    🔗 /{currentData.slug}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ffffff', margin: 0 }}>
                {currentData.title}
              </h2>
            </div>

            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
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
        )}

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Active Lesson Key Knowledge Note if available */}
          {activePreviewLesson && activePreviewLesson.content && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                fontSize: '0.84rem',
              }}
            >
              <strong style={{ color: '#15803d', display: 'block', marginBottom: '4px' }}>
                💡 Trọng tâm bài học ({activePreviewLesson.title}):
              </strong>
              <div style={{ whiteSpace: 'pre-line', lineHeight: 1.6, color: '#166534' }}>
                {activePreviewLesson.content}
              </div>
            </div>
          )}

          {/* Mô tả & Thông tin giảng viên */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-main)' }}>
                GIỚI THIỆU KHÓA HỌC
              </h4>
              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-line',
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                {currentData.description || 'Khóa học được thiết kế chuẩn đầu ra CEFR với bài giảng chi tiết và bài tập ôn luyện phong phú.'}
              </div>
            </div>

            {/* Teacher Info Card */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                height: 'fit-content',
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                CHƯƠNG TRÌNH HỌC ({currentData.chapters?.length || 0} Chương · {currentData.chapters?.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0) || 0} Bài học)
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Bấm vào các bài có nhãn <strong style={{ color: '#16a34a' }}>"Học thử miễn phí"</strong> để xem video
              </span>
            </div>

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
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {ch.title}
                      </div>
                      {ch.description && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'pre-line' }}>
                          {ch.description}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {(ch.lessons || []).map((les, lIdx) => {
                        const isSelected = activePreviewLesson?.id === les.id;
                        const canPreview = les.is_preview;

                        return (
                          <div
                            key={les.id || lIdx}
                            onClick={() => {
                              if (canPreview) {
                                setActivePreviewLesson(les);
                              }
                            }}
                            style={{
                              padding: '10px 14px',
                              borderTop: lIdx > 0 ? '1px solid var(--border-color)' : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.82rem',
                              backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                              cursor: canPreview ? 'pointer' : 'not-allowed',
                              opacity: canPreview ? 1 : 0.65,
                              transition: 'all 0.15s ease',
                            }}
                            title={canPreview ? 'Bấm để xem thử bài giảng này' : 'Bài học đã khóa. Hãy ghi danh hoặc mua khóa học để mở khóa toàn bộ.'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <i
                                className={`fa-solid ${canPreview ? 'fa-circle-play' : 'fa-lock'}`}
                                style={{ color: canPreview ? (isSelected ? '#15803d' : '#0284c7') : '#94a3b8' }}
                              ></i>
                              <span style={{ color: 'var(--text-main)', fontWeight: isSelected ? '700' : '500' }}>
                                {les.title}
                              </span>

                              {canPreview ? (
                                <span style={{ fontSize: '0.7rem', padding: '1px 7px', borderRadius: '4px', backgroundColor: isSelected ? '#bbf7d0' : '#dcfce7', color: '#15803d', fontWeight: '800' }}>
                                  {isSelected ? '🎬 Đang xem' : 'Học thử miễn phí'}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: '600' }}>
                                  Khóa (Cần ghi danh)
                                </span>
                              )}
                            </div>

                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                              {les.duration_minutes || 15} phút
                            </span>
                          </div>
                        );
                      })}
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
            padding: '14px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Học phí khóa học:</span>
            <strong style={{ fontSize: '1.15rem', color: isFree ? '#059669' : '#ea580c' }}>
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

import React, { useState, useEffect } from 'react';
import { courseAPI } from '../services/api';
import { getYouTubeEmbedUrl, isYouTubeUrl } from '../utils/media';

export default function CourseDetailFullView({
  slug,
  myCourses = [],
  onEnroll,
  onNavigateToLearning,
  onBack,
}) {
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activePreviewLesson, setActivePreviewLesson] = useState(null);
  const [copiedSlug, setCopiedSlug] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchCourse = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await courseAPI.getCourseDetail(slug);
        const data = res.data?.data || res.data;
        if (data) {
          setCourse(data);
          const firstPreview = (data.chapters || [])
            .flatMap((ch) => ch.lessons || [])
            .find((les) => les.is_preview);
          setActivePreviewLesson(firstPreview || null);
        } else {
          setErrorMsg('Không tìm thấy thông tin khóa học.');
        }
      } catch (err) {
        console.warn('Load course full view error:', err);
        setErrorMsg('Không thể tải khóa học này hoặc đường dẫn không tồn tại.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [slug]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: '#0284c7' }}></i>
        <p style={{ marginTop: '14px', fontSize: '0.95rem', fontWeight: '600' }}>
          Đang nạp chi tiết khóa học từ máy chủ...
        </p>
      </div>
    );
  }

  if (errorMsg || !course) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '1.8rem' }}>
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>
          {errorMsg || 'Không tìm thấy khóa học'}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '8px 0 20px 0' }}>
          Đường dẫn <code>/courses/{slug}</code> có thể đã thay đổi hoặc khóa học chưa được công khai.
        </p>
        <button className="btn-primary" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i>
          <span>Quay lại danh mục khóa học</span>
        </button>
      </div>
    );
  }

  const isEnrolled = myCourses.some((m) => (m.course?.id || m.id) === course.id);
  const isFree = course.is_free || Number(course.price) === 0;
  const fullUrl = `${window.location.origin}/#/courses/${course.slug || course.id}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2500);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 0 40px 0' }}>
      {/* Breadcrumb & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>Tất cả Khóa học</span>
          </button>
          <span>/</span>
          <span style={{ color: 'var(--text-muted)' }}>{course.category?.name || 'Tiếng Anh'}</span>
          <span>/</span>
          <strong style={{ color: 'var(--text-main)' }}>{course.title}</strong>
        </div>

        {/* URL Slug pill & Copy action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Đường dẫn định danh:</span>
          <button
            onClick={handleCopyUrl}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              fontSize: '0.78rem',
              fontWeight: '700',
              color: '#334155',
              cursor: 'pointer',
            }}
            title="Bấm để sao chép link trực tiếp đến khóa học này"
          >
            <i className={`fa-solid ${copiedSlug ? 'fa-check text-green-600' : 'fa-link'}`}></i>
            <span>{copiedSlug ? 'Đã sao chép Link!' : `/#/courses/${course.slug || course.id}`}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left (Video & Info) + Right (Enrollment Card) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '28px' }}>
        {/* LEFT COLUMN: Media Player + Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Main Stage Video Player or Banner */}
          <div
            style={{
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              backgroundColor: '#0f172a',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            {activePreviewLesson && activePreviewLesson.video_url ? (
              <div>
                <div
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ backgroundColor: '#10b981', color: 'white', padding: '3px 8px', borderRadius: '4px', fontWeight: '800', fontSize: '0.72rem' }}>
                      🎬 ĐANG XEM THỬ MIỄN PHÍ
                    </span>
                    <strong>{activePreviewLesson.title}</strong>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {activePreviewLesson.duration_minutes || 15} phút
                  </span>
                </div>

                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '56.25%',
                    backgroundColor: '#000',
                    overflow: 'hidden',
                  }}
                >
                  {isYouTubeUrl(activePreviewLesson.video_url) ? (
                    <iframe
                      src={getYouTubeEmbedUrl(activePreviewLesson.video_url)}
                      title={activePreviewLesson.title}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none',
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={activePreviewLesson.video_url}
                      controls
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative', height: '320px', backgroundColor: '#0284c7' }}>
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '4rem' }}>
                    <i className="fa-solid fa-graduation-cap"></i>
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px', background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95), transparent)' }}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '800', backgroundColor: '#ffffff', color: '#0f172a', marginBottom: '8px' }}>
                    CEFR {course.level || 'B1'}
                  </span>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff', margin: 0 }}>
                    {course.title}
                  </h1>
                </div>
              </div>
            )}
          </div>

          {/* Active Lesson Knowledge Box */}
          {activePreviewLesson && activePreviewLesson.content && (
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '8px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                fontSize: '0.88rem',
              }}
            >
              <strong style={{ color: '#15803d', display: 'block', marginBottom: '6px', fontSize: '0.92rem' }}>
                💡 Trọng tâm bài giảng: {activePreviewLesson.title}
              </strong>
              <div style={{ whiteSpace: 'pre-line', lineHeight: 1.7, color: '#166534' }}>
                {activePreviewLesson.content}
              </div>
            </div>
          )}

          {/* Course Description */}
          <div
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '14px' }}>
              🎯 Giới thiệu và Mục tiêu khóa học
            </h3>
            <div
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.75,
                whiteSpace: 'pre-line',
              }}
            >
              {course.description || 'Khóa học được thiết kế chuẩn đầu ra CEFR với bài giảng chi tiết và bài tập ôn luyện phong phú.'}
            </div>
          </div>

          {/* Curriculum Section */}
          <div
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                📚 Giáo trình khóa học ({course.chapters?.length || 0} Chương · {course.chapters?.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0) || 0} Bài giảng)
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: '700' }}>
                ✓ Các bài có nhãn "Học thử miễn phí" có thể xem ngay
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(course.chapters || []).map((ch, idx) => (
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
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{ch.title}</strong>
                    {ch.description && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px', whiteSpace: 'pre-line' }}>
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
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          style={{
                            padding: '12px 16px',
                            borderTop: lIdx > 0 ? '1px solid var(--border-color)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.85rem',
                            backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                            cursor: canPreview ? 'pointer' : 'not-allowed',
                            opacity: canPreview ? 1 : 0.65,
                            transition: 'all 0.15s ease',
                          }}
                          title={canPreview ? 'Bấm để xem thử video bài giảng này' : 'Bài giảng bị khóa. Hãy ghi danh để mở khóa toàn bộ.'}
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
                              <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: isSelected ? '#bbf7d0' : '#dcfce7', color: '#15803d', fontWeight: '800' }}>
                                {isSelected ? '🎬 Đang phát' : 'Học thử miễn phí'}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: '600' }}>
                                🔒 Khóa (Cần ghi danh)
                              </span>
                            )}
                          </div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {les.duration_minutes || 15} phút
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Purchase / Enrollment Card & Instructor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              position: 'sticky',
              top: '20px',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              HỌC PHÍ KHÓA HỌC
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: isFree ? '#059669' : '#ea580c', margin: '4px 0 16px 0' }}>
              {isFree ? 'Miễn phí 100%' : `${Number(course.price || 0).toLocaleString('vi-VN')} đ`}
            </div>

            {isEnrolled ? (
              <button
                className="btn-primary"
                onClick={() => onNavigateToLearning && onNavigateToLearning(course)}
                style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: '800', backgroundColor: '#059669', marginBottom: '16px' }}
              >
                <i className="fa-solid fa-circle-play"></i>
                <span>✓ Vào Học Ngay</span>
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={() => onEnroll && onEnroll(course)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: '800',
                  backgroundColor: isFree ? '#0284c7' : '#ea580c',
                  marginBottom: '16px',
                }}
              >
                <i className={`fa-solid ${isFree ? 'fa-play' : 'fa-cart-shopping'}`}></i>
                <span>{isFree ? 'Ghi Danh Miễn Phí' : 'Mua Khóa Học'}</span>
              </button>
            )}

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-layer-group" style={{ color: '#0284c7', width: '16px' }}></i>
                <span>Trình độ chuẩn: <strong>CEFR {course.level || 'B1'}</strong></span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-video" style={{ color: '#0284c7', width: '16px' }}></i>
                <span>{course.chapters?.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0) || 1} bài giảng video chất lượng cao</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-robot" style={{ color: '#7c3aed', width: '16px' }}></i>
                <span>Trợ lý AI phân tích lỗ hổng & chấm điểm 24/7</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-certificate" style={{ color: '#f59e0b', width: '16px' }}></i>
                <span>Cấp chứng chỉ hoàn thành khóa học</span>
              </li>
            </ul>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />

            {/* Teacher Details */}
            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              GIẢNG VIÊN ĐÀO TẠO
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '1.1rem',
                }}
              >
                {course.teacher?.full_name ? course.teacher.full_name.charAt(0).toUpperCase() : 'G'}
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'block' }}>
                  {course.teacher?.full_name || 'Giảng viên chuyên môn'}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {course.teacher?.email || 'teacher@elearning.edu.vn'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

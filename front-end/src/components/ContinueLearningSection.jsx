import React from 'react';
import { cleanCourseTitle } from '../utils/media';

export default function ContinueLearningSection({ myCourses = [], onNavigateToLearning, onViewAll }) {
  if (!myCourses || myCourses.length === 0) return null;

  return (
    <section className="continue-learning-section" style={{ marginTop: '28px', marginBottom: '10px' }}>
      <div
        className="section-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div>
          <h2
            className="section-title"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: '800',
              color: 'var(--text-main)',
            }}
          >
            <i className="fa-solid fa-circle-play" style={{ color: '#0284c7' }}></i>
            <span>TIẾP TỤC BÀI HỌC CỦA BẠN</span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                padding: '2px 8px',
                borderRadius: '12px',
                marginLeft: '4px',
              }}
            >
              {myCourses.length} khóa đang học
            </span>
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Tiếp tục tiến trình học tập để duy trì thói quen và hoàn thành mục tiêu CEFR của bạn
          </span>
        </div>

        {onViewAll && (
          <button
            type="button"
            className="btn-link"
            onClick={onViewAll}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontWeight: '700',
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '6px',
            }}
          >
            <span>Đến phòng học của tôi</span>
            <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.78rem' }}></i>
          </button>
        )}
      </div>

      <div
        className="enrolled-courses-scroll-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '18px',
        }}
      >
        {myCourses.slice(0, 4).map((enrollment) => {
          const course = enrollment.course || enrollment;
          const progress = Math.min(100, Math.max(0, Math.round(enrollment.progress_percent || 0)));
          const isCompleted = progress >= 100 || enrollment.status === 'COMPLETED';

          return (
            <div
              key={enrollment.id || course.id}
              className="enrolled-course-card"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {/* Thumbnail */}
              <div style={{ position: 'relative', width: '100%', height: '140px', backgroundColor: '#0f172a' }}>
                <img
                  src={course.thumbnail || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=500&q=80'}
                  alt={course.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=500&q=80';
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    color: '#38bdf8',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    letterSpacing: '0.5px',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  CEFR {course.level || 'B1'}
                </span>

                {isCompleted && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <i className="fa-solid fa-circle-check"></i>
                    Hoàn thành
                  </span>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h4
                  style={{
                    fontSize: '0.94rem',
                    fontWeight: '700',
                    margin: '0 0 8px 0',
                    color: 'var(--text-main)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.35',
                    minHeight: '2.7em',
                  }}
                  title={course.title}
                >
                  {cleanCourseTitle(course.title)}
                </h4>

                <div
                  style={{
                    fontSize: '0.76rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '12px',
                  }}
                >
                  <i className="fa-solid fa-chalkboard-user" style={{ color: '#64748b' }}></i>
                  <span>{course.instructor?.full_name || course.instructor_name || 'TL-English Mentor'}</span>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 'auto', marginBottom: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      color: isCompleted ? '#059669' : 'var(--text-muted)',
                      marginBottom: '5px',
                    }}
                  >
                    <span>Tiến độ học tập</span>
                    <span>{progress}%</span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: 'var(--border-color)',
                      borderRadius: '99px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${progress}%`,
                        height: '100%',
                        backgroundColor: isCompleted ? '#10b981' : '#0284c7',
                        borderRadius: '99px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Button */}
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onNavigateToLearning && onNavigateToLearning(course)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                    backgroundColor: isCompleted ? '#0f766e' : '#0284c7',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <i className={isCompleted ? 'fa-solid fa-arrow-rotate-left' : 'fa-solid fa-play'}></i>
                  <span>{isCompleted ? 'Ôn tập khóa học' : 'Tiếp tục học ngay'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

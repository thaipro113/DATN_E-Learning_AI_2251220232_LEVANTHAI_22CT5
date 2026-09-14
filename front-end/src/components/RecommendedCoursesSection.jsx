import React, { useState, useMemo, useEffect } from 'react';
import { cleanCourseTitle, isCourseEnrolled } from '../utils/media';
import Pagination from './Pagination';

/**
 * Chuẩn hóa chuỗi tiếng Việt không dấu để tìm kiếm mượt mà
 */
function normalizeStr(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();
}

export default function RecommendedCoursesSection({
  courses = [],
  myCourses = [],
  onEnroll,
  onSelectCourse,
  onNavigateToLearning,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Reset về trang 1 khi người dùng gõ từ khóa tìm kiếm mới
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Lấy danh sách toàn bộ các khóa học mà học viên CHƯA ĐĂNG KÝ
  const unenrolledCourses = useMemo(() => {
    return courses.filter((c) => !isCourseEnrolled(c, myCourses));
  }, [courses, myCourses]);

  // Lọc theo từ khóa tìm kiếm (tên khóa học, danh mục, cấp độ CEFR, mô tả)
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return unenrolledCourses;
    const qNorm = normalizeStr(searchQuery);

    return unenrolledCourses.filter((c) => {
      const titleNorm = normalizeStr(c.title);
      const catNorm = normalizeStr(c.category?.name);
      const descNorm = normalizeStr(c.description);
      const levelNorm = normalizeStr(c.level);
      return (
        titleNorm.includes(qNorm) ||
        catNorm.includes(qNorm) ||
        descNorm.includes(qNorm) ||
        levelNorm.includes(qNorm)
      );
    });
  }, [unenrolledCourses, searchQuery]);

  // Phân trang 12 khóa học mỗi trang
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage) || 1;
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCourses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCourses, currentPage]);

  return (
    <div style={{ marginTop: '28px' }}>
      {/* Tiêu đề mục & Thanh tìm kiếm */}
      <div
        className="section-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <i className="fa-solid fa-graduation-cap section-title-icon" style={{ color: '#0284c7' }}></i>
            <span>KHÓA HỌC DÀNH CHO BẠN</span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                padding: '2px 8px',
                borderRadius: '12px',
                marginLeft: '6px',
              }}
            >
              {filteredCourses.length} khóa
            </span>
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Danh sách các khóa học bạn chưa đăng ký, chọn khóa học phù hợp để bắt đầu lộ trình
          </span>
        </div>

        {/* Thanh tìm kiếm */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Tìm kiếm khóa học, trình độ CEFR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '34px',
              paddingRight: searchQuery ? '32px' : '12px',
              height: '38px',
              fontSize: '0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
              width: '100%',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              title="Xóa tìm kiếm"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                fontSize: '0.85rem',
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>
      </div>

      {/* Danh sách khóa học hoặc Trạng thái trống */}
      {paginatedCourses.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '12px',
            border: '1px dashed var(--border-color)',
            margin: '20px 0',
          }}
        >
          <i
            className="fa-solid fa-inbox"
            style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '12px' }}
          ></i>
          {searchQuery ? (
            <>
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-main)' }}>Không tìm thấy khóa học nào</h4>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Không có kết quả phù hợp với từ khóa "<strong>{searchQuery}</strong>".
              </p>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setSearchQuery('')}
                style={{ marginTop: '14px', padding: '6px 14px', fontSize: '0.82rem' }}
              >
                Xóa bộ lọc tìm kiếm
              </button>
            </>
          ) : (
            <>
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-main)' }}>
                Bạn đã đăng ký toàn bộ khóa học!
              </h4>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Hiện không còn khóa học mới chưa đăng ký. Hãy tiếp tục tiến trình học tập của bạn.
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="course-grid">
            {paginatedCourses.map((course, idx) => {
              const isFree = course.is_free || Number(course.price) === 0;
              const isEnrolled = isCourseEnrolled(course, myCourses);

              return (
                <div
                  key={course.id || idx}
                  className="course-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectCourse && onSelectCourse(course)}
                >
                  {/* Top Thumbnail Banner with Image */}
                  <div
                    className="course-card-top"
                    style={{
                      height: '140px',
                      backgroundColor: '#0284c7',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '2.5rem',
                        }}
                      >
                        <i className="fa-solid fa-graduation-cap"></i>
                      </div>
                    )}
                    <span className="course-level-tag">
                      CEFR {course.level || 'B1'}
                    </span>

                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: isFree ? '#10b981' : '#f59e0b',
                        color: 'white',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                      }}
                    >
                      {isFree ? 'Miễn phí' : `${Number(course.price || 0).toLocaleString('vi-VN')} đ`}
                    </span>
                  </div>

                  {/* Content Body */}
                  <div className="course-card-content">
                    <div>
                      <span className="course-cat-tag">
                        {course.category?.name || 'Ngữ pháp Tiếng Anh'}
                      </span>
                      <h3 className="course-card-title">{cleanCourseTitle(course.title)}</h3>
                      <p className="course-card-desc">{course.description}</p>
                    </div>

                    {/* Card Footer with Price and Action */}
                    <div className="course-card-footer" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                          Học phí:
                        </span>
                        <strong style={{ fontSize: '1rem', color: isFree ? '#059669' : '#ea580c' }}>
                          {isFree ? 'Miễn phí 100%' : `${Number(course.price || 0).toLocaleString('vi-VN')} đ`}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn-outline"
                          onClick={() => onSelectCourse && onSelectCourse(course)}
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        >
                          <i className="fa-regular fa-eye"></i>
                          <span>Chi tiết</span>
                        </button>

                        {isEnrolled ? (
                          <button
                            className="btn-primary"
                            onClick={() => onNavigateToLearning && onNavigateToLearning(course)}
                            style={{ padding: '6px 12px', fontSize: '0.78rem', backgroundColor: '#059669' }}
                          >
                            <i className="fa-solid fa-circle-play"></i>
                            <span>Vào học</span>
                          </button>
                        ) : (
                          <button
                            className="btn-primary"
                            onClick={() => onEnroll && onEnroll(course)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.78rem',
                              backgroundColor: isFree ? '#0284c7' : '#ea580c',
                            }}
                          >
                            <i className={`fa-solid ${isFree ? 'fa-pen-to-square' : 'fa-cart-shopping'}`}></i>
                            <span>{isFree ? 'Đăng ký' : 'Mua ngay'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Phân trang 12 khóa / page */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCourses.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </>
      )}
    </div>
  );
}

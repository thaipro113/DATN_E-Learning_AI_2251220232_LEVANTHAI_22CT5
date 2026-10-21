import React, { useState, useEffect, useMemo } from 'react';
import CourseDetailModal from './CourseDetailModal';
import Pagination from './Pagination';
import { cleanCourseTitle, isCourseEnrolled } from '../utils/media';

export default function CourseCatalogView({ courses = [], myCourses = [], onEnroll, onNavigateToLearning }) {
  // Tabs: 'ALL' (hiển thị 2 phân khu), 'REGISTERED' (chỉ đã đăng ký), 'UNREGISTERED' (chưa đăng ký)
  const [activeCatalogTab, setActiveCatalogTab] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingCourse, setViewingCourse] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCatalogTab, selectedLevel, searchQuery]);

  const levels = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  // Phân chia danh sách khóa học: Đã đăng ký & Chưa đăng ký
  const registeredCourses = useMemo(() => {
    if (!Array.isArray(myCourses) || myCourses.length === 0) return [];

    const enrolledMap = new Map();
    myCourses.forEach((item) => {
      const cObj = item.course || item;
      const cId = cObj.id || item.course_id;
      if (cId) {
        const matched = courses.find(
          (c) => String(c.id).toLowerCase() === String(cId).toLowerCase() || (c.slug && c.slug === cObj.slug)
        );
        const parsedProgress = item.progress_percent != null ? Math.round(Number(item.progress_percent)) : (matched?.progress_percent != null ? Math.round(Number(matched.progress_percent)) : 0);
        enrolledMap.set(String(cId).toLowerCase(), {
          ...(matched || cObj),
          progress_percent: parsedProgress,
          status: item.status || (parsedProgress >= 100 ? 'COMPLETED' : 'ACTIVE'),
          enrollment: item,
        });
      }
    });

    courses.forEach((c) => {
      const key = String(c.id).toLowerCase();
      if (!enrolledMap.has(key) && isCourseEnrolled(c, myCourses)) {
        const matchedItem = myCourses.find((item) => {
          const cObj = item.course || item;
          const cId = cObj.id || item.course_id;
          return cId && String(cId).toLowerCase() === key;
        });
        const parsedProgress = matchedItem?.progress_percent != null ? Math.round(Number(matchedItem.progress_percent)) : 0;
        enrolledMap.set(key, {
          ...c,
          progress_percent: parsedProgress,
          status: matchedItem?.status || (parsedProgress >= 100 ? 'COMPLETED' : 'ACTIVE'),
          enrollment: matchedItem,
        });
      }
    });

    return Array.from(enrolledMap.values());
  }, [courses, myCourses]);

  const unregisteredCourses = useMemo(() => {
    return courses.filter((c) => !isCourseEnrolled(c, myCourses));
  }, [courses, myCourses]);

  // Bộ lọc tìm kiếm & CEFR level cho khóa học chưa đăng ký
  const filteredUnregistered = useMemo(() => {
    return unregisteredCourses.filter((c) => {
      const matchLevel = selectedLevel === 'ALL' || c.level === selectedLevel;
      const matchSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.category?.name && c.category.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchLevel && matchSearch;
    });
  }, [unregisteredCourses, selectedLevel, searchQuery]);

  // Bộ lọc tìm kiếm cho khóa học đã đăng ký
  const filteredRegistered = useMemo(() => {
    return registeredCourses.filter((c) => {
      const matchSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.category?.name && c.category.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSearch;
    });
  }, [registeredCourses, searchQuery]);

  // Hàm render 1 card khóa học chuẩn E-Learning
  const renderCourseCard = (course, isEnrolled) => {
    const isFree = course.is_free || Number(course.price) === 0;
    const progress = Math.min(
      100,
      Math.max(0, Math.round(course.progress_percent != null ? course.progress_percent : (course.enrollment?.progress_percent || 0)))
    );
    const isCompleted = isEnrolled && (progress >= 100 || course.status === 'COMPLETED' || course.enrollment?.status === 'COMPLETED');

    return (
      <div key={course.id} className="course-card" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Card Image Banner */}
        <div
          className="course-card-top"
          style={{
            height: '140px',
            backgroundColor: '#0284c7',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
          onClick={() => setViewingCourse(course)}
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

          {isEnrolled ? (
            isCompleted ? (
              <span
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                }}
              >
                <i className="fa-solid fa-circle-check"></i>
                <span>Hoàn thành</span>
              </span>
            ) : (
              <span
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                }}
              >
                <i className="fa-solid fa-check"></i>
                <span>Đã đăng ký</span>
              </span>
            )
          ) : (
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
          )}
        </div>

        {/* Card Content */}
        <div className="course-card-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', gap: '8px' }}>
              <span className="course-cat-tag" style={{ margin: 0 }}>
                {course.category?.name || 'Ngữ pháp Tiếng Anh'}
              </span>
              <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fa-solid fa-chalkboard-user"></i>
                <span>{course.instructor?.full_name || course.instructor_name || 'TL-English Mentor'}</span>
              </span>
            </div>

            <h3
              className="course-card-title"
              style={{ cursor: 'pointer', margin: '0 0 6px 0', fontSize: '0.96rem', fontWeight: '800', lineHeight: '1.35' }}
              onClick={() => setViewingCourse(course)}
            >
              {cleanCourseTitle(course.title)}
            </h3>
            <p
              className="course-card-desc"
              style={{
                fontSize: '0.78rem',
                color: '#64748b',
                margin: '0 0 10px 0',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {course.description}
            </p>
          </div>

          {/* Thanh Tiến độ học tập (%) chuẩn như ở Dashboard Tổng quan */}
          {isEnrolled && (
            <div style={{ marginTop: 'auto', marginBottom: '14px', paddingTop: '6px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  color: isCompleted ? '#059669' : '#64748b',
                  marginBottom: '5px',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i
                    className={isCompleted ? 'fa-solid fa-circle-check' : 'fa-solid fa-chart-line'}
                    style={{ color: isCompleted ? '#10b981' : '#0284c7' }}
                  ></i>
                  <span>Tiến độ học tập</span>
                </span>
                <span style={{ color: isCompleted ? '#059669' : '#0284c7', fontWeight: '800' }}>
                  {progress}%
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#e2e8f0',
                  borderRadius: '99px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: isCompleted
                      ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)',
                    borderRadius: '99px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div
            className="course-card-footer"
            style={{
              marginTop: isEnrolled ? '0' : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <span
              className="course-price-text"
              style={{
                color: isCompleted ? '#059669' : isEnrolled ? '#0284c7' : isFree ? '#0284c7' : 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: '700',
              }}
            >
              {isCompleted
                ? 'Đã hoàn thành'
                : isEnrolled
                ? 'Đang theo học'
                : isFree
                ? 'Miễn phí 100%'
                : `${Number(course.price || 0).toLocaleString('vi-VN')} đ`}
            </span>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="btn-outline"
                onClick={() => setViewingCourse(course)}
                style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: '8px', cursor: 'pointer' }}
                title="Xem giáo trình chi tiết"
              >
                <i className="fa-solid fa-eye" style={{ marginRight: '4px' }}></i>
                <span>Chi tiết</span>
              </button>

              {isEnrolled ? (
                <button
                  className="btn-primary"
                  onClick={() => onNavigateToLearning && onNavigateToLearning(course)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    backgroundColor: isCompleted ? '#10b981' : '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: isCompleted ? '0 2px 8px rgba(16, 185, 129, 0.25)' : '0 2px 8px rgba(5, 150, 105, 0.25)',
                  }}
                >
                  <i className={`fa-solid ${isCompleted ? 'fa-rotate-left' : 'fa-circle-play'}`}></i>
                  <span>{isCompleted ? 'Ôn tập khóa học' : 'Tiếp tục học'}</span>
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => onEnroll && onEnroll(course)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    backgroundColor: isFree ? '#0284c7' : '#ea580c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer',
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
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Page Header with Title & Search */}
      <div className="page-header-box">
        <div>
          <h2 className="page-title">
            <i className="fa-solid fa-book-open" style={{ color: '#0284c7' }}></i>
            <span>DANH MỤC KHÓA HỌC TIẾNG ANH CHUẨN CEFR</span>
          </h2>
          <p className="page-subtitle">
            Khám phá các khóa học chất lượng cao từ A1 đến C2 kèm giáo trình chi tiết và Trợ lý AI đồng hành.
          </p>
        </div>

        {/* Search & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Tạm thời ẩn nút Wizard khảo sát 4 bước để tập trung vào 3 tính năng cốt lõi
          <button
            type="button"
            onClick={() => setIsWizardOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>Tìm khóa học phù hợp cùng AI (4 bước)</span>
          </button>
          */}

          <div style={{ position: 'relative', width: '260px' }}>
            <input
              type="text"
              placeholder="Tìm kiếm khóa học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                outline: 'none',
                backgroundColor: 'var(--bg-surface)',
              }}
            />
            <i
              className="fa-solid fa-magnifying-glass"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
              }}
            ></i>
          </div>
        </div>
      </div>

      {/* 2. Main Classification Tabs: Tất cả | Khóa học đã đăng ký | Khóa học chưa đăng ký */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          padding: '6px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          width: 'fit-content',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveCatalogTab('ALL')}
          style={{
            padding: '8px 18px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: '700',
            cursor: 'pointer',
            backgroundColor: activeCatalogTab === 'ALL' ? '#0284c7' : 'transparent',
            color: activeCatalogTab === 'ALL' ? '#ffffff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <i className="fa-solid fa-layer-group"></i>
          <span>Tất cả khóa học</span>
          <span
            style={{
              padding: '1px 7px',
              borderRadius: '10px',
              fontSize: '0.72rem',
              backgroundColor: activeCatalogTab === 'ALL' ? 'rgba(255, 255, 255, 0.25)' : '#e2e8f0',
              color: activeCatalogTab === 'ALL' ? '#ffffff' : '#475569',
            }}
          >
            {courses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCatalogTab('REGISTERED')}
          style={{
            padding: '8px 18px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: '700',
            cursor: 'pointer',
            backgroundColor: activeCatalogTab === 'REGISTERED' ? '#059669' : 'transparent',
            color: activeCatalogTab === 'REGISTERED' ? '#ffffff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <i className="fa-solid fa-graduation-cap"></i>
          <span>Khóa học đã đăng ký</span>
          <span
            style={{
              padding: '1px 7px',
              borderRadius: '10px',
              fontSize: '0.72rem',
              backgroundColor: activeCatalogTab === 'REGISTERED' ? 'rgba(255, 255, 255, 0.25)' : '#e2e8f0',
              color: activeCatalogTab === 'REGISTERED' ? '#ffffff' : '#475569',
            }}
          >
            {registeredCourses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCatalogTab('UNREGISTERED')}
          style={{
            padding: '8px 18px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: '700',
            cursor: 'pointer',
            backgroundColor: activeCatalogTab === 'UNREGISTERED' ? '#0284c7' : 'transparent',
            color: activeCatalogTab === 'UNREGISTERED' ? '#ffffff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <i className="fa-solid fa-compass"></i>
          <span>Khóa học chưa đăng ký</span>
          <span
            style={{
              padding: '1px 7px',
              borderRadius: '10px',
              fontSize: '0.72rem',
              backgroundColor: activeCatalogTab === 'UNREGISTERED' ? 'rgba(255, 255, 255, 0.25)' : '#e2e8f0',
              color: activeCatalogTab === 'UNREGISTERED' ? '#ffffff' : '#475569',
            }}
          >
            {unregisteredCourses.length}
          </span>
        </button>
      </div>

      {/* =========================================================================
          SECTION 1: KHÓA HỌC BẠN ĐÃ ĐĂNG KÝ
          ========================================================================= */}
      {(activeCatalogTab === 'ALL' || activeCatalogTab === 'REGISTERED') && (
        <section
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '24px 28px',
            border: '1px solid rgba(226, 232, 240, 0.85)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
          }}
        >
          {/* Section Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '14px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                }}
              >
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: '900', color: '#0f172a' }}>
                  Khóa Học Bạn Đã Đăng Ký
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                  Các khóa học bạn đang theo học. Bấm "Vào học" để tiếp tục giáo trình.
                </p>
              </div>
            </div>

            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: '700',
                color: '#059669',
                backgroundColor: '#ecfdf5',
                padding: '4px 12px',
                borderRadius: '20px',
              }}
            >
              {filteredRegistered.length} khóa học
            </span>
          </div>

          {/* Grid or Empty State */}
          {filteredRegistered.length > 0 ? (
            <div className="course-grid">
              {filteredRegistered.map((course) => renderCourseCard(course, true))}
            </div>
          ) : (
            <div
              style={{
                padding: '36px 20px',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                borderRadius: '16px',
                border: '1.5px dashed #cbd5e1',
              }}
            >
              <i
                className="fa-solid fa-graduation-cap"
                style={{ fontSize: '2.4rem', color: '#94a3b8', marginBottom: '10px', display: 'block' }}
              ></i>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: '800', color: '#334155' }}>
                {searchQuery ? 'Không tìm thấy khóa học đã đăng ký phù hợp với từ khóa' : 'Bạn chưa đăng ký khóa học nào'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                {searchQuery
                  ? 'Vui lòng thử tìm kiếm với từ khóa khác.'
                  : 'Hãy khám phá các khóa học bên dưới và bấm "Đăng ký" để bắt đầu lộ trình học nhé!'}
              </p>
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          SECTION 2: KHÓA HỌC CHƯA ĐĂNG KÝ (KHÁM PHÁ THÊM)
          ========================================================================= */}
      {(activeCatalogTab === 'ALL' || activeCatalogTab === 'UNREGISTERED') && (
        <section
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '24px 28px',
            border: '1px solid rgba(226, 232, 240, 0.85)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
          }}
        >
          {/* Section Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
              paddingBottom: '14px',
              borderBottom: '1px solid #f1f5f9',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                }}
              >
                <i className="fa-solid fa-compass"></i>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: '900', color: '#0f172a' }}>
                  Khóa Học Chưa Đăng Ký (Khám Phá Thêm)
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                  Lựa chọn khóa học phù hợp với trình độ CEFR mục tiêu của bạn.
                </p>
              </div>
            </div>

            {/* Level Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {levels.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  style={{
                    padding: '5px 13px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    border: '1px solid',
                    borderColor: selectedLevel === lvl ? '#0284c7' : '#cbd5e1',
                    backgroundColor: selectedLevel === lvl ? '#0284c7' : '#ffffff',
                    color: selectedLevel === lvl ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {lvl === 'ALL' ? 'Tất cả trình độ' : `Trình độ ${lvl}`}
                </button>
              ))}
            </div>
          </div>

          {/* Grid or Empty State */}
          {filteredUnregistered.length > 0 ? (
            <>
              <div className="course-grid">
                {filteredUnregistered
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((course) => renderCourseCard(course, false))}
              </div>

              {/* Phân trang */}
              {filteredUnregistered.length > itemsPerPage && (
                <div style={{ marginTop: '20px' }}>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredUnregistered.length / itemsPerPage)}
                    totalItems={filteredUnregistered.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                padding: '36px 20px',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                borderRadius: '16px',
                border: '1.5px dashed #cbd5e1',
              }}
            >
              <i
                className="fa-solid fa-circle-info"
                style={{ fontSize: '2.4rem', color: '#94a3b8', marginBottom: '10px', display: 'block' }}
              ></i>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: '800', color: '#334155' }}>
                Không tìm thấy khóa học phù hợp với bộ lọc hiện tại
              </h4>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                {unregisteredCourses.length === 0
                  ? 'Tuyệt vời! Bạn đã đăng ký toàn bộ các khóa học trên hệ thống.'
                  : 'Vui lòng chọn trình độ CEFR khác hoặc điều chỉnh từ khóa tìm kiếm.'}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Course Detail Modal */}
      <CourseDetailModal
        isOpen={!!viewingCourse}
        onClose={() => setViewingCourse(null)}
        course={viewingCourse}
        myCourses={myCourses}
        onEnroll={onEnroll}
        onNavigateToLearning={onNavigateToLearning}
      />

    </div>
  );
}

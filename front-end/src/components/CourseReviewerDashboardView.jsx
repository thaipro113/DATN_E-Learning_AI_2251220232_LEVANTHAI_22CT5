import React, { useState, useEffect } from 'react';
import { courseAPI } from '../services/api';

export default function CourseReviewerDashboardView({ user, onBackToDashboard }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [toastMsg, setToastMsg] = useState(null);

  // Modal xem chi tiết giáo trình để thẩm định
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    course: null,
    details: null,
    loadingDetails: false,
  });

  // Modal phản biện / yêu cầu chỉnh sửa
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    course: null,
    criteria: {
      content: false,
      video: false,
      quiz: false,
      materials: false,
    },
    notes: '',
    isSubmitting: false,
  });

  // 1. Tải danh sách toàn bộ khóa học để thẩm định
  const fetchAllCourses = async () => {
    setLoading(true);
    try {
      // Backend cho phép REVIEWER xem mọi trạng thái khóa học
      const res = await courseAPI.getCourses();
      const courseList = res.data?.data || res.data || [];
      setCourses(Array.isArray(courseList) ? courseList : []);
    } catch (err) {
      setToastMsg({ type: 'error', text: 'Không thể tải danh sách khóa học cần thẩm định.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCourses();
  }, []);

  // 2. Thao tác Phê duyệt & Xuất bản khóa học
  const handleApprove = async (course) => {
    const isConfirmed = window.confirm(
      `Xác nhận phê duyệt khóa học "${course.title}" đạt chuẩn sư phạm và xuất bản công khai cho học viên?`
    );
    if (!isConfirmed) return;

    try {
      await courseAPI.approveCourse(course.id);
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id
            ? {
                ...c,
                status: 'PUBLISHED',
                status_display: 'Đã xuất bản',
                rejection_reason: null,
                reviewed_by: { full_name: user?.full_name || 'Hội đồng Thẩm định' },
                reviewed_at: new Date().toISOString(),
              }
            : c
        )
      );
      if (previewModal.isOpen && previewModal.course?.id === course.id) {
        setPreviewModal((prev) => ({
          ...prev,
          course: { ...prev.course, status: 'PUBLISHED', status_display: 'Đã xuất bản' },
        }));
      }
      setToastMsg({
        type: 'success',
        text: `✓ Khóa học "${course.title}" đã được thẩm định đạt chuẩn và xuất bản thành công!`,
      });
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt khóa học.';
      setToastMsg({ type: 'error', text: errMsg });
    }
  };

  // 3. Mở Modal phản biện / yêu cầu chỉnh sửa
  const handleOpenReviewModal = (course) => {
    setReviewModal({
      isOpen: true,
      course,
      criteria: { content: false, video: false, quiz: false, materials: false },
      notes: course.rejection_reason || '',
      isSubmitting: false,
    });
  };

  // 4. Xác nhận gửi phản biện
  const handleConfirmReview = async () => {
    if (!reviewModal.notes.trim()) {
      alert('Vui lòng nhập chi tiết nhận xét phản biện để giảng viên biết nội dung cần chỉnh sửa!');
      return;
    }

    setReviewModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      // Tổng hợp phản biện
      const selectedCriteria = [];
      if (reviewModal.criteria.content) selectedCriteria.push('Nội dung giáo án');
      if (reviewModal.criteria.video) selectedCriteria.push('Chất lượng Video/Âm thanh');
      if (reviewModal.criteria.quiz) selectedCriteria.push('Ngân hàng câu hỏi');
      if (reviewModal.criteria.materials) selectedCriteria.push('Tài liệu học tập');

      const criteriaPrefix = selectedCriteria.length > 0
        ? `[Hạng mục cần khắc phục: ${selectedCriteria.join(', ')}]\n`
        : '';
      const fullFeedback = `${criteriaPrefix}${reviewModal.notes.trim()}`;

      await courseAPI.rejectCourse(reviewModal.course.id, { reason: fullFeedback });

      setCourses((prev) =>
        prev.map((c) =>
          c.id === reviewModal.course.id
            ? {
                ...c,
                status: 'REJECTED',
                status_display: 'Bị từ chối',
                rejection_reason: fullFeedback,
                reviewed_by: { full_name: user?.full_name || 'Hội đồng Thẩm định' },
                reviewed_at: new Date().toISOString(),
              }
            : c
        )
      );

      setReviewModal({ isOpen: false, course: null, criteria: {}, notes: '', isSubmitting: false });
      if (previewModal.isOpen) {
        setPreviewModal((prev) => ({
          ...prev,
          course: { ...prev.course, status: 'REJECTED', status_display: 'Bị từ chối', rejection_reason: fullFeedback },
        }));
      }

      setToastMsg({
        type: 'info',
        text: `✓ Đã gửi bản phản biện cho khóa học "${reviewModal.course?.title}". Giảng viên sẽ nhận được thông báo để chỉnh sửa.`,
      });
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi gửi phản biện.';
      setToastMsg({ type: 'error', text: errMsg });
      setReviewModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // 5. Xem trước chi tiết cấu trúc bài giảng để thẩm định
  const handleOpenPreview = async (course) => {
    setPreviewModal({
      isOpen: true,
      course,
      details: null,
      loadingDetails: true,
    });
    try {
      const res = await courseAPI.getCourseDetail(course.id);
      const detailData = res.data?.data || res.data;
      setPreviewModal((prev) => ({
        ...prev,
        details: detailData,
        loadingDetails: false,
      }));
    } catch (err) {
      setPreviewModal((prev) => ({ ...prev, loadingDetails: false }));
    }
  };

  // Lọc dữ liệu hiển thị
  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      !searchQuery.trim() ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.teacher?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && c.status === 'PENDING') ||
      (statusFilter === 'PUBLISHED' && c.status === 'PUBLISHED') ||
      (statusFilter === 'REJECTED' && c.status === 'REJECTED') ||
      (statusFilter === 'DRAFT' && c.status === 'DRAFT');

    const matchesLevel = levelFilter === 'ALL' || c.level === levelFilter;

    return matchesSearch && matchesStatus && matchesLevel;
  });

  // Đếm thống kê
  const countPending = courses.filter((c) => c.status === 'PENDING').length;
  const countPublished = courses.filter((c) => c.status === 'PUBLISHED').length;
  const countRejected = courses.filter((c) => c.status === 'REJECTED').length;

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 16px', color: '#1e293b' }}>
      {/* Toast Alert */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toastMsg.type === 'success' ? '#059669' : toastMsg.type === 'error' ? '#dc2626' : '#2563eb',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.9rem',
            fontWeight: '600',
            maxWidth: '450px',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <span>{toastMsg.text}</span>
          <button
            onClick={() => setToastMsg(null)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          borderRadius: '20px',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: '28px',
          boxShadow: '0 10px 30px -10px rgba(49, 46, 129, 0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.15)', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '10px' }}>
              <i className="fa-solid fa-scale-balanced" style={{ color: '#fbbf24' }}></i>
              <span>CỔNG THẨM ĐỊNH & KIỂM ĐỊNH CHẤT LƯỢNG ĐÀO TẠO</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
              Không Gian Phản Biện & Phê Duyệt Bài Giảng
            </h1>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#c7d2fe', maxWidth: '680px', lineHeight: '1.5' }}>
              Chào mừng <strong>{user?.full_name || 'Thẩm định viên chuyên môn'}</strong>. Bạn có quyền rà soát đề cương, kiểm định video bài giảng, ngân hàng đề thi và phản biện chất lượng sư phạm trước khi khóa học được xuất bản công khai.
            </p>
          </div>
          <button
            onClick={fetchAllCourses}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease',
            }}
          >
            <i className="fa-solid fa-arrows-rotate"></i>
            <span>Làm mới danh sách</span>
          </button>
        </div>
      </div>

      {/* 3 Thống kê trạng thái */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div
          onClick={() => setStatusFilter('PENDING')}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: statusFilter === 'PENDING' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b' }}>CHỜ THẨM ĐỊNH (CẦN DUYỆT)</span>
            <span style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-clock-rotate-left"></i>
            </span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: '900', color: '#d97706', marginTop: '8px' }}>
            {countPending}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Giảng viên đã gửi yêu cầu duyệt</span>
        </div>

        <div
          onClick={() => setStatusFilter('PUBLISHED')}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: statusFilter === 'PUBLISHED' ? '2px solid #10b981' : '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b' }}>ĐÃ THẨM ĐỊNH & XUẤT BẢN</span>
            <span style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-shield-check"></i>
            </span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: '900', color: '#059669', marginTop: '8px' }}>
            {countPublished}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Đang mở công khai cho học viên</span>
        </div>

        <div
          onClick={() => setStatusFilter('REJECTED')}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: statusFilter === 'REJECTED' ? '2px solid #ef4444' : '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b' }}>ĐÃ PHẢN BIỆN (CẦN SỬA)</span>
            <span style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-comments"></i>
            </span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: '900', color: '#dc2626', marginTop: '8px' }}>
            {countRejected}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Yêu cầu giảng viên hoàn thiện lại</span>
        </div>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
            <input
              type="text"
              placeholder="Tìm theo tên khóa học, giảng viên, danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b' }}>Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600' }}
            >
              <option value="ALL">Tất cả ({courses.length})</option>
              <option value="PENDING">Chờ thẩm định ({countPending})</option>
              <option value="PUBLISHED">Đã xuất bản ({countPublished})</option>
              <option value="REJECTED">Cần sửa ({countRejected})</option>
              <option value="DRAFT">Bản nháp</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b' }}>Trình độ:</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600' }}
            >
              <option value="ALL">Mọi cấp độ</option>
              <option value="A1">A1 - Beginner</option>
              <option value="A2">A2 - Elementary</option>
              <option value="B1">B1 - Intermediate</option>
              <option value="B2">B2 - Upper-Int</option>
              <option value="C1">C1 - Advanced</option>
              <option value="C2">C2 - Mastery</option>
            </select>
          </div>
        </div>
      </div>

      {/* Danh sách Khóa học Thẩm định */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#4338ca', marginBottom: '12px' }}></i>
          <p style={{ fontWeight: '600' }}>Đang nạp danh sách khóa học phục vụ kiểm định chuyên môn...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '48px 24px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
          <i className="fa-solid fa-clipboard-check" style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '14px' }}></i>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: '800', color: '#334155' }}>
            Không tìm thấy khóa học nào phù hợp bộ lọc
          </h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
            Hiện tại không có khóa học nào thuộc điều kiện tìm kiếm hoặc tất cả đã được thẩm định xong.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredCourses.map((c) => {
            const isPending = c.status === 'PENDING';
            const isPublished = c.status === 'PUBLISHED';
            const isRejected = c.status === 'REJECTED';

            return (
              <div
                key={c.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '20px',
                  border: isPending ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                  boxShadow: isPending ? '0 4px 15px -3px rgba(245, 158, 11, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  {/* Thumbnail */}
                  <img
                    src={c.thumbnail_url || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80'}
                    alt={c.title}
                    style={{ width: '130px', height: '85px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0, backgroundColor: '#f1f5f9' }}
                  />

                  {/* Thông tin khóa học */}
                  <div style={{ flex: '1 1 360px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          backgroundColor: isPending ? '#fef3c7' : isPublished ? '#d1fae5' : '#fee2e2',
                          color: isPending ? '#b45309' : isPublished ? '#047857' : '#b91c1c',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <i className={isPending ? 'fa-solid fa-clock' : isPublished ? 'fa-solid fa-check-double' : 'fa-solid fa-circle-exclamation'}></i>
                        <span>{isPending ? 'CHỜ THẨM ĐỊNH' : isPublished ? 'ĐÃ DUYỆT & XUẤT BẢN' : isRejected ? 'YÊU CẦU CHỈNH SỬA' : 'BẢN NHÁP'}</span>
                      </span>

                      <span style={{ fontSize: '0.75rem', fontWeight: '700', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '8px' }}>
                        Trình độ: {c.level_display || c.level}
                      </span>

                      {c.category?.name && (
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', backgroundColor: '#f8fafc', padding: '3px 8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <i className="fa-solid fa-tag" style={{ marginRight: '4px', fontSize: '0.7rem' }}></i>
                          {c.category.name}
                        </span>
                      )}
                    </div>

                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                      {c.title}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '0.8rem', color: '#64748b' }}>
                      <span>
                        <i className="fa-solid fa-chalkboard-user" style={{ marginRight: '5px', color: '#4338ca' }}></i>
                        Giảng viên: <strong>{c.teacher?.full_name || 'Giảng viên phụ trách'}</strong>
                      </span>
                      <span>
                        <i className="fa-solid fa-layer-group" style={{ marginRight: '5px', color: '#0284c7' }}></i>
                        {c.total_chapters || 0} chương • {c.total_lessons || 0} bài giảng
                      </span>
                      {c.reviewed_by?.full_name && (
                        <span style={{ color: '#059669', fontWeight: '600' }}>
                          <i className="fa-solid fa-user-check" style={{ marginRight: '4px' }}></i>
                          Thẩm định bởi: {c.reviewed_by.full_name}
                        </span>
                      )}
                    </div>

                    {/* Hiển thị lý do phản biện nếu có */}
                    {c.rejection_reason && (
                      <div
                        style={{
                          marginTop: '10px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: '#991b1b',
                          fontSize: '0.82rem',
                          lineHeight: '1.45',
                        }}
                      >
                        <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <i className="fa-solid fa-comment-dots"></i>
                          <span>Ý kiến phản biện đã gửi cho giảng viên:</span>
                        </div>
                        <div style={{ whiteSpace: 'pre-line' }}>{c.rejection_reason}</div>
                      </div>
                    )}
                  </div>

                  {/* Nhóm nút hành động thẩm định */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto' }}>
                    <button
                      onClick={() => handleOpenPreview(c)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        color: '#334155',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      title="Xem toàn bộ cấu trúc bài học, video và đề thi"
                    >
                      <i className="fa-solid fa-eye"></i>
                      <span>Rà soát giáo án</span>
                    </button>

                    <button
                      onClick={() => handleOpenReviewModal(c)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        backgroundColor: '#fee2e2',
                        border: '1px solid #fca5a5',
                        color: '#b91c1c',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      title="Gửi phản biện yêu cầu giảng viên sửa đổi"
                    >
                      <i className="fa-solid fa-message-exclamation"></i>
                      <span>Phản biện & Yêu cầu sửa</span>
                    </button>

                    {c.status !== 'PUBLISHED' && (
                      <button
                        onClick={() => handleApprove(c)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '10px',
                          backgroundColor: '#059669',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '0.82rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 4px rgba(5, 150, 105, 0.25)',
                        }}
                      >
                        <i className="fa-solid fa-check"></i>
                        <span>Duyệt & Xuất bản</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: XEM CHI TIẾT GIÁO ÁN ĐỂ THẨM ĐỊNH (PREVIEW CURRICULUM AUDIT)
         ========================================================================= */}
      {previewModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#4338ca', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  HỒ SƠ THẨM ĐỊNH GIÁO TRÌNH
                </span>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                  {previewModal.course?.title}
                </h2>
              </div>
              <button
                onClick={() => setPreviewModal({ isOpen: false, course: null, details: null, loadingDetails: false })}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {previewModal.loadingDetails ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.8rem', color: '#4338ca', marginBottom: '10px' }}></i>
                  <p>Đang tải chi tiết đề cương & video bài học...</p>
                </div>
              ) : (
                <div>
                  {/* Tổng quan khóa học */}
                  <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.85rem' }}>
                        Giảng viên: <strong>{previewModal.details?.teacher?.full_name || previewModal.course?.teacher?.full_name}</strong>
                      </span>
                      <span style={{ fontSize: '0.85rem' }}>
                        Trình độ: <strong>{previewModal.details?.level_display || previewModal.course?.level}</strong>
                      </span>
                      <span style={{ fontSize: '0.85rem' }}>
                        Trạng thái hiện tại: <strong>{previewModal.course?.status_display || previewModal.course?.status}</strong>
                      </span>
                    </div>
                    <p style={{ margin: '10px 0 0 0', fontSize: '0.88rem', color: '#475569', lineHeight: '1.5' }}>
                      {previewModal.details?.description || previewModal.course?.description}
                    </p>
                  </div>

                  {/* Mục lục các chương và bài học */}
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '800', color: '#1e293b' }}>
                    Cấu trúc chương trình học ({previewModal.details?.chapters?.length || 0} chương):
                  </h4>

                  {(!previewModal.details?.chapters || previewModal.details.chapters.length === 0) ? (
                    <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#fef2f2', borderRadius: '10px', color: '#b91c1c' }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
                      Khóa học này chưa có chương học nào! Giảng viên cần bổ sung ít nhất 1 chương và bài học.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {previewModal.details.chapters.map((ch, idx) => (
                        <div key={ch.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', backgroundColor: '#ffffff' }}>
                          <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a', marginBottom: '8px' }}>
                            Chương {idx + 1}: {ch.title}
                          </div>
                          {ch.description && (
                            <p style={{ margin: '0 0 10px 0', fontSize: '0.82rem', color: '#64748b' }}>{ch.description}</p>
                          )}

                          {/* Danh sách bài học */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {(ch.lessons || []).map((l, lIdx) => (
                              <div
                                key={l.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '8px 12px',
                                  backgroundColor: '#f8fafc',
                                  borderRadius: '8px',
                                  fontSize: '0.82rem',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <i className="fa-solid fa-circle-play" style={{ color: '#4338ca' }}></i>
                                  <span style={{ fontWeight: '600' }}>
                                    {lIdx + 1}. {l.title}
                                  </span>
                                  {l.duration_minutes > 0 && (
                                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>({l.duration_minutes} phút)</span>
                                  )}
                                  {l.is_preview && (
                                    <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', fontSize: '0.68rem', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                                      HỌC THỬ
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {l.video_url ? (
                                    <span style={{ color: '#059669', fontSize: '0.75rem', fontWeight: '700' }}>
                                      <i className="fa-solid fa-video" style={{ marginRight: '4px' }}></i> Có Video
                                    </span>
                                  ) : (
                                    <span style={{ color: '#d97706', fontSize: '0.75rem' }}>Chưa gắn Video</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setPreviewModal({ isOpen: false, course: null, details: null, loadingDetails: false })}
                style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  const course = previewModal.course;
                  setPreviewModal({ isOpen: false, course: null, details: null, loadingDetails: false });
                  handleOpenReviewModal(course);
                }}
                style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #fca5a5', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-comment-pen" style={{ marginRight: '6px' }}></i>
                Gửi phản biện
              </button>
              <button
                onClick={() => {
                  const course = previewModal.course;
                  handleApprove(course);
                }}
                style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', backgroundColor: '#059669', color: '#ffffff', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-check" style={{ marginRight: '6px' }}></i>
                Phê duyệt khóa học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: GỬI PHẢN BIỆN CHUYÊN MÔN (ACADEMIC PEER REVIEW / REVISION MODAL)
         ========================================================================= */}
      {reviewModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '620px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#dc2626', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  PHIẾU PHẢN BIỆN SƯ PHẠM
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.18rem', fontWeight: '800', color: '#0f172a' }}>
                  Yêu Cầu Chỉnh Sửa Khóa Học
                </h3>
              </div>
              <button
                onClick={() => setReviewModal({ isOpen: false, course: null, criteria: {}, notes: '', isSubmitting: false })}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: '#475569' }}>
                Khóa học: <strong>{reviewModal.course?.title}</strong>
                <br />
                Giảng viên: <strong>{reviewModal.course?.teacher?.full_name}</strong>
              </p>

              {/* Tiêu chí cần khắc phục */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                  Các tiêu chí chưa đạt yêu cầu:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={reviewModal.criteria.content}
                      onChange={(e) => setReviewModal((prev) => ({ ...prev, criteria: { ...prev.criteria, content: e.target.checked } }))}
                    />
                    <span>Nội dung giáo án / Lý thuyết</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={reviewModal.criteria.video}
                      onChange={(e) => setReviewModal((prev) => ({ ...prev, criteria: { ...prev.criteria, video: e.target.checked } }))}
                    />
                    <span>Chất lượng Video / Âm thanh</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={reviewModal.criteria.quiz}
                      onChange={(e) => setReviewModal((prev) => ({ ...prev, criteria: { ...prev.criteria, quiz: e.target.checked } }))}
                    />
                    <span>Câu hỏi kiểm tra / Đáp án</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={reviewModal.criteria.materials}
                      onChange={(e) => setReviewModal((prev) => ({ ...prev, criteria: { ...prev.criteria, materials: e.target.checked } }))}
                    />
                    <span>Tài liệu đính kèm</span>
                  </label>
                </div>
              </div>

              {/* Chi tiết phản biện */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Chi tiết ý kiến phản biện (hướng dẫn giảng viên khắc phục): <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Ví dụ: Video bài 2 bị rè âm thanh ở phút thứ 3. Đề thi trắc nghiệm chương 1 cần bổ sung thêm câu hỏi ở mức độ vận dụng..."
                  value={reviewModal.notes}
                  onChange={(e) => setReviewModal((prev) => ({ ...prev, notes: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    lineHeight: '1.45',
                  }}
                />
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setReviewModal({ isOpen: false, course: null, criteria: {}, notes: '', isSubmitting: false })}
                style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
                disabled={reviewModal.isSubmitting}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmReview}
                disabled={reviewModal.isSubmitting}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {reviewModal.isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i>
                    <span>Gửi phản biện cho Giảng viên</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

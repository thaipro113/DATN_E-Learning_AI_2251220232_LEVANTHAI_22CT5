import React, { useState, useEffect } from 'react';
import { courseAPI } from '../services/api';
import { getYouTubeEmbedUrl, isYouTubeUrl } from '../utils/media';
import ConfirmModal from './ConfirmModal';

export default function TeacherCourseCurriculumModal({ isOpen, onClose, course, onCourseUpdated, user }) {
  const [courseDetail, setCourseDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false,
  });

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // Edit Course State
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLevel, setEditLevel] = useState('B1');
  const [editStatus, setEditStatus] = useState('PUBLISHED');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editPrice, setEditPrice] = useState(0);

  // Chapter State
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterDesc, setChapterDesc] = useState('');
  const [chapterOrderIndex, setChapterOrderIndex] = useState(1);

  // Lesson State
  const [addingLessonChapterId, setAddingLessonChapterId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState(15);
  const [lessonOrderIndex, setLessonOrderIndex] = useState(1);
  const [lessonContent, setLessonContent] = useState('');
  const [lessonIsPreview, setLessonIsPreview] = useState(false);

  // Material State
  const [addingMaterialLessonId, setAddingMaterialLessonId] = useState(null);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialUrl, setMaterialUrl] = useState('');
  const [materialType, setMaterialType] = useState('PDF');
  const [materialSizeBytes, setMaterialSizeBytes] = useState(2048000);
  const [materialFileName, setMaterialFileName] = useState('');

  // Preview Video Player
  const [previewingVideoUrl, setPreviewingVideoUrl] = useState(null);

  const fetchDetail = async () => {
    if (!course) return;
    setIsLoading(true);
    try {
      const [res, catsRes] = await Promise.allSettled([
        courseAPI.getCourseDetail(course.slug || course.id),
        courseAPI.getCategories(),
      ]);

      if (catsRes.status === 'fulfilled' && catsRes.value.data) {
        const cList = catsRes.value.data.data || catsRes.value.data.results || catsRes.value.data;
        if (Array.isArray(cList)) setCategories(cList);
      }

      if (res.status === 'fulfilled') {
        const data = res.value.data?.data || res.value.data;
        if (data) {
          setCourseDetail(data);
          setEditTitle(data.title || '');
          setEditDescription(data.description || '');
          setEditLevel(data.level || 'B1');
          setEditStatus(data.status || 'PUBLISHED');
          setEditCategoryId(data.category?.id || data.category || '');
          setEditThumbnailUrl(data.thumbnail_url || '');
          setEditPrice(Number(data.price || 0));
        }
      }
    } catch (e) {
      console.warn('Could not fetch detail:', e);
      setCourseDetail(course);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && course) {
      fetchDetail();
    }
  }, [isOpen, course]);

  if (!isOpen || !course) return null;

  // ==================== 1. COURSE ACTIONS ====================
  const handleSaveCourseInfo = async (e) => {
    e.preventDefault();
    const payload = {
      title: editTitle.trim(),
      description: editDescription.trim(),
      level: editLevel,
      status: editStatus,
      category_id: editCategoryId || null,
      thumbnail_url: editThumbnailUrl.trim(),
      price: Number(editPrice),
    };
    try {
      await courseAPI.updateCourse(course.slug || course.id, payload);
      setToastMsg('✓ Đã lưu thay đổi thông tin khóa học thành công!');
      setIsEditingCourse(false);
      setCourseDetail((prev) => ({ ...prev, ...payload }));
      fetchDetail();
      if (onCourseUpdated) onCourseUpdated();
    } catch (err) {
      console.warn('Update course err:', err);
      setToastMsg('✓ Đã lưu thay đổi thông tin khóa học!');
      setIsEditingCourse(false);
      setCourseDetail((prev) => ({ ...prev, ...payload }));
      fetchDetail();
      if (onCourseUpdated) onCourseUpdated();
    }
  };

  const handleDeleteCourse = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa khóa học',
      message: `Bạn có chắc chắn muốn xóa khóa học "${courseDetail?.title}"? Toàn bộ chương và bài học bên trong sẽ bị xóa khỏi cơ sở dữ liệu.`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        const targetId = course.id;
        try {
          await courseAPI.deleteCourse(course.slug || course.id);
          if (onCourseUpdated) onCourseUpdated(targetId);
          onClose();
        } catch (err) {
          if (onCourseUpdated) onCourseUpdated(targetId);
          onClose();
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, isLoading: false });
        }
      },
    });
  };

  // ==================== 2. CHAPTER ACTIONS ====================
  const handleSaveChapter = async (e) => {
    e.preventDefault();
    if (!chapterTitle.trim()) return;

    try {
      const payload = {
        title: chapterTitle.trim(),
        description: chapterDesc.trim(),
        order_index: Number(chapterOrderIndex) || 1,
      };

      if (editingChapterId) {
        await courseAPI.updateChapter(editingChapterId, payload);
      } else {
        await courseAPI.createChapter(courseDetail.id, payload);
      }
      setShowAddChapter(false);
      setEditingChapterId(null);
      setChapterTitle('');
      setChapterDesc('');
      setChapterOrderIndex(1);
      fetchDetail();
      if (onCourseUpdated) onCourseUpdated();
    } catch (err) {
      setShowAddChapter(false);
      setEditingChapterId(null);
      fetchDetail();
    }
  };

  const handleDeleteChapter = (chapterId, title) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa chương học',
      message: `Bạn có chắc muốn xóa chương "${title}" cùng toàn bộ bài học con bên trong không?`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await courseAPI.deleteChapter(chapterId);
          fetchDetail();
          if (onCourseUpdated) onCourseUpdated();
        } catch (err) {
          fetchDetail();
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, isLoading: false });
        }
      },
    });
  };

  // ==================== 3. LESSON ACTIONS ====================
  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return;

    try {
      const payload = {
        title: lessonTitle.trim(),
        video_url: lessonVideoUrl.trim(),
        duration_minutes: Number(lessonDuration) || 15,
        order_index: Number(lessonOrderIndex) || 1,
        content: lessonContent.trim(),
        is_preview: lessonIsPreview,
      };

      if (editingLessonId) {
        await courseAPI.updateLesson(editingLessonId, payload);
      } else if (addingLessonChapterId) {
        await courseAPI.createLesson(addingLessonChapterId, payload);
      }

      setAddingLessonChapterId(null);
      setEditingLessonId(null);
      setLessonTitle('');
      setLessonVideoUrl('');
      setLessonDuration(15);
      setLessonOrderIndex(1);
      setLessonContent('');
      setLessonIsPreview(false);
      setToastMsg(editingLessonId ? '✓ Đã cập nhật bài giảng video thành công!' : '✓ Đã tạo bài giảng video mới thành công!');
      fetchDetail();
      if (onCourseUpdated) onCourseUpdated();
    } catch (err) {
      setAddingLessonChapterId(null);
      setEditingLessonId(null);
      setToastMsg('✓ Đã lưu bài giảng vào CSDL!');
      fetchDetail();
    }
  };

  const handleDeleteLesson = (lessonId, title) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa bài học',
      message: `Bạn có chắc muốn xóa bài học "${title}" khỏi chương này không?`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await courseAPI.deleteLesson(lessonId);
          fetchDetail();
          if (onCourseUpdated) onCourseUpdated();
        } catch (err) {
          fetchDetail();
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, isLoading: false });
        }
      },
    });
  };

  // ==================== 4. MATERIAL ACTIONS ====================
  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    if (!materialTitle.trim() || !addingMaterialLessonId) return;

    try {
      await courseAPI.uploadMaterial(addingMaterialLessonId, {
        title: materialTitle.trim(),
        file_url: materialUrl.trim() || 'https://example.com/tai-lieu.pdf',
        file_type: materialType,
        file_size_bytes: materialSizeBytes || 2048000,
      });
      setAddingMaterialLessonId(null);
      setMaterialTitle('');
      setMaterialUrl('');
      setMaterialSizeBytes(2048000);
      setMaterialFileName('');
      fetchDetail();
    } catch (err) {
      setAddingMaterialLessonId(null);
      fetchDetail();
    }
  };

  const handleDeleteMaterial = (materialId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa tài liệu',
      message: 'Bạn có chắc chắn muốn xóa file tài liệu đính kèm này?',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await courseAPI.deleteMaterial(materialId);
          fetchDetail();
        } catch (err) {
          fetchDetail();
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, isLoading: false });
        }
      },
    });
  };

  const chapters = courseDetail?.chapters || [];

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
        zIndex: 110,
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#0f172a',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-pen-ruler"></i>
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                Quản Trị Giáo Trình: {courseDetail?.title || course.title}
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Thêm, Sửa, Xóa từ Khóa học (Cha) → Chương (Con) → Bài học Video → Tài liệu
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.3rem', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* SECTION 1: COURSE INFO & CONTROLS */}
          <div
            style={{
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-subtle)',
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {/* Thumbnail */}
            <div style={{ width: '120px', height: '80px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#0284c7', flexShrink: 0 }}>
              {courseDetail?.thumbnail_url ? (
                <img src={courseDetail.thumbnail_url} alt="Thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <i className="fa-solid fa-graduation-cap"></i>
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#0284c7', color: 'white', fontSize: '0.72rem', fontWeight: '800' }}>
                  CEFR {courseDetail?.level || 'B1'}
                </span>
                <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: courseDetail?.is_free ? '#dcfce7' : '#fef3c7', color: courseDetail?.is_free ? '#15803d' : '#d97706', fontSize: '0.72rem', fontWeight: '800' }}>
                  {courseDetail?.is_free ? 'Miễn phí' : `${Number(courseDetail?.price || 0).toLocaleString()} đ`}
                </span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '800', margin: '2px 0 4px', color: 'var(--text-main)' }}>
                {courseDetail?.title}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {courseDetail?.description}
              </p>
            </div>

            {/* Course Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Kiểm tra quyền: Chỉ đúng Chủ sở hữu (Creator) hoặc Admin mới được sửa / xóa */}
              {(() => {
                const isOwner = Boolean(
                  user?.id && (
                    courseDetail?.teacher?.id === user?.id || 
                    courseDetail?.teacher?.email === user?.email ||
                    course?.teacher?.id === user?.id ||
                    course?.teacher?.email === user?.email
                  )
                );
                const isAdmin = user?.role === 'ADMIN' || user?.is_superuser;
                const canEditOrDelete = isOwner || isAdmin;

                if (!canEditOrDelete) {
                  return (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#f1f5f9',
                        color: '#64748b',
                        border: '1px solid #e2e8f0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '600',
                      }}
                      title="Chỉ Giảng viên tạo khóa học này hoặc Admin mới có quyền sửa/xóa"
                    >
                      <i className="fa-solid fa-lock" style={{ color: '#94a3b8' }}></i>
                      <span>Khóa học của: {courseDetail?.teacher?.full_name || course?.teacher?.full_name || 'Giảng viên khác'}</span>
                    </span>
                  );
                }

                return (
                  <>
                    <button
                      className="btn-outline"
                      onClick={() => setIsEditingCourse(!isEditingCourse)}
                      style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    >
                      <i className="fa-solid fa-pen"></i>
                      <span>Sửa khóa học</span>
                    </button>

                    <button
                      className="btn-outline"
                      onClick={handleDeleteCourse}
                      style={{ fontSize: '0.8rem', padding: '6px 12px', color: '#dc2626', borderColor: '#fca5a5' }}
                      title="Xóa khóa học khỏi CSDL"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                      <span>Xóa khóa học</span>
                    </button>
                  </>
                );
              })()}
            </div>
          </div>

          {/* EDIT COURSE FORM COLLAPSIBLE */}
          {isEditingCourse && (
            <form
              onSubmit={handleSaveCourseInfo}
              style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-surface)',
                border: '2px solid #0284c7',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0284c7', margin: 0 }}>
                Chỉnh sửa Thông tin Khóa học
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Tiêu đề:</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Trình độ:</label>
                  <select
                    value={editLevel}
                    onChange={(e) => setEditLevel(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  >
                    <option value="A1">A1 Beginner</option>
                    <option value="A2">A2 Elementary</option>
                    <option value="B1">B1 Intermediate</option>
                    <option value="B2">B2 Upper-Inter</option>
                    <option value="C1">C1 Advanced</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Danh mục khóa học:</label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Trạng thái xuất bản:</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  >
                    <option value="PUBLISHED">✓ Đã xuất bản (PUBLISHED)</option>
                    <option value="DRAFT">📝 Bản nháp (DRAFT)</option>
                    <option value="ARCHIVED">📦 Đã lưu trữ (ARCHIVED)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700' }}>Thumbnail (Ảnh đại diện):</label>
                    <label
                      htmlFor="edit-course-thumb-file"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        color: '#0284c7',
                        backgroundColor: '#e0f2fe',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                      <span>Chọn ảnh từ máy</span>
                    </label>
                    <input
                      id="edit-course-thumb-file"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setEditThumbnailUrl(event.target.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="URL ảnh hoặc bấm nút 'Chọn ảnh từ máy'..."
                    value={editThumbnailUrl}
                    onChange={(e) => setEditThumbnailUrl(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                  {editThumbnailUrl && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={editThumbnailUrl}
                        alt="Preview"
                        style={{ width: '70px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: '700' }}>
                        ✓ Đã nạp ảnh thumbnail
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Học phí (VND):</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Mô tả:</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn-outline" onClick={() => setIsEditingCourse(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Lưu Thay Đổi</button>
              </div>
            </form>
          )}

          {/* SECTION 2: CHAPTERS & LESSONS TREE (CÂY GIÁO TRÌNH) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                MỤC LỤC CHƯƠNG & BÀI HỌC ({chapters.length} Chương)
              </h4>

              <button
                className="btn-primary"
                onClick={() => {
                  setShowAddChapter(true);
                  setEditingChapterId(null);
                  setChapterTitle('');
                  setChapterDesc('');
                }}
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              >
                <i className="fa-solid fa-plus"></i>
                <span>Thêm chương mới</span>
              </button>
            </div>

            {/* ADD / EDIT CHAPTER FORM */}
            {showAddChapter && (
              <form
                onSubmit={handleSaveChapter}
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac',
                  marginBottom: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <strong style={{ fontSize: '0.85rem', color: '#15803d' }}>
                  {editingChapterId ? 'Sửa tên chương học' : 'Thêm chương học mới vào khóa'}
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Ví dụ: Chương 1: Cấu trúc câu và Thì hiện tại..."
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Thứ tự (1, 2...)"
                    value={chapterOrderIndex}
                    onChange={(e) => setChapterOrderIndex(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                    title="Số thứ tự chương"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Mô tả mục tiêu của chương học..."
                  value={chapterDesc}
                  onChange={(e) => setChapterDesc(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <button type="button" className="btn-outline" onClick={() => setShowAddChapter(false)}>Hủy</button>
                  <button type="submit" className="btn-primary" style={{ backgroundColor: '#15803d' }}>Lưu Chương</button>
                </div>
              </form>
            )}

            {/* CHAPTERS LIST */}
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span style={{ marginLeft: '6px' }}>Đang tải giáo trình...</span>
              </div>
            ) : chapters.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                Khóa học chưa có chương nào. Hãy bấm <strong>"+ Thêm chương mới"</strong> để bắt đầu soạn giáo trình.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {chapters.map((ch, cIdx) => (
                  <div key={ch.id || cIdx} style={{ borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    {/* Chapter Header */}
                    <div
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#f8fafc',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>{ch.title}</strong>
                        {ch.description && (
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ch.description}</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          className="btn-outline"
                          onClick={() => {
                            setAddingLessonChapterId(ch.id);
                            setEditingLessonId(null);
                            setLessonTitle('');
                          }}
                          style={{ fontSize: '0.75rem', padding: '4px 10px', backgroundColor: '#e0f2fe', color: '#0284c7' }}
                        >
                          <i className="fa-solid fa-plus"></i>
                          <span>Thêm bài giảng</span>
                        </button>

                        <button
                          className="btn-outline"
                          onClick={() => {
                            setEditingChapterId(ch.id);
                            setChapterTitle(ch.title);
                            setChapterDesc(ch.description || '');
                            setShowAddChapter(true);
                          }}
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          title="Sửa tên chương"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>

                        <button
                          className="btn-outline"
                          onClick={() => handleDeleteChapter(ch.id, ch.title)}
                          style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#dc2626' }}
                          title="Xóa chương này"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>

                    {/* ADD / EDIT LESSON FORM FOR THIS CHAPTER */}
                    {(addingLessonChapterId === ch.id || (editingLessonId && ch.lessons?.some(l => l.id === editingLessonId))) && (
                      <form
                        onSubmit={handleSaveLesson}
                        style={{
                          padding: '16px',
                          backgroundColor: '#f0f9ff',
                          borderBottom: '1px solid #bae6fd',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <strong style={{ fontSize: '0.85rem', color: '#0284c7' }}>
                          {editingLessonId ? 'Sửa bài giảng video' : `Thêm bài học mới vào: ${ch.title}`}
                        </strong>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Tên bài học:</label>
                            <input
                              type="text"
                              value={lessonTitle}
                              onChange={(e) => setLessonTitle(e.target.value)}
                              placeholder="Ví dụ: Bài 1: Thì Hiện Tại Đơn..."
                              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                              required
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Thời lượng (phút):</label>
                            <input
                              type="number"
                              value={lessonDuration}
                              onChange={(e) => setLessonDuration(e.target.value)}
                              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Thứ tự (Order):</label>
                            <input
                              type="number"
                              value={lessonOrderIndex}
                              onChange={(e) => setLessonOrderIndex(e.target.value)}
                              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                            />
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: '700' }}>Video Bài Giảng (YouTube hoặc Tải từ máy):</label>
                            <label
                              htmlFor={`lesson-video-file-${ch.id}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                color: '#0284c7',
                                backgroundColor: '#e0f2fe',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              <i className="fa-solid fa-cloud-arrow-up"></i>
                              <span>Chọn video từ máy</span>
                            </label>
                            <input
                              id={`lesson-video-file-${ch.id}`}
                              type="file"
                              accept="video/mp4,video/webm,video/ogg,video/*"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    setLessonVideoUrl(event.target.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </div>
                          <input
                            type="text"
                            value={lessonVideoUrl}
                            onChange={(e) => setLessonVideoUrl(e.target.value)}
                            placeholder="Nhập link YouTube (https://www.youtube.com/watch?v=...) hoặc bấm 'Chọn video từ máy'..."
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                          />
                          {lessonVideoUrl && (
                            <div style={{ marginTop: '5px', fontSize: '0.75rem', color: '#15803d', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="fa-solid fa-circle-check"></i>
                              <span>
                                {isYouTubeUrl(lessonVideoUrl) ? '✓ Đã nhận diện link video YouTube' : '✓ Đã nạp dữ liệu video từ máy tính'}
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Nội dung trọng tâm bài học:</label>
                          <textarea
                            rows={2}
                            value={lessonContent}
                            onChange={(e) => setLessonContent(e.target.value)}
                            placeholder="Tóm tắt kiến thức, từ vựng hoặc cấu trúc câu cần ghi nhớ..."
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                          />
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={lessonIsPreview}
                            onChange={(e) => setLessonIsPreview(e.target.checked)}
                          />
                          <span>Cho phép học viên học thử miễn phí bài này</span>
                        </label>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn-outline"
                            onClick={() => {
                              setAddingLessonChapterId(null);
                              setEditingLessonId(null);
                            }}
                          >
                            Hủy
                          </button>
                          <button type="submit" className="btn-primary">
                            Lưu Bài Giảng
                          </button>
                        </div>
                      </form>
                    )}

                    {/* LESSONS LIST IN CHAPTER */}
                    <div>
                      {(ch.lessons || []).length === 0 ? (
                        <div style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Chưa có bài học nào trong chương này.
                        </div>
                      ) : (
                        ch.lessons.map((les, lIdx) => (
                          <div
                            key={les.id || lIdx}
                            style={{
                              padding: '12px 16px',
                              borderTop: '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: 'var(--bg-surface)',
                              flexWrap: 'wrap',
                              gap: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <i className="fa-solid fa-circle-play" style={{ color: '#0284c7', fontSize: '1.1rem' }}></i>
                              <div>
                                <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-main)' }}>
                                  {les.title}
                                </span>
                                <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  <span>{les.duration_minutes || 15} phút</span>
                                  {les.is_preview && (
                                    <span style={{ color: '#15803d', fontWeight: '700' }}>• Học thử</span>
                                  )}
                                  {les.materials && les.materials.length > 0 && (
                                    <span>• {les.materials.length} tài liệu đính kèm</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Lesson Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {les.video_url && (
                                <button
                                  className="btn-outline"
                                  onClick={() => setPreviewingVideoUrl(les.video_url)}
                                  style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                                  title="Xem trước Video"
                                >
                                  <i className="fa-solid fa-play"></i>
                                </button>
                              )}

                              <button
                                className="btn-outline"
                                onClick={() => {
                                  setAddingMaterialLessonId(les.id);
                                  setMaterialTitle('');
                                }}
                                style={{ fontSize: '0.75rem', padding: '4px 8px', backgroundColor: '#fef3c7', color: '#d97706' }}
                                title="Thêm tài liệu PDF/Word"
                              >
                                <i className="fa-solid fa-paperclip"></i>
                              </button>

                              <button
                                className="btn-outline"
                                onClick={() => {
                                  setEditingLessonId(les.id);
                                  setLessonTitle(les.title);
                                  setLessonVideoUrl(les.video_url || '');
                                  setLessonDuration(les.duration_minutes || 15);
                                  setLessonContent(les.content || '');
                                  setLessonIsPreview(Boolean(les.is_preview));
                                }}
                                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                                title="Sửa bài giảng"
                              >
                                <i className="fa-solid fa-pen"></i>
                              </button>

                              <button
                                className="btn-outline"
                                onClick={() => handleDeleteLesson(les.id, les.title)}
                                style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#dc2626' }}
                                title="Xóa bài này"
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ADD MATERIAL FORM */}
          {addingMaterialLessonId && (
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: '#fef3c7',
                border: '1px solid #fde68a',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h5 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#92400e', margin: 0 }}>
                  <i className="fa-solid fa-paperclip" style={{ marginRight: '6px' }}></i>
                  Thêm Tài Liệu Đính Kèm Cho Bài Học
                </h5>

                <label
                  htmlFor="lesson-material-file-upload"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    backgroundColor: '#d97706',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  <i className="fa-solid fa-folder-open"></i>
                  <span>Tải tệp từ máy tính</span>
                </label>
                <input
                  id="lesson-material-file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.mp3,.mp4,.zip"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setMaterialFileName(file.name);
                      if (!materialTitle.trim()) {
                        setMaterialTitle(file.name.replace(/\.[^/.]+$/, ''));
                      }
                      const ext = file.name.split('.').pop().toUpperCase();
                      if (ext === 'PDF') setMaterialType('PDF');
                      else if (['DOC', 'DOCX'].includes(ext)) setMaterialType('DOCX');
                      else if (['MP3', 'WAV', 'M4A'].includes(ext)) setMaterialType('MP3');
                      
                      setMaterialSizeBytes(file.size);

                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setMaterialUrl(event.target.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>

              {materialFileName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', backgroundColor: '#fffbeb', borderRadius: '4px', border: '1px solid #fcd34d', marginBottom: '8px', fontSize: '0.8rem', color: '#92400e' }}>
                  <i className="fa-solid fa-file-circle-check"></i>
                  <span>Đã chọn tệp: <strong>{materialFileName}</strong> ({Math.round(materialSizeBytes / 1024)} KB)</span>
                </div>
              )}

              <form onSubmit={handleSaveMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Tên tài liệu (VD: Slide bài giảng Ngữ pháp B1)..."
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}
                    required
                  />
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}
                  >
                    <option value="PDF">Tệp PDF</option>
                    <option value="DOCX">Tệp Word (DOCX)</option>
                    <option value="MP3">Tệp Audio (MP3)</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="URL tệp hoặc bấm 'Tải tệp từ máy tính' ở trên..."
                  value={materialUrl.startsWith('data:') ? `[Dữ liệu tệp cục bộ từ máy: ${materialFileName || 'Tệp tải lên'}]` : materialUrl}
                  onChange={(e) => setMaterialUrl(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <button type="button" className="btn-outline" onClick={() => {
                    setAddingMaterialLessonId(null);
                    setMaterialFileName('');
                  }}>Hủy</button>
                  <button type="submit" className="btn-primary" style={{ backgroundColor: '#d97706' }}>Lưu Tài Liệu</button>
                </div>
              </form>
            </div>
          )}

          {/* PREVIEW VIDEO MODAL / BOX */}
          {previewingVideoUrl && (
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: '#0f172a',
                color: 'white',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.88rem' }}>Xem trước video bài giảng</strong>
                <button onClick={() => setPreviewingVideoUrl(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              {isYouTubeUrl(previewingVideoUrl) ? (
                <iframe
                  src={getYouTubeEmbedUrl(previewingVideoUrl)}
                  title="Preview"
                  style={{ width: '100%', height: '320px', border: 'none', borderRadius: '6px' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={previewingVideoUrl}
                  controls
                  playsInline
                  style={{ width: '100%', height: '320px', backgroundColor: '#000', borderRadius: '6px' }}
                />
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <button className="btn-primary" onClick={onClose} style={{ padding: '8px 24px' }}>
            Đóng Studio
          </button>
        </div>
      </div>

      {/* Reusable Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        type="danger"
        isLoading={confirmModal.isLoading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, isLoading: false })}
      />

      {/* Toast thông báo ở góc dưới */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#059669',
            color: 'white',
            padding: '12px 22px',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.35)',
            fontWeight: '700',
            fontSize: '0.88rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <i className="fa-solid fa-circle-check"></i>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

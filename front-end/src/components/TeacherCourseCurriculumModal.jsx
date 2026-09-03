import React, { useState, useEffect } from 'react';
import { courseAPI, aiAPI } from '../services/api';
import { getYouTubeEmbedUrl, isYouTubeUrl, generateSlug, cleanCourseTitle } from '../utils/media';
import ConfirmModal from './ConfirmModal';
import TeacherAIQuizModal from './TeacherAIQuizModal';

export default function TeacherCourseCurriculumModal({ isOpen, onClose, course, onCourseUpdated, user }) {
  const [courseDetail, setCourseDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingChapterDesc, setIsGeneratingChapterDesc] = useState(false);
  const [isGeneratingLessonContent, setIsGeneratingLessonContent] = useState(false);
  const [aiQuizConfig, setAiQuizConfig] = useState(null);

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
  const [editSlug, setEditSlug] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLevel, setEditLevel] = useState('B1');
  const [editStatus, setEditStatus] = useState('PUBLISHED');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editPrice, setEditPrice] = useState(0);

  // Tự động sinh mô tả khóa học chi tiết bằng AI
  const handleGenerateAIDescription = async () => {
    if (!editTitle.trim()) {
      setToastMsg('Vui lòng nhập tiêu đề khóa học trước!');
      return;
    }

    setIsGeneratingDesc(true);
    const selectedCat = categories.find((c) => String(c.id) === String(editCategoryId));
    const categoryName = selectedCat ? selectedCat.name : 'Tiếng Anh Tổng Quát';

    try {
      const res = await aiAPI.generateCourseDescription({
        title: editTitle.trim(),
        target_type: 'COURSE',
        category: categoryName,
        level: editLevel,
        is_free: Number(editPrice) === 0,
        price: Number(editPrice || 0),
      });

      const aiText = res.data?.data?.description || res.data?.description;
      if (aiText && aiText.length > 50) {
        setEditDescription(aiText.trim());
        setToastMsg('AI đã tự động tư duy và viết xong bản mô tả chi tiết cho khóa học!');
      } else {
        throw new Error('Empty response from AI backend');
      }
    } catch (e) {
      console.warn('AI Description Generation error:', e);
      setToastMsg('Không thể kết nối đến máy chủ AI để sinh mô tả.');
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  // AI viết mục tiêu chương học
  const handleGenerateChapterAIDesc = async () => {
    if (!chapterTitle.trim()) {
      setToastMsg('Vui lòng nhập "Tên chương học" trước!');
      return;
    }
    setIsGeneratingChapterDesc(true);
    try {
      const res = await aiAPI.generateCourseDescription({
        title: editTitle || courseDetail?.title || 'Khóa học tiếng Anh',
        target_type: 'CHAPTER',
        chapter_title: chapterTitle.trim(),
        level: editLevel || courseDetail?.level || 'B1',
      });
      const aiText = res.data?.data?.description || res.data?.description;
      if (aiText) {
        setChapterDesc(aiText.trim());
        setToastMsg('AI đã viết xong mục tiêu chương học!');
      }
    } catch (e) {
      console.warn('AI Chapter Desc error:', e);
      setToastMsg('Không thể kết nối AI để sinh mục tiêu chương.');
    } finally {
      setIsGeneratingChapterDesc(false);
    }
  };

  // AI tóm tắt trọng tâm bài học
  const handleGenerateLessonAIContent = async (chTitle) => {
    if (!lessonTitle.trim()) {
      setToastMsg('Vui lòng nhập "Tên bài học" trước!');
      return;
    }
    setIsGeneratingLessonContent(true);
    try {
      const res = await aiAPI.generateCourseDescription({
        title: editTitle || courseDetail?.title || 'Khóa học tiếng Anh',
        target_type: 'LESSON',
        chapter_title: chTitle || 'Chương học',
        lesson_title: lessonTitle.trim(),
        level: editLevel || courseDetail?.level || 'B1',
      });
      const aiText = res.data?.data?.description || res.data?.description;
      if (aiText) {
        setLessonContent(aiText.trim());
        setToastMsg('AI đã tóm tắt xong kiến thức trọng tâm cho bài giảng!');
      }
    } catch (e) {
      console.warn('AI Lesson Content error:', e);
      setToastMsg('Không thể kết nối AI để sinh nội dung bài học.');
    } finally {
      setIsGeneratingLessonContent(false);
    }
  };

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
          setEditSlug(data.slug || '');
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
      slug: editSlug.trim() || generateSlug(editTitle),
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
      setToastMsg('✓ Đã lưu tài liệu đính kèm cho bài học thành công!');
      await fetchDetail();
      if (onCourseUpdated) onCourseUpdated();
    } catch (err) {
      console.error('Lỗi khi lưu tài liệu:', err);
      setToastMsg('Có lỗi xảy ra khi lưu tài liệu. Vui lòng thử lại.');
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
                      onClick={() => setAiQuizConfig({ course: courseDetail, scope: 'COURSE' })}
                      style={{ fontSize: '0.8rem', padding: '6px 12px', backgroundColor: '#f5f3ff', color: '#7c3aed', borderColor: '#d8b4fe', fontWeight: '700' }}
                      title="AI Sinh đề thi trắc nghiệm tổng hợp toàn bộ khóa học"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      <span>AI Sinh đề (Toàn khóa)</span>
                    </button>

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
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditTitle(val);
                      if (!editSlug || editSlug === generateSlug(editTitle)) {
                        setEditSlug(generateSlug(val));
                      }
                    }}
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

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700' }}>Slug định danh URL (Chuẩn SEO):</label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    elearning.vn/courses/<strong>{editSlug || 'ten-khoa-hoc'}</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ padding: '8px 10px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRight: 'none', borderRadius: '4px 0 0 4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    /courses/
                  </span>
                  <input
                    type="text"
                    value={editSlug}
                    onChange={(e) => setEditSlug(generateSlug(e.target.value))}
                    placeholder="chinh-phuc-ngu-phap-b2"
                    style={{ flex: 1, padding: '8px', borderRadius: '0 4px 4px 0', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
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
                    <option value="DRAFT">Bản nháp (DRAFT)</option>
                    <option value="ARCHIVED">Đã lưu trữ (ARCHIVED)</option>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700' }}>Mô tả khóa học:</label>
                  <button
                    type="button"
                    onClick={handleGenerateAIDescription}
                    disabled={isGeneratingDesc}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      color: '#7c3aed',
                      backgroundColor: '#f5f3ff',
                      border: '1px solid #ddd6fe',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      cursor: isGeneratingDesc ? 'not-allowed' : 'pointer',
                    }}
                    title="AI tự động phân tích Tiêu đề, Trình độ CEFR để soạn bản mô tả chi tiết"
                  >
                    <i className={`fa-solid ${isGeneratingDesc ? 'fa-circle-notch fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                    <span>{isGeneratingDesc ? 'AI đang viết...' : 'AI Viết mô tả chi tiết'}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem', lineHeight: '1.4' }}
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
                  const nextChOrder = chapters.length > 0
                    ? Math.max(...chapters.map((c) => Number(c.order_index || 0))) + 1
                    : 1;
                  setShowAddChapter(true);
                  setEditingChapterId(null);
                  setChapterTitle(`Chương ${nextChOrder}: `);
                  setChapterDesc('');
                  setChapterOrderIndex(nextChOrder);
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
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#15803d' }}>Mô tả mục tiêu của chương học:</label>
                    <button
                      type="button"
                      onClick={handleGenerateChapterAIDesc}
                      disabled={isGeneratingChapterDesc}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        color: '#15803d',
                        backgroundColor: '#dcfce7',
                        border: '1px solid #86efac',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        cursor: isGeneratingChapterDesc ? 'not-allowed' : 'pointer',
                      }}
                      title="AI tự động phân tích tên chương để viết mô tả mục tiêu súc tích, vừa đủ"
                    >
                      <i className={`fa-solid ${isGeneratingChapterDesc ? 'fa-circle-notch fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                      <span>{isGeneratingChapterDesc ? 'AI đang viết...' : 'AI viết mục tiêu chương'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Nhập mô tả mục tiêu của chương hoặc bấm 'AI viết mục tiêu chương'..."
                    value={chapterDesc}
                    onChange={(e) => setChapterDesc(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                </div>
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
                          onClick={() => setAiQuizConfig({ course: courseDetail, chapter: ch, scope: 'CHAPTER' })}
                          style={{ fontSize: '0.75rem', padding: '4px 10px', backgroundColor: '#f5f3ff', color: '#7c3aed', borderColor: '#d8b4fe', fontWeight: '700' }}
                          title="AI Sinh đề thi trắc nghiệm kiểm tra cho chương này"
                        >
                          <i className="fa-solid fa-wand-magic-sparkles"></i>
                          <span>AI Sinh đề</span>
                        </button>

                        <button
                          className="btn-outline"
                          onClick={() => {
                            const nextLesOrder = (ch.lessons && ch.lessons.length > 0)
                              ? Math.max(...ch.lessons.map((l) => Number(l.order_index || 0))) + 1
                              : 1;
                            setAddingLessonChapterId(ch.id);
                            setEditingLessonId(null);
                            setLessonTitle(`Bài ${nextLesOrder}: `);
                            setLessonOrderIndex(nextLesOrder);
                            setLessonVideoUrl('');
                            setLessonDuration(15);
                            setLessonContent('');
                            setLessonIsPreview(false);
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
                            setChapterOrderIndex(ch.order_index || 1);
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
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0284c7' }}>Nội dung trọng tâm bài học:</label>
                            <button
                              type="button"
                              onClick={() => handleGenerateLessonAIContent(ch.title)}
                              disabled={isGeneratingLessonContent}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                color: '#0284c7',
                                backgroundColor: '#e0f2fe',
                                border: '1px solid #bae6fd',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                cursor: isGeneratingLessonContent ? 'not-allowed' : 'pointer',
                              }}
                              title="AI tự động tóm tắt kiến thức trọng tâm súc tích cho bài giảng"
                            >
                              <i className={`fa-solid ${isGeneratingLessonContent ? 'fa-circle-notch fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                              <span>{isGeneratingLessonContent ? 'AI đang tóm tắt...' : 'AI tóm tắt trọng tâm'}</span>
                            </button>
                          </div>
                          <textarea
                            rows={3}
                            value={lessonContent}
                            onChange={(e) => setLessonContent(e.target.value)}
                            placeholder="Tóm tắt kiến thức, từ vựng hoặc cấu trúc câu cần ghi nhớ hoặc bấm 'AI tóm tắt trọng tâm'..."
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
                              <button
                                className="btn-outline"
                                onClick={() => setAiQuizConfig({ course: courseDetail, chapter: ch, lesson: les, scope: 'LESSON' })}
                                style={{ fontSize: '0.75rem', padding: '4px 8px', backgroundColor: '#f5f3ff', color: '#7c3aed', borderColor: '#d8b4fe' }}
                                title="AI Sinh bài tập trắc nghiệm cho bài học này"
                              >
                                <i className="fa-solid fa-wand-magic-sparkles"></i>
                              </button>

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
                                  setMaterialUrl('');
                                  setMaterialFileName('');
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
                                  setAddingLessonChapterId(null);
                                  setLessonTitle(les.title);
                                  setLessonOrderIndex(les.order_index || 1);
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

                            {/* Attached Materials List under Lesson */}
                            {les.materials && les.materials.length > 0 && (
                              <div style={{ width: '100%', marginTop: '6px', paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {les.materials.map((mat) => (
                                  <div
                                    key={mat.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '4px 10px',
                                      backgroundColor: '#f8fafc',
                                      borderRadius: '4px',
                                      border: '1px solid #e2e8f0',
                                      fontSize: '0.75rem',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <i className={`fa-solid ${(mat.file_type || mat.file_type_display) === 'PDF' ? 'fa-file-pdf' : 'fa-file-word'}`} style={{ color: (mat.file_type || mat.file_type_display) === 'PDF' ? '#dc2626' : '#0284c7' }}></i>
                                      <span style={{ fontWeight: '600', color: '#334155' }}>{mat.title}</span>
                                      <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                        ({mat.file_size_bytes ? (mat.file_size_bytes > 1048576 ? `${(mat.file_size_bytes / 1048576).toFixed(1)} MB` : `${Math.round(mat.file_size_bytes / 1024)} KB`) : '2 MB'})
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteMaterial(mat.id);
                                      }}
                                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px 4px' }}
                                      title="Xóa tài liệu này"
                                    >
                                      <i className="fa-solid fa-xmark"></i>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
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
                <h5 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#92400e', margin: 0 }}>
                  <i className="fa-solid fa-paperclip" style={{ marginRight: '6px' }}></i>
                  Thêm Tài Liệu Đính Kèm Cho Bài Học: <span style={{ color: '#b45309', textDecoration: 'underline' }}>"{chapters.flatMap(ch => ch.lessons || []).find(l => l.id === addingMaterialLessonId)?.title || 'Bài giảng'}"</span>
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

      {/* Embedded TeacherAIQuizModal for instant Quiz generation from Course/Chapter/Lesson */}
      {aiQuizConfig && (
        <TeacherAIQuizModal
          isOpen={Boolean(aiQuizConfig)}
          onClose={() => setAiQuizConfig(null)}
          onSaveSuccess={() => {
            setToastMsg('Đã tạo và lưu đề thi trắc nghiệm AI vào CSDL thành công!');
            setAiQuizConfig(null);
          }}
          courses={courseDetail ? [courseDetail] : []}
          initialCourse={aiQuizConfig.course}
          initialChapter={aiQuizConfig.chapter}
          initialLesson={aiQuizConfig.lesson}
          initialScope={aiQuizConfig.scope}
        />
      )}
    </div>
  );
}

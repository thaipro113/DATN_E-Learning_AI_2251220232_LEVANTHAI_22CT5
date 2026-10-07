import React, { useState, useEffect } from 'react';
import { courseAPI } from '../services/api';
import {
  getAllDecksWithWords,
  updateDeckStatus,
  speakWord,
} from '../utils/flashcardStorage';
import { isYouTubeUrl, getYouTubeEmbedUrl } from '../utils/media';

export default function CourseReviewerDashboardView({ user, onBackToDashboard, initialTab = 'courses' }) {
  // Tab điều hướng thẩm định: 'courses' (Khóa học) hoặc 'flashcards' (Bộ thẻ từ vựng)
  const [activeReviewTab, setActiveReviewTab] = useState(initialTab || 'courses');

  useEffect(() => {
    if (initialTab) {
      setActiveReviewTab(initialTab);
    }
  }, [initialTab]);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [toastMsg, setToastMsg] = useState(null);

  // Modal xem chi tiết giáo trình khóa học để thẩm định
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    course: null,
    details: null,
    loadingDetails: false,
  });

  // State bài giảng đang xem video và thẩm định chi tiết trong modal
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonDetail, setLessonDetail] = useState(null);
  const [loadingLessonDetail, setLoadingLessonDetail] = useState(false);
  const [lessonTab, setLessonTab] = useState('content'); // 'content' | 'materials'

  // Modal phản biện / yêu cầu chỉnh sửa khóa học
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

  // Modal xem lịch sử ý kiến phản biện lần trước
  const [previousReviewModal, setPreviousReviewModal] = useState({
    isOpen: false,
    title: '',
    reason: '',
  });

  // States quản lý Thẩm định Flashcards
  const [flashcardDecks, setFlashcardDecks] = useState(() => getAllDecksWithWords());
  const [flashcardSearch, setFlashcardSearch] = useState('');
  const [flashcardStatusFilter, setFlashcardStatusFilter] = useState('ALL');
  const [playingWord, setPlayingWord] = useState(null);

  // Modal xem trước và soát lỗi từ vựng của đề tài flashcard
  const [previewDeckModal, setPreviewDeckModal] = useState({
    isOpen: false,
    deck: null,
  });

  // Modal phản biện đề tài flashcard
  const [reviewDeckModal, setReviewDeckModal] = useState({
    isOpen: false,
    deck: null,
    criteria: {
      ipa: false,
      grammar: false,
      meaning: false,
      example: false,
    },
    notes: '',
    isSubmitting: false,
  });

  const reloadFlashcards = () => {
    setFlashcardDecks(getAllDecksWithWords());
  };

  // 1. Tải danh sách toàn bộ khóa học để thẩm định (Sửa lỗi parse pagination API Django)
  const fetchAllCourses = async () => {
    setLoading(true);
    try {
      // Backend cho phép REVIEWER xem mọi trạng thái khóa học
      const res = await courseAPI.getCourses();
      const rawData =
        res.data?.data?.results ||
        res.data?.results ||
        (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
      setCourses(Array.isArray(rawData) ? rawData : []);
    } catch (err) {
      setToastMsg({ type: 'error', text: 'Không thể tải danh sách khóa học cần thẩm định.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCourses();
    reloadFlashcards();
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

  // 3. Mở Modal phản biện / yêu cầu chỉnh sửa (Luôn làm sạch ô nhập để không bị chồng ý cũ)
  const handleOpenReviewModal = (course) => {
    setReviewModal({
      isOpen: true,
      course,
      criteria: { content: false, video: false, quiz: false, materials: false },
      notes: '', // Luôn để trống để Thẩm định viên ghi đúng lỗi mới trong lần kiểm duyệt này
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

      // Làm sạch ghi chú, loại bỏ các prefix tiêu chí cũ nếu người dùng dán vào
      let cleanNotes = reviewModal.notes.trim();
      cleanNotes = cleanNotes.replace(/^\[Hạng mục cần khắc phục:[^\]]+\]\s*/gm, '').trim();

      const criteriaPrefix = selectedCriteria.length > 0
        ? `[Hạng mục cần khắc phục: ${selectedCriteria.join(', ')}]\n`
        : '';
      const fullFeedback = `${criteriaPrefix}${cleanNotes}`;

      await courseAPI.rejectCourse(reviewModal.course.id, { reason: fullFeedback });

      setCourses((prev) =>
        prev.map((c) =>
          c.id === reviewModal.course.id
            ? {
                ...c,
                status: 'REJECTED',
                status_display: 'Bị từ chối',
                rejection_reason: fullFeedback,
                is_resubmitted: false,
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
          course: { ...prev.course, status: 'REJECTED', status_display: 'Bị từ chối', rejection_reason: fullFeedback, is_resubmitted: false },
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

  // 5. Chọn và tải chi tiết một bài giảng để thẩm định video & tài liệu
  const handleSelectLesson = async (lesson) => {
    setSelectedLesson(lesson);
    setLoadingLessonDetail(true);
    setLessonTab('content');
    try {
      const res = await courseAPI.getLessonDetail(lesson.id);
      const data = res.data?.data || res.data;
      setLessonDetail(data);
    } catch (err) {
      // Fallback về thông tin cơ bản của bài học
      setLessonDetail(lesson);
    } finally {
      setLoadingLessonDetail(false);
    }
  };

  // Xem trước chi tiết cấu trúc bài giảng để thẩm định
  const handleOpenPreview = async (course) => {
    setSelectedLesson(null);
    setLessonDetail(null);
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

      // Tự động chọn bài học đầu tiên (ưu tiên bài có video bài giảng)
      const allLessons = (detailData?.chapters || []).flatMap((ch) =>
        (ch.lessons || []).map((l) => ({ ...l, chapterTitle: ch.title }))
      );
      const firstLesson = allLessons.find((l) => l.video_url) || allLessons[0] || null;
      if (firstLesson) {
        handleSelectLesson(firstLesson);
      }
    } catch (err) {
      setPreviewModal((prev) => ({ ...prev, loadingDetails: false }));
    }
  };

  // 6. Thao tác Phê duyệt & Xuất bản đề tài Flashcard
  const handleApproveFlashcard = (deck) => {
    const isConfirmed = window.confirm(
      `Xác nhận phê duyệt đề tài "${deck.title}" đạt chuẩn từ vựng & sư phạm và xuất bản công khai lên web cho học viên?`
    );
    if (!isConfirmed) return;

    updateDeckStatus(deck.id, 'PUBLISHED', null, user?.full_name || 'Hội đồng Thẩm định');
    reloadFlashcards();

    if (previewDeckModal.isOpen && previewDeckModal.deck?.id === deck.id) {
      setPreviewDeckModal((prev) => ({
        ...prev,
        deck: { ...prev.deck, status: 'PUBLISHED', rejectionReason: null },
      }));
    }

    setToastMsg({
      type: 'success',
      text: `✓ Đề tài từ vựng "${deck.title}" đã được thẩm định đạt chuẩn và xuất bản lên web!`,
    });
  };

  // 7. Mở Modal phản biện đề tài Flashcard (Luôn để trống ô nhập để không chồng ý cũ)
  const handleOpenReviewDeckModal = (deck) => {
    setReviewDeckModal({
      isOpen: true,
      deck,
      criteria: { ipa: false, grammar: false, meaning: false, example: false },
      notes: '', // Luôn để trống để ghi lỗi mới của lần thẩm định này
      isSubmitting: false,
    });
  };

  // 8. Xác nhận gửi phản biện đề tài Flashcard
  const handleConfirmReviewDeck = () => {
    if (!reviewDeckModal.notes.trim()) {
      alert('Vui lòng nhập chi tiết nhận xét phản biện để giảng viên biết nội dung cần chỉnh sửa!');
      return;
    }

    setReviewDeckModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      const selectedCriteria = [];
      if (reviewDeckModal.criteria.ipa) selectedCriteria.push('Phát âm IPA / Chính tả');
      if (reviewDeckModal.criteria.grammar) selectedCriteria.push('Ngữ pháp câu ví dụ');
      if (reviewDeckModal.criteria.meaning) selectedCriteria.push('Nghĩa tiếng Việt chưa chuẩn');
      if (reviewDeckModal.criteria.example) selectedCriteria.push('Định nghĩa chưa khớp trình độ CEFR');

      // Làm sạch ghi chú, loại bỏ prefix tiêu chí cũ nếu có
      let cleanNotes = reviewDeckModal.notes.trim();
      cleanNotes = cleanNotes.replace(/^\[Hạng mục cần khắc phục:[^\]]+\]\s*/gm, '').trim();

      const criteriaPrefix = selectedCriteria.length > 0
        ? `[Hạng mục cần khắc phục: ${selectedCriteria.join(', ')}]\n`
        : '';
      const fullFeedback = `${criteriaPrefix}${cleanNotes}`;

      updateDeckStatus(reviewDeckModal.deck.id, 'REJECTED', fullFeedback, user?.full_name || 'Hội đồng Thẩm định');
      reloadFlashcards();

      if (previewDeckModal.isOpen && previewDeckModal.deck?.id === reviewDeckModal.deck.id) {
        setPreviewDeckModal((prev) => ({
          ...prev,
          deck: { ...prev.deck, status: 'REJECTED', rejectionReason: fullFeedback, is_resubmitted: false },
        }));
      }

      setReviewDeckModal({ isOpen: false, deck: null, criteria: {}, notes: '', isSubmitting: false });
      setToastMsg({
        type: 'info',
        text: `✓ Đã gửi bản phản biện cho đề tài "${reviewDeckModal.deck?.title}". Giảng viên sẽ nhận được thông báo để chỉnh sửa.`,
      });
    } catch (err) {
      setToastMsg({ type: 'error', text: 'Có lỗi xảy ra khi gửi phản biện đề tài.' });
      setReviewDeckModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // 9. Thu hồi xuất bản đề tài Flashcard
  const handleRevokeFlashcard = (deck) => {
    const isConfirmed = window.confirm(
      `Xác nhận thu hồi đề tài "${deck.title}" khỏi web để chuyển về trạng thái Chờ thẩm định?`
    );
    if (!isConfirmed) return;

    updateDeckStatus(deck.id, 'PENDING', null, user?.full_name || 'Hội đồng Thẩm định');
    reloadFlashcards();
    if (previewDeckModal.isOpen && previewDeckModal.deck?.id === deck.id) {
      setPreviewDeckModal((prev) => ({
        ...prev,
        deck: { ...prev.deck, status: 'PENDING' },
      }));
    }
    setToastMsg({
      type: 'info',
      text: `✓ Đã thu hồi đề tài "${deck.title}" về trạng thái Chờ thẩm định.`,
    });
  };

  // 10. Phát âm thử từ vựng khi soát lỗi
  const handlePlayWordAudio = (word) => {
    setPlayingWord(word);
    speakWord(word, 1.0);
    setTimeout(() => setPlayingWord(null), 1500);
  };

  // Lọc và sắp xếp dữ liệu Khóa học hiển thị
  // Yêu cầu: Khóa học CHỜ THẨM ĐỊNH (hoặc giảng viên mới gửi lại) luôn được xếp LÊN TRÊN CÙNG
  const filteredCourses = courses
    .filter((c) => {
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
    })
    .sort((a, b) => {
      // 1. CHỜ THẨM ĐỊNH (PENDING) luôn ưu tiên xếp trên cùng
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;

      // 2. Mới gửi lại hoặc mới nhất xếp trước
      const timeA = new Date(a.resubmitted_at || a.updated_at || a.created_at || 0).getTime();
      const timeB = new Date(b.resubmitted_at || b.updated_at || b.created_at || 0).getTime();
      return timeB - timeA;
    });

  // Đếm thống kê Khóa học
  const countPending = courses.filter((c) => c.status === 'PENDING').length;
  const countPublished = courses.filter((c) => c.status === 'PUBLISHED').length;
  const countRejected = courses.filter((c) => c.status === 'REJECTED').length;

  // Lọc và sắp xếp dữ liệu Đề tài Flashcard hiển thị
  // Yêu cầu: Đề tài Giảng viên yêu cầu mới / Chờ thẩm định luôn hiển thị LÊN TRÊN CÙNG
  const filteredDecks = flashcardDecks
    .filter((d) => {
      const matchesSearch =
        !flashcardSearch.trim() ||
        d.title?.toLowerCase().includes(flashcardSearch.toLowerCase()) ||
        d.author?.toLowerCase().includes(flashcardSearch.toLowerCase()) ||
        d.description?.toLowerCase().includes(flashcardSearch.toLowerCase()) ||
        d.level?.toLowerCase().includes(flashcardSearch.toLowerCase());

      const matchesStatus =
        flashcardStatusFilter === 'ALL' ||
        (flashcardStatusFilter === 'PENDING' && d.status === 'PENDING') ||
        (flashcardStatusFilter === 'PUBLISHED' && d.status === 'PUBLISHED') ||
        (flashcardStatusFilter === 'REJECTED' && d.status === 'REJECTED');

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // 1. CHỜ THẨM ĐỊNH (PENDING) luôn ưu tiên xếp trên cùng
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;

      // 2. Đề tài gửi lại hoặc mới cập nhật xếp trước
      const timeA = new Date(a.resubmittedAt || a.updated_at || a.created_at || (a.isCustomDeck ? 9999999999999 : 0)).getTime();
      const timeB = new Date(b.resubmittedAt || b.updated_at || b.created_at || (b.isCustomDeck ? 9999999999999 : 0)).getTime();
      return timeB - timeA;
    });

  // Đếm thống kê Flashcards
  const countPendingDecks = flashcardDecks.filter((d) => d.status === 'PENDING').length;
  const countPublishedDecks = flashcardDecks.filter((d) => d.status === 'PUBLISHED').length;
  const countRejectedDecks = flashcardDecks.filter((d) => d.status === 'REJECTED').length;
  const countTotalWords = flashcardDecks.reduce((sum, d) => sum + (d.cards?.length || 0), 0);

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

      {/* Header Kiểu Giảng viên (Đơn giản, chuyên nghiệp, không màu mè) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              fontSize: '0.75rem',
              fontWeight: '700',
              marginBottom: '8px',
            }}
          >
            <i className="fa-solid fa-clipboard-check"></i>
            <span>CỔNG THẨM ĐỊNH & KIỂM ĐỊNH CHUYÊN MÔN</span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
            Không gian Thẩm định viên - {user?.full_name || 'Hội đồng thẩm định'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, maxWidth: '780px', lineHeight: '1.5' }}>
            {activeReviewTab === 'courses'
              ? 'Rà soát đề cương giáo án, video bài giảng, hệ thống đề thi và phản biện chất lượng chuyên môn trước khi xuất bản công khai.'
              : 'Rà soát tính chuẩn xác của phát âm IPA, nghĩa từ vựng tiếng Việt, câu ví dụ và phân bổ trình độ CEFR của các bộ thẻ Flashcards.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={activeReviewTab === 'courses' ? fetchAllCourses : reloadFlashcards}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <i className="fa-solid fa-arrows-rotate"></i>
            <span>Làm mới dữ liệu</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher Chuẩn Phong Cách Giảng Viên */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '22px' }}>
        <button
          type="button"
          onClick={() => setActiveReviewTab('courses')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeReviewTab === 'courses' ? '3px solid #0284c7' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeReviewTab === 'courses' ? '#0284c7' : '#64748b',
            fontWeight: '700',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <i className="fa-solid fa-book-open"></i>
          <span>Thẩm định Khóa học & Bài giảng</span>
          {countPending > 0 && (
            <span style={{ backgroundColor: '#ef4444', color: '#ffffff', fontSize: '0.72rem', padding: '2px 7px', borderRadius: '9999px', fontWeight: '800' }}>
              {countPending}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveReviewTab('flashcards')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeReviewTab === 'flashcards' ? '3px solid #0284c7' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeReviewTab === 'flashcards' ? '#0284c7' : '#64748b',
            fontWeight: '700',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <i className="fa-solid fa-layer-group"></i>
          <span>Thẩm định Đề tài Flashcards</span>
          {countPendingDecks > 0 && (
            <span style={{ backgroundColor: '#f59e0b', color: '#ffffff', fontSize: '0.72rem', padding: '2px 7px', borderRadius: '9999px', fontWeight: '800' }}>
              {countPendingDecks}
            </span>
          )}
        </button>
      </div>

      {/* =========================================================================
          PHÂN HỆ 1: THẨM ĐỊNH & KIỂM ĐỊNH KHÓA HỌC BÀI GIẢNG
         ========================================================================= */}
      {activeReviewTab === 'courses' && (
        <>
          {/* 3 Thống kê trạng thái Khóa Học */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
            <div
              onClick={() => setStatusFilter((prev) => (prev === 'PENDING' ? 'ALL' : 'PENDING'))}
              title={statusFilter === 'PENDING' ? 'Bấm để hiển thị lại toàn bộ khóa học' : 'Bấm để lọc các khóa chờ thẩm định'}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 20px',
                border: statusFilter === 'PENDING' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                boxShadow: statusFilter === 'PENDING' ? '0 4px 12px rgba(2, 132, 199, 0.15)' : '0 1px 3px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>CHỜ THẨM ĐỊNH (CẦN DUYỆT)</span>
                <span style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-clock-rotate-left"></i>
                </span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
                {countPending}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {statusFilter === 'PENDING' ? 'Đang lọc (bấm lại để xem tất cả)' : 'Giảng viên đã gửi yêu cầu duyệt'}
              </span>
            </div>

            <div
              onClick={() => setStatusFilter((prev) => (prev === 'PUBLISHED' ? 'ALL' : 'PUBLISHED'))}
              title={statusFilter === 'PUBLISHED' ? 'Bấm để hiển thị lại toàn bộ khóa học' : 'Bấm để lọc các khóa đã xuất bản'}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 20px',
                border: statusFilter === 'PUBLISHED' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                boxShadow: statusFilter === 'PUBLISHED' ? '0 4px 12px rgba(2, 132, 199, 0.15)' : '0 1px 3px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>ĐÃ THẨM ĐỊNH & XUẤT BẢN</span>
                <span style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-shield-check"></i>
                </span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
                {countPublished}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {statusFilter === 'PUBLISHED' ? 'Đang lọc (bấm lại để xem tất cả)' : 'Đang mở công khai cho học viên'}
              </span>
            </div>

            <div
              onClick={() => setStatusFilter((prev) => (prev === 'REJECTED' ? 'ALL' : 'REJECTED'))}
              title={statusFilter === 'REJECTED' ? 'Bấm để hiển thị lại toàn bộ khóa học' : 'Bấm để lọc các khóa bị phản biện'}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 20px',
                border: statusFilter === 'REJECTED' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                boxShadow: statusFilter === 'REJECTED' ? '0 4px 12px rgba(2, 132, 199, 0.15)' : '0 1px 3px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>ĐÃ PHẢN BIỆN (CẦN SỬA)</span>
                <span style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-comments"></i>
                </span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
                {countRejected}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {statusFilter === 'REJECTED' ? 'Đang lọc (bấm lại để xem tất cả)' : 'Yêu cầu giảng viên hoàn thiện lại'}
              </span>
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
                  borderRadius: '12px',
                  padding: '18px 20px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  transition: 'all 0.15s ease',
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
                      {isPending && c.is_resubmitted ? (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: '800',
                            padding: '3px 9px',
                            borderRadius: '8px',
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <i className="fa-solid fa-arrows-rotate"></i>
                          <span>ĐÃ CẬP NHẬT & GỬI DUYỆT LẠI</span>
                        </span>
                      ) : (
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
                      )}

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

                    {/* Thông báo nếu giảng viên đã sửa và gửi duyệt lại */}
                    {isPending && c.is_resubmitted && (
                      <div
                        style={{
                          marginTop: '10px',
                          padding: '9px 13px',
                          borderRadius: '8px',
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          color: '#15803d',
                          fontSize: '0.82rem',
                          lineHeight: '1.45',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="fa-solid fa-circle-check" style={{ color: '#16a34a', fontSize: '0.95rem' }}></i>
                          <div>
                            <span style={{ fontWeight: '700', color: '#14532d' }}>
                              Giảng viên đã cập nhật lại giáo trình và gửi duyệt lại!
                            </span>
                            {c.resubmitted_at && (
                              <span style={{ fontSize: '0.75rem', color: '#166534', marginLeft: '6px' }}>
                                ({new Date(c.resubmitted_at).toLocaleString('vi-VN')})
                              </span>
                            )}
                          </div>
                        </div>
                        {c.previous_rejection_reason && (
                          <button
                            type="button"
                            onClick={() => setPreviousReviewModal({ isOpen: true, title: c.title, reason: c.previous_rejection_reason })}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #86efac',
                              color: '#15803d',
                              fontSize: '0.74rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                            title="Xem lại nội dung phản biện lần trước để đối chiếu kiểm tra"
                          >
                            <i className="fa-solid fa-clock-rotate-left"></i>
                            <span>Xem góp ý lần trước</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Hiển thị lý do phản biện NẾU ĐANG BỊ TỪ CHỐI (không hiển thị khi đã gửi lại chờ duyệt) */}
                    {isRejected && c.rejection_reason && (
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
        </>
      )}

      {/* =========================================================================
          PHÂN HỆ 2: THẨM ĐỊNH & KIỂM ĐỊNH ĐỀ TÀI FLASHCARDS
         ========================================================================= */}
      {activeReviewTab === 'flashcards' && (
        <div>
          {/* 4 Thống kê trạng thái Flashcards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
            <div
              onClick={() => setFlashcardStatusFilter((prev) => (prev === 'PENDING' ? 'ALL' : 'PENDING'))}
              title={flashcardStatusFilter === 'PENDING' ? 'Bấm để hiển thị lại toàn bộ đề tài' : 'Bấm để lọc các đề tài chờ thẩm định'}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 20px',
                border: flashcardStatusFilter === 'PENDING' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                boxShadow: flashcardStatusFilter === 'PENDING' ? '0 4px 12px rgba(2, 132, 199, 0.15)' : '0 1px 3px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>CHỜ THẨM ĐỊNH (CẦN DUYỆT)</span>
                <span style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-clock-rotate-left"></i>
                </span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
                {countPendingDecks}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {flashcardStatusFilter === 'PENDING' ? 'Đang lọc (bấm lại để xem tất cả)' : 'Giảng viên gửi đề tài mới'}
              </span>
            </div>

            <div
              onClick={() => setFlashcardStatusFilter((prev) => (prev === 'PUBLISHED' ? 'ALL' : 'PUBLISHED'))}
              title={flashcardStatusFilter === 'PUBLISHED' ? 'Bấm để hiển thị lại toàn bộ đề tài' : 'Bấm để lọc các đề tài đã xuất bản'}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 20px',
                border: flashcardStatusFilter === 'PUBLISHED' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                boxShadow: flashcardStatusFilter === 'PUBLISHED' ? '0 4px 12px rgba(2, 132, 199, 0.15)' : '0 1px 3px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>ĐÃ THẨM ĐỊNH & XUẤT BẢN</span>
                <span style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-circle-check"></i>
                </span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
                {countPublishedDecks}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {flashcardStatusFilter === 'PUBLISHED' ? 'Đang lọc (bấm lại để xem tất cả)' : 'Đang mở công khai cho học viên'}
              </span>
            </div>

            <div
              onClick={() => setFlashcardStatusFilter((prev) => (prev === 'REJECTED' ? 'ALL' : 'REJECTED'))}
              title={flashcardStatusFilter === 'REJECTED' ? 'Bấm để hiển thị lại toàn bộ đề tài' : 'Bấm để lọc các đề tài bị phản biện'}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 20px',
                border: flashcardStatusFilter === 'REJECTED' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                boxShadow: flashcardStatusFilter === 'REJECTED' ? '0 4px 12px rgba(2, 132, 199, 0.15)' : '0 1px 3px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>ĐÃ PHẢN BIỆN (CẦN SỬA)</span>
                <span style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
                {countRejectedDecks}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {flashcardStatusFilter === 'REJECTED' ? 'Đang lọc (bấm lại để xem tất cả)' : 'Yêu cầu giảng viên sửa đổi'}
              </span>
            </div>

            <div
              onClick={() => setFlashcardStatusFilter('ALL')}
              title="Bấm để hiển thị toàn bộ đề tài từ vựng"
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 20px',
                border: flashcardStatusFilter === 'ALL' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                boxShadow: flashcardStatusFilter === 'ALL' ? '0 4px 12px rgba(2, 132, 199, 0.15)' : '0 1px 3px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>TỔNG TỪ VỰNG HỆ THỐNG</span>
                <span style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-spell-check"></i>
                </span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
                {countTotalWords}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {flashcardStatusFilter === 'ALL' ? 'Đang xem tất cả đề tài' : 'Bấm để hiển thị toàn bộ'}
              </span>
            </div>
          </div>

          {/* Bộ lọc Flashcards */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '20px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px',
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 300px' }}>
              <i
                className="fa-solid fa-magnifying-glass"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem' }}
              ></i>
              <input
                type="text"
                placeholder="Tìm theo tên đề tài từ vựng, giảng viên, trình độ..."
                value={flashcardSearch}
                onChange={(e) => setFlashcardSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569' }}>Trạng thái:</label>
              <select
                value={flashcardStatusFilter}
                onChange={(e) => setFlashcardStatusFilter(e.target.value)}
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#334155',
                  outline: 'none',
                }}
              >
                <option value="ALL">Tất cả ({flashcardDecks.length})</option>
                <option value="PENDING">Chờ thẩm định ({countPendingDecks})</option>
                <option value="PUBLISHED">Đã xuất bản ({countPublishedDecks})</option>
                <option value="REJECTED">Đã phản biện ({countRejectedDecks})</option>
              </select>
            </div>
          </div>

          {/* Danh sách đề tài Flashcard */}
          {filteredDecks.length === 0 ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                border: '1px dashed #cbd5e1',
                color: '#64748b',
              }}
            >
              <i className="fa-solid fa-folder-open" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '12px' }}></i>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 6px 0', color: '#334155' }}>
                Không tìm thấy đề tài flashcard nào phù hợp
              </h3>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                Hiện tại không có đề tài nào thuộc điều kiện tìm kiếm hoặc tất cả đã được xử lý.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredDecks.map((deck) => {
                const isPending = deck.status === 'PENDING';
                const isPublished = deck.status === 'PUBLISHED';
                const isRejected = deck.status === 'REJECTED';
                const cardCount = deck.cards?.length || 0;

                return (
                  <div
                    key={deck.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      padding: '18px 20px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                      <div style={{ flex: '1 1 360px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                          {isPending && deck.is_resubmitted ? (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: '800',
                                padding: '3px 9px',
                                borderRadius: '6px',
                                backgroundColor: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <i className="fa-solid fa-arrows-rotate"></i>
                              <span>ĐÃ CẬP NHẬT & GỬI DUYỆT LẠI</span>
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: '800',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                backgroundColor: isPending ? '#fef3c7' : isPublished ? '#d1fae5' : '#fee2e2',
                                color: isPending ? '#b45309' : isPublished ? '#065f46' : '#991b1b',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isPending ? '#f59e0b' : isPublished ? '#10b981' : '#ef4444' }}></span>
                              {isPending ? 'CHỜ THẨM ĐỊNH' : isPublished ? 'ĐÃ DUYỆT LÊN WEB' : 'BỊ YÊU CẦU SỬA'}
                            </span>
                          )}

                          <span style={{ fontSize: '0.72rem', fontWeight: '800', backgroundColor: `${deck.color || '#0284c7'}15`, color: deck.color || '#0284c7', padding: '3px 8px', borderRadius: '6px' }}>
                            Trình độ: {deck.level}
                          </span>

                          <span style={{ fontSize: '0.72rem', fontWeight: '700', backgroundColor: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px' }}>
                            <i className="fa-solid fa-spell-check" style={{ marginRight: '4px', color: '#7c3aed' }}></i>
                            {cardCount} từ vựng
                          </span>
                        </div>

                        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                          {deck.title}
                        </h3>

                        <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#64748b', lineHeight: '1.45' }}>
                          {deck.description || 'Chủ đề từ vựng tiếng Anh chuyên đề do Giảng viên biên soạn.'}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '0.8rem', color: '#64748b' }}>
                          <span>
                            <i className="fa-solid fa-chalkboard-user" style={{ marginRight: '5px', color: '#4338ca' }}></i>
                            Người biên soạn: <strong>{deck.author || 'Giảng viên'}</strong>
                          </span>
                          {deck.created_at && (
                            <span>
                              <i className="fa-regular fa-calendar" style={{ marginRight: '5px', color: '#0284c7' }}></i>
                              Ngày gửi: {deck.created_at}
                            </span>
                          )}
                          {deck.reviewedBy && (
                            <span style={{ color: '#059669', fontWeight: '600' }}>
                              <i className="fa-solid fa-user-check" style={{ marginRight: '4px' }}></i>
                              Thẩm định bởi: {deck.reviewedBy}
                            </span>
                          )}
                        </div>

                        {/* Thông báo nếu giảng viên đã sửa đề tài và gửi duyệt lại */}
                        {isPending && deck.is_resubmitted && (
                          <div
                            style={{
                              marginTop: '10px',
                              padding: '9px 13px',
                              borderRadius: '8px',
                              backgroundColor: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              color: '#15803d',
                              fontSize: '0.82rem',
                              lineHeight: '1.45',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="fa-solid fa-circle-check" style={{ color: '#16a34a', fontSize: '0.95rem' }}></i>
                              <div>
                                <span style={{ fontWeight: '700', color: '#14532d' }}>
                                  Giảng viên đã cập nhật lại đề tài từ vựng và gửi duyệt lại!
                                </span>
                                {deck.resubmittedAt && (
                                  <span style={{ fontSize: '0.75rem', color: '#166534', marginLeft: '6px' }}>
                                    ({new Date(deck.resubmittedAt).toLocaleString('vi-VN')})
                                  </span>
                                )}
                              </div>
                            </div>
                            {deck.previousRejectionReason && (
                              <button
                                type="button"
                                onClick={() => setPreviousReviewModal({ isOpen: true, title: deck.title, reason: deck.previousRejectionReason })}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  backgroundColor: '#ffffff',
                                  border: '1px solid #86efac',
                                  color: '#15803d',
                                  fontSize: '0.74rem',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                                title="Xem lại nội dung phản biện lần trước để đối chiếu kiểm tra"
                              >
                                <i className="fa-solid fa-clock-rotate-left"></i>
                                <span>Xem góp ý lần trước</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Chi tiết phản biện CHỈ hiển thị khi BỊ TỪ CHỐI (không hiển thị khi đã gửi lại chờ duyệt) */}
                        {isRejected && deck.rejectionReason && (
                          <div
                            style={{
                              marginTop: '12px',
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
                              <span>Góp ý phản biện đã gửi cho giảng viên:</span>
                            </div>
                            <div style={{ whiteSpace: 'pre-line' }}>{deck.rejectionReason}</div>
                          </div>
                        )}
                      </div>

                      {/* Các nút hành động thẩm định */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto' }}>
                        <button
                          onClick={() => setPreviewDeckModal({ isOpen: true, deck })}
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
                          title="Xem toàn bộ danh sách từ vựng, phiên âm IPA, nghĩa và câu ví dụ"
                        >
                          <i className="fa-solid fa-eye"></i>
                          <span>Soát lỗi từ vựng</span>
                        </button>

                        <button
                          onClick={() => handleOpenReviewDeckModal(deck)}
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
                          title="Gửi bản phản biện yêu cầu giảng viên chỉnh sửa"
                        >
                          <i className="fa-solid fa-message-exclamation"></i>
                          <span>Phản biện & Yêu cầu sửa</span>
                        </button>

                        {!isPublished ? (
                          <button
                            onClick={() => handleApproveFlashcard(deck)}
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
                        ) : (
                          <button
                            onClick={() => handleRevokeFlashcard(deck)}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '10px',
                              backgroundColor: '#fff7ed',
                              border: '1px solid #fdba74',
                              color: '#c2410c',
                              fontSize: '0.82rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                            title="Thu hồi xuất bản đề tài này về trạng thái chờ duyệt"
                          >
                            <i className="fa-solid fa-rotate-left"></i>
                            <span>Thu hồi xuất bản</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: XEM CHI TIẾT GIÁO ÁN & THẨM ĐỊNH VIDEO BÀI GIẢNG
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
              borderRadius: '16px',
              maxWidth: '1200px',
              width: '96%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', marginBottom: '2px' }}>
                  <i className="fa-solid fa-circle-play"></i>
                  <span>KHÔNG GIAN RÀ SOÁT & KIỂM ĐỊNH VIDEO BÀI GIẢNG</span>
                </div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                  {previewModal.course?.title}
                </h2>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginTop: '4px', fontSize: '0.8rem', color: '#64748b' }}>
                  <span>Giảng viên: <strong style={{ color: '#0f172a' }}>{previewModal.details?.teacher?.full_name || previewModal.course?.teacher?.full_name}</strong></span>
                  <span>Trình độ: <strong style={{ color: '#0f172a' }}>{previewModal.details?.level_display || previewModal.course?.level}</strong></span>
                  <span>Trạng thái: <strong style={{ color: '#0f172a' }}>{previewModal.course?.status_display || previewModal.course?.status}</strong></span>
                </div>
              </div>
              <button
                onClick={() => {
                  setPreviewModal({ isOpen: false, course: null, details: null, loadingDetails: false });
                  setSelectedLesson(null);
                  setLessonDetail(null);
                }}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#64748b', cursor: 'pointer', padding: '4px 8px' }}
                title="Đóng modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Content: Split Screen Layout */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {previewModal.loadingDetails ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#0284c7', marginBottom: '12px' }}></i>
                  <p style={{ fontWeight: '600' }}>Đang nạp video bài giảng và cấu trúc đề cương...</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: '22px' }}>
                  {/* CỘT TRÁI: KHU VỰC TRÌNH CHIẾU VIDEO & CHI TIẾT BÀI HỌC */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {selectedLesson ? (
                      <>
                        {/* Video Player Box */}
                        <div style={{ backgroundColor: '#000000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                          {(lessonDetail?.video_url || selectedLesson.video_url) ? (
                            isYouTubeUrl(lessonDetail?.video_url || selectedLesson.video_url) ? (
                              <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                                <iframe
                                  key={`yt-${selectedLesson.id}-${lessonDetail?.video_url || selectedLesson.video_url}`}
                                  src={getYouTubeEmbedUrl(lessonDetail?.video_url || selectedLesson.video_url)}
                                  title={selectedLesson.title}
                                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            ) : (
                              <video
                                key={`video-${selectedLesson.id}-${lessonDetail?.video_url || selectedLesson.video_url}`}
                                controls
                                src={lessonDetail?.video_url || selectedLesson.video_url}
                                style={{ width: '100%', maxHeight: '380px', display: 'block', backgroundColor: '#000000' }}
                              />
                            )
                          ) : (
                            <div style={{ padding: '44px 20px', textAlign: 'center', backgroundColor: '#f8fafc', color: '#64748b' }}>
                              <i className="fa-solid fa-video-slash" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '10px' }}></i>
                              <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: '800', color: '#334155' }}>
                                Bài giảng này chưa gắn video
                              </h4>
                              <p style={{ margin: 0, fontSize: '0.84rem' }}>
                                Giảng viên có thể chỉ cung cấp tài liệu đọc lý thuyết hoặc chưa bổ sung liên kết video.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Chi tiết bài giảng đang xem */}
                        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0284c7' }}>
                              {selectedLesson.chapterTitle && <span>{selectedLesson.chapterTitle} • </span>}
                              Bài {selectedLesson.order_index || 1}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              {selectedLesson.duration_minutes > 0 && (
                                <span style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' }}>
                                  <i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i>
                                  {selectedLesson.duration_minutes} phút
                                </span>
                              )}
                              {selectedLesson.is_preview && (
                                <span style={{ fontSize: '0.72rem', backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>
                                  HỌC THỬ
                                </span>
                              )}
                              {(lessonDetail?.video_url || selectedLesson.video_url) && (
                                <a
                                  href={lessonDetail?.video_url || selectedLesson.video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontSize: '0.75rem', color: '#0284c7', textDecoration: 'none', fontWeight: '600', marginLeft: '6px' }}
                                  title="Mở liên kết video gốc trong tab mới"
                                >
                                  <i className="fa-solid fa-arrow-up-right-from-square"></i> Mở link gốc
                                </a>
                              )}
                            </div>
                          </div>

                          <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                            {selectedLesson.title}
                          </h3>

                          {/* Tabs bài học */}
                          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid #e2e8f0', marginBottom: '12px' }}>
                            <button
                              type="button"
                              onClick={() => setLessonTab('content')}
                              style={{
                                padding: '8px 14px',
                                border: 'none',
                                borderBottom: lessonTab === 'content' ? '2px solid #0284c7' : '2px solid transparent',
                                backgroundColor: 'transparent',
                                color: lessonTab === 'content' ? '#0284c7' : '#64748b',
                                fontWeight: '700',
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                              }}
                            >
                              <i className="fa-solid fa-align-left" style={{ marginRight: '6px' }}></i>
                              Nội dung lý thuyết
                            </button>
                            <button
                              type="button"
                              onClick={() => setLessonTab('materials')}
                              style={{
                                padding: '8px 14px',
                                border: 'none',
                                borderBottom: lessonTab === 'materials' ? '2px solid #0284c7' : '2px solid transparent',
                                backgroundColor: 'transparent',
                                color: lessonTab === 'materials' ? '#0284c7' : '#64748b',
                                fontWeight: '700',
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                              }}
                            >
                              <i className="fa-solid fa-paperclip" style={{ marginRight: '6px' }}></i>
                              Tài liệu đính kèm ({lessonDetail?.materials?.length || selectedLesson.materials?.length || 0})
                            </button>
                          </div>

                          {/* Tab Body */}
                          {loadingLessonDetail ? (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                              <i className="fa-solid fa-spinner fa-spin" style={{ color: '#0284c7' }}></i>
                              <span style={{ marginLeft: '8px', fontSize: '0.82rem' }}>Đang nạp chi tiết bài giảng...</span>
                            </div>
                          ) : lessonTab === 'content' ? (
                            <div style={{ fontSize: '0.86rem', color: '#334155', lineHeight: '1.6', maxHeight: '180px', overflowY: 'auto' }}>
                              {lessonDetail?.content || selectedLesson.content ? (
                                <div style={{ whiteSpace: 'pre-line' }}>{lessonDetail?.content || selectedLesson.content}</div>
                              ) : (
                                <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                                  Bài học này không có ghi chú lý thuyết bằng văn bản.
                                </p>
                              )}
                            </div>
                          ) : (
                            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                              {(!lessonDetail?.materials || lessonDetail.materials.length === 0) && (!selectedLesson.materials || selectedLesson.materials.length === 0) ? (
                                <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0, fontSize: '0.84rem' }}>
                                  Bài giảng này không có file tài liệu đính kèm.
                                </p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {(lessonDetail?.materials || selectedLesson.materials || []).map((m, mIdx) => (
                                    <div
                                      key={m.id || mIdx}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        backgroundColor: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.82rem',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fa-solid fa-file-lines" style={{ color: '#0284c7' }}></i>
                                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{m.title || `Tài liệu ${mIdx + 1}`}</span>
                                      </div>
                                      {m.file_url && (
                                        <a
                                          href={m.file_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ color: '#0284c7', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                          <i className="fa-solid fa-download"></i> Xem file
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                        <i className="fa-solid fa-circle-play" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '12px' }}></i>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: '700', color: '#475569' }}>
                          Vui lòng chọn bài học từ danh mục bên phải
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8' }}>
                          Bấm vào bất kỳ bài học nào để thẩm định trực tiếp video và nội dung sư phạm.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CỘT PHẢI: MỤC LỤC GIÁO TRÌNH & CÁC CHƯƠNG BÀI HỌC */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '620px', overflowY: 'auto', paddingRight: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                        Mục lục giáo trình ({previewModal.details?.chapters?.length || 0} chương)
                      </h4>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Bấm để kiểm định video
                      </span>
                    </div>

                    {(!previewModal.details?.chapters || previewModal.details.chapters.length === 0) ? (
                      <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#fef2f2', borderRadius: '10px', color: '#b91c1c' }}>
                        <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
                        Khóa học này chưa có chương học nào! Giảng viên cần bổ sung ít nhất 1 chương và bài học.
                      </div>
                    ) : (
                      previewModal.details.chapters.map((ch, idx) => (
                        <div key={ch.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', backgroundColor: '#ffffff' }}>
                          <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Chương {idx + 1}: {ch.title}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                              {(ch.lessons || []).length} bài
                            </span>
                          </div>

                          {/* Danh sách bài học của chương */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {(ch.lessons || []).map((l, lIdx) => {
                              const isCurrent = selectedLesson?.id === l.id;
                              const hasVideo = !!l.video_url;

                              return (
                                <div
                                  key={l.id}
                                  onClick={() => handleSelectLesson({ ...l, chapterTitle: ch.title })}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '9px 12px',
                                    backgroundColor: isCurrent ? '#eff6ff' : '#f8fafc',
                                    border: isCurrent ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                    <i
                                      className={isCurrent ? 'fa-solid fa-circle-play' : 'fa-regular fa-circle-play'}
                                      style={{ color: isCurrent ? '#0284c7' : hasVideo ? '#10b981' : '#94a3b8', fontSize: '0.95rem' }}
                                    ></i>
                                    <span
                                      style={{
                                        fontWeight: isCurrent ? '800' : '600',
                                        fontSize: '0.82rem',
                                        color: isCurrent ? '#0284c7' : '#334155',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {lIdx + 1}. {l.title}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                    {hasVideo ? (
                                      <span style={{ fontSize: '0.7rem', color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                        <i className="fa-solid fa-video" style={{ marginRight: '3px' }}></i> Video
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '0.7rem', color: '#d97706', backgroundColor: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                                        Chưa video
                                      </span>
                                    )}
                                    {l.duration_minutes > 0 && (
                                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{l.duration_minutes}m</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                {selectedLesson && (
                  <button
                    type="button"
                    onClick={() => {
                      const course = previewModal.course;
                      const lessonTitle = selectedLesson.title;
                      setPreviewModal({ isOpen: false, course: null, details: null, loadingDetails: false });
                      setReviewModal({
                        isOpen: true,
                        course,
                        criteria: { content: false, video: true, quiz: false, materials: false },
                        notes: `[Phản biện Bài giảng "${lessonTitle}"]:\n- Video: \n- Nội dung: `,
                        isSubmitting: false,
                      });
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid #fca5a5',
                      backgroundColor: '#ffffff',
                      color: '#dc2626',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    title="Gửi phản biện riêng cho bài giảng video đang xem"
                  >
                    <i className="fa-solid fa-comment-dots"></i>
                    <span>Phản biện bài học này</span>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setPreviewModal({ isOpen: false, course: null, details: null, loadingDetails: false });
                    setSelectedLesson(null);
                    setLessonDetail(null);
                  }}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  Đóng
                </button>

                <button
                  onClick={() => {
                    const course = previewModal.course;
                    setPreviewModal({ isOpen: false, course: null, details: null, loadingDetails: false });
                    handleOpenReviewModal(course);
                  }}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #fca5a5', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="fa-solid fa-message-exclamation"></i>
                  <span>Yêu cầu sửa khóa học</span>
                </button>

                <button
                  onClick={() => {
                    const course = previewModal.course;
                    handleApprove(course);
                  }}
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#059669', color: '#ffffff', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="fa-solid fa-check"></i>
                  <span>Phê duyệt khóa học</span>
                </button>
              </div>
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
                  Phiếu phản biện sư phạm
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.18rem', fontWeight: '800', color: '#0f172a' }}>
                  Yêu cầu chỉnh sửa khóa học
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

              {/* Ý kiến phản biện lần trước để đối chiếu nếu có */}
              {reviewModal.course?.previous_rejection_reason && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '10px 14px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: '#475569',
                    lineHeight: '1.45',
                  }}
                >
                  <div style={{ fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-clock-rotate-left"></i>
                    <span>Ý kiến phản biện lần trước (để đối chiếu rà soát):</span>
                  </div>
                  <div style={{ whiteSpace: 'pre-line', fontStyle: 'italic', color: '#64748b', maxHeight: '100px', overflowY: 'auto' }}>
                    {reviewModal.course.previous_rejection_reason}
                  </div>
                </div>
              )}

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
                    <span>Gửi phản biện cho giảng viên</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem Ý kiến phản biện lần trước */}
      {previousReviewModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-clock-rotate-left" style={{ color: '#0284c7' }}></i>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>
                  Ý kiến phản biện lần trước
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviousReviewModal({ isOpen: false, title: '', reason: '' })}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: '#64748b' }}>
                Khóa học: <strong style={{ color: '#0f172a' }}>{previousReviewModal.title}</strong>
              </p>
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px',
                  color: '#334155',
                  fontSize: '0.85rem',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-line',
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}
              >
                {previousReviewModal.reason}
              </div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setPreviousReviewModal({ isOpen: false, title: '', reason: '' })}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Đã hiểu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: XEM TRƯỚC & SOÁT LỖI TỪ VỰNG FLASHCARD (PREVIEW & AUDIT DECK)
         ========================================================================= */}
      {previewDeckModal.isOpen && previewDeckModal.deck && (
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
              width: '100%',
              maxWidth: '1100px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '800', backgroundColor: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: '6px' }}>
                    {previewDeckModal.deck.level}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b' }}>
                    Người tạo: {previewDeckModal.deck.author || 'Giảng viên'}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Thẩm Định Chi Tiết Từ Vựng: {previewDeckModal.deck.title} ({previewDeckModal.deck.cards?.length || 0} từ)
                </h2>
              </div>
              <button
                onClick={() => setPreviewDeckModal({ isOpen: false, deck: null })}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Bảng danh sách từ vựng kiểm định */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {(!previewDeckModal.deck.cards || previewDeckModal.deck.cards.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Đề tài này hiện chưa có từ vựng nào được thêm vào.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#475569', fontWeight: '800' }}>
                        <th style={{ padding: '10px 12px', width: '40px' }}>#</th>
                        <th style={{ padding: '10px 12px', minWidth: '160px' }}>Từ Vựng & IPA</th>
                        <th style={{ padding: '10px 12px', width: '100px' }}>Loại Từ</th>
                        <th style={{ padding: '10px 12px', minWidth: '180px' }}>Nghĩa Tiếng Việt</th>
                        <th style={{ padding: '10px 12px', minWidth: '220px' }}>Định Nghĩa Tiếng Anh</th>
                        <th style={{ padding: '10px 12px', minWidth: '240px' }}>Câu Ví Dụ & Ngữ Cảnh</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewDeckModal.deck.cards.map((c, idx) => (
                        <tr key={c.id || idx} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                          <td style={{ padding: '12px', fontWeight: '700', color: '#94a3b8' }}>
                            #{idx + 1}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{c.word}</span>
                              <button
                                type="button"
                                onClick={() => handlePlayWordAudio(c.word)}
                                style={{
                                  border: 'none',
                                  background: '#e0f2fe',
                                  color: '#0284c7',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                }}
                                title="Nghe phát âm chuẩn"
                              >
                                <i className={`fa-solid ${playingWord === c.word ? 'fa-spinner fa-spin' : 'fa-volume-high'}`}></i>
                              </button>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                              {c.ipa || 'Chưa có IPA'}
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: '700', backgroundColor: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '4px' }}>
                              {c.type || 'Noun'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: '600', color: '#0f172a' }}>
                            {c.meaning}
                            {c.collocation && (
                              <div style={{ fontSize: '0.74rem', color: '#0284c7', marginTop: '4px', fontWeight: '500' }}>
                                🔗 {c.collocation}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px', color: '#475569', fontSize: '0.8rem', lineHeight: '1.4' }}>
                            {c.english_def || '—'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ color: '#0f172a', fontStyle: 'italic', lineHeight: '1.4' }}>
                              "{c.example || '—'}"
                            </div>
                            {c.example_vi && (
                              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '3px' }}>
                                ↳ {c.example_vi}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <button
                onClick={() => setPreviewDeckModal({ isOpen: false, deck: null })}
                style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
              >
                Đóng
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    const d = previewDeckModal.deck;
                    setPreviewDeckModal({ isOpen: false, deck: null });
                    handleOpenReviewDeckModal(d);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fca5a5',
                    color: '#b91c1c',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <i className="fa-solid fa-message-exclamation"></i>
                  <span>Phản biện & Yêu cầu sửa</span>
                </button>

                {previewDeckModal.deck.status !== 'PUBLISHED' && (
                  <button
                    onClick={() => {
                      handleApproveFlashcard(previewDeckModal.deck);
                    }}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                    }}
                  >
                    <i className="fa-solid fa-check"></i>
                    <span>Xác nhận Duyệt & Xuất bản lên Web</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: PHẢN BIỆN ĐỀ TÀI FLASHCARD
         ========================================================================= */}
      {reviewDeckModal.isOpen && reviewDeckModal.deck && (
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
              width: '100%',
              maxWidth: '620px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fef2f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Phiếu phản biện từ vựng sư phạm
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#991b1b', margin: '2px 0 0 0' }}>
                  Phản biện đề tài: "{reviewDeckModal.deck.title}"
                </h3>
              </div>
              <button
                onClick={() => setReviewDeckModal({ isOpen: false, deck: null, criteria: {}, notes: '', isSubmitting: false })}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#991b1b', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Ý kiến phản biện lần trước để đối chiếu nếu có */}
              {reviewDeckModal.deck?.previousRejectionReason && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: '#475569',
                    lineHeight: '1.45',
                  }}
                >
                  <div style={{ fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-clock-rotate-left"></i>
                    <span>Ý kiến phản biện lần trước (để đối chiếu rà soát):</span>
                  </div>
                  <div style={{ whiteSpace: 'pre-line', fontStyle: 'italic', color: '#64748b', maxHeight: '100px', overflowY: 'auto' }}>
                    {reviewDeckModal.deck.previousRejectionReason}
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                  Các tiêu chí cần Giảng viên khắc phục / chỉnh sửa:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'ipa', label: 'Phát âm IPA / Chính tả từ vựng' },
                    { id: 'grammar', label: 'Ngữ pháp câu ví dụ ngữ cảnh' },
                    { id: 'meaning', label: 'Nghĩa tiếng Việt chưa chuẩn xác' },
                    { id: 'example', label: 'Định nghĩa chưa khớp chuẩn CEFR' },
                  ].map((item) => (
                    <label
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.82rem',
                        fontWeight: '600',
                        color: '#475569',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={reviewDeckModal.criteria[item.id] || false}
                        onChange={(e) =>
                          setReviewDeckModal((prev) => ({
                            ...prev,
                            criteria: { ...prev.criteria, [item.id]: e.target.checked },
                          }))
                        }
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Chi tiết ý kiến phản biện (hướng dẫn cụ thể cho giảng viên): <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Ví dụ: Từ số 3 phiên âm IPA bị thiếu trọng âm. Câu ví dụ của từ số 7 chưa đúng ngữ pháp thì hiện tại hoàn thành, cần sửa lại..."
                  value={reviewDeckModal.notes}
                  onChange={(e) => setReviewDeckModal((prev) => ({ ...prev, notes: e.target.value }))}
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
                onClick={() => setReviewDeckModal({ isOpen: false, deck: null, criteria: {}, notes: '', isSubmitting: false })}
                style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
                disabled={reviewDeckModal.isSubmitting}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmReviewDeck}
                disabled={reviewDeckModal.isSubmitting}
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
                {reviewDeckModal.isSubmitting ? (
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

import React, { useState, useEffect } from 'react';
import { assessmentAPI, courseAPI } from '../services/api';
import Pagination from './Pagination';
import ConfirmModal from './ConfirmModal';
import TeacherAIQuizModal from './TeacherAIQuizModal';

export default function TeacherQuizManagerView({ user, onOpenQuizImport }) {
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuizType, setSelectedQuizType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Toast Notification
  const [toastMsg, setToastMsg] = useState(null);
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // AI Quiz Modal
  const [showAIQuizModal, setShowAIQuizModal] = useState(false);

  // Confirm Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false,
  });

  // Create / Edit Quiz Modal State
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizType, setQuizType] = useState('PRACTICE');
  const [quizLevel, setQuizLevel] = useState('B1');
  const [quizTimeLimit, setQuizTimeLimit] = useState(15);
  const [quizPassingScore, setQuizPassingScore] = useState(70);
  const [quizIsPublished, setQuizIsPublished] = useState(true);
  const [quizCourseId, setQuizCourseId] = useState('');
  const [quizChapterId, setQuizChapterId] = useState('');
  const [quizLessonId, setQuizLessonId] = useState('');
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);

  // Question Management Modal State (Quản lý các câu hỏi trong 1 đề thi)
  const [managingQuiz, setManagingQuiz] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Question Create / Edit Form State inside Managing Quiz
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [qContent, setQContent] = useState('');
  const [qSkill, setQSkill] = useState('GRAMMAR');
  const [qPoints, setQPoints] = useState(1.0);
  const [qAudioUrl, setQAudioUrl] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  const [qOptions, setQOptions] = useState([
    { content: '', is_correct: true },
    { content: '', is_correct: false },
    { content: '', is_correct: false },
    { content: '', is_correct: false },
  ]);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);

  // Fetch Quizzes and Courses
  const fetchQuizzesAndCourses = async () => {
    setIsLoading(true);
    try {
      const [quizzesRes, coursesRes] = await Promise.allSettled([
        assessmentAPI.getQuizzes(),
        courseAPI.getTeachingCourses(),
      ]);

      if (quizzesRes.status === 'fulfilled' && quizzesRes.value.data) {
        const list = quizzesRes.value.data.results || quizzesRes.value.data.data?.results || quizzesRes.value.data.data || quizzesRes.value.data || [];
        if (Array.isArray(list)) {
          setQuizzes(list);
        }
      }

      if (coursesRes.status === 'fulfilled' && coursesRes.value.data) {
        const cList = coursesRes.value.data.data || coursesRes.value.data.results || coursesRes.value.data || [];
        if (Array.isArray(cList)) {
          setCourses(cList);
        }
      }
    } catch (err) {
      console.warn('Could not load quizzes for teacher:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzesAndCourses();
  }, []);

  // Mở modal tạo đề thi mới
  const handleOpenCreateQuiz = () => {
    setEditingQuiz(null);
    setQuizTitle('');
    setQuizDescription('');
    setQuizType('PRACTICE');
    setQuizLevel('B1');
    setQuizTimeLimit(15);
    setQuizPassingScore(70);
    setQuizIsPublished(true);
    setQuizCourseId(courses[0]?.id || '');
    setQuizChapterId('');
    setQuizLessonId('');
    setIsQuizModalOpen(true);
  };

  // Mở modal sửa đề thi
  const handleOpenEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizTitle(quiz.title || '');
    setQuizDescription(quiz.description || '');
    setQuizType(quiz.quiz_type || 'PRACTICE');
    setQuizLevel(quiz.level || 'B1');
    setQuizTimeLimit(quiz.time_limit_minutes || 15);
    setQuizPassingScore(Math.round(Number(quiz.passing_score || 70)));
    setQuizIsPublished(quiz.is_published !== false);
    setQuizCourseId(quiz.course || quiz.course_id || '');
    setQuizChapterId(quiz.chapter || quiz.chapter_id || '');
    setQuizLessonId(quiz.lesson || quiz.lesson_id || '');
    setIsQuizModalOpen(true);
  };

  // Lưu tạo mới / cập nhật đề thi
  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    if (!quizTitle.trim()) {
      setToastMsg('Vui lòng nhập tiêu đề đề thi!');
      return;
    }

    setIsSavingQuiz(true);
    const payload = {
      title: quizTitle.trim(),
      description: quizDescription.trim(),
      quiz_type: quizType,
      level: quizLevel,
      time_limit_minutes: Number(quizTimeLimit) || 15,
      passing_score: Number(quizPassingScore) || 70.0,
      is_published: quizIsPublished,
      course_id: quizCourseId || null,
      chapter_id: quizChapterId || null,
      lesson_id: quizLessonId || null,
    };

    try {
      if (editingQuiz) {
        await assessmentAPI.updateQuiz(editingQuiz.id, payload);
        setToastMsg('Đã cập nhật đề thi thành công!');
      } else {
        await assessmentAPI.createQuiz(payload);
        setToastMsg('Đã tạo đề thi mới thành công!');
      }
      setIsQuizModalOpen(false);
      fetchQuizzesAndCourses();
    } catch (err) {
      console.warn('Save quiz error:', err);
      setToastMsg('Không thể lưu đề thi vào CSDL.');
    } finally {
      setIsSavingQuiz(false);
    }
  };

  // Xóa đề thi
  const handleDeleteQuiz = (quiz) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa đề thi',
      message: `Bạn có chắc chắn muốn xóa đề thi "${quiz.title}"? Toàn bộ các câu hỏi bên trong sẽ bị xóa vĩnh viễn.`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await assessmentAPI.deleteQuiz(quiz.id);
          setToastMsg('Đã xóa đề thi thành công!');
          fetchQuizzesAndCourses();
        } catch (err) {
          setToastMsg('Không thể xóa đề thi.');
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, isLoading: false });
        }
      },
      isLoading: false,
    });
  };

  // Mở quản lý danh sách câu hỏi trong đề thi
  const handleManageQuestions = async (quiz) => {
    setManagingQuiz(quiz);
    setIsQuestionFormOpen(false);
    setEditingQuestion(null);
    setIsLoadingQuestions(true);
    try {
      const res = await assessmentAPI.getQuizDetail(quiz.id);
      const detail = res.data?.data || res.data;
      if (detail && detail.questions) {
        setQuizQuestions(detail.questions);
      } else {
        setQuizQuestions([]);
      }
    } catch (err) {
      console.warn('Could not load quiz questions:', err);
      setQuizQuestions([]);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Mở form thêm câu hỏi thủ công
  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setQContent('');
    setQSkill('GRAMMAR');
    setQPoints(1.0);
    setQAudioUrl('');
    setQExplanation('');
    setQOptions([
      { content: '', is_correct: true },
      { content: '', is_correct: false },
      { content: '', is_correct: false },
      { content: '', is_correct: false },
    ]);
    setIsQuestionFormOpen(true);
  };

  // Mở form sửa câu hỏi
  const handleOpenEditQuestion = (q) => {
    setEditingQuestion(q);
    setQContent(q.content || '');
    setQSkill(q.skill || 'GRAMMAR');
    setQPoints(q.points || 1.0);
    setQAudioUrl(q.audio_url || '');
    setQExplanation(q.explanation || q.explanation_vi || '');

    const opts = (q.options || []).map((o) => ({
      id: o.id,
      content: o.content || '',
      is_correct: o.is_correct === true || String(o.is_correct).toLowerCase() === 'true',
    }));

    while (opts.length < 4) {
      opts.push({ content: '', is_correct: false });
    }
    setQOptions(opts);
    setIsQuestionFormOpen(true);
  };

  // Lưu câu hỏi vào đề thi
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!qContent.trim()) {
      setToastMsg('Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    const validOptions = qOptions.filter((o) => o.content.trim() !== '');
    if (validOptions.length < 2) {
      setToastMsg('Câu hỏi phải có ít nhất 2 phương án trả lời!');
      return;
    }

    const hasCorrect = validOptions.some((o) => o.is_correct);
    if (!hasCorrect) {
      setToastMsg('Vui lòng chọn ít nhất 1 đáp án đúng!');
      return;
    }

    setIsSavingQuestion(true);
    const formattedOpts = validOptions.map((opt, idx) => ({
      content: opt.content.trim(),
      is_correct: Boolean(opt.is_correct),
      order_index: idx + 1,
    }));

    const payload = {
      content: qContent.trim(),
      question_type: 'SINGLE_CHOICE',
      skill: qSkill,
      level: managingQuiz.level || 'B1',
      points: Number(qPoints) || 1.0,
      audio_url: qAudioUrl.trim() || null,
      explanation: qExplanation.trim(),
      options: formattedOpts,
    };

    try {
      if (editingQuestion) {
        await assessmentAPI.updateQuestion(editingQuestion.id, payload);
        setToastMsg('Đã cập nhật câu hỏi thành công!');
      } else {
        await assessmentAPI.createQuestion(managingQuiz.id, payload);
        setToastMsg('Đã thêm câu hỏi vào đề thi!');
      }
      setIsQuestionFormOpen(false);
      handleManageQuestions(managingQuiz);
      fetchQuizzesAndCourses();
    } catch (err) {
      console.warn('Save question error:', err);
      setToastMsg('Không thể lưu câu hỏi.');
    } finally {
      setIsSavingQuestion(false);
    }
  };

  // Xóa câu hỏi khỏi đề thi
  const handleDeleteQuestion = (q) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa câu hỏi',
      message: `Bạn có chắc chắn muốn xóa câu hỏi "${q.content.slice(0, 60)}..." khỏi đề thi?`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await assessmentAPI.deleteQuestion(q.id);
          setToastMsg('Đã xóa câu hỏi!');
          handleManageQuestions(managingQuiz);
          fetchQuizzesAndCourses();
        } catch (err) {
          setToastMsg('Không thể xóa câu hỏi.');
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, isLoading: false });
        }
      },
      isLoading: false,
    });
  };

  // Lọc đề thi
  const filteredQuizzes = quizzes.filter((q) => {
    if (selectedQuizType !== 'ALL') {
      if (selectedQuizType === 'PRACTICE' && q.quiz_type && q.quiz_type !== 'PRACTICE') return false;
      if (selectedQuizType !== 'PRACTICE' && q.quiz_type !== selectedQuizType) return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleMatch = (q.title || '').toLowerCase().includes(query);
      const descMatch = (q.description || '').toLowerCase().includes(query);
      const courseMatch = (q.course_title || '').toLowerCase().includes(query);
      return titleMatch || descMatch || courseMatch;
    }
    return true;
  });

  const paginatedQuizzes = filteredQuizzes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      {/* Top Header Box */}
      <div className="page-header-box" style={{ marginBottom: '24px' }}>
        <div>
          <h2 className="page-title">
            <i className="fa-solid fa-file-pen" style={{ color: '#0284c7' }}></i>
            <span>QUẢN LÝ NGÂN HÀNG ĐỀ THI & CÂU HỎI (GIẢNG VIÊN)</span>
          </h2>
          <p className="page-subtitle">
            Thiết kế bài kiểm tra trắc nghiệm, chỉnh sửa câu hỏi, đáp án đúng/sai, tích hợp AI Sinh đề tự động và Import từ Word/Excel.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={handleOpenCreateQuiz}
            style={{ backgroundColor: '#0284c7' }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>Tạo Đề Thi Mới</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowAIQuizModal(true)}
            style={{ backgroundColor: '#7c3aed' }}
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>AI Sinh Đề Thi (UC_T4)</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={onOpenQuizImport}
            style={{ backgroundColor: '#e11d48' }}
          >
            <i className="fa-solid fa-file-import"></i>
            <span>Import Đề Thi</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `Tất cả (${quizzes.length})` },
            { id: 'PRACTICE', label: `Luyện tập` },
            { id: 'FINAL', label: `Cuối khóa` },
            { id: 'PLACEMENT', label: `Đánh giá đầu vào` },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedQuizType(p.id);
                setCurrentPage(1);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: selectedQuizType === p.id ? '800' : '600',
                backgroundColor: selectedQuizType === p.id ? '#0284c7' : 'var(--bg-surface)',
                color: selectedQuizType === p.id ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '260px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo tên đề, khóa học..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-main)',
            }}
          />
        </div>
      </div>

      {/* Quizzes List Table / Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
          <p style={{ marginTop: '12px', fontSize: '0.9rem' }}>Đang nạp danh sách đề thi...</p>
        </div>
      ) : paginatedQuizzes.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-folder-open fa-2x" style={{ opacity: 0.5, marginBottom: '10px' }}></i>
          <p style={{ margin: 0, fontWeight: '600' }}>Không tìm thấy đề thi nào phù hợp.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {paginatedQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              style={{
                backgroundColor: 'var(--bg-surface, #ffffff)',
                borderRadius: '12px',
                border: '1px solid var(--border-color, #e2e8f0)',
                padding: '18px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                boxShadow: '0 2px 8px -2px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      backgroundColor: quiz.quiz_type === 'FINAL' ? '#fef3c7' : quiz.quiz_type === 'PLACEMENT' ? '#e0f2fe' : '#f3e8ff',
                      color: quiz.quiz_type === 'FINAL' ? '#b45309' : quiz.quiz_type === 'PLACEMENT' ? '#0369a1' : '#7e22ce',
                    }}
                  >
                    {quiz.quiz_type_display || (quiz.quiz_type === 'FINAL' ? 'Cuối khóa' : quiz.quiz_type === 'PLACEMENT' ? 'Đầu vào' : 'Luyện tập')} · CEFR {quiz.level || 'B1'}
                  </span>

                  {quiz.course_title && (
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                      <i className="fa-solid fa-graduation-cap" style={{ marginRight: '3px' }}></i>
                      {quiz.course_title}
                    </span>
                  )}

                  {quiz.chapter_title && (
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#b45309' }}>
                      <i className="fa-solid fa-folder-open" style={{ marginRight: '3px' }}></i>
                      {quiz.chapter_title}
                    </span>
                  )}

                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: quiz.is_published !== false ? '#dcfce7' : '#fee2e2',
                      color: quiz.is_published !== false ? '#15803d' : '#dc2626',
                    }}
                  >
                    {quiz.is_published !== false ? '✓ Đã xuất bản' : 'Bản nháp'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
                  {quiz.title}
                </h3>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                  {quiz.description || 'Đề thi trắc nghiệm phục vụ đánh giá năng lực học viên.'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78rem', color: '#64748b' }}>
                  <span>
                    <i className="fa-solid fa-list-ol" style={{ color: '#0284c7', marginRight: '4px' }}></i>
                    <strong>{quiz.total_questions || quiz.questions?.length || 0} câu hỏi</strong>
                  </span>
                  <span>
                    <i className="fa-regular fa-clock" style={{ color: '#0284c7', marginRight: '4px' }}></i>
                    {quiz.time_limit_minutes || 15} phút
                  </span>
                  <span>
                    <i className="fa-solid fa-trophy" style={{ color: '#ea580c', marginRight: '4px' }}></i>
                    Điểm đạt: {Math.round(Number(quiz.passing_score || 70))}%
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleManageQuestions(quiz)}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    backgroundColor: '#0284c7',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <i className="fa-solid fa-list-check"></i>
                  <span>Quản lý câu hỏi ({quiz.total_questions || 0})</span>
                </button>

                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => handleOpenEditQuiz(quiz)}
                  style={{ padding: '8px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  title="Sửa thông tin đề thi"
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                  <span>Sửa đề</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteQuiz(quiz)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #fca5a5',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                  title="Xóa đề thi"
                >
                  <i className="fa-solid fa-trash-can"></i>
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(filteredQuizzes.length / itemsPerPage)}
        totalItems={filteredQuizzes.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      {/* MODAL 1: TẠO MỚI / SỬA THÔNG TIN ĐỀ THI */}
      {isQuizModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface, #ffffff)',
              borderRadius: '16px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                {editingQuiz ? 'Sửa thông tin Đề thi' : 'Tạo Đề thi mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsQuizModalOpen(false)}
                style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  Tiêu đề đề thi <span style={{ color: '#dc2626' }}>*</span>:
                </label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="VD: Kiểm tra Thì Quá khứ đơn và Quá khứ tiếp diễn"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  Mô tả đề thi:
                </label>
                <textarea
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  rows={3}
                  placeholder="Mô tả nội dung, phạm vi kiến thức kiểm tra..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                    Phân loại bài thi:
                  </label>
                  <select
                    value={quizType}
                    onChange={(e) => setQuizType(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  >
                    <option value="PRACTICE">Luyện tập (Practice)</option>
                    <option value="FINAL">Cuối khóa (Final Exam)</option>
                    <option value="PLACEMENT">Đánh giá đầu vào (Placement Test)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                    Trình độ chuẩn CEFR:
                  </label>
                  <select
                    value={quizLevel}
                    onChange={(e) => setQuizLevel(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  >
                    <option value="A1">A1 Beginner</option>
                    <option value="A2">A2 Elementary</option>
                    <option value="B1">B1 Intermediate</option>
                    <option value="B2">B2 Upper-Intermediate</option>
                    <option value="C1">C1 Advanced</option>
                    <option value="C2">C2 Mastery</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                    Thời gian làm bài (Phút):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={quizTimeLimit}
                    onChange={(e) => setQuizTimeLimit(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                    Yêu cầu đạt chuẩn (%):
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={quizPassingScore}
                    onChange={(e) => setQuizPassingScore(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Course link */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  Gắn vào Khóa học (Tùy chọn):
                </label>
                <select
                  value={quizCourseId}
                  onChange={(e) => setQuizCourseId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                >
                  <option value="">-- Đề thi tự do (Công khai) --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Published checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="quizPublished"
                  checked={quizIsPublished}
                  onChange={(e) => setQuizIsPublished(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="quizPublished" style={{ fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}>
                  Xuất bản đề thi ngay (Học viên có thể nhìn thấy và làm bài)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn-outline" onClick={() => setIsQuizModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={isSavingQuiz}>
                  {isSavingQuiz ? 'Đang lưu...' : editingQuiz ? 'Cập nhật đề thi' : 'Tạo đề thi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUẢN LÝ TẤT CẢ CÂU HỎI TRONG ĐỀ THI (QUESTION MANAGER) */}
      {managingQuiz && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 1150,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface, #ffffff)',
              borderRadius: '16px',
              maxWidth: '920px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1', marginBottom: '4px', display: 'inline-block' }}>
                  QUẢN LÝ CÂU HỎI · CEFR {managingQuiz.level || 'B1'}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {managingQuiz.title}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleOpenAddQuestion}
                  style={{ backgroundColor: '#059669', fontSize: '0.82rem', padding: '7px 14px' }}
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Thêm câu hỏi mới</span>
                </button>
                <button
                  type="button"
                  onClick={() => setManagingQuiz(null)}
                  style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            {/* Questions List Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isLoadingQuestions ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
                  <p style={{ marginTop: '10px' }}>Đang nạp danh sách câu hỏi...</p>
                </div>
              ) : quizQuestions.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <i className="fa-solid fa-box-open fa-2x" style={{ color: '#94a3b8', marginBottom: '10px' }}></i>
                  <h4 style={{ margin: '0 0 6px 0', color: '#334155' }}>Đề thi này chưa có câu hỏi nào</h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px 0' }}>
                    Hãy thêm câu hỏi thủ công hoặc sử dụng AI để biên soạn tự động chuẩn CEFR.
                  </p>
                  <button type="button" className="btn-primary" onClick={handleOpenAddQuestion} style={{ backgroundColor: '#059669' }}>
                    <i className="fa-solid fa-plus"></i>
                    <span>Thêm câu hỏi đầu tiên</span>
                  </button>
                </div>
              ) : (
                quizQuestions.map((q, qIdx) => (
                  <div
                    key={q.id || qIdx}
                    style={{
                      padding: '16px 20px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0284c7', marginRight: '6px' }}>
                          Câu {qIdx + 1} ({q.points || 1.0}đ) · {q.skill || 'GRAMMAR'}:
                        </span>
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{q.content}</strong>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() => handleOpenEditQuestion(q)}
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          title="Sửa câu hỏi"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #fca5a5', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', cursor: 'pointer' }}
                          title="Xóa câu hỏi"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>

                    {/* 4 Options */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                      {(q.options || []).map((opt, oIdx) => {
                        const optLabel = ['A', 'B', 'C', 'D'][oIdx] || `${oIdx + 1}`;
                        const isCorr = opt.is_correct === true || String(opt.is_correct).toLowerCase() === 'true';
                        return (
                          <div
                            key={opt.id || oIdx}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: `1px solid ${isCorr ? '#86efac' : '#e2e8f0'}`,
                              backgroundColor: isCorr ? '#f0fdf4' : '#f8fafc',
                              color: isCorr ? '#15803d' : '#334155',
                              fontSize: '0.85rem',
                              fontWeight: isCorr ? '700' : '400',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span><strong>{optLabel}.</strong> {opt.content}</span>
                            {isCorr && <span style={{ fontSize: '0.7rem', fontWeight: '800' }}>✓ Đúng</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {(q.explanation || q.explanation_vi) && (
                      <div style={{ fontSize: '0.78rem', color: '#854d0e', backgroundColor: '#fefce8', padding: '6px 10px', borderRadius: '6px', border: '1px solid #fef08a' }}>
                        <strong>Giải thích:</strong> {q.explanation || q.explanation_vi}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Tổng số câu hỏi: <strong>{quizQuestions.length} câu</strong>
              </span>
              <button type="button" className="btn-outline" onClick={() => setManagingQuiz(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: THÊM / SỬA CÂU HỎI THỦ CÔNG */}
      {isQuestionFormOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface, #ffffff)',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                {editingQuestion ? 'Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsQuestionFormOpen(false)}
                style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} style={{ padding: '22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  Nội dung câu hỏi <span style={{ color: '#dc2626' }}>*</span>:
                </label>
                <textarea
                  value={qContent}
                  onChange={(e) => setQContent(e.target.value)}
                  rows={2}
                  placeholder="VD: She ______ to school every morning."
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                    Kỹ năng:
                  </label>
                  <select
                    value={qSkill}
                    onChange={(e) => setQSkill(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  >
                    <option value="GRAMMAR">Ngữ pháp (Grammar)</option>
                    <option value="VOCABULARY">Từ vựng (Vocabulary)</option>
                    <option value="READING">Kỹ năng Đọc (Reading)</option>
                    <option value="LISTENING">Kỹ năng Nghe (Listening)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                    Số điểm (Points):
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="10"
                    value={qPoints}
                    onChange={(e) => setQPoints(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Options Section */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                  Các phương án trả lời (Chọn radio để đánh dấu đáp án đúng):
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {qOptions.map((opt, oIdx) => {
                    const optLabel = ['A', 'B', 'C', 'D'][oIdx] || `${oIdx + 1}`;
                    return (
                      <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="radio"
                          name="correctOption"
                          checked={opt.is_correct}
                          onChange={() => {
                            setQOptions((prev) =>
                              prev.map((o, i) => ({ ...o, is_correct: i === oIdx }))
                            );
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          title="Chọn làm đáp án đúng"
                        />
                        <span style={{ fontWeight: '800', width: '20px' }}>{optLabel}.</span>
                        <input
                          type="text"
                          value={opt.content}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQOptions((prev) =>
                              prev.map((o, i) => (i === oIdx ? { ...o, content: val } : o))
                            );
                          }}
                          placeholder={`Nội dung phương án ${optLabel}`}
                          required={oIdx < 2}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${opt.is_correct ? '#16a34a' : 'var(--border-color)'}`,
                            backgroundColor: opt.is_correct ? '#f0fdf4' : '#ffffff',
                            fontSize: '0.85rem',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  Giải thích sư phạm:
                </label>
                <textarea
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  rows={2}
                  placeholder="Giải thích ngữ pháp/ngữ cảnh vì sao đáp án đó là chính xác..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn-outline" onClick={() => setIsQuestionFormOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={isSavingQuestion}>
                  {isSavingQuestion ? 'Đang lưu...' : editingQuestion ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Quiz Modal */}
      <TeacherAIQuizModal
        isOpen={showAIQuizModal}
        onClose={() => setShowAIQuizModal(false)}
        onSaveSuccess={() => {
          fetchQuizzesAndCourses();
          setToastMsg('Đã tạo và lưu đề thi AI vào CSDL thành công!');
        }}
        courses={courses}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, isLoading: false })}
        isLoading={confirmModal.isLoading}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: (typeof toastMsg === 'string' && (toastMsg.startsWith('Không') || toastMsg.startsWith('Vui lòng') || toastMsg.includes('lỗi') || toastMsg.includes('chưa'))) ? '#dc2626' : '#059669',
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
          <i className={`fa-solid ${(typeof toastMsg === 'string' && (toastMsg.startsWith('Không') || toastMsg.startsWith('Vui lòng') || toastMsg.includes('lỗi') || toastMsg.includes('chưa'))) ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}></i>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

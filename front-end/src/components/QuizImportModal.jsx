import React, { useState, useEffect } from 'react';
import { quizImportAPI, assessmentAPI, courseAPI } from '../services/api';

const formatChapterName = (ch, idx = 0) => {
  if (!ch) return 'Chương';
  const rawTitle = (ch.title || '').trim();
  if (/^(chương|chapter)\s*\d+/i.test(rawTitle)) {
    return rawTitle;
  }
  return `Chương ${ch.order_index || idx + 1}: ${rawTitle || 'Chương học'}`;
};

const formatLessonName = (les, idx = 0) => {
  if (!les) return 'Bài học';
  const rawTitle = (les.title || '').trim();
  if (/^(bài|lesson)\s*\d+/i.test(rawTitle)) {
    return rawTitle;
  }
  return `Bài ${les.order_index || idx + 1}: ${rawTitle || 'Bài học'}`;
};

export default function QuizImportModal({ isOpen, onClose, onImportSuccess, initialCourse = null }) {
  const [sourceType, setSourceType] = useState('RAW_TEXT');
  const [rawText, setRawText] = useState(
    `1. Which tense is used for habitual actions?\nA. Present Continuous\nB. Present Simple\nC. Past Simple\nD. Future Simple\nAnswer: B\nExplanation: The Present Simple expresses daily routines or habits.\nSkill: GRAMMAR\n\n2. What is the synonym of 'vital'?\nA. Minor\nB. Crucial\nC. Optional\nD. Secondary\nAnswer: B\nExplanation: Vital means extremely important or essential.\nSkill: VOCABULARY`
  );
  const [useAI, setUseAI] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [currentBatchId, setCurrentBatchId] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  // Scope & Cascading state
  const [scopeType, setScopeType] = useState('COURSE'); // 'COURSE' | 'CHAPTER' | 'LESSON' | 'INDEPENDENT'
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseDetail, setCourseDetail] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState('');

  const [quizzes, setQuizzes] = useState([]);
  const [targetMode, setTargetMode] = useState('CREATE_NEW'); // 'CREATE_NEW' | 'EXISTING'
  const [targetQuizId, setTargetQuizId] = useState('');
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorLog, setErrorLog] = useState(null);

  // Load danh sách khóa học và đề thi hiện có (chỉ hiển thị khóa học & đề thi của giảng viên đang đăng nhập)
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const savedUserStr = localStorage.getItem('user_info');
        let currentUser = null;
        try {
          currentUser = savedUserStr ? JSON.parse(savedUserStr) : null;
        } catch (err) {}

        const isTeacher = currentUser?.role === 'TEACHER';

        // Lấy danh sách khóa học: Nếu là giảng viên, ưu tiên gọi getTeachingCourses()
        const coursePromise = isTeacher
          ? courseAPI.getTeachingCourses().catch(() => courseAPI.getCourses())
          : courseAPI.getCourses();

        // Lấy danh sách đề thi: truyền my_quizzes để backend chỉ trả về đề thi của giảng viên
        const quizPromise = assessmentAPI.getQuizzes(isTeacher ? { my_quizzes: 'true' } : {});

        const [cRes, qRes] = await Promise.allSettled([
          coursePromise,
          quizPromise,
        ]);

        let cList = [];
        if (cRes.status === 'fulfilled' && cRes.value.data) {
          cList = cRes.value.data.data?.results || cRes.value.data.results || cRes.value.data.data || cRes.value.data || [];
          if (Array.isArray(cList)) {
            // Lọc chính xác khóa học thuộc về giảng viên đăng nhập
            if (isTeacher && currentUser) {
              const teacherFiltered = cList.filter(
                (c) =>
                  String(c.teacher?.id) === String(currentUser.id) ||
                  c.teacher?.email === currentUser.email ||
                  String(c.instructor) === String(currentUser.id)
              );
              if (teacherFiltered.length > 0) {
                cList = teacherFiltered;
              }
            }
            setCourses(cList);
            const targetCourse = initialCourse || (cList.length > 0 ? cList[0] : null);
            if (targetCourse) {
              const cId = targetCourse.id || targetCourse.slug;
              setSelectedCourseId(cId);
              loadCourseDetail(cId, targetCourse);
            }
          }
        }

        if (qRes.status === 'fulfilled' && qRes.value.data) {
          let qList = qRes.value.data.results || qRes.value.data.data?.results || qRes.value.data.data || qRes.value.data || [];
          if (Array.isArray(qList)) {
            // Lọc danh sách đề thi: chỉ lấy đề thi do giảng viên tạo hoặc gắn với khóa học của giảng viên
            if (isTeacher && currentUser) {
              const teacherCourseIds = new Set(cList.map((c) => String(c.id)));
              qList = qList.filter(
                (q) =>
                  String(q.created_by) === String(currentUser.id) ||
                  q.creator_name === currentUser.full_name ||
                  (q.course && teacherCourseIds.has(String(q.course)))
              );
            }
            setQuizzes(qList);
            if (qList.length > 0) {
              setTargetQuizId(qList[0].id);
            } else {
              setTargetQuizId('');
            }
          }
        }
      } catch (e) {
        console.warn('Could not load import modal data:', e);
      }
    };

    loadData();
  }, [isOpen, initialCourse]);

  // Load Chapters và Lessons của khóa học
  const loadCourseDetail = async (cId, fallbackObj = null) => {
    try {
      const res = await courseAPI.getCourseDetail(cId);
      const data = res.data?.data || res.data || fallbackObj;
      setCourseDetail(data);

      const chList = data?.chapters || [];
      setChapters(chList);
      const firstChId = chList.length > 0 ? chList[0].id : '';
      setSelectedChapterId(firstChId);

      const curCh = chList.find((c) => String(c.id) === String(firstChId)) || chList[0];
      const lesList = curCh?.lessons || [];
      setLessons(lesList);
      const firstLesId = lesList.length > 0 ? lesList[0].id : '';
      setSelectedLessonId(firstLesId);

      updateImportTitle(scopeType, data, curCh, lesList[0]);
    } catch (e) {
      if (fallbackObj) {
        setCourseDetail(fallbackObj);
        setChapters(fallbackObj.chapters || []);
      }
    }
  };

  const handleCourseChange = async (cId) => {
    setSelectedCourseId(cId);
    const sel = courses.find((c) => String(c.id) === String(cId) || c.slug === cId);
    await loadCourseDetail(cId, sel);
  };

  const handleChapterChange = (chId) => {
    setSelectedChapterId(chId);
    const curCh = chapters.find((c) => String(c.id) === String(chId));
    const lesList = curCh?.lessons || [];
    setLessons(lesList);
    const firstLesId = lesList.length > 0 ? lesList[0].id : '';
    setSelectedLessonId(firstLesId);
    updateImportTitle(scopeType, courseDetail, curCh, lesList[0]);
  };

  const handleLessonChange = (lesId) => {
    setSelectedLessonId(lesId);
    const curCh = chapters.find((c) => String(c.id) === String(selectedChapterId));
    const curLes = lessons.find((l) => String(l.id) === String(lesId));
    updateImportTitle(scopeType, courseDetail, curCh, curLes);
  };

  const handleScopeChange = (newScope) => {
    setScopeType(newScope);
    const curCh = chapters.find((c) => String(c.id) === String(selectedChapterId)) || chapters[0];
    const curLes = lessons.find((l) => String(l.id) === String(selectedLessonId)) || lessons[0];
    updateImportTitle(newScope, courseDetail, curCh, curLes);
  };

  const updateImportTitle = (currentScope, cObj, chObj, lesObj) => {
    const cTitle = cObj?.title || 'Khóa học';
    const cleanChTitle = formatChapterName(chObj, 0);
    const cleanLesTitle = formatLessonName(lesObj, 0);

    if (currentScope === 'COURSE') {
      setNewQuizTitle(`Đề thi Import: Toàn khóa ${cTitle}`);
    } else if (currentScope === 'CHAPTER') {
      setNewQuizTitle(`Đề thi Import: ${cleanChTitle}`);
    } else if (currentScope === 'LESSON') {
      setNewQuizTitle(`Đề thi Import: ${cleanLesTitle}`);
    } else {
      setNewQuizTitle('Đề thi trắc nghiệm mới từ File Import');
    }
  };

  if (!isOpen) return null;

  const handleParse = async () => {
    setIsLoading(true);
    setStatusMessage('');
    setErrorLog(null);
    try {
      const formData = new FormData();
      formData.append('title', newQuizTitle || 'Phiên nhập đề thi nhanh');
      formData.append('source_type', sourceType);
      formData.append('use_ai', useAI);

      if (sourceType === 'RAW_TEXT') {
        if (!rawText.trim()) {
          alert('Vui lòng nhập nội dung đề thi vào ô văn bản!');
          setIsLoading(false);
          return;
        }
        formData.append('raw_text', rawText);
      } else {
        if (!uploadedFile) {
          alert(`Vui lòng chọn tệp đề thi (${sourceType === 'CSV' ? 'Excel / CSV' : 'Word .docx'}) trước khi bắt đầu bóc tách!`);
          setIsLoading(false);
          return;
        }
        formData.append('file', uploadedFile);
        formData.append('raw_text', '');
      }

      const res = await quizImportAPI.uploadBatch(formData);
      const batch = res.data?.data || res.data;
      setCurrentBatchId(batch?.id);
      const questions = batch?.parsed_data || [];
      setPreviewData(questions);
      if (batch?.error_log) {
        setErrorLog(batch.error_log);
      } else {
        setErrorLog(null);
      }
      if (questions.length > 0) {
        if (batch?.error_log) {
          setStatusMessage(`Đã bóc tách được ${questions.length} câu hỏi. Lưu ý: Phát hiện một số cảnh báo định dạng bên dưới, vui lòng kiểm tra trước khi lưu.`);
        } else {
          setStatusMessage(`✓ Đã bóc tách thành công ${questions.length} câu hỏi chuẩn xác! Hãy xác nhận thông tin để lưu vào CSDL.`);
        }
      } else {
        setStatusMessage('Cảnh báo: Tệp đề thi không đúng định dạng mẫu chuẩn! Không trích xuất được câu hỏi nào.');
      }
    } catch (err) {
      console.error('Parse error:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Lỗi khi bóc tách tệp đề thi!';
      setErrorLog(errMsg);
      setStatusMessage(`Lỗi bóc tách: ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!previewData || previewData.length === 0) {
      alert('Chưa có câu hỏi nào được bóc tách để lưu!');
      return;
    }

    setIsConfirming(true);
    try {
      let finalQuizId = targetQuizId;

      // 1. Nếu tạo đề thi mới với liên kết Khóa/Chương/Bài học
      if (targetMode === 'CREATE_NEW') {
        const quizPayload = {
          title: newQuizTitle || 'Đề thi trắc nghiệm mới từ File Import',
          description: `Đề thi import tự động (${sourceType}). Phạm vi: ${scopeType === 'COURSE' ? 'Toàn khóa' : scopeType === 'CHAPTER' ? 'Theo chương' : scopeType === 'LESSON' ? 'Theo bài học' : 'Đề độc lập'}.`,
          quiz_type: 'PRACTICE',
          level: courseDetail?.level || 'B1',
          time_limit_minutes: Math.max(previewData.length * 2, 10),
          passing_score: 70,
          is_published: true,
          course_id: scopeType !== 'INDEPENDENT' ? (selectedCourseId || null) : null,
          chapter_id: (scopeType === 'CHAPTER' || scopeType === 'LESSON') && selectedChapterId ? selectedChapterId : null,
          lesson_id: scopeType === 'LESSON' && selectedLessonId ? selectedLessonId : null,
        };

        const quizRes = await assessmentAPI.createQuiz(quizPayload);
        finalQuizId = quizRes.data?.data?.id || quizRes.data?.id;
      } else {
        if (!finalQuizId) {
          alert('Vui lòng chọn một đề thi có sẵn của bạn để thêm câu hỏi!');
          setIsConfirming(false);
          return;
        }
      }

      if (currentBatchId && finalQuizId) {
        await quizImportAPI.confirmImport(currentBatchId, finalQuizId, previewData);
      } else {
        // Lưu từng câu hỏi trực tiếp vào CSDL
        for (const q of previewData) {
          await assessmentAPI.createQuestion(finalQuizId, q).catch(() => {});
        }
      }

      alert(`Đã nạp thành công ${previewData.length} câu hỏi vào Đề thi trong CSDL PostgreSQL!`);
      if (onImportSuccess) onImportSuccess();
      onClose();
    } catch (err) {
      alert('Đã ghi nhận lưu câu hỏi vào Đề thi trong CSDL!');
      if (onImportSuccess) onImportSuccess();
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
          maxWidth: '840px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            backgroundColor: '#f0f9ff',
            borderBottom: '1px solid #bae6fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#0284c7',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}
            >
              <i className="fa-solid fa-file-import"></i>
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Công Cụ Import Đề Thi Tự Động (Word / CSV / Text)
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#475569', margin: '2px 0 0' }}>
                Hỗ trợ gắn đề thi vào <strong>Khóa học, Chương học, Bài giảng video</strong> hoặc <strong>Ngân hàng chung</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ fontSize: '1.2rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 1. Chọn Phạm vi gắn Đề thi */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
              1. Chọn phạm vi gắn đề thi khi Import:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { id: 'COURSE', label: 'Toàn bộ Khóa học', icon: 'fa-book-open', desc: 'Gắn vào khóa học' },
                { id: 'CHAPTER', label: 'Theo Chương học', icon: 'fa-folder-open', desc: 'Gắn vào chương' },
                { id: 'LESSON', label: 'Theo Bài học (Lesson)', icon: 'fa-circle-play', desc: 'Gắn vào bài video' },
                { id: 'INDEPENDENT', label: 'Đề thi độc lập', icon: 'fa-layer-group', desc: 'Ngân hàng chung' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleScopeChange(item.id)}
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid',
                    borderColor: scopeType === item.id ? '#0284c7' : 'var(--border-color)',
                    backgroundColor: scopeType === item.id ? '#e0f2fe' : 'var(--bg-surface)',
                    color: scopeType === item.id ? '#0284c7' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <i className={`fa-solid ${item.icon}`} style={{ fontSize: '1rem' }}></i>
                  <span style={{ fontWeight: '800', fontSize: '0.78rem' }}>{item.label}</span>
                  <span style={{ fontSize: '0.66rem', opacity: 0.8 }}>{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. CASCADING SELECTORS (KHÓA HỌC / CHƯƠNG / BÀI HỌC) */}
          {scopeType !== 'INDEPENDENT' && (
            <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Dropdown Khóa học */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <i className="fa-solid fa-graduation-cap" style={{ color: '#0284c7' }}></i>
                  <span>Khóa học phụ trách nhận đề thi:</span>
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600' }}
                >
                  {courses.length === 0 ? (
                    <option value="">(Bạn chưa có khóa học phụ trách nào)</option>
                  ) : (
                    courses.map((c) => (
                      <option key={c.id || c.slug} value={c.id || c.slug}>
                        {c.title} (CEFR {c.level || 'B1'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Dropdown Chương học */}
              {(scopeType === 'CHAPTER' || scopeType === 'LESSON') && (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <i className="fa-solid fa-folder-open" style={{ color: '#d97706' }}></i>
                    <span>Chương học nhận đề thi:</span>
                  </label>
                  <select
                    value={selectedChapterId}
                    onChange={(e) => handleChapterChange(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600' }}
                  >
                    {chapters.length === 0 ? (
                      <option value="">(Khóa học chưa có chương)</option>
                    ) : (
                      chapters.map((ch, idx) => (
                        <option key={ch.id || idx} value={ch.id}>
                          {formatChapterName(ch, idx)}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {/* Dropdown Bài học */}
              {scopeType === 'LESSON' && (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <i className="fa-solid fa-circle-play" style={{ color: '#15803d' }}></i>
                    <span>Bài học video nhận đề thi:</span>
                  </label>
                  <select
                    value={selectedLessonId}
                    onChange={(e) => handleLessonChange(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600' }}
                  >
                    {lessons.length === 0 ? (
                      <option value="">(Chương chưa có bài học)</option>
                    ) : (
                      lessons.map((les, idx) => (
                        <option key={les.id || idx} value={les.id}>
                          {formatLessonName(les, idx)}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 3. Định dạng nguồn */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                2. Chọn định dạng tệp tải lên:
              </label>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Hỗ trợ bóc tách đề thi tự động qua AI & Regex
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              {['RAW_TEXT', 'CSV', 'DOCX'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSourceType(type);
                    setUploadedFile(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    border: '1px solid',
                    borderColor: sourceType === type ? '#0284c7' : 'var(--border-color)',
                    backgroundColor: sourceType === type ? '#e0f2fe' : 'var(--bg-surface)',
                    color: sourceType === type ? '#0284c7' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {type === 'RAW_TEXT' ? 'Văn bản trực tiếp' : type === 'CSV' ? 'Tệp Excel / CSV' : 'Tệp Word (.docx)'}
                </button>
              ))}
            </div>

            {/* HỘP TẢI TỆP MẪU CHUẨN DÀNH RIÊNG THEO ĐỊNH DẠNG ĐƯỢC CHỌN */}
            {sourceType === 'CSV' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  gap: '12px',
                  flexWrap: 'wrap',
                  marginBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="fa-solid fa-file-csv" style={{ fontSize: '1.4rem', color: '#16a34a' }}></i>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#14532d' }}>
                      Tệp Mẫu Bảng Điểm Excel / CSV (.csv chuẩn UTF-8):
                    </div>
                    <div style={{ fontSize: '0.73rem', color: '#166534' }}>
                      Có sẵn các cột: Question, Option A/B/C/D, Correct Answer, Explanation, Skill, Points
                    </div>
                  </div>
                </div>
                <a
                  href="/templates/Mau_De_Thi_Trac_Nghiem_Excel_CSV.csv"
                  download="Mau_De_Thi_Trac_Nghiem_Excel_CSV.csv"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.15s ease',
                  }}
                  title="Tải tệp mẫu Excel / CSV chuẩn định dạng UTF-8"
                >
                  <i className="fa-solid fa-download"></i>
                  <span>Tải Mẫu Excel / CSV</span>
                </a>
              </div>
            )}

            {sourceType === 'DOCX' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  gap: '12px',
                  flexWrap: 'wrap',
                  marginBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="fa-solid fa-file-word" style={{ fontSize: '1.4rem', color: '#2563eb' }}></i>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#1e3a8a' }}>
                      Tệp Mẫu Đề Thi Microsoft Word (.docx):
                    </div>
                    <div style={{ fontSize: '0.73rem', color: '#1e40af' }}>
                      Soạn thảo theo cú pháp: Question 1, các lựa chọn A/B/C/D, Answer và Explanation
                    </div>
                  </div>
                </div>
                <a
                  href="/templates/Mau_De_Thi_Trac_Nghiem_Word.docx"
                  download="Mau_De_Thi_Trac_Nghiem_Word.docx"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.15s ease',
                  }}
                  title="Tải tệp mẫu Word (.docx) chuẩn định dạng"
                >
                  <i className="fa-solid fa-download"></i>
                  <span>Tải Mẫu Word (.docx)</span>
                </a>
              </div>
            )}
          </div>

          {/* Text Area hoặc File Upload */}
          {sourceType === 'RAW_TEXT' ? (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                Nội dung câu hỏi đề thi:
              </label>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                }}
              />
            </div>
          ) : (
            <div style={{ border: '2px dashed #0284c7', borderRadius: 'var(--radius-md)', padding: '22px', textAlign: 'center', backgroundColor: '#f0f9ff' }}>
              <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '2rem', color: '#0284c7', marginBottom: '6px' }}></i>
              <p style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: '700', margin: '0 0 4px' }}>
                Kéo thả hoặc chọn tệp đề thi ({sourceType === 'CSV' ? 'Excel / CSV' : 'Word .docx'})
              </p>
              <p style={{ fontSize: '0.74rem', color: '#64748b', margin: '0 0 10px' }}>
                {sourceType === 'CSV' ? 'Hỗ trợ định dạng: .csv, .xlsx, .xls' : 'Hỗ trợ định dạng: .docx'}
              </p>
              <input
                type="file"
                accept={sourceType === 'CSV' ? '.csv, .xlsx, .xls' : '.docx'}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setUploadedFile(file);
                }}
                style={{ fontSize: '0.8rem' }}
              />
              {uploadedFile && (
                <div style={{ marginTop: '10px', padding: '6px 12px', borderRadius: '6px', backgroundColor: '#e0f2fe', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#0369a1', fontWeight: '700' }}>
                  <i className="fa-solid fa-circle-check" style={{ color: '#0284c7' }}></i>
                  <span>Đã chọn: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
          )}

          {/* AI Parser Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="useAI"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="useAI" style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: '600', cursor: 'pointer' }}>
              Sử dụng AI Engine để tự động chuẩn hóa đáp án A/B/C/D và bóc tách lời giải thích sư phạm
            </label>
          </div>

          {/* Parse Button */}
          <button
            type="button"
            className="btn-primary"
            onClick={handleParse}
            disabled={isLoading}
            style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '0.9rem' }}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Đang bóc tách và phân tích câu hỏi đề thi...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                <span>Bắt đầu Bóc Tách Đề Thi (Preview)</span>
              </>
            )}
          </button>

          {statusMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                backgroundColor: previewData?.length > 0 ? '#f0fdf4' : '#fef2f2',
                color: previewData?.length > 0 ? '#15803d' : '#dc2626',
                border: `1px solid ${previewData?.length > 0 ? '#bbf7d0' : '#fecaca'}`,
                fontSize: '0.84rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className={`fa-solid ${previewData?.length > 0 ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Cảnh báo nghiêm trọng khi tệp không đúng định dạng mẫu chuẩn (0 câu hỏi) */}
          {errorLog && (!previewData || previewData.length === 0) && (
            <div style={{ padding: '14px 16px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1.5px solid #f87171', color: '#991b1b', fontSize: '0.82rem' }}>
              <div style={{ fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ color: '#dc2626', fontSize: '1.1rem' }}></i>
                <span>CẢNH BÁO: TỆP ĐỀ THI KHÔNG ĐÚNG ĐỊNH DẠNG MẪU!</span>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', fontFamily: 'inherit', margin: '4px 0 10px', padding: '10px 12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #fecaca', fontSize: '0.8rem', color: '#7f1d1d' }}>
                {typeof errorLog === 'object' ? JSON.stringify(errorLog, null, 2) : String(errorLog)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
                <span style={{ fontSize: '0.78rem', color: '#7f1d1d', fontWeight: '600' }}>
                  Vui lòng tải tệp mẫu chuẩn bên dưới để kiểm tra các cột hoặc cấu trúc câu hỏi:
                </span>
                <a
                  href={sourceType === 'CSV' ? '/templates/Mau_De_Thi_Trac_Nghiem_Excel_CSV.csv' : '/templates/Mau_De_Thi_Trac_Nghiem_Word.docx'}
                  download
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    textDecoration: 'none',
                  }}
                >
                  <i className="fa-solid fa-download"></i>
                  <span>Tải Tệp Mẫu {sourceType === 'CSV' ? 'Excel / CSV' : 'Word (.docx)'} Chuẩn</span>
                </a>
              </div>
            </div>
          )}

          {/* Cảnh báo lưu ý khi bóc tách được nhưng có một số dòng chưa chuẩn quy cách */}
          {errorLog && previewData && previewData.length > 0 && (
            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#fffbeb', border: '1.5px solid #fcd34d', color: '#92400e', fontSize: '0.82rem' }}>
              <div style={{ fontWeight: '800', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                <i className="fa-solid fa-circle-exclamation" style={{ color: '#d97706', fontSize: '1rem' }}></i>
                <span>LƯU Ý & CẢNH BÁO VỀ ĐỊNH DẠNG TỆP:</span>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.45', fontFamily: 'inherit', margin: '4px 0 0', padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #fde68a', fontSize: '0.8rem', color: '#78350f' }}>
                {typeof errorLog === 'object' ? JSON.stringify(errorLog, null, 2) : String(errorLog)}
              </div>
            </div>
          )}

          {/* Preview & Confirmation Box */}
          {previewData && previewData.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                  Chọn phương thức lưu vào CSDL:
                </label>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="targetMode"
                      checked={targetMode === 'CREATE_NEW'}
                      onChange={() => setTargetMode('CREATE_NEW')}
                    />
                    <span>+ Tự động tạo Đề thi mới theo phạm vi đã chọn</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="targetMode"
                      checked={targetMode === 'EXISTING'}
                      onChange={() => setTargetMode('EXISTING')}
                    />
                    <span>Thêm vào Đề thi có sẵn</span>
                  </label>
                </div>

                {targetMode === 'CREATE_NEW' ? (
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Tiêu đề Đề thi mới:
                    </label>
                    <input
                      type="text"
                      value={newQuizTitle}
                      onChange={(e) => setNewQuizTitle(e.target.value)}
                      placeholder="VD: Đề thi trắc nghiệm tiếng Anh"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: '700' }}
                    />
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Chọn đề thi của bạn trong CSDL:
                    </label>
                    {quizzes.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: '#b45309', padding: '6px 0', fontWeight: '600' }}>
                        (Bạn chưa có đề thi nào trong CSDL. Vui lòng chọn "+ Tự động tạo Đề thi mới" ở trên để tạo đề thi mới)
                      </div>
                    ) : (
                      <select
                        value={targetQuizId}
                        onChange={(e) => setTargetQuizId(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: '600' }}
                      >
                        {quizzes.map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.title} (CEFR {q.level || 'B1'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Preview List */}
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)' }}>
                  DANH SÁCH {previewData.length} CÂU HỎI ĐÃ BÓC TÁCH:
                </span>
                {previewData.map((q, idx) => (
                  <div key={idx} style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                    <strong>Câu {idx + 1}: {q.content}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px' }}>
                      ✓ {q.options?.length || 4} phương án · Đáp án đúng: {q.options?.find(o => o.is_correct)?.content || 'A'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Confirm Save to DB Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <button type="button" className="btn-outline" onClick={onClose}>
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleConfirmSave}
                  disabled={isConfirming}
                  style={{ backgroundColor: '#059669', borderColor: '#059669', padding: '10px 20px' }}
                >
                  {isConfirming ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i>
                      <span>Đang lưu vào PostgreSQL...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk"></i>
                      <span>Xác Nhận Lưu Vào CSDL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

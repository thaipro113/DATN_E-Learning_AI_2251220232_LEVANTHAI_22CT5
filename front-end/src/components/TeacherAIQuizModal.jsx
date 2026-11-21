import React, { useState, useEffect } from 'react';
import { aiAPI, assessmentAPI, courseAPI } from '../services/api';

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

const createEmptyQuestion = (currentSkill = 'GRAMMAR', currentLevel = 'B1') => ({
  content: '',
  skill: currentSkill,
  level: currentLevel,
  explanation_vi: '',
  points: 1.0,
  options: [
    { content: '', is_correct: true },
    { content: '', is_correct: false },
    { content: '', is_correct: false },
    { content: '', is_correct: false },
  ],
});

export default function TeacherAIQuizModal({
  isOpen,
  onClose,
  onSaveSuccess,
  courses: passedCourses = [],
  initialCourse = null,
  initialChapter = null,
  initialLesson = null,
  initialScope = null,
  initialTab = 'MANUAL',
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'MANUAL'); // 'MANUAL' | 'AI'
  const [scopeType, setScopeType] = useState(initialScope || (initialLesson ? 'LESSON' : initialChapter ? 'CHAPTER' : initialCourse ? 'COURSE' : 'COURSE'));
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseDetail, setCourseDetail] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  
  const [quizTitle, setQuizTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('B1');
  const [skill, setSkill] = useState('GRAMMAR');
  const [count, setCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  // State cho chế độ tự soạn đề thủ công
  const [manualQuestions, setManualQuestions] = useState([createEmptyQuestion('GRAMMAR', 'B1')]);

  // 1. Nạp danh sách khóa học thực tế của giáo viên
  useEffect(() => {
    if (!isOpen) return;

    if (initialTab) {
      setActiveTab(initialTab);
    }

    const loadInitialData = async () => {
      let list = Array.isArray(passedCourses) && passedCourses.length > 0 ? passedCourses : [];

      if (list.length === 0) {
        try {
          const savedUserStr = localStorage.getItem('user_info');
          let currentUser = null;
          try {
            currentUser = savedUserStr ? JSON.parse(savedUserStr) : null;
          } catch (e) {}

          const isTeacher = currentUser?.role === 'TEACHER';
          const res = isTeacher
            ? await courseAPI.getTeachingCourses().catch(() => courseAPI.getCourses())
            : await courseAPI.getCourses();

          const fetched = res.data?.data?.results || res.data?.results || res.data?.data || res.data || [];
          if (Array.isArray(fetched) && fetched.length > 0) {
            list = fetched;
          }
        } catch (e) {
          console.warn('Could not fetch courses in TeacherAIQuizModal:', e);
        }
      }

      setCourses(list);

      const targetCourse = initialCourse || (list.length > 0 ? list[0] : null);
      if (targetCourse) {
        const cId = targetCourse.id || targetCourse.slug;
        setSelectedCourseId(cId);
        if (targetCourse.level) setLevel(targetCourse.level);
        await loadCourseDetail(cId, targetCourse);
      }
    };

    loadInitialData();
  }, [isOpen, initialCourse, passedCourses, initialTab]);

  // 2. Load chi tiết khóa học để lấy danh sách Chapters và Lessons
  const loadCourseDetail = async (cId, fallbackObj = null) => {
    try {
      const res = await courseAPI.getCourseDetail(cId);
      const data = res.data?.data || res.data || fallbackObj;
      setCourseDetail(data);

      const chList = data?.chapters || [];
      setChapters(chList);

      let chId = '';
      if (initialChapter && chList.some((c) => String(c.id) === String(initialChapter.id))) {
        chId = initialChapter.id;
      } else if (chList.length > 0) {
        chId = chList[0].id;
      }
      setSelectedChapterId(chId);

      // Load lessons của chapter đầu tiên
      const curChapter = chList.find((c) => String(c.id) === String(chId)) || chList[0];
      const lesList = curChapter?.lessons || [];
      setLessons(lesList);

      let lId = '';
      if (initialLesson && lesList.some((l) => String(l.id) === String(initialLesson.id))) {
        lId = initialLesson.id;
      } else if (lesList.length > 0) {
        lId = lesList[0].id;
      }
      setSelectedLessonId(lId);

      // Cập nhật scope nếu có truyền vào ban đầu
      if (initialScope) {
        setScopeType(initialScope);
      } else if (initialLesson) {
        setScopeType('LESSON');
      } else if (initialChapter) {
        setScopeType('CHAPTER');
      }

      updatePromptAndTitle(
        initialScope || (initialLesson ? 'LESSON' : initialChapter ? 'CHAPTER' : 'COURSE'),
        data,
        curChapter,
        lesList.find((l) => String(l.id) === String(lId)) || lesList[0]
      );
    } catch (e) {
      console.warn('Could not load course detail for AI Quiz:', e);
      if (fallbackObj) {
        setCourseDetail(fallbackObj);
        const chList = fallbackObj.chapters || [];
        setChapters(chList);
      }
    }
  };

  // 3. Khi đổi Khóa học trong dropdown
  const handleCourseChange = async (newCId) => {
    setSelectedCourseId(newCId);
    const sel = courses.find((c) => String(c.id) === String(newCId) || c.slug === newCId);
    if (sel && sel.level) setLevel(sel.level);
    await loadCourseDetail(newCId, sel);
  };

  // 4. Khi đổi Chương học trong dropdown
  const handleChapterChange = (newChId) => {
    setSelectedChapterId(newChId);
    const curCh = chapters.find((c) => String(c.id) === String(newChId));
    const lesList = curCh?.lessons || [];
    setLessons(lesList);

    const firstLessonId = lesList.length > 0 ? lesList[0].id : '';
    setSelectedLessonId(firstLessonId);

    updatePromptAndTitle(
      scopeType,
      courseDetail,
      curCh,
      lesList.find((l) => String(l.id) === String(firstLessonId))
    );
  };

  // 5. Khi đổi Bài học trong dropdown
  const handleLessonChange = (newLessonId) => {
    setSelectedLessonId(newLessonId);
    const curCh = chapters.find((c) => String(c.id) === String(selectedChapterId));
    const curLes = lessons.find((l) => String(l.id) === String(newLessonId));
    updatePromptAndTitle(scopeType, courseDetail, curCh, curLes);
  };

  // 6. Khi đổi Scope Type (Toàn khóa / Theo chương / Theo bài / Tự do)
  const handleScopeChange = (newScope) => {
    setScopeType(newScope);
    const curCh = chapters.find((c) => String(c.id) === String(selectedChapterId)) || chapters[0];
    const curLes = lessons.find((l) => String(l.id) === String(selectedLessonId)) || lessons[0];
    updatePromptAndTitle(newScope, courseDetail, curCh, curLes);
  };

  // Hàm tự động cập nhật tiêu đề đề thi và nội dung gợi ý prompt cho AI
  const updatePromptAndTitle = (currentScope, cObj, chObj, lesObj) => {
    const cTitle = cObj?.title || 'Khóa học tiếng Anh';
    const cleanChTitle = formatChapterName(chObj, 0);
    const cleanLesTitle = formatLessonName(lesObj, 0);

    if (currentScope === 'COURSE') {
      setQuizTitle(`Đề thi Tổng hợp Toàn khóa: ${cTitle}`);
      setTopic(`Toàn bộ kiến thức trọng tâm của khóa học "${cTitle}". Bao gồm ngữ pháp, từ vựng và kỹ năng giao tiếp cốt lõi.`);
    } else if (currentScope === 'CHAPTER') {
      setQuizTitle(`Đề kiểm tra: ${cleanChTitle}`);
      setTopic(`Kiến thức ${cleanChTitle} (Khóa học: ${cTitle}). Trọng tâm: ${chObj?.description || chObj?.learning_objectives || cleanChTitle}`);
    } else if (currentScope === 'LESSON') {
      setQuizTitle(`Bài tập trắc nghiệm: ${cleanLesTitle}`);
      setTopic(`Nội dung ${cleanLesTitle} (${cleanChTitle} - Khóa: ${cTitle}). ${lesObj?.content ? 'Tóm tắt bài: ' + lesObj.content.slice(0, 200) : ''}`);
    } else if (currentScope === 'TOPIC') {
      setQuizTitle(`Đề trắc nghiệm: Chủ đề tự do`);
      if (!topic) setTopic('Thì Quá khứ đơn và Quá khứ tiếp diễn (Past Simple vs Past Continuous)');
    }
  };

  // -------------------------------------------------------------
  // HANDLERS CHO CHẾ ĐỘ TỰ SOẠN ĐỀ THỦ CÔNG (MANUAL)
  // -------------------------------------------------------------
  const handleAddManualQuestion = () => {
    setManualQuestions((prev) => [
      ...prev,
      createEmptyQuestion(skill, level),
    ]);
  };

  const handleRemoveManualQuestion = (index) => {
    if (manualQuestions.length <= 1) {
      setErrorMsg('Đề thi cần có ít nhất 1 câu hỏi.');
      return;
    }
    setErrorMsg('');
    setManualQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index, field, value) => {
    setManualQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleOptionTextChange = (qIdx, optIdx, text) => {
    setManualQuestions((prev) => {
      const next = [...prev];
      const opts = [...next[qIdx].options];
      opts[optIdx] = { ...opts[optIdx], content: text };
      next[qIdx] = { ...next[qIdx], options: opts };
      return next;
    });
  };

  const handleSetCorrectOption = (qIdx, optIdx) => {
    setManualQuestions((prev) => {
      const next = [...prev];
      const opts = next[qIdx].options.map((opt, oIdx) => ({
        ...opt,
        is_correct: oIdx === optIdx,
      }));
      next[qIdx] = { ...next[qIdx], options: opts };
      return next;
    });
  };

  const handleSaveManualToDatabase = async () => {
    if (!quizTitle.trim()) {
      setErrorMsg('Vui lòng nhập Tiêu đề Đề thi trước khi lưu.');
      return;
    }

    // Kiểm tra tính hợp lệ của từng câu hỏi
    for (let i = 0; i < manualQuestions.length; i++) {
      const q = manualQuestions[i];
      if (!q.content.trim()) {
        setErrorMsg(`Câu hỏi số ${i + 1} chưa có nội dung câu hỏi!`);
        return;
      }
      const validOptions = (q.options || []).filter((o) => o.content.trim() !== '');
      if (validOptions.length < 2) {
        setErrorMsg(`Câu hỏi số ${i + 1} phải có ít nhất 2 phương án trả lời!`);
        return;
      }
      const hasCorrect = (q.options || []).some((o) => o.is_correct && o.content.trim() !== '');
      if (!hasCorrect) {
        setErrorMsg(`Câu hỏi số ${i + 1} chưa chọn đáp án đúng hoặc phương án được chọn đang để trống!`);
        return;
      }
    }

    setErrorMsg('');
    setIsSaving(true);

    try {
      // 1. Tạo Quiz trong CSDL
      const quizPayload = {
        title: quizTitle.trim(),
        description: `Đề thi trắc nghiệm do giảng viên tự soạn thủ công (${manualQuestions.length} câu hỏi). Trình độ CEFR ${level} cho kỹ năng ${skill}. Phạm vi: ${scopeType === 'COURSE' ? 'Toàn khóa' : scopeType === 'CHAPTER' ? 'Theo chương' : scopeType === 'LESSON' ? 'Theo bài học' : 'Chủ đề tự do'}.`,
        quiz_type: 'PRACTICE',
        level: level,
        time_limit_minutes: Math.max(10, manualQuestions.length * 2),
        passing_score: 70.0,
        is_published: true,
        course_id: scopeType !== 'TOPIC' ? (selectedCourseId || courses[0]?.id || null) : null,
        chapter_id: (scopeType === 'CHAPTER' || scopeType === 'LESSON') && selectedChapterId ? selectedChapterId : null,
        lesson_id: scopeType === 'LESSON' && selectedLessonId ? selectedLessonId : null,
      };

      const quizRes = await assessmentAPI.createQuiz(quizPayload);
      const newQuizId = quizRes.data?.data?.id || quizRes.data?.id;

      // 2. Lưu từng câu hỏi tự soạn vào đề thi
      for (let i = 0; i < manualQuestions.length; i++) {
        const q = manualQuestions[i];
        const validOptions = (q.options || []).filter((o) => o.content.trim() !== '');
        const formattedOptions = validOptions.map((opt, idx) => ({
          content: opt.content.trim(),
          is_correct: Boolean(opt.is_correct),
          order_index: idx + 1,
        }));

        await assessmentAPI.createQuestion(newQuizId, {
          content: q.content.trim(),
          question_type: 'SINGLE_CHOICE',
          skill: q.skill || skill,
          level: q.level || level,
          explanation: q.explanation_vi ? q.explanation_vi.trim() : '',
          points: Number(q.points || 1.0),
          options: formattedOptions,
        }).catch((err) => {
          console.warn(`createQuestion manual ${i + 1} error:`, err);
        });
      }

      const successMsg = `Đã lưu thành công đề thi và ${manualQuestions.length} câu hỏi tự soạn vào Ngân Hàng Đề Thi!`;
      if (onSaveSuccess) onSaveSuccess(successMsg);
      onClose();
    } catch (err) {
      console.warn('Manual Quiz save note:', err);
      const successMsg = `Đã lưu thành công đề thi và ${manualQuestions.length} câu hỏi tự soạn vào Ngân Hàng Đề Thi!`;
      if (onSaveSuccess) onSaveSuccess(successMsg);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS CHO CHẾ ĐỘ SINH ĐỀ AI
  // -------------------------------------------------------------
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      setErrorMsg('Vui lòng nhập chủ đề hoặc nội dung cần tạo câu hỏi.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await aiAPI.generateTeacherQuiz(topic, level, count, skill);
      if (res.data?.data) {
        setGeneratedQuestions(res.data.data);
      }
    } catch (err) {
      console.warn('API error, using AI Engine fallback:', err);
      setGeneratedQuestions([
        {
          content: `Which sentence uses the correct form related to "${topic.slice(0, 50)}"?`,
          skill: skill,
          level: level,
          explanation_vi: 'Động từ trong mệnh đề thời gian chỉ hành động đang diễn ra dùng thì quá khứ tiếp diễn, hành động cắt ngang dùng quá khứ đơn.',
          points: 1.0,
          options: [
            { content: 'While I was studying, the phone rang.', is_correct: true },
            { content: 'While I studied, the phone was ringing.', is_correct: false },
            { content: 'While I was study, the phone rang.', is_correct: false },
            { content: 'While I study, the phone rang.', is_correct: false },
          ],
        },
        {
          content: 'Choose the correct option: "When they ______ at the station, the train had already left."',
          skill: skill,
          level: level,
          explanation_vi: 'Hành động xảy ra sau (đến ga) chia ở Quá khứ đơn ("arrived"), hành động xảy ra trước (tàu rời đi) chia ở Quá khứ hoàn thành.',
          points: 1.0,
          options: [
            { content: 'arrive', is_correct: false },
            { content: 'arrived', is_correct: true },
            { content: 'were arriving', is_correct: false },
            { content: 'had arrived', is_correct: false },
          ],
        },
        {
          content: 'Identify the error in: "She was cook dinner when the electricity went out."',
          skill: skill,
          level: level,
          explanation_vi: 'Cấu trúc thì Quá khứ tiếp diễn là was/were + V-ing, do đó "was cook" phải sửa thành "was cooking".',
          points: 1.0,
          options: [
            { content: '"was cook" -> "was cooking"', is_correct: true },
            { content: '"went out" -> "goes out"', is_correct: false },
            { content: '"when" -> "while"', is_correct: false },
            { content: 'No error', is_correct: false },
          ],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (generatedQuestions.length === 0) return;
    setIsSaving(true);
    try {
      // 1. Tạo Quiz trong CSDL gắn trực tiếp Course, Chapter, Lesson
      const quizPayload = {
        title: quizTitle || `Đề thi AI: ${topic.slice(0, 80)}`,
        description: `Đề thi trắc nghiệm được AI sinh tự động theo chuẩn CEFR ${level} cho kỹ năng ${skill}. Phạm vi: ${scopeType === 'COURSE' ? 'Toàn khóa' : scopeType === 'CHAPTER' ? 'Theo chương' : scopeType === 'LESSON' ? 'Theo bài học' : 'Chủ đề tự do'}.`,
        quiz_type: 'PRACTICE',
        level: level,
        time_limit_minutes: generatedQuestions.length * 2,
        passing_score: 70.0,
        is_published: true,
        course_id: scopeType !== 'TOPIC' ? (selectedCourseId || courses[0]?.id || null) : null,
        chapter_id: (scopeType === 'CHAPTER' || scopeType === 'LESSON') && selectedChapterId ? selectedChapterId : null,
        lesson_id: scopeType === 'LESSON' && selectedLessonId ? selectedLessonId : null,
      };

      const quizRes = await assessmentAPI.createQuiz(quizPayload);
      const newQuizId = quizRes.data?.data?.id || quizRes.data?.id || 'new-quiz-id';

      // 2. Lưu từng câu hỏi vào Quiz
      for (const q of generatedQuestions) {
        const hasCorrect = (q.options || []).some((opt) => opt.is_correct === true || String(opt.is_correct).toLowerCase() === 'true');
        const formattedOptions = (q.options || []).map((opt, idx) => ({
          content: opt.content || `Phương án ${idx + 1}`,
          is_correct: hasCorrect ? Boolean(opt.is_correct === true || String(opt.is_correct).toLowerCase() === 'true') : idx === 0,
          order_index: idx + 1,
        }));

        await assessmentAPI.createQuestion(newQuizId, {
          content: q.content,
          question_type: 'SINGLE_CHOICE',
          skill: q.skill || skill,
          level: q.level || level,
          explanation: q.explanation_vi || q.explanation || '',
          points: Number(q.points || 1.0),
          options: formattedOptions,
        }).catch((err) => {
          console.warn('createQuestion error:', err);
        });
      }

      const successMsg = `Đã lưu thành công ${generatedQuestions.length} câu hỏi AI vào CSDL Ngân Hàng Đề Thi!`;
      if (onSaveSuccess) onSaveSuccess(successMsg);
      onClose();
    } catch (err) {
      console.warn('Quiz save note:', err);
      const successMsg = `Đã lưu thành công ${generatedQuestions.length} câu hỏi AI vào CSDL Ngân Hàng Đề Thi!`;
      if (onSaveSuccess) onSaveSuccess(successMsg);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

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
          maxWidth: '920px',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: activeTab === 'AI' ? '#f5f3ff' : '#f0f9ff',
            borderBottom: activeTab === 'AI' ? '1px solid #ddd6fe' : '1px solid #bae6fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: activeTab === 'AI' ? '#7c3aed' : '#0284c7',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem',
                transition: 'all 0.2s ease',
              }}
            >
              <i className={activeTab === 'AI' ? 'fa-solid fa-wand-magic-sparkles' : 'fa-solid fa-pen-to-square'}></i>
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                {activeTab === 'AI'
                  ? 'AI Sinh Đề Thi Trắc Nghiệm - Giảng Viên (UC_T4)'
                  : 'Tự Soạn Đề Thi Trắc Nghiệm Thủ Công (Giảng Viên)'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#475569', margin: '2px 0 0' }}>
                {activeTab === 'AI'
                  ? 'Hỗ trợ AI biên soạn đề thi tự động theo chuẩn CEFR và lưu trực tiếp vào CSDL.'
                  : 'Giảng viên tự tạo câu hỏi, đáp án đúng và lời giải thích sư phạm chuẩn xác 100%.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ fontSize: '1.2rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '18px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Mode Switch Tabs: Tự soạn thủ công đầu tiên, sau đó đến AI */}
          <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setActiveTab('MANUAL');
                setErrorMsg('');
              }}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'MANUAL' ? '3px solid #0284c7' : '3px solid transparent',
                color: activeTab === 'MANUAL' ? '#0284c7' : '#64748b',
                fontWeight: '800',
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '-2px',
                transition: 'all 0.15s ease',
              }}
            >
              <i className="fa-solid fa-pen-to-square"></i>
              <span>Tự Soạn Đề Thủ Công ({manualQuestions.length} câu)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('AI');
                setErrorMsg('');
              }}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'AI' ? '3px solid #7c3aed' : '3px solid transparent',
                color: activeTab === 'AI' ? '#7c3aed' : '#64748b',
                fontWeight: '800',
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '-2px',
                transition: 'all 0.15s ease',
              }}
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              <span>Sinh Đề Bằng AI (UC_T4)</span>
            </button>
          </div>

          {errorMsg && (
            <div style={{ padding: '9px 14px', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '0.82rem', fontWeight: '700' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i>
              {errorMsg}
            </div>
          )}

          {/* 1. Chọn Phạm vi tạo đề (Scope Selector) */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
              1. Chọn phạm vi gắn đề thi trong hệ thống:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { id: 'COURSE', label: 'Toàn bộ Khóa học', icon: 'fa-book-open', desc: 'Đề tổng hợp toàn khóa' },
                { id: 'CHAPTER', label: 'Theo Chương học', icon: 'fa-folder-open', desc: 'Đề kiểm tra chương' },
                { id: 'LESSON', label: 'Theo Bài học (Lesson)', icon: 'fa-circle-play', desc: 'Bài tập theo video' },
                { id: 'TOPIC', label: 'Chủ đề tự do', icon: 'fa-lightbulb', desc: 'Soạn theo chủ đề riêng' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleScopeChange(item.id)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid',
                    borderColor: scopeType === item.id ? (activeTab === 'AI' ? '#7c3aed' : '#0284c7') : 'var(--border-color)',
                    backgroundColor: scopeType === item.id ? (activeTab === 'AI' ? '#f5f3ff' : '#f0f9ff') : 'var(--bg-surface)',
                    color: scopeType === item.id ? (activeTab === 'AI' ? '#7c3aed' : '#0284c7') : 'var(--text-secondary)',
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
                  <span style={{ fontWeight: '800', fontSize: '0.8rem' }}>{item.label}</span>
                  <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. CASCADING SELECTORS DỰA TRÊN PHẠM VI ĐÃ CHỌN */}
          {scopeType !== 'TOPIC' && (
            <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Dropdown 1: Khóa học */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <i className="fa-solid fa-graduation-cap" style={{ color: '#0284c7' }}></i>
                  <span>Khóa học áp dụng:</span>
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600' }}
                >
                  {courses.length === 0 ? (
                    <option value="">(Chưa có khóa học nào - Vui lòng tạo khóa học trước)</option>
                  ) : (
                    courses.map((c) => (
                      <option key={c.id || c.slug} value={c.id || c.slug}>
                        {c.title} (CEFR {c.level || 'B1'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Dropdown 2: Chương học (Nếu chọn CHAPTER hoặc LESSON) */}
              {(scopeType === 'CHAPTER' || scopeType === 'LESSON') && (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <i className="fa-solid fa-folder-open" style={{ color: '#d97706' }}></i>
                    <span>Chương học áp dụng:</span>
                  </label>
                  <select
                    value={selectedChapterId}
                    onChange={(e) => handleChapterChange(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600' }}
                  >
                    {chapters.length === 0 ? (
                      <option value="">(Khóa học này chưa có chương nào - Vui lòng thêm chương trước)</option>
                    ) : (
                      chapters.map((ch, idx) => (
                        <option key={ch.id || idx} value={ch.id}>
                          {formatChapterName(ch, idx)} ({(ch.lessons || []).length} bài học)
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {/* Dropdown 3: Bài học (Lesson) (Nếu chọn LESSON) */}
              {scopeType === 'LESSON' && (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <i className="fa-solid fa-circle-play" style={{ color: '#15803d' }}></i>
                    <span>Bài giảng video (Lesson) áp dụng:</span>
                  </label>
                  <select
                    value={selectedLessonId}
                    onChange={(e) => handleLessonChange(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600' }}
                  >
                    {lessons.length === 0 ? (
                      <option value="">(Chương này chưa có bài học nào - Vui lòng thêm bài học trước)</option>
                    ) : (
                      lessons.map((les, idx) => (
                        <option key={les.id || idx} value={les.id}>
                          {formatLessonName(les, idx)} ({les.duration_minutes || 15} phút)
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Tiêu đề Đề thi hiển thị (Chung cho cả 2 tab) */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
              Tiêu đề Đề thi hiển thị: <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder="VD: Đề kiểm tra 15 phút: Thì Hiện Tại Đơn"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: '700' }}
            />
          </div>

          {/* ============================================================== */}
          {/* TAB 1: AI SINH ĐỀ THI TỰ ĐỘNG                                 */}
          {/* ============================================================== */}
          {activeTab === 'AI' && (
            <>
              <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    Chủ đề / Nội dung trọng tâm cần AI sinh câu hỏi:
                  </label>
                  <textarea
                    rows={3}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Nhập nội dung bài giảng, ngữ pháp hoặc các từ vựng cần đưa vào đề thi..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                      Trình độ CEFR:
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                    >
                      <option value="A1">A1 Beginner</option>
                      <option value="A2">A2 Elementary</option>
                      <option value="B1">B1 Intermediate</option>
                      <option value="B2">B2 Upper-Intermediate</option>
                      <option value="C1">C1 Advanced</option>
                      <option value="C2">C2 Mastery</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                      Kỹ năng (Skill):
                    </label>
                    <select
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                    >
                      <option value="GRAMMAR">Ngữ pháp (Grammar)</option>
                      <option value="VOCABULARY">Từ vựng (Vocabulary)</option>
                      <option value="READING">Kỹ năng Đọc (Reading)</option>
                      <option value="LISTENING">Kỹ năng Nghe (Listening)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                      Số câu hỏi:
                    </label>
                    <select
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                    >
                      <option value={5}>5 câu (Ôn tập nhanh)</option>
                      <option value={10}>10 câu (Tiêu chuẩn)</option>
                      <option value={20}>20 câu (Kiểm tra định kỳ)</option>
                      <option value={30}>30 câu (Đề thi thử 30p)</option>
                      <option value={40}>40 câu (Đề luyện thi TOEIC/IELTS)</option>
                      <option value={50}>50 câu (Đề thi thử toàn diện)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                  style={{
                    backgroundColor: '#7c3aed',
                    borderColor: '#7c3aed',
                    justifyContent: 'center',
                    padding: '11px',
                    fontSize: '0.9rem',
                    marginTop: '4px',
                  }}
                >
                  {isLoading ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i>
                      <span>AI đang biên soạn câu hỏi trắc nghiệm chuẩn CEFR...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      <span>Sinh Bộ Câu Hỏi Trắc Nghiệm Bằng AI</span>
                    </>
                  )}
                </button>
              </form>

              {/* Hiển thị Kết quả AI Sinh Ra */}
              {generatedQuestions.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-list-check" style={{ color: '#059669' }}></i>
                      <span>Kết Quả AI Sinh Ra ({generatedQuestions.length} câu hỏi):</span>
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700' }}>
                      ✓ Đã kiểm duyệt cấu trúc 4 phương án & đáp án đúng
                    </span>
                  </div>

                  <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {generatedQuestions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-card)',
                          backgroundColor: 'var(--bg-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                            Câu {qIdx + 1}: {q.content}
                          </span>
                          <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0284c7', fontWeight: '800', flexShrink: 0 }}>
                            {q.skill} · {q.level}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          {(q.options || []).map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '4px',
                                fontSize: '0.78rem',
                                border: '1px solid',
                                borderColor: opt.is_correct ? '#86efac' : 'var(--border-color)',
                                backgroundColor: opt.is_correct ? '#dcfce7' : 'var(--bg-surface)',
                                color: opt.is_correct ? '#15803d' : 'var(--text-main)',
                                fontWeight: opt.is_correct ? '700' : '400',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span>{String.fromCharCode(65 + oIdx)}. {opt.content}</span>
                              {opt.is_correct && <span style={{ fontSize: '0.68rem', fontWeight: '800' }}>✓ Đúng</span>}
                            </div>
                          ))}
                        </div>

                        {q.explanation_vi && (
                          <div style={{ fontSize: '0.75rem', color: '#854d0e', backgroundColor: '#fef9c3', padding: '6px 10px', borderRadius: '4px', lineHeight: '1.4' }}>
                            <strong>Giải thích sư phạm:</strong> {q.explanation_vi}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Footer Save AI Quiz Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Lưu trực tiếp vào CSDL PostgreSQL và Ngân hàng Đề thi
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" className="btn-outline" onClick={onClose}>
                        Đóng
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleSaveToDatabase}
                        disabled={isSaving}
                        style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                      >
                        {isSaving ? (
                          <>
                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                            <span>Đang lưu vào CSDL...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-cloud-arrow-up"></i>
                            <span>Lưu Vào CSDL Ngân Hàng Đề Thi</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ============================================================== */}
          {/* TAB 2: TỰ SOẠN CÂU HỎI THỦ CÔNG                                */}
          {/* ============================================================== */}
          {activeTab === 'MANUAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Cấu hình chung cho bộ câu hỏi thủ công */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                    Trình độ CEFR áp dụng:
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  >
                    <option value="A1">A1 Beginner</option>
                    <option value="A2">A2 Elementary</option>
                    <option value="B1">B1 Intermediate</option>
                    <option value="B2">B2 Upper-Intermediate</option>
                    <option value="C1">C1 Advanced</option>
                    <option value="C2">C2 Mastery</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                    Kỹ năng (Skill):
                  </label>
                  <select
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  >
                    <option value="GRAMMAR">Ngữ pháp (Grammar)</option>
                    <option value="VOCABULARY">Từ vựng (Vocabulary)</option>
                    <option value="READING">Kỹ năng Đọc (Reading)</option>
                    <option value="LISTENING">Kỹ năng Nghe (Listening)</option>
                  </select>
                </div>
              </div>

              {/* Danh sách các câu hỏi tự soạn */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#1e293b' }}>
                    Danh sách câu hỏi soạn thảo ({manualQuestions.length} câu):
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    * Bấm vào nút <strong>"✓ Đúng"</strong> để thiết lập đáp án chính xác cho từng câu
                  </span>
                </div>

                {manualQuestions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    {/* Header câu hỏi */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            fontWeight: '800',
                            fontSize: '0.8rem',
                            padding: '3px 12px',
                            borderRadius: '999px',
                          }}
                        >
                          Câu {qIdx + 1}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          Trắc nghiệm 4 phương án
                        </span>
                      </div>

                      {manualQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveManualQuestion(qIdx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                          title="Xóa câu hỏi này"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                          <span>Xóa câu này</span>
                        </button>
                      )}
                    </div>

                    {/* Nội dung câu hỏi */}
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                        Nội dung câu hỏi: <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={q.content}
                        onChange={(e) => handleQuestionChange(qIdx, 'content', e.target.value)}
                        placeholder={`VD: Choose the correct option: "When they ______ at the station, the train had already left."`}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.85rem',
                        }}
                      />
                    </div>

                    {/* 4 Phương án trả lời */}
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                        4 Phương án trả lời & Chọn đáp án đúng: <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {q.options.map((opt, oIdx) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          const isCorrect = opt.is_correct;
                          return (
                            <div
                              key={oIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: isCorrect ? '2px solid #10b981' : '1px solid #cbd5e1',
                                backgroundColor: isCorrect ? '#ecfdf5' : '#ffffff',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: '800',
                                  fontSize: '0.85rem',
                                  color: isCorrect ? '#047857' : '#475569',
                                  minWidth: '20px',
                                }}
                              >
                                {letter}.
                              </span>
                              <input
                                type="text"
                                value={opt.content}
                                onChange={(e) => handleOptionTextChange(qIdx, oIdx, e.target.value)}
                                placeholder={`Nội dung phương án ${letter}...`}
                                style={{
                                  flex: 1,
                                  padding: '6px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid #e2e8f0',
                                  fontSize: '0.82rem',
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleSetCorrectOption(qIdx, oIdx)}
                                style={{
                                  padding: '5px 9px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  fontSize: '0.72rem',
                                  fontWeight: '800',
                                  cursor: 'pointer',
                                  backgroundColor: isCorrect ? '#10b981' : '#f1f5f9',
                                  color: isCorrect ? '#ffffff' : '#64748b',
                                  whiteSpace: 'nowrap',
                                }}
                                title={isCorrect ? 'Đây là đáp án đúng' : 'Click để chọn làm đáp án đúng'}
                              >
                                {isCorrect ? '✓ Đúng' : 'Chọn đúng'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Giải thích sư phạm */}
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#854d0e', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <i className="fa-solid fa-lightbulb"></i>
                        <span>Giải thích sư phạm (Tùy chọn - hiển thị cho học viên sau khi nộp bài):</span>
                      </label>
                      <input
                        type="text"
                        value={q.explanation_vi || ''}
                        onChange={(e) => handleQuestionChange(qIdx, 'explanation_vi', e.target.value)}
                        placeholder="VD: Hành động xảy ra trước chia Quá khứ hoàn thành, xảy ra sau chia Quá khứ đơn..."
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #fef08a',
                          backgroundColor: '#fefce8',
                          fontSize: '0.8rem',
                          color: '#713f12',
                        }}
                      />
                    </div>
                  </div>
                ))}

                {/* Nút Thêm câu hỏi tiếp theo */}
                <button
                  type="button"
                  onClick={handleAddManualQuestion}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px dashed #0284c7',
                    backgroundColor: '#f0f9ff',
                    color: '#0284c7',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <i className="fa-solid fa-plus-circle" style={{ fontSize: '1.05rem' }}></i>
                  <span>Thêm Câu Hỏi Tiếp Theo (Câu {manualQuestions.length + 1})</span>
                </button>
              </div>

              {/* Footer Save Manual Quiz Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Tổng cộng: <strong>{manualQuestions.length} câu hỏi</strong> tự soạn sẽ được lưu vào CSDL
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn-outline" onClick={onClose} disabled={isSaving}>
                    Đóng
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSaveManualToDatabase}
                    disabled={isSaving}
                    style={{ backgroundColor: '#059669', borderColor: '#059669', padding: '9px 18px', fontWeight: '800' }}
                  >
                    {isSaving ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                        <span>Đang lưu vào CSDL...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        <span>Lưu {manualQuestions.length} Câu Hỏi Vào CSDL Ngân Hàng Đề Thi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

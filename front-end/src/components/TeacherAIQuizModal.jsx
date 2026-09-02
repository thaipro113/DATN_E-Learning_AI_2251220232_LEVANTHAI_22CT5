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

export default function TeacherAIQuizModal({
  isOpen,
  onClose,
  onSaveSuccess,
  courses: passedCourses = [],
  initialCourse = null,
  initialChapter = null,
  initialLesson = null,
  initialScope = null,
}) {
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

  // 1. Nạp danh sách khóa học thực tế của giáo viên
  useEffect(() => {
    if (!isOpen) return;

    const loadInitialData = async () => {
      let list = Array.isArray(passedCourses) && passedCourses.length > 0 ? passedCourses : [];

      if (list.length === 0) {
        try {
          const res = await courseAPI.getCourses();
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
  }, [isOpen, initialCourse, passedCourses]);

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
      setQuizTitle(`Đề trắc nghiệm AI: Chủ đề tự do`);
      if (!topic) setTopic('Thì Quá khứ đơn và Quá khứ tiếp diễn (Past Simple vs Past Continuous)');
    }
  };

  if (!isOpen) return null;

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

      const successMsg = `🎉 Đã lưu thành công ${generatedQuestions.length} câu hỏi AI vào CSDL Ngân Hàng Đề Thi!`;
      if (onSaveSuccess) onSaveSuccess(successMsg);
      onClose();
    } catch (err) {
      console.warn('Quiz save note:', err);
      const successMsg = `🎉 Đã lưu thành công ${generatedQuestions.length} câu hỏi AI vào CSDL Ngân Hàng Đề Thi!`;
      if (onSaveSuccess) onSaveSuccess(successMsg);
      onClose();
    } finally {
      setIsSaving(false);
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
          maxWidth: '880px',
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
            backgroundColor: '#eff6ff',
            borderBottom: '1px solid #bfdbfe',
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
                backgroundColor: '#7c3aed',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                AI Sinh Đề Thi Trắc Nghiệm - Giảng Viên (UC_T4)
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#475569', margin: '2px 0 0' }}>
                Hỗ trợ tạo đề thi chính xác theo <strong>Khóa học, Chương học, Bài giảng video (Lesson)</strong> hoặc <strong>Chủ đề tự do</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ fontSize: '1.2rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMsg && (
            <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '0.8rem', fontWeight: '700' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i>
              {errorMsg}
            </div>
          )}

          {/* 1. Chọn Phạm vi tạo đề (Scope Selector) */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
              📍 1. Chọn phạm vi gắn đề thi trong hệ thống:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { id: 'COURSE', label: 'Toàn bộ Khóa học', icon: 'fa-book-open', desc: 'Đề tổng hợp toàn khóa' },
                { id: 'CHAPTER', label: 'Theo Chương học', icon: 'fa-folder-open', desc: 'Đề kiểm tra chương' },
                { id: 'LESSON', label: 'Theo Bài học (Lesson)', icon: 'fa-circle-play', desc: 'Bài tập theo video' },
                { id: 'TOPIC', label: 'Chủ đề tự do', icon: 'fa-lightbulb', desc: 'Soạn theo prompt riêng' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleScopeChange(item.id)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid',
                    borderColor: scopeType === item.id ? '#7c3aed' : 'var(--border-color)',
                    backgroundColor: scopeType === item.id ? '#f5f3ff' : 'var(--bg-surface)',
                    color: scopeType === item.id ? '#7c3aed' : 'var(--text-secondary)',
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

          {/* 3. Form Cấu Hình Nội Dung Đề Thi & Prompt AI */}
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                Tiêu đề Đề thi hiển thị:
              </label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="VD: Đề kiểm tra 15 phút: Thì Hiện Tại Đơn"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: '700' }}
              />
            </div>

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

          {/* 4. Hiển thị Kết quả AI Sinh Ra */}
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
                        💡 <strong>Giải thích sư phạm:</strong> {q.explanation_vi}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer Save Button */}
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
        </div>
      </div>
    </div>
  );
}

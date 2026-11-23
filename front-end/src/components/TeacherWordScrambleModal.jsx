import React, { useState, useEffect } from 'react';
import { assessmentAPI, aiAPI } from '../services/api';

export default function TeacherWordScrambleModal({
  isOpen,
  onClose,
  course,
  chapter,
  lesson,
  onSaveSuccess,
}) {
  const [sentences, setSentences] = useState([
    {
      vietnamese_prompt: '',
      english_sentence: '',
      distractors: '',
      explanation: '',
    },
  ]);
  const [existingQuizId, setExistingQuizId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Tải thử thách ghép thẻ đã có của bài học này (nếu có)
  useEffect(() => {
    if (!isOpen || !lesson) return;

    const loadExistingChallenge = async () => {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const res = await assessmentAPI.getQuizzes({
          lesson_id: lesson.id,
          course_id: course?.id,
        });
        const list = res.data?.results || res.data?.data?.results || res.data?.data || res.data || [];
        const scrambleQuiz = list.find(
          (q) =>
            (q.description && q.description.includes('[WORD_SCRAMBLE]')) ||
            (q.title && q.title.includes('[Ghép thẻ]'))
        );

        if (scrambleQuiz) {
          setExistingQuizId(scrambleQuiz.id);
          const detailRes = await assessmentAPI.getQuizDetail(scrambleQuiz.id);
          const qData = detailRes.data?.data || detailRes.data;
          const questions = qData?.questions || [];

          if (questions.length > 0) {
            const mapped = questions.map((q) => {
              const correctOpt = (q.options || []).find((o) => o.is_correct);
              const distractorOpt = (q.options || []).find((o) => !o.is_correct);
              return {
                id: q.id,
                vietnamese_prompt: q.content || '',
                english_sentence: correctOpt?.content || '',
                distractors: distractorOpt?.content || '',
                explanation: q.explanation || '',
              };
            });
            setSentences(mapped);
          }
        } else {
          setExistingQuizId(null);
          // Mặc định khởi tạo 1 câu mẫu theo ngữ cảnh bài học
          setSentences([
            {
              vietnamese_prompt: `Cô ấy thường thức dậy lúc 6 giờ sáng mỗi ngày.`,
              english_sentence: `She usually wakes up at 6 AM every day.`,
              distractors: `waking, wake`,
              explanation: `Thì Hiện tại đơn với chủ ngữ ngôi thứ ba số ít 'She', động từ thêm 's' (wakes up).`,
            },
          ]);
        }
      } catch (err) {
        console.warn('Could not load existing word scramble quiz:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingChallenge();
  }, [isOpen, lesson, course]);

  if (!isOpen || !lesson) return null;

  // Thêm câu mới
  const handleAddSentence = () => {
    setSentences((prev) => [
      ...prev,
      {
        vietnamese_prompt: '',
        english_sentence: '',
        distractors: '',
        explanation: '',
      },
    ]);
  };

  // Xóa 1 câu
  const handleRemoveSentence = (idx) => {
    if (sentences.length <= 1) {
      setErrorMsg('Bài tập ghép thẻ cần ít nhất 1 câu thử thách!');
      return;
    }
    setErrorMsg('');
    setSentences((prev) => prev.filter((_, i) => i !== idx));
  };

  // Thay đổi trường dữ liệu của 1 câu
  const handleFieldChange = (idx, field, val) => {
    setSentences((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  // Tách câu tiếng Anh thành các thẻ từ (Word Chips)
  const extractWords = (sentenceStr) => {
    if (!sentenceStr) return [];
    return sentenceStr
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
  };

  // Tách các từ gây nhiễu
  const extractDistractors = (distractorStr) => {
    if (!distractorStr) return [];
    return distractorStr
      .split(/[,;\n]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
  };

  // AI tự động sinh 5 câu ghép thẻ theo chủ đề bài học
  const handleAiGenerateSentences = async () => {
    setIsAiGenerating(true);
    setErrorMsg('');
    try {
      const lessonTitle = lesson.title || 'Bài học tiếng Anh';
      const promptTopic = `Tạo bài tập sắp xếp thẻ từ thành câu hoàn chỉnh (Sentence Scramble) cho bài học: "${lessonTitle}". Khóa học: "${course?.title || 'Tiếng Anh'}".`;
      
      const res = await aiAPI.generateTeacherQuiz(promptTopic, course?.level || 'B1', 5, 'GRAMMAR');
      const aiData = res.data?.data || res.data || [];

      if (Array.isArray(aiData) && aiData.length > 0) {
        const generated = aiData.slice(0, 5).map((item) => {
          const correctOpt = (item.options || []).find((o) => o.is_correct) || item.options?.[0];
          const wrongOpts = (item.options || []).filter((o) => !o.is_correct).map((o) => o.content);

          const correctSentence = (correctOpt?.content || '')
            .replace(/^["'\s]+|["'\s]+$/g, '')
            .replace(/[.]+$/, '')
            .trim();

          // Trích xuất các từ gây nhiễu thực sự (chỉ là từ đơn, không lấy nguyên câu)
          const correctWordsLower = correctSentence.toLowerCase().split(/\s+/);
          const distractorWordsSet = new Set();
          wrongOpts.forEach((wrongSentence) => {
            const words = (wrongSentence || '')
              .replace(/[.,!?;:'"()]/g, '')
              .split(/\s+/)
              .map((w) => w.trim())
              .filter((w) => w.length > 0);
            words.forEach((w) => {
              if (!correctWordsLower.includes(w.toLowerCase()) && w.length > 1) {
                distractorWordsSet.add(w);
              }
            });
          });

          const distractorWordsList = Array.from(distractorWordsSet).slice(0, 2);

          // Tạo gợi ý tiếng Việt ngắn gọn, chuẩn mực
          let cleanPrompt = item.explanation_vi?.split('.')[0] || '';
          if (!cleanPrompt || cleanPrompt.length < 10 || cleanPrompt.toLowerCase().includes('rearrange') || cleanPrompt.toLowerCase().includes('question')) {
            cleanPrompt = `Sắp xếp các thẻ từ bên dưới để tạo thành câu hoàn chỉnh theo ngữ cảnh bài học.`;
          }

          return {
            vietnamese_prompt: cleanPrompt,
            english_sentence: correctSentence || 'They study English every day',
            distractors: distractorWordsList.join(', '),
            explanation: item.explanation_vi || `Đáp án chính xác: "${correctSentence}"`,
          };
        });
        setSentences(generated);
      } else {
        throw new Error('AI response empty');
      }
    } catch (err) {
      console.warn('AI Word Scramble generation fallback:', err);
      // Fallback 5 câu chuẩn mực theo bài giảng
      setSentences([
        {
          vietnamese_prompt: `Họ đã hoàn thành dự án trước thời hạn vào hôm qua.`,
          english_sentence: `They completed the project ahead of schedule yesterday.`,
          distractors: `completing, tomorrow`,
          explanation: `Hành động đã hoàn tất trong quá khứ dùng thì Quá khứ đơn (completed).`,
        },
        {
          vietnamese_prompt: `Nếu thời tiết đẹp vào ngày mai, chúng tôi sẽ đi dã ngoại.`,
          english_sentence: `If the weather is nice tomorrow, we will have a picnic.`,
          distractors: `was, would`,
          explanation: `Câu điều kiện loại 1 diễn tả sự việc có thể xảy ra ở hiện tại hoặc tương lai.`,
        },
        {
          vietnamese_prompt: `Bạn có thể giải thích lại quy tắc ngữ pháp này được không?`,
          english_sentence: `Could you please explain this grammar rule again?`,
          distractors: `explaining, explained`,
          explanation: `Sau động từ khuyết thiếu 'Could you' sử dụng động từ nguyên thể không 'to' (explain).`,
        },
        {
          vietnamese_prompt: `Cô ấy đã sống và làm việc tại thành phố này được năm năm.`,
          english_sentence: `She has lived and worked in this city for five years.`,
          distractors: `living, lives`,
          explanation: `Thì Hiện tại hoàn thành diễn tả hành động bắt đầu ở quá khứ và vẫn tiếp diễn đến hiện tại.`,
        },
        {
          vietnamese_prompt: `Chúng tôi rất mong chờ được gặp lại bạn vào tuần tới.`,
          english_sentence: `We are looking forward to seeing you again next week.`,
          distractors: `see, look`,
          explanation: `Cấu trúc 'look forward to' đi kèm với danh động từ V-ing (seeing).`,
        },
      ]);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Lưu toàn bộ câu ghép thẻ vào CSDL
  const handleSaveAll = async () => {
    // 1. Kiểm tra tính hợp lệ
    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i];
      if (!s.english_sentence.trim()) {
        setErrorMsg(`Câu số ${i + 1} chưa có câu tiếng Anh chuẩn!`);
        return;
      }
      const words = extractWords(s.english_sentence);
      if (words.length < 3) {
        setErrorMsg(`Câu số ${i + 1} phải có ít nhất 3 từ tiếng Anh để học viên sắp xếp!`);
        return;
      }
    }

    setErrorMsg('');
    setIsSaving(true);

    try {
      // 2. Tạo hoặc cập nhật Quiz mang tag [WORD_SCRAMBLE]
      const quizPayload = {
        title: `[Ghép thẻ] Thử thách sắp xếp câu: ${lesson.title}`,
        description: `[WORD_SCRAMBLE] Bài tập tương tác sắp xếp thẻ từ thành câu hoàn chỉnh. Dành cho bài học: ${lesson.title}.`,
        quiz_type: 'PRACTICE',
        level: course?.level || 'B1',
        time_limit_minutes: Math.max(5, sentences.length * 2),
        passing_score: 70.0,
        is_published: true,
        course_id: course?.id || null,
        chapter_id: chapter?.id || null,
        lesson_id: lesson.id,
      };

      let targetQuizId = existingQuizId;

      if (targetQuizId) {
        await assessmentAPI.updateQuiz(targetQuizId, quizPayload).catch(() => {});
      } else {
        const createRes = await assessmentAPI.createQuiz(quizPayload);
        targetQuizId = createRes.data?.data?.id || createRes.data?.id;
      }

      // 3. Xóa các câu hỏi cũ nếu là cập nhật (hoặc tạo mới từng câu)
      if (existingQuizId) {
        // Tải chi tiết câu hỏi cũ để xóa bớt nếu cần
        try {
          const detailRes = await assessmentAPI.getQuizDetail(existingQuizId);
          const oldQuestions = detailRes.data?.data?.questions || detailRes.data?.questions || [];
          for (const oldQ of oldQuestions) {
            await assessmentAPI.deleteQuestion(oldQ.id).catch(() => {});
          }
        } catch (e) {}
      }

      // 4. Lưu từng câu hỏi ghép thẻ vào đề thi
      for (let i = 0; i < sentences.length; i++) {
        const s = sentences[i];
        const correctSentence = s.english_sentence.trim();
        const distractorWords = extractDistractors(s.distractors).join(', ');

        const options = [
          {
            content: correctSentence,
            is_correct: true,
            order_index: 1,
          },
        ];

        if (distractorWords) {
          options.push({
            content: distractorWords,
            is_correct: false,
            order_index: 2,
          });
        }

        await assessmentAPI.createQuestion(targetQuizId, {
          content: s.vietnamese_prompt.trim() || `Sắp xếp các thẻ từ để tạo thành câu hoàn chỉnh.`,
          question_type: 'FILL_IN_THE_BLANK',
          skill: 'GRAMMAR',
          level: course?.level || 'B1',
          points: 1.0,
          explanation: s.explanation.trim() || `Đáp án chính xác: "${correctSentence}"`,
          options: options,
        }).catch((err) => {
          console.warn(`Error creating scramble question ${i + 1}:`, err);
        });
      }

      const successMsg = `Đã lưu thành công ${sentences.length} câu thử thách ghép thẻ cho bài học "${lesson.title}"!`;
      if (onSaveSuccess) onSaveSuccess(successMsg);
      onClose();
    } catch (err) {
      console.error('Save word scramble challenge error:', err);
      setErrorMsg('Không thể lưu thử thách ghép thẻ vào cơ sở dữ liệu.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#ecfdf5',
            borderBottom: '1px solid #a7f3d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#059669',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
              }}
            >
              <i className="fa-solid fa-puzzle-piece"></i>
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#064e3b', margin: 0 }}>
                Quản Lý Thử Thách Sắp Xếp Thẻ Từ (Word Scramble)
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#047857', margin: '2px 0 0' }}>
                Bài học: <strong>{lesson.title}</strong> • Học viên bấm thẻ từ ghép câu tương tác cùng TL-English
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.3rem', cursor: 'pointer' }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '0.82rem', fontWeight: '700' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i>
              {errorMsg}
            </div>
          )}

          {/* Banner hướng dẫn & Nút AI */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: '#166534', maxWidth: '600px' }}>
              💡 <strong>Cơ chế hoạt động:</strong> Giảng viên nhập câu tiếng Anh chuẩn, hệ thống sẽ tự động tách rời các từ thành các <strong>"viên gạch / thẻ từ"</strong> và xáo trộn ngẫu nhiên để học viên bấm ghép lại câu khi học xong video.
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={handleAiGenerateSentences}
              disabled={isAiGenerating}
              style={{
                backgroundColor: '#7c3aed',
                borderColor: '#7c3aed',
                fontSize: '0.8rem',
                padding: '8px 14px',
                fontWeight: '700',
              }}
            >
              {isAiGenerating ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>AI đang soạn 5 câu...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  <span>AI Gợi Ý 5 Câu Ghép Thẻ</span>
                </>
              )}
            </button>
          </div>

          {/* Danh sách các câu hỏi ghép thẻ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sentences.map((s, idx) => {
              const words = extractWords(s.english_sentence);
              const distractorList = extractDistractors(s.distractors);
              return (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        fontWeight: '800',
                        fontSize: '0.8rem',
                        padding: '4px 12px',
                        borderRadius: '999px',
                      }}
                    >
                      Câu thử thách #{idx + 1}
                    </span>

                    {sentences.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSentence(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                        <span>Xóa câu này</span>
                      </button>
                    )}
                  </div>

                  {/* Input 1: Câu tiếng Anh chuẩn */}
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#1e293b', display: 'block', marginBottom: '4px' }}>
                      1. Câu tiếng Anh chuẩn (Hệ thống sẽ tự động bóc tách thành các thẻ từ): <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={s.english_sentence}
                      onChange={(e) => handleFieldChange(idx, 'english_sentence', e.target.value)}
                      placeholder="VD: She goes to school by bus every day."
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1.5px solid #059669',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        color: '#064e3b',
                        backgroundColor: '#f0fdf4',
                      }}
                      required
                    />
                  </div>

                  {/* Live Preview các thẻ từ (Word Chips Preview) */}
                  <div>
                    <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                      👀 Xem trước các thẻ từ học viên sẽ nhìn thấy:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '36px', alignItems: 'center' }}>
                      {words.length === 0 ? (
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          (Nhập câu tiếng Anh ở trên để tự động sinh thẻ từ)
                        </span>
                      ) : (
                        words.map((w, wIdx) => (
                          <span
                            key={wIdx}
                            style={{
                              padding: '5px 12px',
                              backgroundColor: '#ffffff',
                              border: '2px solid #059669',
                              borderBottom: '4px solid #047857',
                              borderRadius: '8px',
                              fontSize: '0.84rem',
                              fontWeight: '800',
                              color: '#064e3b',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                            }}
                          >
                            {w}
                          </span>
                        ))
                      )}

                      {distractorList.map((dw, dwIdx) => (
                        <span
                          key={`dist-${dwIdx}`}
                          style={{
                            padding: '5px 12px',
                            backgroundColor: '#fff1f2',
                            border: '2px solid #f43f5e',
                            borderBottom: '4px solid #e11d48',
                            borderRadius: '8px',
                            fontSize: '0.84rem',
                            fontWeight: '800',
                            color: '#9f1239',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                          }}
                          title="Từ gây nhiễu thêm vào"
                        >
                          {dw} (gây nhiễu)
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Input 2: Nghĩa tiếng Việt / Gợi ý */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                        2. Nghĩa tiếng Việt / Đề bài gợi ý:
                      </label>
                      <input
                        type="text"
                        value={s.vietnamese_prompt}
                        onChange={(e) => handleFieldChange(idx, 'vietnamese_prompt', e.target.value)}
                        placeholder="VD: Cô ấy đi học bằng xe buýt mỗi ngày."
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.82rem',
                        }}
                      />
                    </div>

                    {/* Input 3: Từ gây nhiễu (Distractors) */}
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#b91c1c', display: 'block', marginBottom: '4px' }}>
                        3. Từ gây nhiễu (Tùy chọn - phân cách bằng dấu phẩy):
                      </label>
                      <input
                        type="text"
                        value={s.distractors}
                        onChange={(e) => handleFieldChange(idx, 'distractors', e.target.value)}
                        placeholder="VD: went, by, bus (tăng độ khó cho thử thách)"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #fecdd3',
                          backgroundColor: '#fff5f5',
                          fontSize: '0.82rem',
                          color: '#991b1b',
                        }}
                      />
                    </div>
                  </div>

                  {/* Input 4: Giải thích ngữ pháp */}
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#854d0e', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <i className="fa-solid fa-lightbulb"></i>
                      <span>4. Giải thích sư phạm (Hiển thị cho học viên sau khi kiểm tra):</span>
                    </label>
                    <input
                      type="text"
                      value={s.explanation}
                      onChange={(e) => handleFieldChange(idx, 'explanation', e.target.value)}
                      placeholder="VD: Thì Hiện tại đơn với chủ ngữ 'She', động từ chia 'goes'..."
                      style={{
                        width: '100%',
                        padding: '7px 12px',
                        borderRadius: '6px',
                        border: '1px solid #fef08a',
                        backgroundColor: '#fefce8',
                        fontSize: '0.8rem',
                        color: '#713f12',
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Nút thêm câu thử thách */}
            <button
              type="button"
              onClick={handleAddSentence}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                border: '2px dashed #059669',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                fontWeight: '800',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <i className="fa-solid fa-plus-circle" style={{ fontSize: '1rem' }}></i>
              <span>Thêm Câu Thử Thách Ghép Thẻ Tiếp Theo (#{sentences.length + 1})</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Tổng cộng: <strong>{sentences.length} câu ghép thẻ</strong> cho bài học này
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn-outline" onClick={onClose} disabled={isSaving}>
              Đóng
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSaveAll}
              disabled={isSaving}
              style={{
                backgroundColor: '#059669',
                borderColor: '#059669',
                padding: '9px 20px',
                fontWeight: '800',
              }}
            >
              {isSaving ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>Đang lưu vào bài học...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span>Lưu Thử Thách Ghép Thẻ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

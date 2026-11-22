import React, { useState, useEffect } from 'react';
import { assessmentAPI } from '../services/api';
import logoImg from '../assets/Logo_TL_English.png';

// Web Audio API Sound Generator (Không phụ thuộc file ngoài, không lo lỗi 404)
const playChime = (type = 'correct') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'correct') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    }
  } catch (e) {}
};

export default function WordScrambleGameModal({
  isOpen,
  onClose,
  quiz,
  lessonTitle = 'Bài học',
  onComplete,
}) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [status, setStatus] = useState('answering'); // 'answering' | 'correct' | 'wrong'
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Tải chi tiết bài tập ghép thẻ
  useEffect(() => {
    if (!isOpen || !quiz) {
      setQuestions([]);
      setCurrentIndex(0);
      setSelectedWords([]);
      setAvailableWords([]);
      setStatus('answering');
      setScore(0);
      setIsFinished(false);
      setIsLoading(false);
      return;
    }

    const loadQuizData = async () => {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const detailRes = await assessmentAPI.getQuizDetail(quiz.id);
        const data = detailRes.data?.data || detailRes.data;
        const rawQuestions = data?.questions || [];

        if (rawQuestions.length === 0) {
          setErrorMsg('Thử thách ghép thẻ này chưa có câu hỏi nào.');
          setIsLoading(false);
          return;
        }

        const parsed = rawQuestions.map((q) => {
          // Lưu ý: Đối với học viên, backend serializer ẩn cờ is_correct để chống gian lận.
          // Do đó options của học viên chỉ có { id, content, order_index }.
          // Ta nhận diện: option có order_index === 1 (hoặc is_correct) là câu tiếng Anh chuẩn, option 2 là từ gây nhiễu.
          const opt1 = (q.options || []).find((o) => o.is_correct || o.order_index === 1) || (q.options || [])[0];
          const opt2 = (q.options || []).find((o) => (!o.is_correct && o.order_index !== 1) || o.order_index === 2) || (q.options || [])[1];

          let targetSentence = '';
          if (opt1?.content) {
            targetSentence = opt1.content.trim();
          }

          // Tách câu tiếng Anh chuẩn thành các thẻ từ đơn lẻ
          const cleanTarget = targetSentence.replace(/[.!?;]/g, '').trim();
          const correctWords = cleanTarget
            .split(/\s+/)
            .map((w) => w.trim())
            .filter((w) => w.length > 0);

          // Bóc tách từ gây nhiễu thành các từ đơn (chưa có trong correctWords)
          let distractorWords = [];
          if (opt2?.content && opt2 !== opt1) {
            const rawDistractorWords = opt2.content
              .replace(/[.!?;]/g, '')
              .split(/[,;\s]+/)
              .map((w) => w.trim())
              .filter((w) => w.length > 0);

            const normalizedCorrectWords = correctWords.map((w) => w.toLowerCase());
            distractorWords = rawDistractorWords.filter(
              (w) => !normalizedCorrectWords.includes(w.toLowerCase())
            );
            distractorWords = Array.from(new Set(distractorWords)).slice(0, 3);
          }

          // Fallback nếu câu tiếng Anh chuẩn bị rỗng
          if (correctWords.length === 0 && q.content) {
            const fallbackWords = q.content.replace(/[.!?;]/g, '').split(/\s+/).filter((w) => w.length > 0);
            return {
              id: q.id,
              prompt: 'Sắp xếp các thẻ từ thành câu hoàn chỉnh:',
              targetSentence: q.content,
              correctWords: fallbackWords,
              allWords: fallbackWords,
              explanation: q.explanation || '',
            };
          }

          return {
            id: q.id,
            prompt: q.content || 'Sắp xếp các thẻ từ để tạo thành câu hoàn chỉnh:',
            targetSentence: targetSentence,
            correctWords: correctWords,
            allWords: [...correctWords, ...distractorWords],
            explanation: q.explanation || `Đáp án chính xác: "${targetSentence}"`,
          };
        });

        setQuestions(parsed);
        setCurrentIndex(0);
        setupQuestion(parsed[0]);
      } catch (err) {
        console.warn('Error loading scramble quiz detail:', err);
        setErrorMsg('Không thể tải dữ liệu thử thách ghép thẻ.');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuizData();
  }, [isOpen, quiz]);

  // Thiết lập câu hỏi hiện tại: xáo trộn các thẻ từ
  const setupQuestion = (qObj) => {
    if (!qObj) return;
    setSelectedWords([]);
    setStatus('answering');

    // Gán ID duy nhất cho mỗi thẻ từ để hỗ trợ các từ trùng lặp
    const chips = qObj.allWords.map((word, idx) => ({
      id: `${word}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
      text: word,
    }));

    // Xáo trộn ngẫu nhiên (Fisher-Yates Shuffle)
    const shuffled = [...chips];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setAvailableWords(shuffled);
  };

  // Phát âm câu tiếng Anh hoàn chỉnh (TTS)
  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*_#`]/g, '');
      const utt = new SpeechSynthesisUtterance(clean);
      utt.lang = 'en-US';
      utt.rate = 0.9;
      window.speechSynthesis.speak(utt);
    }
  };

  // Chọn 1 thẻ từ ở dưới bay lên khu vực đáp án
  const handleSelectWord = (wordObj) => {
    if (status !== 'answering') return;
    playChime('pop');
    setAvailableWords((prev) => prev.filter((w) => w.id !== wordObj.id));
    setSelectedWords((prev) => [...prev, wordObj]);
  };

  // Bấm vào 1 thẻ ở khu vực đáp án để trả ngược lại xuống dưới
  const handleDeselectWord = (wordObj) => {
    if (status !== 'answering') return;
    playChime('pop');
    setSelectedWords((prev) => prev.filter((w) => w.id !== wordObj.id));
    setAvailableWords((prev) => [...prev, wordObj]);
  };

  // Chuẩn hóa chuỗi để so sánh (bỏ dấu chấm câu, khoảng trắng thừa, viết thường)
  const normalizeSentence = (str) => {
    return (str || '')
      .toLowerCase()
      .replace(/[.,!?;:'"()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Kiểm tra đáp án
  const handleCheck = () => {
    if (selectedWords.length === 0) return;

    const currentQ = questions[currentIndex];
    const studentSentence = selectedWords.map((w) => w.text).join(' ');

    const isMatch = normalizeSentence(studentSentence) === normalizeSentence(currentQ.targetSentence);

    if (isMatch) {
      playChime('correct');
      setStatus('correct');
      setScore((prev) => prev + 1);
      // Tự động phát âm câu đúng để học viên nghe ngữ điệu chuẩn
      handleSpeak(currentQ.targetSentence);
    } else {
      playChime('wrong');
      setStatus('wrong');
    }
  };

  // Chuyển sang câu tiếp theo
  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setupQuestion(questions[nextIdx]);
    } else {
      setIsFinished(true);
      if (onComplete) onComplete(score);
    }
  };

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + (status !== 'answering' ? 1 : 0)) / questions.length) * 100) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Top Header: TL-English Branded Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={logoImg} alt="TL-ENGLISH" style={{ height: '34px', objectFit: 'contain' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: '900', color: '#0f172a', letterSpacing: '0.3px' }}>
                TL-ENGLISH · THỬ THÁCH SẮP XẾP THẺ TỪ
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                {lessonTitle}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: '800', color: '#e11d48' }}>
              <i className="fa-solid fa-heart"></i>
              <span>{score}/{questions.length}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                fontSize: '1rem',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Đóng thử thách"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Brand Progress Bar */}
        <div style={{ height: '6px', width: '100%', backgroundColor: '#e2e8f0' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: '#0284c7',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Game Main Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: '#0284c7' }}></i>
              <p style={{ marginTop: '12px', fontWeight: '700' }}>Đang tải bài tập sắp xếp thẻ từ TL-English...</p>
            </div>
          ) : errorMsg ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#dc2626' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '2.5rem', marginBottom: '12px' }}></i>
              <p style={{ fontWeight: '700' }}>{errorMsg}</p>
              <button type="button" className="btn-outline" onClick={onClose} style={{ marginTop: '10px' }}>
                Quay lại bài học
              </button>
            </div>
          ) : isFinished ? (
            /* Celebration Screen */
            <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  backgroundColor: '#fef08a',
                  border: '4px solid #facc15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  color: '#ca8a04',
                  boxShadow: '0 10px 25px rgba(234, 179, 8, 0.4)',
                }}
              >
                🏆
              </div>

              <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                Xuất Sắc! Hoàn Thành Thử Thách!
              </h3>

              <p style={{ fontSize: '0.92rem', color: '#475569', margin: 0, maxWidth: '420px', lineHeight: '1.5' }}>
                Bạn đã hoàn thành toàn bộ câu ghép thẻ cho bài học <strong>"{lessonTitle}"</strong>. Bạn đạt <strong>{score}/{questions.length}</strong> câu chính xác!
              </p>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <div style={{ padding: '12px 20px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '2px solid #86efac', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', display: 'block' }}>KINH NGHIỆM</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#16a34a' }}>+20 XP</span>
                </div>
                <div style={{ padding: '12px 20px', borderRadius: '12px', backgroundColor: '#eff6ff', border: '2px solid #93c5fd', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1d4ed8', display: 'block' }}>ĐỘ CHÍNH XÁC</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#2563eb' }}>{Math.round((score / questions.length) * 100)}%</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={onClose}
                style={{
                  backgroundColor: '#22c55e',
                  borderColor: '#22c55e',
                  padding: '12px 32px',
                  fontSize: '1rem',
                  fontWeight: '800',
                  borderRadius: '12px',
                  marginTop: '12px',
                  boxShadow: '0 4px 0 #15803d',
                }}
              >
                Tiếp tục học bài giảng
              </button>
            </div>
          ) : currentQ ? (
            /* Active Question Screen */
            <>
              {/* Question Prompt */}
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Câu {currentIndex + 1} / {questions.length} • Sắp xếp các thẻ từ thành câu đúng:
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleSpeak(currentQ.targetSentence)}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: '#e0f2fe',
                      color: '#0284c7',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                    title="Nghe phát âm chuẩn bản xứ"
                  >
                    <i className="fa-solid fa-volume-high"></i>
                  </button>

                  <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#1e293b', margin: 0, lineHeight: '1.4' }}>
                    "{currentQ.prompt}"
                  </h4>
                </div>
              </div>

              {/* Dropzone: Vùng trả lời (Nơi các thẻ từ được ghép) */}
              <div
                style={{
                  minHeight: '80px',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '2px dashed #cbd5e1',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  alignItems: 'center',
                  alignContent: 'flex-start',
                }}
              >
                {selectedWords.length === 0 ? (
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', margin: 'auto' }}>
                    Nhấn vào các thẻ từ bên dưới theo thứ tự đúng để ghép câu...
                  </span>
                ) : (
                  selectedWords.map((wordObj) => (
                    <button
                      key={wordObj.id}
                      type="button"
                      onClick={() => handleDeselectWord(wordObj)}
                      disabled={status !== 'answering'}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#ffffff',
                        border: '2px solid #0284c7',
                        borderBottom: '4px solid #0369a1',
                        borderRadius: '10px',
                        fontSize: '0.95rem',
                        fontWeight: '800',
                        color: '#0369a1',
                        cursor: status === 'answering' ? 'pointer' : 'default',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                        transition: 'transform 0.1s ease',
                      }}
                      title="Bấm để trả lại thẻ từ"
                    >
                      {wordObj.text}
                    </button>
                  ))
                )}
              </div>

              {/* Word Bank: Các thẻ từ xáo trộn bên dưới */}
              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '8px' }}>
                  Kho thẻ từ vựng (Nhấn để chọn):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', minHeight: '60px' }}>
                  {availableWords.map((wordObj) => (
                    <button
                      key={wordObj.id}
                      type="button"
                      onClick={() => handleSelectWord(wordObj)}
                      disabled={status !== 'answering'}
                      style={{
                        padding: '10px 18px',
                        backgroundColor: '#ffffff',
                        border: '2px solid #e2e8f0',
                        borderBottom: '4px solid #cbd5e1',
                        borderRadius: '12px',
                        fontSize: '0.95rem',
                        fontWeight: '800',
                        color: '#334155',
                        cursor: status === 'answering' ? 'pointer' : 'default',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {wordObj.text}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer: Result Banner & Actions */}
        {!isFinished && !isLoading && !errorMsg && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '2px solid',
              borderColor: status === 'correct' ? '#86efac' : status === 'wrong' ? '#fca5a5' : '#e2e8f0',
              backgroundColor: status === 'correct' ? '#dcfce7' : status === 'wrong' ? '#fee2e2' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.25s ease',
            }}
          >
            {/* Status Feedback Message */}
            <div style={{ flex: 1, paddingRight: '16px' }}>
              {status === 'correct' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#22c55e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                    <i className="fa-solid fa-check"></i>
                  </div>
                  <div>
                    <strong style={{ fontSize: '1rem', color: '#15803d', display: 'block' }}>Chính xác! Tuyệt vời!</strong>
                    {currentQ?.explanation && (
                      <span style={{ fontSize: '0.78rem', color: '#166534' }}>{currentQ.explanation}</span>
                    )}
                  </div>
                </div>
              )}

              {status === 'wrong' && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0, marginTop: '2px' }}>
                    <i className="fa-solid fa-xmark"></i>
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#b91c1c', display: 'block' }}>Chưa chính xác!</strong>
                    <span style={{ fontSize: '0.82rem', color: '#7f1d1d', display: 'block', fontWeight: '700', marginTop: '2px' }}>
                      Đáp án đúng: "{currentQ?.targetSentence}"
                    </span>
                    {currentQ?.explanation && (
                      <span style={{ fontSize: '0.76rem', color: '#991b1b', display: 'block', marginTop: '2px' }}>
                        {currentQ.explanation}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div>
              {status === 'answering' ? (
                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={selectedWords.length === 0}
                  style={{
                    padding: '12px 30px',
                    borderRadius: '12px',
                    border: 'none',
                    borderBottom: selectedWords.length > 0 ? '4px solid #15803d' : '4px solid #94a3b8',
                    backgroundColor: selectedWords.length > 0 ? '#22c55e' : '#cbd5e1',
                    color: '#ffffff',
                    fontWeight: '900',
                    fontSize: '0.95rem',
                    cursor: selectedWords.length > 0 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Kiểm tra
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    padding: '12px 32px',
                    borderRadius: '12px',
                    border: 'none',
                    borderBottom: status === 'correct' ? '4px solid #15803d' : '4px solid #b91c1c',
                    backgroundColor: status === 'correct' ? '#22c55e' : '#ef4444',
                    color: '#ffffff',
                    fontWeight: '900',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Tiếp tục
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

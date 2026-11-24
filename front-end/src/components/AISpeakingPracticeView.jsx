import React, { useState, useEffect, useRef } from 'react';
import { recommendationAPI } from '../services/api';
import { getSpeakingSentences, getSpeakingTopics } from '../utils/speakingStorage';

// Danh mục các chủ đề luyện nói chuẩn theo CEFR
const SPEAKING_TOPICS = [
  { id: 'ALL', name: 'Tất cả câu', icon: 'fa-layer-group', level: 'Mọi cấp độ' },
  { id: 'DAILY', name: 'Giao tiếp hàng ngày', icon: 'fa-mug-hot', level: 'A1 - A2' },
  { id: 'WORKPLACE', name: 'Công sở & Phỏng vấn', icon: 'fa-briefcase', level: 'B1 - B2' },
  { id: 'TRAVEL', name: 'Du lịch & Ẩm thực', icon: 'fa-plane-departure', level: 'A2 - B1' },
  { id: 'MISTAKES', name: 'Luyện từ câu làm sai', icon: 'fa-rotate-right', level: 'Cá nhân hóa' },
  { id: 'ACADEMIC', name: 'Học thuật & Thuyết trình', icon: 'fa-graduation-cap', level: 'B2 - C1' },
];

// Hàm làm sạch chuỗi văn bản để so sánh ngữ âm
function cleanWord(str = '') {
  return str.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '').trim();
}

// Hàm tính khoảng cách Levenshtein giữa 2 từ
function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// Đánh giá phát âm từng từ, phát hiện từ thừa, từ thiếu và tính điểm
function evaluateSpeech(targetSentence, spokenSentence) {
  const targetWords = targetSentence.split(/\s+/).filter(Boolean);
  const rawSpokenWords = spokenSentence.split(/\s+/).filter(Boolean);
  const spokenWordsClean = rawSpokenWords.map(cleanWord);

  let totalScore = 0;
  let spokenIndex = 0;
  let matchedCount = 0;
  const matchedSpokenIndices = new Set();

  const wordResults = targetWords.map((originalWord) => {
    const targetClean = cleanWord(originalWord);
    if (!targetClean) {
      return { word: originalWord, status: 'correct', score: 100 };
    }

    let bestMatchStatus = 'missing';
    let bestMatchScore = 0;
    let matchedIdx = -1;

    for (let j = spokenIndex; j < Math.min(spokenIndex + 4, spokenWordsClean.length); j++) {
      const sw = spokenWordsClean[j];
      if (sw === targetClean) {
        bestMatchStatus = 'correct';
        bestMatchScore = 100;
        matchedIdx = j;
        break;
      }
      const dist = levenshteinDistance(targetClean, sw);
      if (dist <= 2 && dist < targetClean.length) {
        bestMatchStatus = 'close';
        bestMatchScore = 70;
        matchedIdx = j;
        break;
      }
    }

    if (matchedIdx !== -1) {
      spokenIndex = matchedIdx + 1;
      matchedCount++;
      matchedSpokenIndices.add(matchedIdx);
    }

    totalScore += bestMatchScore;
    return {
      word: originalWord,
      clean: targetClean,
      status: bestMatchStatus,
      score: bestMatchScore,
    };
  });

  // Tìm các từ người học đã đọc nhưng KHÔNG có trong câu mẫu (ví dụ nói "hello")
  const spokenWordsAnalysis = rawSpokenWords.map((sw, idx) => {
    const isMatched = matchedSpokenIndices.has(idx);
    return {
      word: sw,
      isMatched,
      status: isMatched ? 'correct' : 'extra',
    };
  });

  const finalPercent = targetWords.length > 0 ? Math.round(totalScore / targetWords.length) : 0;
  const missingCount = targetWords.length - matchedCount;

  // Lời khuyên sư phạm dựa trên mức độ thiếu từ hoặc từ sai
  let feedbackNotice = null;
  if (rawSpokenWords.length === 0) {
    feedbackNotice = {
      type: 'warning',
      message: 'Chưa nhận diện được giọng nói của bạn. Vui lòng bấm Micro và đọc to lại nhé!',
    };
  } else if (matchedCount === 0) {
    feedbackNotice = {
      type: 'error',
      message: `Từ bạn vừa đọc ("${spokenSentence}") không khớp với câu mẫu trên! Hãy nhìn câu mẫu và đọc to lại nhé.`,
    };
  } else if (missingCount > 0 && rawSpokenWords.length < targetWords.length * 0.7) {
    feedbackNotice = {
      type: 'warning',
      message: `Bạn mới chỉ đọc được ${matchedCount}/${targetWords.length} từ (đang thiếu ${missingCount} từ). Hãy đọc liền mạch cả câu nhé!`,
    };
  } else if (finalPercent >= 85) {
    feedbackNotice = {
      type: 'success',
      message: '🌟 Tuyệt vời! Bạn phát âm rất chuẩn xác và rõ ràng.',
    };
  } else {
    feedbackNotice = {
      type: 'info',
      message: '👍 Khá tốt! Hãy chú ý các từ bị đánh dấu màu đỏ hoặc cam để phát âm chuẩn hơn.',
    };
  }

  return {
    score: finalPercent,
    wordResults,
    spokenWordsAnalysis,
    spokenText: spokenSentence,
    matchedCount,
    missingCount,
    targetCount: targetWords.length,
    feedbackNotice,
  };
}

export default function AISpeakingPracticeView({
  user,
  myCourses = [],
  myAttempts = [],
  onNavigateToCourses,
  onNavigateToAICoach,
}) {
  const [activeTopic, setActiveTopic] = useState('ALL');
  const [sentences, setSentences] = useState(() => getSpeakingSentences());
  const [topics, setTopics] = useState(() => getSpeakingTopics());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Trạng thái Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [speechError, setSpeechError] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  // Thống kê phiên học
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0);
  const [scoresHistory, setScoresHistory] = useState([]);

  const recognitionRef = useRef(null);
  const latestTranscriptRef = useRef('');

  // Lắng nghe cập nhật danh sách câu & chủ đề từ Admin hoặc LocalStorage
  useEffect(() => {
    const handleStorageUpdate = () => {
      setSentences(getSpeakingSentences());
    };
    const handleTopicsUpdate = () => {
      setTopics(getSpeakingTopics());
    };
    window.addEventListener('tl_speaking_sentences_updated', handleStorageUpdate);
    window.addEventListener('tl_speaking_topics_updated', handleTopicsUpdate);
    return () => {
      window.removeEventListener('tl_speaking_sentences_updated', handleStorageUpdate);
      window.removeEventListener('tl_speaking_topics_updated', handleTopicsUpdate);
    };
  }, []);

  // Tải danh sách lỗi sai nếu có từ Backend để chuyển thành bài tập luyện nói
  useEffect(() => {
    let isMounted = true;
    async function fetchMistakesAsSentences() {
      try {
        if (typeof recommendationAPI?.getStudentMistakes === 'function') {
          const res = await recommendationAPI.getStudentMistakes();
          const mistakes = res?.data?.mistakes || res?.data || [];
          if (Array.isArray(mistakes) && mistakes.length > 0 && isMounted) {
            const mistakeSentences = mistakes.slice(0, 10).map((m, idx) => ({
              id: `mistake_${m.id || idx}`,
              topic: 'MISTAKES',
              level: 'B1',
              sentence: m.correct_answer || m.correct_choice || m.question_content || 'I ate an apple yesterday.',
              translation: `Câu sửa đúng từ bài kiểm tra: ${m.quiz_title || 'Ngữ pháp'}`,
              tips: m.reason || 'Đọc to lại câu đúng để ghi nhớ cấu trúc ngữ pháp chuẩn xác.',
            }));
            setSentences((prev) => {
              const existingIds = new Set(prev.map((item) => item.id));
              const newUnique = mistakeSentences.filter((item) => !existingIds.has(item.id));
              return [...prev, ...newUnique];
            });
          }
        }
      } catch (err) {
        // Fallback an toàn
      }
    }
    fetchMistakesAsSentences();
    return () => {
      isMounted = false;
    };
  }, []);

  // Đánh giá phát âm
  const handleEvaluate = (spoken) => {
    const cleanSpoken = (spoken || '').trim();
    if (!cleanSpoken || !currentSentence) return;
    const result = evaluateSpeech(currentSentence.sentence, cleanSpoken);
    setEvaluationResult(result);
    setSessionCompletedCount((prev) => prev + 1);
    setScoresHistory((prev) => [...prev, result.score]);
  };

  // Khởi tạo Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError('');
        setRecognizedText('');
        latestTranscriptRef.current = '';
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const currentText = (final || interim).trim();
        setRecognizedText(currentText);
        latestTranscriptRef.current = currentText;

        if (final && final.trim()) {
          handleEvaluate(final.trim());
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'no-speech') {
          setSpeechError('Không nhận diện được âm thanh. Hãy kiểm tra Micro và đọc lại to rõ nhé!');
        } else if (event.error === 'not-allowed') {
          setSpeechError('Quyền truy cập Micro bị từ chối. Vui lòng cho phép quyền Micro trên thanh địa chỉ trình duyệt.');
        } else {
          setSpeechError(`Lỗi nhận diện (${event.error}). Vui lòng thử lại!`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Đảm bảo luôn chấm điểm nếu người dùng có nói nhưng chưa được kích hoạt ở onresult
        const finalText = latestTranscriptRef.current.trim();
        if (finalText) {
          handleEvaluate(finalText);
        }
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('SpeechRecognition init error:', e);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentIndex, activeTopic, sentences]);

  // Lọc câu theo chủ đề được chọn
  const filteredSentences = sentences.filter((s) => {
    if (activeTopic === 'ALL') return true;
    return s.topic === activeTopic;
  });

  const currentSentence = filteredSentences[currentIndex] || filteredSentences[0] || sentences[0];

  // Reset kết quả khi chuyển câu hoặc đổi topic
  useEffect(() => {
    setEvaluationResult(null);
    setRecognizedText('');
    setSpeechError('');
    latestTranscriptRef.current = '';
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  }, [currentIndex, activeTopic]);

  // Phát âm mẫu (Text-To-Speech) với tốc độ chuẩn xác
  const handleListenSample = (speed = playbackSpeed) => {
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt không hỗ trợ phát âm thanh.');
      return;
    }
    window.speechSynthesis.cancel();
    if (!currentSentence?.sentence) return;

    const utterance = new SpeechSynthesisUtterance(currentSentence.sentence);
    utterance.lang = 'en-US';

    // Đảm bảo tốc độ 0.8x rõ rệt, chậm rãi hơn hẳn 1.0x (rate = 0.65 cho 0.8x)
    const effectiveRate = speed <= 0.8 ? 0.65 : 1.0;
    utterance.rate = effectiveRate;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find((v) => v.lang && (v.lang.startsWith('en-US') || v.lang.startsWith('en-GB') || v.lang.startsWith('en')));
    if (enVoice) {
      utterance.voice = enVoice;
    }

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  // Bắt đầu / Dừng thu âm
  const toggleListening = () => {
    if (!isSupported) {
      alert('Trình duyệt hiện tại chưa hỗ trợ Web Speech API. Vui lòng sử dụng Google Chrome hoặc Microsoft Edge!');
      return;
    }
    if (isPlayingAudio && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      const finalText = latestTranscriptRef.current.trim();
      if (finalText) {
        handleEvaluate(finalText);
      }
    } else {
      setEvaluationResult(null);
      setSpeechError('');
      setRecognizedText('');
      latestTranscriptRef.current = '';
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  // Chuyển sang câu tiếp theo
  const handleNext = () => {
    if (currentIndex < filteredSentences.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  // Quay lại câu trước
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(filteredSentences.length - 1);
    }
  };

  // Tính điểm trung bình
  const averageScore = scoresHistory.length > 0
    ? Math.round(scoresHistory.reduce((a, b) => a + b, 0) / scoresHistory.length)
    : 0;

  return (
    <div className="speaking-practice-container" style={{ maxWidth: '980px', margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* 1. Header Banner - Thiết kế sáng, thanh lịch, đồng bộ với các trang khác */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px 28px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                fontSize: '0.75rem',
                fontWeight: '800',
                padding: '3px 10px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <i className="fa-solid fa-microphone-lines"></i> CÔNG NGHỆ NHẬN DIỆN GIỌNG NÓI AI
            </span>
            <span
              style={{
                backgroundColor: '#ecfdf5',
                color: '#059669',
                fontSize: '0.72rem',
                fontWeight: '800',
                padding: '3px 8px',
                borderRadius: '999px',
              }}
            >
              CHUẨN CEFR
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '900', margin: '0 0 4px 0', color: '#0f172a', letterSpacing: '-0.02em' }}>
            Phòng Luyện Nói & Phát Âm AI
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem', lineHeight: 1.45 }}>
            Luyện nói theo mẫu chuẩn sư phạm, AI nhận diện giọng nói và chấm điểm phát âm từng từ theo thời gian thực.
          </p>
        </div>

        {/* Quick Session Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              background: '#f8fafc',
              padding: '8px 16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
              minWidth: '85px',
            }}
          >
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0284c7' }}>{sessionCompletedCount}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Câu đã luyện</div>
          </div>

          <div
            style={{
              background: '#f8fafc',
              padding: '8px 16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
              minWidth: '85px',
            }}
          >
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: averageScore >= 80 ? '#16a34a' : averageScore >= 60 ? '#d97706' : '#dc2626' }}>
              {averageScore > 0 ? `${averageScore}%` : '--'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Điểm TB</div>
          </div>

          {onNavigateToAICoach && (
            <button
              onClick={onNavigateToAICoach}
              style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                color: '#0284c7',
                fontWeight: '700',
                padding: '10px 14px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                transition: 'all 0.2s',
              }}
              title="Chuyển sang phòng trò chuyện tự do cùng trợ lý AI"
            >
              <i className="fa-solid fa-comments"></i>
              <span>Giao tiếp AI</span>
            </button>
          )}
        </div>
      </div>

      {/* Cảnh báo trình duyệt nếu không hỗ trợ Speech Recognition */}
      {!isSupported && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            color: '#92400e',
            borderRadius: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.88rem',
          }}
        >
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '1.1rem', color: '#d97706' }}></i>
          <span>
            Trình duyệt hiện tại chưa hỗ trợ Web Speech API đầy đủ. Khuyến nghị bạn sử dụng <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong> hoặc <strong>Cốc Cốc</strong> để tính năng nhận diện giọng nói hoạt động tốt nhất.
          </span>
        </div>
      )}

      {/* 2. Topic Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '16px',
        }}
      >
        {[{ id: 'ALL', name: 'Tất cả câu', icon: 'fa-layer-group', level: 'Mọi cấp độ' }, ...topics].map((t) => {
          const isActive = activeTopic === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTopic(t.id);
                setCurrentIndex(0);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: isActive ? '1px solid #0284c7' : '1px solid #e2e8f0',
                background: isActive ? '#f0f9ff' : '#ffffff',
                color: isActive ? '#0284c7' : '#475569',
                fontWeight: isActive ? '700' : '600',
                fontSize: '0.84rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <i className={`fa-solid ${t.icon || 'fa-tag'}`} style={{ color: isActive ? '#0284c7' : '#94a3b8' }}></i>
              <span>{t.name}</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  background: isActive ? '#bae6fd' : '#f1f5f9',
                  color: isActive ? '#0369a1' : '#64748b',
                  fontWeight: '700',
                }}
              >
                {t.level}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Practice Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.04)',
          padding: '32px 28px',
          position: 'relative',
        }}
      >
        {/* Card Header: Topic Badge & Sentence Counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                backgroundColor: '#ede9fe',
                color: '#6d28d9',
                fontWeight: '800',
                fontSize: '0.72rem',
                padding: '4px 8px',
                borderRadius: '6px',
              }}
            >
              CẤP ĐỘ {currentSentence?.level || 'A1'}
            </span>
            <span
              style={{
                backgroundColor: '#f1f5f9',
                color: '#475569',
                fontWeight: '700',
                fontSize: '0.72rem',
                padding: '4px 8px',
                borderRadius: '6px',
              }}
            >
              {currentSentence?.topic === 'MISTAKES'
                ? '🎯 Câu ôn tập lỗi sai'
                : 'Chủ đề: ' + (topics.find((tp) => tp.id === currentSentence?.topic)?.name || currentSentence?.topic || 'DAILY')}
            </span>
          </div>

          <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#64748b' }}>
            Câu {currentIndex + 1} / {filteredSentences.length}
          </div>
        </div>

        {/* Target Sentence Display */}
        <div style={{ textAlign: 'center', margin: '16px 0 24px' }}>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              color: '#0f172a',
              lineHeight: 1.45,
              maxWidth: '800px',
              margin: '0 auto 10px',
              letterSpacing: '-0.01em',
            }}
          >
            "{currentSentence?.sentence}"
          </div>
          <div style={{ fontSize: '0.98rem', color: '#64748b', fontWeight: '500', marginBottom: '14px' }}>
            {currentSentence?.translation}
          </div>

          {/* Pronunciation Tip */}
          {currentSentence?.tips && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.82rem',
                color: '#92400e',
              }}
            >
              <i className="fa-solid fa-lightbulb" style={{ color: '#d97706' }}></i>
              <span>{currentSentence.tips}</span>
            </div>
          )}
        </div>

        {/* Audio Sample Controls - Hỗ trợ phân biệt rõ ràng 1.0x Chuẩn và 0.8x Chậm */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <button
            onClick={() => handleListenSample(playbackSpeed)}
            disabled={isPlayingAudio}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 20px',
              borderRadius: '999px',
              border: '1px solid #cbd5e1',
              backgroundColor: isPlayingAudio ? '#f1f5f9' : '#ffffff',
              color: '#0f172a',
              fontWeight: '700',
              fontSize: '0.88rem',
              cursor: isPlayingAudio ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <i className={`fa-solid ${isPlayingAudio ? 'fa-volume-high' : 'fa-volume-low'}`} style={{ color: '#0284c7' }}></i>
            <span>{isPlayingAudio ? 'Đang phát âm...' : 'Nghe giọng bản xứ đọc'}</span>
          </button>

          {/* Speed selector */}
          <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: '999px', padding: '3px' }}>
            <button
              onClick={() => {
                setPlaybackSpeed(1.0);
                handleListenSample(1.0);
              }}
              style={{
                border: 'none',
                padding: '5px 12px',
                borderRadius: '999px',
                background: playbackSpeed === 1.0 ? '#0284c7' : 'transparent',
                color: playbackSpeed === 1.0 ? 'white' : '#64748b',
                fontWeight: '700',
                fontSize: '0.76rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Phát âm với tốc độ chuẩn 1.0x"
            >
              1.0x Chuẩn
            </button>
            <button
              onClick={() => {
                setPlaybackSpeed(0.8);
                handleListenSample(0.8);
              }}
              style={{
                border: 'none',
                padding: '5px 12px',
                borderRadius: '999px',
                background: playbackSpeed === 0.8 ? '#0284c7' : 'transparent',
                color: playbackSpeed === 0.8 ? 'white' : '#64748b',
                fontWeight: '700',
                fontSize: '0.76rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Phát âm chậm rãi và rõ từng âm (0.8x)"
            >
              0.8x Chậm
            </button>
          </div>
        </div>

        {/* 4. Microphone Speaking Center Action */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              onClick={toggleListening}
              style={{
                width: '78px',
                height: '78px',
                borderRadius: '50%',
                border: 'none',
                background: isListening
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: 'white',
                fontSize: '1.8rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: isListening
                  ? '0 0 20px rgba(239, 68, 68, 0.5)'
                  : '0 8px 20px rgba(2, 132, 199, 0.35)',
                transition: 'all 0.2s ease',
                margin: '0 auto',
              }}
              title={isListening ? 'Bấm để dừng ghi âm' : 'Bấm để bắt đầu đọc'}
            >
              <i className={`fa-solid ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
            </button>
          </div>

          <div style={{ marginTop: '14px' }}>
            <div style={{ fontWeight: '800', fontSize: '1rem', color: isListening ? '#dc2626' : '#0f172a' }}>
              {isListening ? 'Đang lắng nghe giọng bạn... Hãy đọc to câu tiếng Anh trên!' : 'Nhấn Micro để bắt đầu luyện nói'}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
              {isListening ? 'Nói xong hệ thống sẽ tự động nhận diện hoặc bạn có thể bấm nút dừng' : 'Đọc rõ ràng từng từ với âm lượng vừa phải'}
            </div>
          </div>

          {/* Real-time transcribed text */}
          {recognizedText && (
            <div
              style={{
                marginTop: '14px',
                padding: '10px 18px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px dashed #cbd5e1',
                display: 'inline-block',
                maxWidth: '650px',
                color: '#334155',
                fontSize: '0.92rem',
              }}
            >
              <i className="fa-solid fa-waveform-lines" style={{ marginRight: '8px', color: '#0284c7' }}></i>
              AI đang nghe: <strong>"{recognizedText}"</strong>
            </div>
          )}

          {/* Speech Error Banner */}
          {speechError && (
            <div
              style={{
                marginTop: '14px',
                padding: '10px 16px',
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '8px',
                color: '#b91c1c',
                fontSize: '0.84rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{speechError}</span>
            </div>
          )}
        </div>

        {/* 5. Evaluation Result Card - Phân tích chi tiết lỗi sai, thiếu từ, từ thừa */}
        {evaluationResult && (
          <div
            style={{
              marginTop: '24px',
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              animation: 'fadeIn 0.25s ease-in-out',
            }}
          >
            {/* Feedback Alert Notice */}
            {evaluationResult.feedbackNotice && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                  background:
                    evaluationResult.feedbackNotice.type === 'error'
                      ? '#fef2f2'
                      : evaluationResult.feedbackNotice.type === 'warning'
                      ? '#fffbeb'
                      : evaluationResult.feedbackNotice.type === 'success'
                      ? '#ecfdf5'
                      : '#f0f9ff',
                  color:
                    evaluationResult.feedbackNotice.type === 'error'
                      ? '#b91c1c'
                      : evaluationResult.feedbackNotice.type === 'warning'
                      ? '#b45309'
                      : evaluationResult.feedbackNotice.type === 'success'
                      ? '#047857'
                      : '#0369a1',
                  border: `1px solid ${
                    evaluationResult.feedbackNotice.type === 'error'
                      ? '#fecaca'
                      : evaluationResult.feedbackNotice.type === 'warning'
                      ? '#fde68a'
                      : evaluationResult.feedbackNotice.type === 'success'
                      ? '#a7f3d0'
                      : '#bae6fd'
                  }`,
                }}
              >
                <i
                  className={`fa-solid ${
                    evaluationResult.feedbackNotice.type === 'error'
                      ? 'fa-circle-xmark'
                      : evaluationResult.feedbackNotice.type === 'warning'
                      ? 'fa-triangle-exclamation'
                      : evaluationResult.feedbackNotice.type === 'success'
                      ? 'fa-circle-check'
                      : 'fa-circle-info'
                  }`}
                  style={{ fontSize: '1.1rem' }}
                ></i>
                <span style={{ lineHeight: 1.4 }}>{evaluationResult.feedbackNotice.message}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Score gauge circle */}
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background:
                      evaluationResult.score >= 80
                        ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                        : evaluationResult.score >= 50
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontWeight: '900',
                  }}
                >
                  <span style={{ fontSize: '1.15rem', lineHeight: 1 }}>{evaluationResult.score}%</span>
                  <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', opacity: 0.9 }}>Độ chuẩn</span>
                </div>

                <div>
                  <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0f172a' }}>
                    {evaluationResult.score >= 85
                      ? '🌟 Phát âm rất chuẩn xác!'
                      : evaluationResult.score >= 50
                      ? '👍 Khá tốt! Cần chú ý hoàn thiện các từ'
                      : '💪 Cần luyện thêm! Hãy nghe mẫu và đọc lại'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                    Đã đọc đúng: <strong>{evaluationResult.matchedCount}/{evaluationResult.targetCount} từ</strong>
                    {evaluationResult.missingCount > 0 && <span style={{ color: '#dc2626', marginLeft: '6px' }}>(Thiếu {evaluationResult.missingCount} từ)</span>}
                  </div>
                </div>
              </div>

              {/* Retry & Next buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={toggleListening}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    color: '#334155',
                    fontWeight: '700',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  <i className="fa-solid fa-rotate-right" style={{ marginRight: '5px' }}></i> Đọc lại
                </button>
                <button
                  onClick={handleNext}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0284c7',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  Câu tiếp theo <i className="fa-solid fa-arrow-right" style={{ marginLeft: '5px' }}></i>
                </button>
              </div>
            </div>

            {/* Word-by-word Breakdown of Target Sentence */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                Đối chiếu từng từ trong câu mẫu:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {evaluationResult.wordResults.map((item, idx) => {
                  let bg = '#dcfce7';
                  let color = '#15803d';
                  let borderColor = '#86efac';
                  let label = 'Đúng';

                  if (item.status === 'close') {
                    bg = '#fef3c7';
                    color = '#b45309';
                    borderColor = '#fcd34d';
                    label = 'Gần đúng';
                  } else if (item.status === 'missing' || item.status === 'incorrect') {
                    bg = '#fee2e2';
                    color = '#b91c1c';
                    borderColor = '#fca5a5';
                    label = 'Chưa đọc / Thiếu';
                  }

                  return (
                    <span
                      key={idx}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        background: bg,
                        color: color,
                        border: `1px solid ${borderColor}`,
                        fontSize: '0.88rem',
                        fontWeight: '700',
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                      title={`Trạng thái: ${label}`}
                    >
                      <span>{item.word}</span>
                      <span style={{ fontSize: '0.62rem', fontWeight: '600', opacity: 0.85 }}>{label}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Hiển thị riêng các từ học viên đã đọc để làm rõ nếu học viên đọc từ ngoài câu mẫu */}
            {evaluationResult.spokenWordsAnalysis && evaluationResult.spokenWordsAnalysis.length > 0 && (
              <div style={{ marginBottom: '12px', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginRight: '8px' }}>
                  Giọng bạn đã đọc:
                </span>
                <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '6px' }}>
                  {evaluationResult.spokenWordsAnalysis.map((item, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        background: item.isMatched ? '#ecfdf5' : '#fee2e2',
                        color: item.isMatched ? '#047857' : '#b91c1c',
                        border: `1px solid ${item.isMatched ? '#a7f3d0' : '#fecaca'}`,
                      }}
                    >
                      {item.word} {!item.isMatched && '(không có trong câu)'}
                    </span>
                  ))}
                </span>
              </div>
            )}

            {/* Color Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.74rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#22c55e' }}></span> Phát âm đúng
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f59e0b' }}></span> Gần chuẩn / nhẹ âm
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444' }}></span> Sai hoặc bỏ sót
              </span>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '18px',
            marginTop: '20px',
          }}
        >
          <button
            onClick={handlePrev}
            style={{
              background: 'none',
              border: '1px solid #cbd5e1',
              padding: '7px 16px',
              borderRadius: '8px',
              color: '#475569',
              fontWeight: '600',
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-arrow-left"></i> Câu trước
          </button>

          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Nhấn "Câu tiếp theo" để luyện tập câu kế tiếp
          </span>

          <button
            onClick={handleNext}
            style={{
              background: '#0284c7',
              border: 'none',
              padding: '7px 18px',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Câu tiếp theo <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

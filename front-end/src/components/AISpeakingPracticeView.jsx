import React, { useState, useEffect, useRef } from 'react';
import { recommendationAPI } from '../services/api';

// Danh mục các chủ đề và câu luyện nói chuẩn theo CEFR
const SPEAKING_TOPICS = [
  { id: 'ALL', name: 'Tất cả câu', icon: 'fa-layer-group', level: 'Mọi cấp độ' },
  { id: 'DAILY', name: 'Giao tiếp hàng ngày', icon: 'fa-mug-hot', level: 'A1 - A2' },
  { id: 'WORKPLACE', name: 'Công sở & Phỏng vấn', icon: 'fa-briefcase', level: 'B1 - B2' },
  { id: 'TRAVEL', name: 'Du lịch & Ẩm thực', icon: 'fa-plane-departure', level: 'A2 - B1' },
  { id: 'MISTAKES', name: 'Luyện từ câu làm sai', icon: 'fa-rotate-right', level: 'Cá nhân hóa' },
  { id: 'ACADEMIC', name: 'Học thuật & Thuyết trình', icon: 'fa-graduation-cap', level: 'B2 - C1' },
];

const DEFAULT_SENTENCES = [
  {
    id: 's1',
    topic: 'DAILY',
    level: 'A1',
    sentence: 'Nice to meet you. I am excited to learn English every day.',
    translation: 'Rất vui được gặp bạn. Tôi rất hào hứng học tiếng Anh mỗi ngày.',
    tips: 'Chú ý phát âm rõ âm /s/ trong "excited" và nối âm "learn_English".',
  },
  {
    id: 's2',
    topic: 'DAILY',
    level: 'A2',
    sentence: 'I usually drink a cup of warm coffee before going to work.',
    translation: 'Tôi thường uống một tách cà phê ấm trước khi đi làm.',
    tips: 'Nhấn trọng âm vào từ "usually" (/ˈjuː.ʒu.ə.li/) và "coffee" (/ˈkɒf.i/).',
  },
  {
    id: 's3',
    topic: 'DAILY',
    level: 'A2',
    sentence: 'Can you tell me how to get to the nearest bus station?',
    translation: 'Bạn có thể chỉ cho tôi đường đến trạm xe buýt gần nhất không?',
    tips: 'Lên giọng nhẹ ở cuối câu hỏi Yes/No, bật âm đuôi /t/ ở "nearest".',
  },
  {
    id: 's4',
    topic: 'WORKPLACE',
    level: 'B1',
    sentence: 'I have over two years of experience in software development.',
    translation: 'Tôi có hơn hai năm kinh nghiệm trong lĩnh vực phát triển phần mềm.',
    tips: 'Phát âm chuẩn âm /v/ trong "development" (/dɪˈvel.əp.mənt/).',
  },
  {
    id: 's5',
    topic: 'WORKPLACE',
    level: 'B2',
    sentence: 'Effective communication and teamwork are critical for our project success.',
    translation: 'Giao tiếp hiệu quả và làm việc nhóm là yếu tố then chốt cho thành công của dự án.',
    tips: 'Chú ý nhấn âm 2 ở "Effective" và "success", âm 1 ở "critical".',
  },
  {
    id: 's6',
    topic: 'WORKPLACE',
    level: 'B2',
    sentence: 'We should schedule a brief meeting tomorrow to review the project milestones.',
    translation: 'Chúng ta nên lên lịch một cuộc họp ngắn vào ngày mai để xem xét các cột mốc dự án.',
    tips: 'Từ "schedule" phát âm là /ˈskedʒ.uːl/ (US) hoặc /ˈʃedʒ.uːl/ (UK).',
  },
  {
    id: 's7',
    topic: 'TRAVEL',
    level: 'A2',
    sentence: 'Could I have a table for two near the window, please?',
    translation: 'Cho tôi xin một bàn hai người gần cửa sổ được không ạ?',
    tips: 'Nối âm "Could_I", bật âm /z/ trong "please".',
  },
  {
    id: 's8',
    topic: 'TRAVEL',
    level: 'B1',
    sentence: 'I would like to check in for my flight to Singapore this afternoon.',
    translation: 'Tôi muốn làm thủ tục lên máy bay cho chuyến bay đến Singapore chiều nay.',
    tips: 'Cụm "check in" nối âm đọc liền thành /tʃek ɪn/.',
  },
  {
    id: 's9',
    topic: 'TRAVEL',
    level: 'B1',
    sentence: 'How much does a round-trip ticket to the city center cost?',
    translation: 'Vé khứ hồi đến trung tâm thành phố có giá bao nhiêu?',
    tips: 'Phát âm rõ cụm "round-trip" (/ˌraʊndˈtrɪp/) và âm /kɒst/.',
  },
  {
    id: 's10',
    topic: 'ACADEMIC',
    level: 'B2',
    sentence: 'Artificial intelligence is fundamentally revolutionizing modern education.',
    translation: 'Trí tuệ nhân tạo đang cách mạng hóa căn bản nền giáo dục hiện đại.',
    tips: 'Chú ý phát âm rõ các âm đa tiết: fundamentally (/ˌfʌn.dəˈmen.təl.i/) và revolutionizing.',
  },
  {
    id: 's11',
    topic: 'ACADEMIC',
    level: 'C1',
    sentence: 'Sustainable economic growth requires continuous innovation and research.',
    translation: 'Tăng trưởng kinh tế bền vững đòi hỏi sự đổi mới sáng tạo và nghiên cứu liên tục.',
    tips: 'Trọng âm từ "Sustainable" rơi vào âm tiết thứ hai (/səˈsteɪ.nə.bəl/).',
  },
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

// Đánh giá phát âm từng từ và tính điểm phần trăm
function evaluateSpeech(targetSentence, spokenSentence) {
  const targetWords = targetSentence.split(/\s+/).filter(Boolean);
  const spokenWords = spokenSentence.split(/\s+/).filter(Boolean).map(cleanWord);

  let totalScore = 0;
  let spokenIndex = 0;

  const wordResults = targetWords.map((originalWord) => {
    const targetClean = cleanWord(originalWord);
    if (!targetClean) {
      return { word: originalWord, status: 'correct', score: 100 };
    }

    // Tìm kiếm trong cửa sổ gần nhất của spokenWords
    let bestMatchStatus = 'missing';
    let bestMatchScore = 0;
    let matchedIdx = -1;

    for (let j = spokenIndex; j < Math.min(spokenIndex + 3, spokenWords.length); j++) {
      const sw = spokenWords[j];
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
    }

    totalScore += bestMatchScore;
    return {
      word: originalWord,
      clean: targetClean,
      status: bestMatchStatus,
      score: bestMatchScore,
    };
  });

  const finalPercent = targetWords.length > 0 ? Math.round(totalScore / targetWords.length) : 0;
  return {
    score: finalPercent,
    wordResults,
    spokenText: spokenSentence,
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
  const [sentences, setSentences] = useState(DEFAULT_SENTENCES);
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
            setSentences((prev) => [...prev, ...mistakeSentences]);
          }
        }
      } catch (err) {
        // Fallback nhẹ nếu chưa có API mistakes hoặc chưa đăng nhập
      }
    }
    fetchMistakesAsSentences();
    return () => {
      isMounted = false;
    };
  }, []);

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
        const currentText = final || interim;
        setRecognizedText(currentText);

        if (final) {
          handleEvaluate(final);
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'no-speech') {
          setSpeechError('Không nhận diện được giọng nói. Hãy kiểm tra Micro và đọc lại to rõ nhé!');
        } else if (event.error === 'not-allowed') {
          setSpeechError('Quyền truy cập Micro bị từ chối. Vui lòng cho phép quyền Micro trên trình duyệt.');
        } else {
          setSpeechError(`Lỗi nhận diện âm thanh (${event.error}). Vui lòng thử lại!`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
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
  }, []);

  // Lọc câu theo chủ đề được chọn
  const filteredSentences = sentences.filter((s) => {
    if (activeTopic === 'ALL') return true;
    return s.topic === activeTopic;
  });

  const currentSentence = filteredSentences[currentIndex] || filteredSentences[0] || DEFAULT_SENTENCES[0];

  // Reset kết quả khi chuyển câu hoặc đổi topic
  useEffect(() => {
    setEvaluationResult(null);
    setRecognizedText('');
    setSpeechError('');
    if (recognitionRef.current && isListening) {
      recognitionRef.current.abort();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  }, [currentIndex, activeTopic]);

  // Phát âm mẫu (Text-To-Speech)
  const handleListenSample = (speed = playbackSpeed) => {
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt không hỗ trợ phát âm thanh.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentSentence.sentence);
    utterance.lang = 'en-US';
    utterance.rate = speed;
    utterance.pitch = 1.0;

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
        recognitionRef.current.stop();
      }
    } else {
      setEvaluationResult(null);
      setSpeechError('');
      setRecognizedText('');
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  // Đánh giá phát âm
  const handleEvaluate = (spoken) => {
    if (!spoken || !currentSentence) return;
    const result = evaluateSpeech(currentSentence.sentence, spoken);
    setEvaluationResult(result);
    setSessionCompletedCount((prev) => prev + 1);
    setScoresHistory((prev) => [...prev, result.score]);
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
    <div className="speaking-practice-container" style={{ maxWidth: '1180px', margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* 1. Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '20px',
          padding: '28px 32px',
          color: 'white',
          marginBottom: '24px',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                backgroundColor: '#0284c7',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '800',
                padding: '3px 10px',
                borderRadius: '999px',
                letterSpacing: '0.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <i className="fa-solid fa-microphone-lines"></i> CÔNG NGHỆ NHẬN DIỆN GIỌNG NÓI AI
            </span>
            <span
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                fontSize: '0.72rem',
                fontWeight: '800',
                padding: '3px 8px',
                borderRadius: '999px',
              }}
            >
              CHUẨN CEFR
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '900', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Phòng Luyện Nói & Phát Âm AI
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem', maxWidth: '650px', lineHeight: 1.5 }}>
            Luyện nói theo mẫu chuẩn sư phạm từ giáo trình, AI lắng nghe và chấm điểm phát âm từng từ theo thời gian thực (như ELSA Speak & Duolingo).
          </p>
        </div>

        {/* Quick Session Stats */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '12px 20px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              textAlign: 'center',
              minWidth: '95px',
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#38bdf8' }}>{sessionCompletedCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: '600' }}>Câu đã luyện</div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '12px 20px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              textAlign: 'center',
              minWidth: '95px',
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: averageScore >= 80 ? '#4ade80' : averageScore >= 60 ? '#fbbf24' : '#f87171' }}>
              {averageScore > 0 ? `${averageScore}%` : '--'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: '600' }}>Điểm TB</div>
          </div>

          {onNavigateToAICoach && (
            <button
              onClick={onNavigateToAICoach}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                border: 'none',
                color: 'white',
                fontWeight: '700',
                padding: '0 18px',
                borderRadius: '14px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
              }}
              title="Chuyển sang phòng trò chuyện tự do cùng trợ lý AI"
            >
              <i className="fa-solid fa-comments" style={{ fontSize: '1.1rem' }}></i>
              <span style={{ fontSize: '0.75rem' }}>Giao tiếp AI →</span>
            </button>
          )}
        </div>
      </div>

      {/* Cảnh báo trình duyệt nếu không hỗ trợ Speech Recognition */}
      {!isSupported && (
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            color: '#92400e',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '1.2rem', color: '#d97706' }}></i>
          <span style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>
            Trình duyệt của bạn hiện chưa hỗ trợ Web Speech API đầy đủ. Khuyến nghị bạn mở hệ thống trên <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong> hoặc <strong>Cốc Cốc</strong> để tính năng nhận diện giọng nói hoạt động mượt mà nhất.
          </span>
        </div>
      )}

      {/* 2. Topic Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '20px',
        }}
      >
        {SPEAKING_TOPICS.map((t) => {
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
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                border: isActive ? '2px solid #0284c7' : '1px solid #e2e8f0',
                background: isActive ? '#f0f9ff' : 'white',
                color: isActive ? '#0369a1' : '#475569',
                fontWeight: isActive ? '700' : '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 2px 8px rgba(2, 132, 199, 0.15)' : 'none',
              }}
            >
              <i className={`fa-solid ${t.icon}`} style={{ color: isActive ? '#0284c7' : '#94a3b8' }}></i>
              <span>{t.name}</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '6px',
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
          background: 'white',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
          padding: '36px 32px',
          marginBottom: '24px',
          position: 'relative',
        }}
      >
        {/* Card Header: Topic Badge & Sentence Counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                backgroundColor: '#ede9fe',
                color: '#6d28d9',
                fontWeight: '800',
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '8px',
              }}
            >
              CẤP ĐỘ {currentSentence.level}
            </span>
            <span
              style={{
                backgroundColor: '#f1f5f9',
                color: '#475569',
                fontWeight: '700',
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '8px',
              }}
            >
              {currentSentence.topic === 'MISTAKES' ? '🎯 Câu ôn tập lỗi sai' : 'Chủ đề: ' + currentSentence.topic}
            </span>
          </div>

          <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#64748b' }}>
            Câu {currentIndex + 1} / {filteredSentences.length}
          </div>
        </div>

        {/* Target Sentence Display */}
        <div style={{ textAlign: 'center', margin: '20px 0 30px' }}>
          <div
            style={{
              fontSize: '1.65rem',
              fontWeight: '800',
              color: '#0f172a',
              lineHeight: 1.45,
              maxWidth: '850px',
              margin: '0 auto 12px',
              letterSpacing: '-0.01em',
            }}
          >
            "{currentSentence.sentence}"
          </div>
          <div style={{ fontSize: '1.05rem', color: '#64748b', fontWeight: '500', marginBottom: '16px' }}>
            {currentSentence.translation}
          </div>

          {/* Pronunciation Tip */}
          {currentSentence.tips && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '0.85rem',
                color: '#475569',
              }}
            >
              <i className="fa-solid fa-lightbulb" style={{ color: '#eab308' }}></i>
              <span>{currentSentence.tips}</span>
            </div>
          )}
        </div>

        {/* Audio Sample Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <button
            onClick={() => handleListenSample(playbackSpeed)}
            disabled={isPlayingAudio}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '999px',
              border: '1px solid #cbd5e1',
              backgroundColor: isPlayingAudio ? '#f1f5f9' : 'white',
              color: '#0f172a',
              fontWeight: '700',
              fontSize: '0.92rem',
              cursor: isPlayingAudio ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
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
                padding: '6px 12px',
                borderRadius: '999px',
                background: playbackSpeed === 1.0 ? '#0284c7' : 'transparent',
                color: playbackSpeed === 1.0 ? 'white' : '#64748b',
                fontWeight: '700',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
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
                padding: '6px 12px',
                borderRadius: '999px',
                background: playbackSpeed === 0.8 ? '#0284c7' : 'transparent',
                color: playbackSpeed === 0.8 ? 'white' : '#64748b',
                fontWeight: '700',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              0.8x Chậm
            </button>
          </div>
        </div>

        {/* 4. Microphone Speaking Center Action */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Visualizer animation ring when listening */}
            {isListening && (
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '-12px',
                  right: '-12px',
                  bottom: '-12px',
                  borderRadius: '50%',
                  border: '3px solid #ef4444',
                  animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
            )}

            <button
              onClick={toggleListening}
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                border: 'none',
                background: isListening
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: 'white',
                fontSize: '2rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: isListening
                  ? '0 0 25px rgba(239, 68, 68, 0.6)'
                  : '0 10px 25px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.25s ease',
                margin: '0 auto',
              }}
              title={isListening ? 'Bấm để dừng ghi âm' : 'Bấm để bắt đầu đọc'}
            >
              <i className={`fa-solid ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
            </button>
          </div>

          <div style={{ marginTop: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '1.05rem', color: isListening ? '#dc2626' : '#0f172a' }}>
              {isListening ? 'Đang lắng nghe giọng bạn... Hãy đọc to câu tiếng Anh trên!' : 'Nhấn Micro để bắt đầu luyện nói'}
            </div>
            <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '4px' }}>
              {isListening ? 'Hệ thống sẽ tự nhận diện khi bạn nói xong hoặc bấm nút dừng' : 'Đọc rõ ràng từng từ với âm lượng vừa phải'}
            </div>
          </div>

          {/* Real-time transcribed text */}
          {recognizedText && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 20px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px dashed #cbd5e1',
                display: 'inline-block',
                maxWidth: '650px',
                color: '#334155',
                fontSize: '0.95rem',
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
                marginTop: '16px',
                padding: '10px 18px',
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '10px',
                color: '#b91c1c',
                fontSize: '0.88rem',
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

        {/* 5. Evaluation Result Card (Khi đã chấm điểm xong) */}
        {evaluationResult && (
          <div
            style={{
              marginTop: '32px',
              padding: '24px',
              borderRadius: '18px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              animation: 'fadeIn 0.3s ease-in-out',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Score gauge circle */}
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background:
                      evaluationResult.score >= 80
                        ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                        : evaluationResult.score >= 60
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontWeight: '900',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  }}
                >
                  <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{evaluationResult.score}%</span>
                  <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', opacity: 0.9 }}>Độ chuẩn</span>
                </div>

                <div>
                  <div style={{ fontWeight: '800', fontSize: '1.15rem', color: '#0f172a' }}>
                    {evaluationResult.score >= 85
                      ? '🌟 Xuất sắc! Phát âm rất chuẩn xác'
                      : evaluationResult.score >= 65
                      ? '👍 Khá tốt! Chỉ cần chỉnh lại một vài từ'
                      : '💪 Cần luyện thêm! Hãy nghe lại mẫu và thử lại'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                    AI nhận diện giọng bạn: <em>"{evaluationResult.spokenText}"</em>
                  </div>
                </div>
              </div>

              {/* Retry & Next buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={toggleListening}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    color: '#334155',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  <i className="fa-solid fa-rotate-right" style={{ marginRight: '6px' }}></i> Đọc lại
                </button>
                <button
                  onClick={handleNext}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#0284c7',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  Câu tiếp theo <i className="fa-solid fa-arrow-right" style={{ marginLeft: '6px' }}></i>
                </button>
              </div>
            </div>

            {/* Word-by-word Breakdown Chips */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
                Chi tiết phát âm từng từ:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {evaluationResult.wordResults.map((item, idx) => {
                  let bg = '#dcfce7';
                  let color = '#15803d';
                  let borderColor = '#86efac';
                  let icon = 'fa-check';

                  if (item.status === 'close') {
                    bg = '#fef3c7';
                    color = '#b45309';
                    borderColor = '#fcd34d';
                    icon = 'fa-exclamation';
                  } else if (item.status === 'missing' || item.status === 'incorrect') {
                    bg = '#fee2e2';
                    color = '#b91c1c';
                    borderColor = '#fca5a5';
                    icon = 'fa-xmark';
                  }

                  return (
                    <span
                      key={idx}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: bg,
                        color: color,
                        border: `1px solid ${borderColor}`,
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>{item.word}</span>
                      <i className={`fa-solid ${icon}`} style={{ fontSize: '0.72rem' }}></i>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Color Legend */}
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.76rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></span> Phát âm đúng
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span> Gần chuẩn / nhẹ âm
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span> Sai hoặc bỏ sót
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
            paddingTop: '20px',
            marginTop: '24px',
          }}
        >
          <button
            onClick={handlePrev}
            style={{
              background: 'none',
              border: '1px solid #cbd5e1',
              padding: '8px 18px',
              borderRadius: '10px',
              color: '#475569',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-arrow-left"></i> Câu trước
          </button>

          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Dùng phím mũi tên hoặc bấm chuyển câu linh hoạt
          </span>

          <button
            onClick={handleNext}
            style={{
              background: '#0f172a',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '10px',
              color: 'white',
              fontWeight: '700',
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

      {/* 6. Quick Sentence Queue List */}
      <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>
          Danh sách câu trong phần này ({filteredSentences.length} câu)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
          {filteredSentences.map((s, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <div
                key={s.id || idx}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  background: isSelected ? '#f0f9ff' : '#fafafa',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: isSelected ? '800' : '600',
                      color: isSelected ? '#0369a1' : '#1e293b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    #{idx + 1}. {s.sentence}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    {s.translation}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: isSelected ? '#bae6fd' : '#e2e8f0',
                    color: isSelected ? '#0369a1' : '#475569',
                    flexShrink: 0,
                  }}
                >
                  {s.level}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

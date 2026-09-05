import React, { useState, useEffect, useMemo } from 'react';
import { recommendationAPI } from '../services/api';
import WeakTopicPracticeModal from './WeakTopicPracticeModal';

export default function AdaptivePathView({
  myCourses = [],
  myAttempts = [],
  user,
  onNavigateToCourses,
  onNavigateToLearning,
  onNavigateToQuiz,
}) {
  const [mistakeData, setMistakeData] = useState({
    has_enrolled_courses: false,
    has_quiz_attempts: false,
    total_mistakes: 0,
    weak_topics: [],
    mistakes: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMistakeIds, setSelectedMistakeIds] = useState(new Set());
  const [filterTopic, setFilterTopic] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [practiceModal, setPracticeModal] = useState({
    isOpen: false,
    topic: '',
    subTopic: '',
    topics: [],
    level: 'B1',
  });

  const fetchMistakes = async () => {
    setIsLoading(true);
    try {
      const res = await recommendationAPI.getStudentMistakes();
      const data = res.data?.data || res.data || {};
      setMistakeData({
        has_enrolled_courses: data.has_enrolled_courses || (myCourses && myCourses.length > 0),
        has_quiz_attempts: data.has_quiz_attempts || (myAttempts && myAttempts.length > 0),
        total_mistakes: data.total_mistakes || 0,
        weak_topics: data.weak_topics || [],
        mistakes: data.mistakes || [],
      });
      // Mặc định chọn tất cả các câu sai để tiện luyện tập
      if (Array.isArray(data.mistakes)) {
        setSelectedMistakeIds(new Set(data.mistakes.map((m) => m.id)));
      }
    } catch (err) {
      console.warn('Lỗi khi tải dữ liệu phân tích lỗi sai:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMistakes();
  }, []);

  // Lọc danh sách câu hỏi làm sai theo chủ đề và từ khóa tìm kiếm
  const filteredMistakes = useMemo(() => {
    return (mistakeData.mistakes || []).filter((m) => {
      const matchTopic = filterTopic === 'ALL' || m.topic === filterTopic;
      const matchSearch =
        !searchQuery ||
        m.question_content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.reason?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTopic && matchSearch;
    });
  }, [mistakeData.mistakes, filterTopic, searchQuery]);

  // Chọn / bỏ chọn 1 câu hỏi
  const handleToggleSelectMistake = (id) => {
    setSelectedMistakeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Chọn tất cả / Bỏ chọn tất cả
  const handleToggleSelectAll = () => {
    if (selectedMistakeIds.size === filteredMistakes.length) {
      setSelectedMistakeIds(new Set());
    } else {
      setSelectedMistakeIds(new Set(filteredMistakes.map((m) => m.id)));
    }
  };

  // Luyện tập 1 chủ đề cụ thể
  const handlePracticeSingleTopic = (topicObj) => {
    setPracticeModal({
      isOpen: true,
      topic: topicObj.topic,
      subTopic: topicObj.sub_topic || '',
      topics: [topicObj.topic],
      level: topicObj.difficulty || 'B1',
    });
  };

  // Luyện tập 1 câu hỏi cụ thể
  const handlePracticeSingleMistake = (mistake) => {
    setPracticeModal({
      isOpen: true,
      topic: mistake.topic,
      subTopic: mistake.sub_topic || '',
      topics: [mistake.topic],
      level: mistake.difficulty || 'B1',
    });
  };

  // Luyện tập các lỗi sai đã chọn bằng checkbox
  const handlePracticeSelected = () => {
    const selectedList = (mistakeData.mistakes || []).filter((m) => selectedMistakeIds.has(m.id));
    if (selectedList.length === 0) {
      alert('Vui lòng chọn ít nhất một lỗi sai để luyện tập cùng AI.');
      return;
    }
    const topicSet = new Set(selectedList.map((m) => m.topic).filter(Boolean));
    const topicsArr = Array.from(topicSet);
    setPracticeModal({
      isOpen: true,
      topic: topicsArr.join(', '),
      subTopic: '',
      topics: topicsArr,
      level: selectedList[0]?.difficulty || 'B1',
    });
  };

  // Luyện tập toàn bộ lỗi sai
  const handlePracticeAll = () => {
    const topicsArr = (mistakeData.weak_topics || []).map((t) => t.topic).filter(Boolean);
    setPracticeModal({
      isOpen: true,
      topic: topicsArr.length > 0 ? topicsArr.join(', ') : 'Ôn tập ngữ pháp tổng hợp',
      subTopic: '',
      topics: topicsArr,
      level: mistakeData.weak_topics[0]?.difficulty || 'B1',
    });
  };

  // Điều kiện kiểm tra trạng thái học viên
  const hasEnrolledCourses = mistakeData.has_enrolled_courses || (myCourses && myCourses.length > 0);
  const hasQuizAttempts = mistakeData.has_quiz_attempts || (myAttempts && myAttempts.length > 0);
  const totalMistakes = mistakeData.total_mistakes || 0;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '50px' }}>
      {/* 1. Header Banner */}
      <div className="page-header-box" style={{ marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: '6px',
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                fontSize: '0.75rem',
                fontWeight: '800',
              }}
            >
              <i className="fa-solid fa-brain"></i>
              <span>AI MISTAKE ANALYTICS & ADAPTIVE QUIZ</span>
            </span>
            {totalMistakes > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                }}
              >
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>{totalMistakes} CÂU LÀM SAI CẦN BÙ ĐẮP</span>
              </span>
            )}
          </div>

          <h2 className="page-title" style={{ margin: 0 }}>
            <i className="fa-solid fa-circle-exclamation" style={{ color: '#ea580c' }}></i>
            <span>PHÂN TÍCH LỖI SAI TRẮC NGHIỆM & LUYỆN TẬP CÙNG AI</span>
          </h2>
          <p className="page-subtitle" style={{ margin: '6px 0 0' }}>
            AI đọc toàn bộ câu trả lời trắc nghiệm của bạn từ CSDL, bóc tách bản chất lỗi sai ngữ pháp / từ vựng và tự động tạo bài trắc nghiệm bù đắp kiến thức.
          </p>
        </div>

        <button
          className="btn-secondary"
          onClick={fetchMistakes}
          disabled={isLoading}
          style={{
            fontSize: '0.85rem',
            padding: '8px 16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <i className={`fa-solid ${isLoading ? 'fa-spinner fa-spin' : 'fa-arrows-rotate'}`}></i>
          <span>{isLoading ? 'Đang phân tích...' : 'Quét Lại Lỗi Sai'}</span>
        </button>
      </div>

      {/* 2. TRƯỜNG HỢP 1: HỌC VIÊN CHƯA ĐĂNG KÝ KHÓA HỌC NÀO */}
      {!hasEnrolledCourses ? (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.4rem',
              margin: '0 auto 20px',
            }}
          >
            <i className="fa-solid fa-graduation-cap"></i>
          </div>

          <h3 style={{ fontSize: '1.45rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '10px' }}>
            Bạn Chưa Đăng Ký Khóa Học Nào
          </h3>

          <p style={{ fontSize: '0.94rem', color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto 28px', lineHeight: 1.6 }}>
            Để Trợ lý AI có thể phân tích các lỗi sai và lỗ hổng kiến thức cho bạn, hãy đăng ký một khóa học tiếng Anh và hoàn thành các bài trắc nghiệm. AI sẽ tự động phát hiện những điểm bạn còn yếu và thiết kế bài luyện tập thích ứng dành riêng cho bạn!
          </p>

          <button
            className="btn-primary"
            onClick={onNavigateToCourses}
            style={{
              padding: '12px 28px',
              fontSize: '0.95rem',
              fontWeight: '800',
              backgroundColor: '#0284c7',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
            }}
          >
            <i className="fa-solid fa-compass"></i>
            <span>Khám Phá Danh Mục Khóa Học Ngay</span>
          </button>
        </div>
      ) : !hasQuizAttempts ? (
        /* 3. TRƯỜNG HỢP 2: ĐÃ ĐĂNG KÝ KHÓA HỌC NHƯNG CHƯA LÀM BÀI TRẮC NGHIỆM NÀO */
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#fff7ed',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.4rem',
              margin: '0 auto 20px',
            }}
          >
            <i className="fa-solid fa-clipboard-question"></i>
          </div>

          <h3 style={{ fontSize: '1.45rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '10px' }}>
            Chưa Có Dữ Liệu Bài Kiểm Tra Trắc Nghiệm
          </h3>

          <p style={{ fontSize: '0.94rem', color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto 28px', lineHeight: 1.6 }}>
            Bạn đã đăng ký khóa học! Bây giờ, hãy hoàn thành các bài trắc nghiệm trong khóa học hoặc vào phần Luyện đề. Ngay khi có câu trả lời sai, AI sẽ tự động gom nhóm lỗi sai và hỗ trợ bạn tạo bài ôn luyện ngay tại đây.
          </p>

          <button
            className="btn-primary"
            onClick={onNavigateToQuiz}
            style={{
              padding: '12px 28px',
              fontSize: '0.95rem',
              fontWeight: '800',
              backgroundColor: '#ea580c',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
            }}
          >
            <i className="fa-solid fa-pencil"></i>
            <span>Vào Làm Bài Trắc Nghiệm Ngay</span>
          </button>
        </div>
      ) : totalMistakes === 0 ? (
        /* 4. TRƯỜNG HỢP 3: ĐÃ LÀM BÀI VÀ KHÔNG CÓ LỖI SAI NÀO */
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.4rem',
              margin: '0 auto 20px',
            }}
          >
            <i className="fa-solid fa-award"></i>
          </div>

          <h3 style={{ fontSize: '1.45rem', fontWeight: '900', color: '#16a34a', marginBottom: '10px' }}>
            Xuất Sắc! Không Có Lỗi Sai Nào Được Ghi Nhận
          </h3>

          <p style={{ fontSize: '0.94rem', color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Toàn bộ các câu hỏi trắc nghiệm bạn đã làm đều đạt kết quả chính xác 100%. Bạn có thể tiếp tục thử thách với các bài thi trắc nghiệm trình độ cao hơn (B2, C1) để nâng cao phản xạ.
          </p>

          <button
            className="btn-primary"
            onClick={onNavigateToQuiz}
            style={{
              padding: '10px 24px',
              fontSize: '0.9rem',
              fontWeight: '800',
              backgroundColor: '#0284c7',
              borderRadius: 'var(--radius-full)',
            }}
          >
            Thử Sức Bài Thi Mới
          </button>
        </div>
      ) : (
        /* 5. TRƯỜNG HỢP 4: CÓ LỖI SAI -> HIỂN THỊ PHÂN TÍCH CHI TIẾT & CHỌN LUYỆN TẬP */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* A. Thống kê tổng hợp & Nút Luyện tập chính */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              flexWrap: 'wrap',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>
                CHẨN ĐOÁN LỖI SAI TỪ TRỢ LÝ AI
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--text-main)' }}>
                Phát hiện <span style={{ color: '#dc2626' }}>{totalMistakes} câu sai</span> thuộc{' '}
                <span style={{ color: '#0284c7' }}>{mistakeData.weak_topics.length} chủ đề kiến thức</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Chọn các lỗi sai bạn muốn ôn tập bên dưới, sau đó bấm nút để AI tự tạo bài trắc nghiệm kiểm tra lại.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handlePracticeSelected}
                disabled={selectedMistakeIds.size === 0}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: selectedMistakeIds.size > 0 ? '#ea580c' : '#cbd5e1',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: selectedMistakeIds.size > 0 ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: selectedMistakeIds.size > 0 ? '0 4px 14px rgba(234, 88, 12, 0.35)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                <span>Luyện Tập Lỗi Đã Chọn ({selectedMistakeIds.size})</span>
              </button>

              <button
                type="button"
                onClick={handlePracticeAll}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="fa-solid fa-bolt"></i>
                <span>Luyện Toàn Bộ Lỗi Sai</span>
              </button>
            </div>
          </div>

          {/* B. Bảng phân nhóm chủ đề sai (Weak Topic Cards) */}
          {mistakeData.weak_topics.length > 0 && (
            <div>
              <h3
                style={{
                  fontSize: '1.05rem',
                  fontWeight: '900',
                  color: 'var(--text-main)',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <i className="fa-solid fa-layer-group" style={{ color: '#0284c7' }}></i>
                <span>CÁC CHỦ ĐỀ HAY LÀM SAI NHẤT (PHÂN TÍCH BỞI AI LLM)</span>
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '16px',
                }}
              >
                {mistakeData.weak_topics.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderLeft: '4px solid #ea580c',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            fontSize: '0.72rem',
                            fontWeight: '800',
                          }}
                        >
                          {t.count} câu sai
                        </span>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#e0f2fe',
                            color: '#0284c7',
                            fontSize: '0.72rem',
                            fontWeight: '800',
                          }}
                        >
                          CEFR {t.difficulty || 'B1'}
                        </span>
                      </div>

                      <h4 style={{ margin: '0 0 6px', fontSize: '0.98rem', fontWeight: '800', color: 'var(--text-main)' }}>
                        {t.topic}
                      </h4>

                      {t.sub_topic && (
                        <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {t.sub_topic}
                        </p>
                      )}

                      {t.sample_reason && (
                        <p
                          style={{
                            margin: '0 0 14px',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--bg-subtle)',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            lineHeight: 1.4,
                          }}
                        >
                          <i className="fa-solid fa-quote-left" style={{ marginRight: '6px', color: '#94a3b8' }}></i>
                          {t.sample_reason.length > 120 ? t.sample_reason.substring(0, 120) + '...' : t.sample_reason}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePracticeSingleTopic(t)}
                      style={{
                        width: '100%',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        backgroundColor: '#fff7ed',
                        color: '#ea580c',
                        border: '1px solid #fdba74',
                        fontWeight: '800',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <i className="fa-solid fa-play"></i>
                      <span>Luyện Chủ Đề Này (AI Sinh 5 Câu)</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* C. Bộ lọc và danh sách chi tiết các câu hỏi làm sai */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <h3
                style={{
                  fontSize: '1.05rem',
                  fontWeight: '900',
                  color: 'var(--text-main)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <i className="fa-solid fa-list-check" style={{ color: '#4f46e5' }}></i>
                <span>DANH SÁCH CHI TIẾT TỪNG CÂU HỎI LÀM SAI ({filteredMistakes.length})</span>
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Lọc theo chủ đề */}
                <select
                  value={filterTopic}
                  onChange={(e) => setFilterTopic(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                  }}
                >
                  <option value="ALL">Tất cả chủ đề ({totalMistakes})</option>
                  {mistakeData.weak_topics.map((t, i) => (
                    <option key={i} value={t.topic}>
                      {t.topic} ({t.count})
                    </option>
                  ))}
                </select>

                {/* Ô tìm kiếm câu hỏi */}
                <input
                  type="text"
                  placeholder="Tìm nội dung câu hỏi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    width: '200px',
                  }}
                />

                {/* Nút chọn tất cả */}
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  {selectedMistakeIds.size === filteredMistakes.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              </div>
            </div>

            {/* Danh sách từng câu hỏi */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredMistakes.map((m, idx) => {
                const isSelected = selectedMistakeIds.has(m.id);
                return (
                  <div
                    key={m.id || idx}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid',
                      borderColor: isSelected ? '#ea580c' : 'var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '20px 24px',
                      boxShadow: isSelected ? '0 4px 12px rgba(234, 88, 12, 0.1)' : 'var(--shadow-sm)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Hàng trên: Checkbox + Tiêu đề bài thi + Chủ đề AI */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        marginBottom: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectMistake(m.id)}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor: '#ea580c',
                          }}
                        />
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0284c7' }}>
                          Câu {idx + 1}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          • {m.quiz_title} ({m.attempt_date})
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#fef3c7',
                            color: '#b45309',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                          }}
                        >
                          {m.topic}
                        </span>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#e0f2fe',
                            color: '#0284c7',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                          }}
                        >
                          CEFR {m.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Nội dung câu hỏi */}
                    <div
                      style={{
                        fontSize: '1rem',
                        fontWeight: '800',
                        color: 'var(--text-main)',
                        marginBottom: '14px',
                        lineHeight: 1.5,
                      }}
                    >
                      {m.question_content}
                    </div>

                    {/* Đối chiếu Đáp án bạn đã chọn vs Đáp án đúng */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '12px',
                        marginBottom: '14px',
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '8px',
                          padding: '10px 14px',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b91c1c', marginBottom: '4px' }}>
                          <i className="fa-solid fa-xmark" style={{ marginRight: '6px' }}></i>
                          ĐÁP ÁN BẠN ĐÃ CHỌN (SAI):
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#991b1b' }}>
                          {m.student_selected || '(Chưa chọn đáp án)'}
                        </div>
                      </div>

                      <div
                        style={{
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '8px',
                          padding: '10px 14px',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', marginBottom: '4px' }}>
                          <i className="fa-solid fa-check" style={{ marginRight: '6px' }}></i>
                          ĐÁP ÁN CHÍNH XÁC:
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#166534' }}>
                          {m.correct_answer}
                        </div>
                      </div>
                    </div>

                    {/* Phân tích học thuật của AI */}
                    {m.reason && (
                      <div
                        style={{
                          backgroundColor: 'var(--bg-subtle)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          marginBottom: '14px',
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                        }}
                      >
                        <strong style={{ color: '#4f46e5', display: 'block', marginBottom: '4px' }}>
                          <i className="fa-solid fa-lightbulb" style={{ marginRight: '6px' }}></i>
                          Giải thích chuyên sâu từ AI:
                        </strong>
                        {m.reason}
                      </div>
                    )}

                    {/* Nút Luyện câu này */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => handlePracticeSingleMistake(m)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          backgroundColor: 'transparent',
                          color: '#ea580c',
                          border: '1px solid #ea580c',
                          fontWeight: '800',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <i className="fa-solid fa-dumbbell"></i>
                        <span>Luyện Riêng Lỗi Sai Này Cùng AI</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Luyện Tập Câu Hỏi Mới Do AI Sinh Ra */}
      <WeakTopicPracticeModal
        isOpen={practiceModal.isOpen}
        onClose={() => setPracticeModal({ ...practiceModal, isOpen: false })}
        topic={practiceModal.topic}
        subTopic={practiceModal.subTopic}
        topics={practiceModal.topics}
        level={practiceModal.level || 'B1'}
      />
    </div>
  );
}

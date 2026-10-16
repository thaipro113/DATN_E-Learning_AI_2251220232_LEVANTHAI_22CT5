import React, { useState, useEffect, useMemo } from 'react';
import { recommendationAPI } from '../services/api';
import WeakTopicPracticeModal from './WeakTopicPracticeModal';
import Pagination from './Pagination';
import {
  formatTopicBilingual,
  getVietnameseTopicName,
  getCanonicalTopic,
  translateGrammarDescription,
  normalizeSearchText,
} from '../utils/grammarTranslations';

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [customQuantity, setCustomQuantity] = useState(5);
  const [practicedTopics, setPracticedTopics] = useState(new Set());
  const [practiceModal, setPracticeModal] = useState({
    isOpen: false,
    topic: '',
    subTopic: '',
    topics: [],
    level: 'B1',
    quantity: 5,
    practicingMistakeId: null,
  });

  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterTopic, searchQuery]);

  // Hàm chuẩn hóa dữ liệu lỗi sai toàn diện, đảm bảo gom nhóm đúng Canonical Topics & đếm chuẩn xác 100%
  const normalizeMistakesData = (rawMistakes = [], rawTopics = [], metadata = {}) => {
    const groupedByQuestion = {};
    (rawMistakes || []).forEach((m) => {
      const key = m.question_id || m.question_content?.trim() || m.id;
      const cTopic = m.canonical_topic || getCanonicalTopic(m.topic);
      if (!groupedByQuestion[key]) {
        groupedByQuestion[key] = {
          ...m,
          id: m.id || m.mistake_id,
          mistake_id: m.id || m.mistake_id,
          all_ids: m.all_ids || [m.id || m.mistake_id],
          repeat_count: m.repeat_count || 1,
          question_content: m.question_content || m.question_text || '',
          student_selected: m.student_selected || m.student_choice || '',
          correct_answer: m.correct_answer || m.correct_choice || '',
          attempt_date: m.attempt_date || m.attempted_at || '',
          topic: m.topic,
          canonical_topic: cTopic,
        };
      } else {
        const cur = groupedByQuestion[key];
        const mId = m.id || m.mistake_id;
        if (mId && !cur.all_ids.includes(mId)) {
          cur.all_ids.push(mId);
        }
        cur.repeat_count += (m.repeat_count || 1);
        if (m.attempt_date && (!cur.attempt_date || m.attempt_date > cur.attempt_date)) {
          cur.attempt_date = m.attempt_date;
          cur.quiz_title = m.quiz_title || cur.quiz_title;
          cur.student_selected = m.student_selected || m.student_choice || cur.student_selected;
        }
      }
    });
    const normalizedMistakes = Object.values(groupedByQuestion);

    // Gom nhóm các chủ đề Canonical và tính số câu sai chính xác dựa trên danh sách câu hỏi
    const topicsMap = {};
    (rawTopics || []).forEach((t) => {
      const cTopic = t.canonical_topic || getCanonicalTopic(t.topic);
      if (!topicsMap[cTopic]) {
        topicsMap[cTopic] = {
          topic: cTopic,
          canonical_topic: cTopic,
          count: 0,
          sub_topics: new Set(),
          raw_topics: new Set(),
          all_mistake_ids: [],
          sample_reason: t.sample_reason || '',
          difficulty: t.difficulty || 'B1',
        };
      }
      const entry = topicsMap[cTopic];
      entry.raw_topics.add(t.topic);
      if (t.raw_topics && Array.isArray(t.raw_topics)) {
        t.raw_topics.forEach((rt) => entry.raw_topics.add(rt));
      }
      if (t.sub_topics) {
        if (Array.isArray(t.sub_topics)) {
          t.sub_topics.forEach((st) => entry.sub_topics.add(st));
        } else if (typeof t.sub_topics === 'string') {
          t.sub_topics.split(',').forEach((st) => entry.sub_topics.add(st.trim()));
        }
      }
      if (t.sub_topic) {
        t.sub_topic.split(',').forEach((st) => entry.sub_topics.add(st.trim()));
      }
      if (!entry.sample_reason && t.sample_reason) {
        entry.sample_reason = t.sample_reason;
      }
    });

    normalizedMistakes.forEach((m) => {
      const cTopic = m.canonical_topic || getCanonicalTopic(m.topic);
      if (!topicsMap[cTopic]) {
        topicsMap[cTopic] = {
          topic: cTopic,
          canonical_topic: cTopic,
          count: 0,
          sub_topics: new Set(),
          raw_topics: new Set(),
          all_mistake_ids: [],
          sample_reason: m.reason || m.explanation || '',
          difficulty: m.difficulty || 'B1',
        };
      }
      const entry = topicsMap[cTopic];
      entry.count += 1;
      entry.raw_topics.add(m.topic);
      if (Array.isArray(m.all_ids)) {
        entry.all_mistake_ids.push(...m.all_ids);
      } else if (m.id) {
        entry.all_mistake_ids.push(m.id);
      }
      if (m.sub_topic) {
        entry.sub_topics.add(m.sub_topic);
      }
      if (!entry.sample_reason && (m.reason || m.explanation)) {
        entry.sample_reason = m.reason || m.explanation;
      }
    });

    const normalizedTopics = Object.values(topicsMap)
      .filter((t) => t.count > 0)
      .map((t) => {
        const subList = Array.from(t.sub_topics).filter(Boolean);
        return {
          ...t,
          sub_topics: subList,
          sub_topic: subList.slice(0, 3).join(', '),
          raw_topics: Array.from(t.raw_topics),
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      has_enrolled_courses: Boolean(metadata.has_enrolled_courses || (myCourses && myCourses.length > 0)),
      has_quiz_attempts: Boolean(metadata.has_quiz_attempts || (myAttempts && myAttempts.length > 0)),
      total_mistakes: normalizedMistakes.length,
      weak_topics: normalizedTopics,
      mistakes: normalizedMistakes,
    };
  };

  const fetchMistakes = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await recommendationAPI.getStudentMistakes();
      const data = res.data?.data || res.data || {};
      const normalized = normalizeMistakesData(
        data.mistakes || [],
        data.weak_topics_summary || data.weak_topics || [],
        {
          has_enrolled_courses: data.has_enrolled_courses || (myCourses && myCourses.length > 0),
          has_quiz_attempts: data.has_quiz_attempts || (myAttempts && myAttempts.length > 0),
        }
      );

      setMistakeData(normalized);

      // Nếu bộ lọc chủ đề hiện tại không còn câu hỏi nào, tự động đưa về ALL
      setFilterTopic((prevFilter) => {
        if (prevFilter === 'ALL') return 'ALL';
        const hasMatching = normalized.mistakes.some(
          (m) => m.canonical_topic === prevFilter || m.topic === prevFilter
        );
        return hasMatching ? prevFilter : 'ALL';
      });

      // Điều chỉnh phân trang không bị vượt quá số trang hiện tại
      setCurrentPage((prevPage) => {
        const totalP = Math.ceil(normalized.mistakes.length / itemsPerPage) || 1;
        return Math.min(prevPage, totalP);
      });
    } catch (err) {
      console.warn('Lỗi khi tải dữ liệu phân tích lỗi sai:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMistakes(false);
  }, []);

  // Đánh dấu đã hoàn thành / xóa 1 câu hỏi sai đơn lẻ
  const handleResolveSingleMistake = async (mistake) => {
    const mistakeId = typeof mistake === 'object' ? mistake.id : mistake;
    const allIds = (typeof mistake === 'object' && Array.isArray(mistake.all_ids)) ? mistake.all_ids : [mistakeId];
    if (!mistakeId || isResolving) return;

    setIsResolving(true);
    try {
      const idSet = new Set([mistakeId, ...allIds]);

      // 1. Cập nhật lạc quan (Optimistic update) ngay lập tức trên UI với thuật toán chuẩn hóa
      const remainingMistakes = (mistakeData.mistakes || []).filter(
        (item) => !idSet.has(item.id) && !idSet.has(item.mistake_id)
      );

      const nextData = normalizeMistakesData(remainingMistakes, mistakeData.weak_topics, mistakeData);
      setMistakeData(nextData);

      setSelectedMistakeIds((prev) => {
        const next = new Set(prev);
        idSet.forEach((id) => next.delete(id));
        return next;
      });

      // Nếu chủ đề đang xem vừa hết sạch câu sai, tự động quay về xem tất cả
      if (filterTopic !== 'ALL') {
        const stillHasTopic = remainingMistakes.some(
          (m) => (m.canonical_topic || getCanonicalTopic(m.topic)) === filterTopic || m.topic === filterTopic
        );
        if (!stillHasTopic) {
          setFilterTopic('ALL');
        }
      }

      setCurrentPage((prevPage) => {
        const newTotal = Math.ceil(remainingMistakes.length / itemsPerPage) || 1;
        return Math.min(prevPage, newTotal);
      });

      // 2. Gửi request lưu vào database backend
      if (allIds.length > 1) {
        await recommendationAPI.resolveBatchMistakes(allIds);
      } else {
        await recommendationAPI.resolveMistake(mistakeId);
      }

      // 3. Tự động đồng bộ ngầm với backend (silent refresh) để đảm bảo dữ liệu 100% khớp máy chủ
      await fetchMistakes(true);

      // Kích hoạt cập nhật chuỗi học tập nếu có
      window.dispatchEvent(new CustomEvent('study_activity_recorded'));
    } catch (err) {
      console.warn('Lỗi khi đánh dấu hoàn thành câu hỏi:', err);
      alert('Không thể cập nhật trạng thái câu hỏi. Vui lòng thử lại!');
      await fetchMistakes(true);
    } finally {
      setIsResolving(false);
    }
  };

  // Đánh dấu đã hoàn thành nhiều câu hỏi sai đã chọn
  const handleResolveSelectedMistakes = async () => {
    if (selectedMistakeIds.size === 0 || isResolving) return;
    const targetMistakes = (mistakeData.mistakes || []).filter(
      (m) => selectedMistakeIds.has(m.id) || selectedMistakeIds.has(m.mistake_id)
    );
    const allTargetIds = [];
    targetMistakes.forEach((m) => {
      if (Array.isArray(m.all_ids) && m.all_ids.length > 0) {
        allTargetIds.push(...m.all_ids);
      } else {
        allTargetIds.push(m.id || m.mistake_id);
      }
    });
    const uniqueIds = Array.from(new Set(allTargetIds));

    if (!window.confirm(`Bạn có chắc muốn đánh dấu đã hoàn thành và xóa ${targetMistakes.length} câu hỏi sai đã chọn?`)) {
      return;
    }

    setIsResolving(true);
    try {
      const idSet = new Set(uniqueIds);
      selectedMistakeIds.forEach((id) => idSet.add(id));

      const remainingMistakes = (mistakeData.mistakes || []).filter(
        (item) => !idSet.has(item.id) && !idSet.has(item.mistake_id)
      );

      const nextData = normalizeMistakesData(remainingMistakes, mistakeData.weak_topics, mistakeData);
      setMistakeData(nextData);
      setSelectedMistakeIds(new Set());

      if (filterTopic !== 'ALL') {
        const stillHasTopic = remainingMistakes.some(
          (m) => (m.canonical_topic || getCanonicalTopic(m.topic)) === filterTopic || m.topic === filterTopic
        );
        if (!stillHasTopic) {
          setFilterTopic('ALL');
        }
      }

      setCurrentPage((prevPage) => {
        const newTotal = Math.ceil(remainingMistakes.length / itemsPerPage) || 1;
        return Math.min(prevPage, newTotal);
      });

      await recommendationAPI.resolveBatchMistakes(uniqueIds);
      await fetchMistakes(true);
      window.dispatchEvent(new CustomEvent('study_activity_recorded'));
    } catch (err) {
      console.warn('Lỗi khi xóa danh sách câu hỏi sai:', err);
      alert('Không thể cập nhật danh sách câu hỏi. Vui lòng thử lại!');
      await fetchMistakes(true);
    } finally {
      setIsResolving(false);
    }
  };

  // Lọc danh sách câu hỏi làm sai theo chủ đề và từ khóa tìm kiếm (hỗ trợ cả tiếng Việt & tiếng Anh)
  const filteredMistakes = useMemo(() => {
    const queryNorm = normalizeSearchText(searchQuery);

    return (mistakeData.mistakes || []).filter((m) => {
      const mCanonical = m.canonical_topic || getCanonicalTopic(m.topic);
      const matchTopic =
        filterTopic === 'ALL' ||
        filterTopic === mCanonical ||
        filterTopic === m.topic;
      if (!matchTopic) return false;

      if (!queryNorm) return true;

      const contentNorm = normalizeSearchText(m.question_content || m.question_text);
      const topicNorm = normalizeSearchText(m.topic);
      const canonicalNorm = normalizeSearchText(mCanonical);
      const topicViNorm = normalizeSearchText(getVietnameseTopicName(mCanonical || m.topic));
      const subTopicNorm = normalizeSearchText(translateGrammarDescription(m.sub_topic));
      const reasonNorm = normalizeSearchText(translateGrammarDescription(m.reason || m.explanation));
      const quizNorm = normalizeSearchText(m.quiz_title);

      return (
        contentNorm.includes(queryNorm) ||
        topicNorm.includes(queryNorm) ||
        canonicalNorm.includes(queryNorm) ||
        topicViNorm.includes(queryNorm) ||
        subTopicNorm.includes(queryNorm) ||
        reasonNorm.includes(queryNorm) ||
        quizNorm.includes(queryNorm)
      );
    });
  }, [mistakeData.mistakes, filterTopic, searchQuery]);

  // Phân trang danh sách câu hỏi làm sai (5 câu / trang)
  const totalPages = Math.ceil(filteredMistakes.length / itemsPerPage) || 1;
  const paginatedMistakes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMistakes.slice(start, start + itemsPerPage);
  }, [filteredMistakes, currentPage, itemsPerPage]);

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
    const canonical = topicObj.canonical_topic || getCanonicalTopic(topicObj.topic);
    const topicsArr = topicObj.raw_topics && topicObj.raw_topics.length > 0
      ? topicObj.raw_topics
      : [topicObj.topic];

    setPracticeModal({
      isOpen: true,
      topic: canonical,
      subTopic: topicObj.sub_topic || '',
      topics: topicsArr,
      level: topicObj.difficulty || 'B1',
      practicingMistakeId: null,
    });
  };

  // Xem các câu làm sai của riêng chủ đề này (Lọc & cuộn xuống danh sách chi tiết)
  const handleViewTopicMistakes = (topicObj) => {
    const canonical = topicObj.canonical_topic || getCanonicalTopic(topicObj.topic);
    setFilterTopic(canonical);
    setSearchQuery('');
    setCurrentPage(1);

    const elem = document.getElementById('mistakes-list-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Ghi nhận chủ đề học viên vừa nộp bài luyện tập xong
  const handlePracticeComplete = (result) => {
    const topic = result?.topic || practiceModal.topic;
    if (topic) {
      const canonical = getCanonicalTopic(topic);
      setPracticedTopics((prev) => {
        const next = new Set(prev);
        next.add(canonical);
        next.add(topic);
        return next;
      });
    }
  };

  // Đánh dấu đã luyện tập xong chủ đề (Xác nhận & xóa các câu làm sai của chủ đề này)
  const handleMarkTopicAsFinished = async (topicObj) => {
    const canonical = topicObj.canonical_topic || getCanonicalTopic(topicObj.topic);
    const topicMistakes = (mistakeData.mistakes || []).filter(
      (m) => (m.canonical_topic || getCanonicalTopic(m.topic)) === canonical || m.topic === canonical
    );

    const allIds = [];
    topicMistakes.forEach((m) => {
      if (Array.isArray(m.all_ids) && m.all_ids.length > 0) {
        allIds.push(...m.all_ids);
      } else {
        allIds.push(m.id || m.mistake_id);
      }
    });
    const uniqueIds = Array.from(new Set(allIds.filter(Boolean)));

    if (uniqueIds.length === 0) {
      alert(`Chủ đề "${formatTopicBilingual(canonical)}" không còn câu hỏi sai nào trong danh sách.`);
      return;
    }

    const confirmMsg = `Bạn đã hoàn thành ôn luyện chủ đề "${formatTopicBilingual(canonical)}"?\n\nHệ thống sẽ đánh dấu đã nắm vững và xóa ${topicMistakes.length} câu làm sai của chủ đề này khỏi danh sách.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsResolving(true);
    try {
      // 1. Cập nhật giao diện lạc quan với normalizeMistakesData
      const remainingMistakes = (mistakeData.mistakes || []).filter(
        (m) => (m.canonical_topic || getCanonicalTopic(m.topic)) !== canonical && m.topic !== canonical
      );
      const nextData = normalizeMistakesData(remainingMistakes, mistakeData.weak_topics, mistakeData);
      setMistakeData(nextData);

      setSelectedMistakeIds((prev) => {
        const next = new Set(prev);
        uniqueIds.forEach((id) => next.delete(id));
        return next;
      });

      if (filterTopic === canonical) {
        setFilterTopic('ALL');
      }

      setPracticedTopics((prev) => {
        const next = new Set(prev);
        next.add(canonical);
        return next;
      });

      // 2. Gửi request backend
      await recommendationAPI.resolveBatchMistakes(uniqueIds);

      // 3. Tự động đồng bộ ngầm
      await fetchMistakes(true);

      // 4. Kích hoạt sự kiện học tập
      window.dispatchEvent(new CustomEvent('study_activity_recorded'));
    } catch (err) {
      console.warn('Lỗi khi đánh dấu hoàn thành chủ đề:', err);
      alert('Không thể cập nhật trạng thái chủ đề. Vui lòng thử lại!');
      await fetchMistakes(true);
    } finally {
      setIsResolving(false);
    }
  };

  // Luyện tập 1 câu hỏi cụ thể (Sẽ tự động xóa khỏi danh sách khi luyện xong và đóng modal)
  const handlePracticeSingleMistake = (mistake) => {
    setPracticeModal({
      isOpen: true,
      topic: mistake.topic,
      subTopic: mistake.sub_topic || '',
      topics: [mistake.topic],
      level: mistake.difficulty || 'B1',
      practicingMistakeId: mistake.id,
    });
  };

  // Đóng modal luyện tập & Tự động xóa câu hỏi sai đã luyện xong khỏi danh sách
  const handleClosePracticeModal = async () => {
    const mistakeIdToResolve = practiceModal.practicingMistakeId;
    setPracticeModal((prev) => ({
      ...prev,
      isOpen: false,
      practicingMistakeId: null,
    }));

    if (mistakeIdToResolve) {
      // 1. Cập nhật lạc quan
      const remainingMistakes = (mistakeData.mistakes || []).filter(
        (item) => item.id !== mistakeIdToResolve && item.mistake_id !== mistakeIdToResolve
      );
      const nextData = normalizeMistakesData(remainingMistakes, mistakeData.weak_topics, mistakeData);
      setMistakeData(nextData);

      setSelectedMistakeIds((prev) => {
        const next = new Set(prev);
        next.delete(mistakeIdToResolve);
        return next;
      });

      if (filterTopic !== 'ALL') {
        const stillHasTopic = remainingMistakes.some(
          (m) => (m.canonical_topic || getCanonicalTopic(m.topic)) === filterTopic || m.topic === filterTopic
        );
        if (!stillHasTopic) {
          setFilterTopic('ALL');
        }
      }

      // 2. Gửi request backend để đánh dấu đã khắc phục câu hỏi sai
      try {
        await recommendationAPI.resolveMistake(mistakeIdToResolve);
        await fetchMistakes(true);
        window.dispatchEvent(new CustomEvent('study_activity_recorded'));
      } catch (err) {
        console.warn('Lỗi khi gọi resolveMistake:', err);
        await fetchMistakes(true);
      }
    }
  };

  // Luyện tập các lỗi sai đã chọn bằng checkbox
  const handlePracticeSelected = () => {
    const selectedList = (mistakeData.mistakes || []).filter((m) => selectedMistakeIds.has(m.id));
    if (selectedList.length === 0) {
      alert('Vui lòng chọn ít nhất một lỗi sai để luyện tập cùng AI.');
      return;
    }
    const topicSet = new Set(selectedList.map((m) => m.canonical_topic || m.topic).filter(Boolean));
    const topicsArr = Array.from(topicSet);
    setPracticeModal({
      isOpen: true,
      topic: topicsArr.join(', '),
      subTopic: '',
      topics: topicsArr,
      level: selectedList[0]?.difficulty || 'B1',
      quantity: customQuantity,
      practicingMistakeId: null,
    });
  };

  // Luyện tập toàn bộ lỗi sai
  const handlePracticeAll = () => {
    const topicsArr = (mistakeData.weak_topics || []).map((t) => t.canonical_topic || t.topic).filter(Boolean);
    setPracticeModal({
      isOpen: true,
      topic: topicsArr.length > 0 ? topicsArr.join(', ') : 'Ôn tập ngữ pháp tổng hợp',
      subTopic: '',
      topics: topicsArr,
      level: mistakeData.weak_topics[0]?.difficulty || 'B1',
      quantity: customQuantity,
      practicingMistakeId: null,
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

      {/* 2. TRƯỜNG HỢP ĐANG TẢI DỮ LIỆU BAN ĐẦU */}
      {isLoading && (!mistakeData.mistakes || mistakeData.mistakes.length === 0) ? (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '60px 32px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <i
            className="fa-solid fa-spinner fa-spin"
            style={{ fontSize: '2.4rem', color: '#0284c7', marginBottom: '16px' }}
          ></i>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
            Đang Phân Tích Lỗi Sai & Lộ Trình Ôn Tập AI...
          </h3>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: 0 }}>
            Hệ thống đang truy xuất lịch sử làm bài trắc nghiệm và bóc tách các chủ đề cần củng cố.
          </p>
        </div>
      ) : !hasEnrolledCourses ? (
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Bộ chọn số lượng câu hỏi AI sinh */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
                }}
              >
                <i className="fa-solid fa-sliders" style={{ color: '#6366f1', fontSize: '0.85rem' }}></i>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                  Số câu AI sinh:
                </span>
                <select
                  value={customQuantity}
                  onChange={(e) => setCustomQuantity(Number(e.target.value))}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  title="Chọn số lượng câu hỏi AI sẽ sinh ra cho bài luyện tập"
                >
                  <option value={3}>3 câu (Luyện nhanh)</option>
                  <option value={5}>5 câu (Chuẩn)</option>
                  <option value={10}>10 câu (Toàn diện)</option>
                  <option value={15}>15 câu (Chuyên sâu)</option>
                  <option value={20}>20 câu (Tối đa)</option>
                </select>
              </div>

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
                <span>Luyện Toàn Bộ Lỗi Sai ({customQuantity} Câu)</span>
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
                        {formatTopicBilingual(t.topic)}
                      </h4>

                      {t.sub_topic && (
                        <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {translateGrammarDescription(t.sub_topic)}
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
                          {(() => {
                            const translated = translateGrammarDescription(t.sample_reason);
                            return translated.length > 140 ? translated.substring(0, 140) + '...' : translated;
                          })()}
                        </p>
                      )}
                    </div>

                    {/* Khu vực 3 nút hành động theo yêu cầu người dùng */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {/* Nút 1: Luyện chủ đề */}
                        <button
                          type="button"
                          onClick={() => handlePracticeSingleTopic(t)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#fff7ed',
                            color: '#ea580c',
                            border: '1px solid #fdba74',
                            fontWeight: '800',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease',
                          }}
                          title="Luyện tập 5 câu hỏi trắc nghiệm do AI sinh ra cho chủ đề này"
                        >
                          <i className="fa-solid fa-play"></i>
                          <span>Luyện Chủ Đề</span>
                        </button>

                        {/* Nút 2: Xem các câu làm sai kế bên nút luyện chủ đề */}
                        <button
                          type="button"
                          onClick={() => handleViewTopicMistakes(t)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#f0f9ff',
                            color: '#0284c7',
                            border: '1px solid #bae6fd',
                            fontWeight: '800',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease',
                          }}
                          title="Xem danh sách chi tiết các câu làm sai thuộc chủ đề này"
                        >
                          <i className="fa-solid fa-eye"></i>
                          <span>Xem Câu Sai ({t.count})</span>
                        </button>
                      </div>

                      {/* Nút 3: Đã luyện tập xong (kế bên 2 nút trên) */}
                      {(() => {
                        const isTopicPracticed = practicedTopics.has(t.canonical_topic || t.topic);
                        return (
                          <button
                            type="button"
                            onClick={() => handleMarkTopicAsFinished(t)}
                            disabled={isResolving}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              backgroundColor: isTopicPracticed ? '#ecfdf5' : '#f8fafc',
                              color: isTopicPracticed ? '#059669' : '#475569',
                              border: `1px solid ${isTopicPracticed ? '#6ee7b7' : 'var(--border-color)'}`,
                              fontWeight: '800',
                              fontSize: '0.8rem',
                              cursor: isResolving ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.2s ease',
                              boxShadow: isTopicPracticed ? '0 2px 6px rgba(16, 185, 129, 0.2)' : 'none',
                            }}
                            title="Xác nhận đã hiểu rõ và xóa các câu hỏi sai của chủ đề này"
                          >
                            <i className={`fa-solid ${isTopicPracticed ? 'fa-circle-check' : 'fa-check'}`}></i>
                            <span>{isTopicPracticed ? '✓ Đã Luyện Tập Xong (Hoàn Thành)' : 'Đã Luyện Tập Xong'}</span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* C. Bộ lọc và danh sách chi tiết các câu hỏi làm sai */}
          <div id="mistakes-list-section">
            {/* Tiêu đề mục danh sách */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                flexWrap: 'wrap',
                gap: '8px',
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

              {filterTopic !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setFilterTopic('ALL')}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#0284c7',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: 0,
                  }}
                >
                  <i className="fa-solid fa-rotate-left"></i>
                  <span>Xem tất cả ({totalMistakes} câu)</span>
                </button>
              )}
            </div>

            {/* Thanh công cụ tìm kiếm, lọc và thao tác hàng loạt - Luôn thẳng hàng */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '16px',
                backgroundColor: 'var(--bg-surface)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* Nhóm trái: Lọc chủ đề & Ô tìm kiếm */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 360px', minWidth: '260px' }}>
                {/* Lọc theo chủ đề */}
                <select
                  value={filterTopic}
                  onChange={(e) => setFilterTopic(e.target.value)}
                  style={{
                    height: '36px',
                    padding: '0 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    maxWidth: '220px',
                    width: '100%',
                    outline: 'none',
                    cursor: 'pointer',
                    textOverflow: 'ellipsis',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="ALL">Tất cả chủ đề ({totalMistakes})</option>
                  {mistakeData.weak_topics.map((t, i) => {
                    const cTopic = t.canonical_topic || t.topic;
                    return (
                      <option key={i} value={cTopic}>
                        {formatTopicBilingual(cTopic)} ({t.count})
                      </option>
                    );
                  })}
                </select>

                {/* Ô tìm kiếm câu hỏi */}
                <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '300px' }}>
                  <i
                    className="fa-solid fa-magnifying-glass"
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none',
                    }}
                  ></i>
                  <input
                    type="text"
                    placeholder="Tìm câu hỏi, chủ đề..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      height: '36px',
                      padding: '0 10px 0 28px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem',
                      width: '100%',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Nhóm phải: Nút chọn tất cả + Luyện tập + Xóa đã chọn */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {/* Nút chọn tất cả */}
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  style={{
                    height: '36px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box',
                  }}
                >
                  <i className={`fa-regular ${selectedMistakeIds.size === filteredMistakes.length && filteredMistakes.length > 0 ? 'fa-square-check' : 'fa-square'}`}></i>
                  <span>{selectedMistakeIds.size === filteredMistakes.length && filteredMistakes.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</span>
                </button>

                {/* Nút luyện tập các câu đã chọn (màu cam đặc trưng AI) */}
                {selectedMistakeIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handlePracticeSelected}
                    style={{
                      height: '36px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#ea580c',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      boxSizing: 'border-box',
                    }}
                    title="Luyện tập các câu hỏi sai đã chọn cùng AI"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    <span>Luyện {selectedMistakeIds.size} câu</span>
                  </button>
                )}

                {/* Nút xóa các câu đã chọn (màu đỏ phân biệt với nút luyện tập) */}
                {selectedMistakeIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleResolveSelectedMistakes}
                    disabled={isResolving}
                    style={{
                      height: '36px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      cursor: isResolving ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      boxSizing: 'border-box',
                    }}
                    title="Xóa các câu hỏi sai đã chọn khỏi danh sách lỗi sai"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    <span>Xóa {selectedMistakeIds.size} câu đã chọn</span>
                  </button>
                )}
              </div>
            </div>

            {/* Danh sách từng câu hỏi */}
            {filteredMistakes.length === 0 ? (
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px dashed var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <i className="fa-solid fa-circle-check" style={{ fontSize: '2.5rem', color: '#10b981', marginBottom: '12px' }}></i>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>
                  {filterTopic !== 'ALL'
                    ? `Không còn câu hỏi sai nào trong chủ đề "${formatTopicBilingual(filterTopic)}"`
                    : 'Không tìm thấy câu hỏi sai nào phù hợp'}
                </h4>
                <p style={{ fontSize: '0.9rem', margin: '0 0 16px 0' }}>
                  {filterTopic !== 'ALL'
                    ? 'Bạn đã hoàn thành tốt các câu hỏi của chủ đề này! Hãy chuyển về xem toàn bộ hoặc chọn chủ đề khác.'
                    : 'Hãy làm thêm các bài kiểm tra trắc nghiệm để AI tiếp tục theo dõi tiến độ học tập.'}
                </p>
                {filterTopic !== 'ALL' && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setFilterTopic('ALL')}
                    style={{ fontSize: '0.85rem', padding: '7px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                    <span>Xem Tất Cả Câu Sai</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {paginatedMistakes.map((m, idx) => {
                const isSelected = selectedMistakeIds.has(m.id);
                const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
                          Câu {globalIdx}
                        </span>
                        {m.repeat_count > 1 && (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#fee2e2',
                              color: '#dc2626',
                              fontSize: '0.75rem',
                              fontWeight: '800',
                            }}
                          >
                            Đã làm sai {m.repeat_count} lần
                          </span>
                        )}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          • {m.quiz_title} {m.attempt_date ? `(Lần gần nhất: ${m.attempt_date})` : ''}
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
                          {formatTopicBilingual(m.topic)}
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
                      {m.question_content || m.question_text}
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
                          {m.student_selected || m.student_choice || '(Chưa chọn đáp án)'}
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
                          {m.correct_answer || m.correct_choice || '(Chưa có đáp án chính xác)'}
                        </div>
                      </div>
                    </div>

                    {/* Phân tích học thuật của AI */}
                    {(m.reason || m.explanation) && (
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
                        {translateGrammarDescription(m.reason || m.explanation)}
                      </div>
                    )}

                    {/* Hàng nút hành động: Đánh dấu đã hoàn thành & Luyện câu này */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleResolveSingleMistake(m)}
                        disabled={isResolving}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '6px',
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          border: 'none',
                          fontWeight: '800',
                          fontSize: '0.82rem',
                          cursor: isResolving ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                        }}
                        title="Đánh dấu đã hiểu rõ và xóa câu này khỏi danh sách lỗi sai"
                      >
                        <i className="fa-solid fa-circle-check"></i>
                        <span>Đã Hoàn Thành (Xóa Câu Này)</span>
                      </button>

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
                          fontSize: '0.82rem',
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

            {/* Phân trang danh sách câu hỏi làm sai */}
            {filteredMistakes.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredMistakes.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
          </div>
        </div>
      )}

      {/* Modal Luyện Tập Câu Hỏi Mới Do AI Sinh Ra */}
      <WeakTopicPracticeModal
        isOpen={practiceModal.isOpen}
        onClose={handleClosePracticeModal}
        topic={practiceModal.topic}
        subTopic={practiceModal.subTopic}
        topics={practiceModal.topics}
        level={practiceModal.level || 'B1'}
        quantity={practiceModal.quantity || customQuantity || 5}
        onComplete={handlePracticeComplete}
      />
    </div>
  );
}

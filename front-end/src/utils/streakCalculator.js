// front-end/src/utils/streakCalculator.js
/**
 * Utility tính toán chuỗi học tập liên tục (Daily Study Streak) chuẩn xác 100%
 * dựa trên dữ liệu thật của học viên (ngày nào, thời gian ra sao).
 *
 * Quy tắc:
 * 1. Học viên phải học liên tục từng ngày thì mới có chuỗi.
 * 2. Nếu bỏ lỡ 1 ngày trở lên (hôm qua không học) -> Chuỗi = 0 ngày (BỊ GIÁN ĐOẠN).
 * 3. Nếu hôm nay chưa học nhưng hôm qua có học -> Chuỗi giữ từ hôm qua (CẦN DUY TRÌ HÔM NAY).
 * 4. Nếu hôm nay đã học -> Chuỗi tăng lên và hiển thị "ĐÃ DUY TRÌ THÀNH CÔNG".
 */

export function toLocalDateString(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatVNDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const y = d.getFullYear();
  return `${day}/${m}/${y}`;
}

export function formatVNTimeDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins} ngày ${formatVNDate(d)}`;
}

/**
 * Ghi nhận một hành động học tập thực tế (Học flashcards, làm bài test, xem video...)
 */
export function recordStudyActivity(userId = 'default', activityType = 'study', metadata = {}) {
  const now = new Date();
  const todayStr = toLocalDateString(now);
  const storageKey = `study_sessions_log_${userId}`;

  try {
    const raw = localStorage.getItem(storageKey);
    let logs = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(logs)) logs = [];

    logs.push({
      date: todayStr,
      timestamp: now.toISOString(),
      type: activityType,
      ...metadata,
    });

    // Giữ lại 100 log gần nhất
    if (logs.length > 100) {
      logs = logs.slice(-100);
    }

    localStorage.setItem(storageKey, JSON.stringify(logs));
    localStorage.setItem('study_session_date', todayStr);

    // Kích hoạt event để các component lắng nghe cập nhật ngay lập tức
    window.dispatchEvent(
      new CustomEvent('study_activity_recorded', {
        detail: { date: todayStr, timestamp: now.toISOString(), type: activityType },
      })
    );
  } catch (e) {
    console.error('Lỗi khi ghi nhận hoạt động học:', e);
  }
}

/**
 * Tính toán toàn diện thông tin Chuỗi ngày học
 */
export function calculateRealStreak({
  user = null,
  backendStreak = null,
  myAttempts = [],
  myCourses = [],
  aiSessions = [],
}) {
  const userId = user?.id || user?.email || 'default';
  const todayDate = new Date();
  const todayStr = toLocalDateString(todayDate);

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterdayDate);

  // 1. Tập hợp các mốc thời gian hoạt động thực tế
  const timestamps = [];

  // Từ Backend Attempts (Bài thi)
  if (Array.isArray(myAttempts)) {
    myAttempts.forEach((a) => {
      const ts = a.completed_at || a.started_at || a.created_at;
      if (ts) timestamps.push(new Date(ts));
    });
  }

  // Từ MyCourses (Tiến độ bài học)
  if (Array.isArray(myCourses)) {
    myCourses.forEach((c) => {
      const ts = c.updated_at || c.completed_at || c.enrolled_at;
      if (ts) timestamps.push(new Date(ts));
      if (Array.isArray(c.lesson_progresses)) {
        c.lesson_progresses.forEach((lp) => {
          const lpts = lp.completed_at || lp.updated_at;
          if (lpts) timestamps.push(new Date(lpts));
        });
      }
    });
  }

  // Từ AI Chat Sessions
  if (Array.isArray(aiSessions)) {
    aiSessions.forEach((s) => {
      const ts = s.updated_at || s.created_at;
      if (ts) timestamps.push(new Date(ts));
    });
  }

  // Từ LocalStorage Study Activity Logs (Flashcard, video, realtime)
  try {
    const storageKey = `study_sessions_log_${userId}`;
    const rawLogs = localStorage.getItem(storageKey);
    if (rawLogs) {
      const logs = JSON.parse(rawLogs);
      if (Array.isArray(logs)) {
        logs.forEach((item) => {
          if (item.timestamp) timestamps.push(new Date(item.timestamp));
          else if (item.date) timestamps.push(new Date(`${item.date}T12:00:00`));
        });
      }
    }
    const lastSession = localStorage.getItem('study_session_date');
    if (lastSession) {
      timestamps.push(new Date(`${lastSession}T12:00:00`));
    }
  } catch (e) {}

  // 2. Chuyển thành tập hợp các ngày duy nhất (YYYY-MM-DD)
  const activeDatesSet = new Set();
  let latestDateObj = null;

  timestamps.forEach((dt) => {
    if (!isNaN(dt.getTime())) {
      const ds = toLocalDateString(dt);
      if (ds) {
        activeDatesSet.add(ds);
        if (!latestDateObj || dt > latestDateObj) {
          latestDateObj = dt;
        }
      }
    }
  });

  // Nếu backendStreak có danh sách ngày học bổ sung
  if (backendStreak?.recent_study_dates && Array.isArray(backendStreak.recent_study_dates)) {
    backendStreak.recent_study_dates.forEach((d) => {
      const ds = toLocalDateString(d);
      if (ds) activeDatesSet.add(ds);
    });
  }

  const sortedDates = Array.from(activeDatesSet).sort();
  const hasStudiedToday = activeDatesSet.has(todayStr);

  // 3. Tính toán số ngày chuỗi liên tục
  let streak = 0;
  let status = 'NEW'; // 'ACTIVE_TODAY' | 'PENDING_TODAY' | 'BROKEN' | 'NEW'

  if (hasStudiedToday) {
    // Đã học hôm nay: đếm lùi từng ngày liên tiếp từ hôm nay
    let curr = new Date(todayDate.getTime());
    while (activeDatesSet.has(toLocalDateString(curr))) {
      streak += 1;
      curr.setDate(curr.getDate() - 1);
    }
    status = 'ACTIVE_TODAY';
  } else {
    // Chưa học hôm nay: kiểm tra hôm qua
    if (activeDatesSet.has(yesterdayStr)) {
      // Hôm qua có học -> Chuỗi tính đến hôm qua được bảo lưu, chờ học hôm nay để không mất
      let curr = new Date(yesterdayDate.getTime());
      while (activeDatesSet.has(toLocalDateString(curr))) {
        streak += 1;
        curr.setDate(curr.getDate() - 1);
      }
      status = 'PENDING_TODAY';
    } else {
      // Hôm qua KHÔNG học -> Đã bỏ lỡ ít nhất 1 ngày -> Chuỗi bị gián đoạn = 0 ngày!
      streak = 0;
      status = activeDatesSet.size > 0 ? 'BROKEN' : 'NEW';
    }
  }

  // 4. Tính toán khoảng cách ngày kể từ lần học gần nhất
  let daysSinceLastStudy = null;
  let lastStudyDateFormatted = null;
  let lastStudyTimeFormatted = null;

  if (latestDateObj) {
    const lastDateStr = toLocalDateString(latestDateObj);
    const diffMs = new Date(todayStr).getTime() - new Date(lastDateStr).getTime();
    daysSinceLastStudy = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    lastStudyDateFormatted = formatVNDate(latestDateObj);
    lastStudyTimeFormatted = formatVNTimeDate(latestDateObj);
  } else if (backendStreak?.last_study_date_display) {
    lastStudyDateFormatted = backendStreak.last_study_date_display;
    daysSinceLastStudy = backendStreak.days_since_last_study ?? null;
  }

  // 5. Nội dung thông báo tương ứng từng trạng thái
  let badgeText = '';
  let headline = '';
  let subtext = '';

  if (status === 'ACTIVE_TODAY') {
    badgeText = 'ĐÃ DUY TRÌ THÀNH CÔNG';
    headline = `Xuất sắc! Bạn đã duy trì chuỗi ${streak} ngày học liên tiếp!`;
    subtext = `Mục tiêu hôm nay (${formatVNDate(todayDate)}) đã hoàn thành. Hãy giữ vững chuỗi ${streak} ngày này nhé!`;
  } else if (status === 'PENDING_TODAY') {
    badgeText = 'CÚ HUÝCH DUY TRÌ THÓI QUEN';
    headline = 'Hôm nay bạn chưa học bài nào đấy nhé!';
    subtext = `Hôm qua bạn đã học rất chăm chỉ! Chỉ cần dành 5 phút lướt thẻ từ vựng hoặc làm 1 bài kiểm tra mini ngay hôm nay để chuỗi ${streak} ngày không bị gián đoạn!`;
  } else if (status === 'BROKEN') {
    badgeText = 'CHUỖI ĐÃ BỊ GIÁN ĐOẠN';
    const agoText = daysSinceLastStudy !== null ? `(${daysSinceLastStudy} ngày trước)` : '';
    headline = 'Chuỗi học tập của bạn hiện đang là 0 ngày!';
    subtext = `Lần học gần nhất của bạn là ${lastStudyDateFormatted || 'các ngày trước'} ${agoText}. Đừng bỏ cuộc nhé! Hãy hoàn thành 1 bài học hoặc 5 phút flashcards ngay hôm nay để khởi động lại chuỗi 1 ngày đầu tiên!`;
  } else {
    badgeText = 'KHỞI ĐẦU HÀNH TRÌNH';
    headline = 'Bắt đầu chuỗi ngày học đầu tiên của bạn!';
    subtext = 'Hãy hoàn thành 1 bài học hoặc làm một bài test mini hôm nay để tạo chuỗi ngày học liên tục đầu tiên nhé!';
  }

  return {
    streak,
    hasStudiedToday,
    status,
    badgeText,
    headline,
    subtext,
    lastStudyDateFormatted,
    lastStudyTimeFormatted,
    daysSinceLastStudy,
    totalStudyDays: activeDatesSet.size,
    activeDates: sortedDates,
  };
}

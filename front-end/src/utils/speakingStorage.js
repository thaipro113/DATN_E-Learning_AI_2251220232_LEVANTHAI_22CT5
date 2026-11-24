// Quản lý kho câu luyện nói & phát âm AI và danh mục chủ đề cho hệ thống TL-English
const STORAGE_KEY = 'tl_speaking_sentences_v1';
const TOPICS_STORAGE_KEY = 'tl_speaking_topics_v1';

export const DEFAULT_SPEAKING_TOPICS = [
  { id: 'DAILY', name: 'Giao tiếp hàng ngày', level: 'A1 - A2', icon: 'fa-mug-hot', color: '#0284c7', bg: '#e0f2fe', isDefault: true },
  { id: 'WORKPLACE', name: 'Công sở & Phỏng vấn', level: 'B1 - B2', icon: 'fa-briefcase', color: '#059669', bg: '#ecfdf5', isDefault: true },
  { id: 'TRAVEL', name: 'Du lịch & Ẩm thực', level: 'A2 - B1', icon: 'fa-plane-departure', color: '#d97706', bg: '#fef3c7', isDefault: true },
  { id: 'ACADEMIC', name: 'Học thuật & Thuyết trình', level: 'B2 - C1', icon: 'fa-graduation-cap', color: '#7c3aed', bg: '#ede9fe', isDefault: true },
  { id: 'MISTAKES', name: 'Khắc phục lỗi sai', level: 'Cá nhân hóa', icon: 'fa-rotate-right', color: '#dc2626', bg: '#fee2e2', isDefault: true },
];

export const DEFAULT_SPEAKING_SENTENCES = [
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

// ==================== QUẢN LÝ CHỦ ĐỀ (TOPICS) ====================
export function getSpeakingTopics() {
  try {
    const raw = localStorage.getItem(TOPICS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(DEFAULT_SPEAKING_TOPICS));
      return DEFAULT_SPEAKING_TOPICS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SPEAKING_TOPICS;
  } catch (err) {
    console.warn('Lỗi đọc speaking topics từ localStorage:', err);
    return DEFAULT_SPEAKING_TOPICS;
  }
}

export function saveSpeakingTopics(topicsList) {
  try {
    localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topicsList));
    window.dispatchEvent(new Event('tl_speaking_topics_updated'));
    return true;
  } catch (err) {
    console.error('Lỗi lưu speaking topics:', err);
    return false;
  }
}

export function addSpeakingTopic(topicObj) {
  const current = getSpeakingTopics();
  // Chuẩn hóa ID
  let customId = (topicObj.id || topicObj.name || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .trim();
  
  if (!customId) {
    customId = `TOPIC_${Date.now()}`;
  }

  // Tránh trùng ID
  if (current.some((t) => t.id === customId)) {
    customId = `${customId}_${Date.now().toString().slice(-4)}`;
  }

  const newTopic = {
    id: customId,
    name: topicObj.name.trim(),
    level: topicObj.level || 'A1 - B2',
    icon: topicObj.icon || 'fa-folder-plus',
    color: topicObj.color || '#0284c7',
    bg: topicObj.bg || '#e0f2fe',
    isDefault: false,
  };

  const updated = [...current, newTopic];
  saveSpeakingTopics(updated);
  return newTopic;
}

export function deleteSpeakingTopic(topicId) {
  const current = getSpeakingTopics();
  const updated = current.filter((t) => t.id !== topicId || t.isDefault);
  saveSpeakingTopics(updated);
  return updated;
}

// ==================== QUẢN LÝ CÂU LUYỆN NÓI (SENTENCES) ====================
export function getSpeakingSentences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SPEAKING_SENTENCES));
      return DEFAULT_SPEAKING_SENTENCES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SPEAKING_SENTENCES;
  } catch (err) {
    console.warn('Lỗi đọc speaking sentences từ localStorage:', err);
    return DEFAULT_SPEAKING_SENTENCES;
  }
}

export function saveSpeakingSentences(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('tl_speaking_sentences_updated'));
    return true;
  } catch (err) {
    console.error('Lỗi lưu speaking sentences:', err);
    return false;
  }
}

export function addSpeakingSentence(sentenceObj) {
  const current = getSpeakingSentences();
  const newId = `s_${Date.now()}`;
  const newItem = {
    id: newId,
    topic: sentenceObj.topic || 'DAILY',
    level: sentenceObj.level || 'A1',
    sentence: (sentenceObj.sentence || '').trim(),
    translation: (sentenceObj.translation || '').trim(),
    tips: (sentenceObj.tips || '').trim(),
  };
  const updated = [newItem, ...current];
  saveSpeakingSentences(updated);
  return newItem;
}

export function updateSpeakingSentence(id, updatedFields) {
  const current = getSpeakingSentences();
  const updated = current.map((item) => {
    if (item.id === id) {
      return { ...item, ...updatedFields };
    }
    return item;
  });
  saveSpeakingSentences(updated);
  return updated;
}

export function deleteSpeakingSentence(id) {
  const current = getSpeakingSentences();
  const updated = current.filter((item) => item.id !== id);
  saveSpeakingSentences(updated);
  return updated;
}

export function resetSpeakingSentences() {
  saveSpeakingSentences(DEFAULT_SPEAKING_SENTENCES);
  saveSpeakingTopics(DEFAULT_SPEAKING_TOPICS);
  return DEFAULT_SPEAKING_SENTENCES;
}

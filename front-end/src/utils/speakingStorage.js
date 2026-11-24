// Quản lý kho câu luyện nói & phát âm AI cho hệ thống TL-English
const STORAGE_KEY = 'tl_speaking_sentences_v1';

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
  return DEFAULT_SPEAKING_SENTENCES;
}

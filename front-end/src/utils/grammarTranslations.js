/**
 * Từ điển và tiện ích dịch thuật học thuật ngữ pháp tiếng Anh sang tiếng Việt.
 * Giữ nguyên các ví dụ, từ khóa tiếng Anh trong ngoặc kép hoặc nháy đơn.
 */

export const TOPIC_TRANSLATIONS = {
  'Present Continuous': 'Thì hiện tại tiếp diễn',
  'Present Progressive': 'Thì hiện tại tiếp diễn',
  'Present Continuous (Present Progressive)': 'Thì hiện tại tiếp diễn',
  'Present Simple': 'Thì hiện tại đơn',
  'Present Simple vs. Present Continuous': 'Phân biệt Thì hiện tại đơn & Hiện tại tiếp diễn',
  'Present Perfect': 'Thì hiện tại hoàn thành',
  'Present Perfect Continuous': 'Thì hiện tại hoàn thành tiếp diễn',
  'Past Simple': 'Thì quá khứ đơn',
  'Past Continuous': 'Thì quá khứ tiếp diễn',
  'Past Perfect': 'Thì quá khứ hoàn thành',
  'Past Perfect Continuous': 'Thì quá khứ hoàn thành tiếp diễn',
  'Future Simple': 'Thì tương lai đơn',
  'Future Continuous': 'Thì tương lai tiếp diễn',
  'Future Perfect': 'Thì tương lai hoàn thành',
  'Future Perfect Continuous': 'Thì tương lai hoàn thành tiếp diễn',
  'Be going to': 'Tương lai gần (Be going to)',
  'Conditionals': 'Câu điều kiện',
  'Conditional Sentences': 'Câu điều kiện',
  'Zero Conditional': 'Câu điều kiện loại 0',
  'First Conditional': 'Câu điều kiện loại 1',
  'Second Conditional': 'Câu điều kiện loại 2',
  'Third Conditional': 'Câu điều kiện loại 3',
  'Mixed Conditionals': 'Câu điều kiện hỗn hợp',
  'Relative Clauses': 'Mệnh đề quan hệ',
  'Defining Relative Clauses': 'Mệnh đề quan hệ xác định',
  'Non-defining Relative Clauses': 'Mệnh đề quan hệ không xác định',
  'Passive Voice': 'Thể bị động',
  'Reported Speech': 'Câu gián tiếp / tường thuật',
  'Direct and Indirect Speech': 'Câu trực tiếp & gián tiếp',
  'Modal Verbs': 'Động từ khuyết thiếu (Modal Verbs)',
  'Gerunds and Infinitives': 'Danh động từ & Động từ nguyên mẫu (V-ing / To-V)',
  'Gerunds': 'Danh động từ (V-ing)',
  'Infinitives': 'Động từ nguyên mẫu (To-V / V-bare)',
  'Prepositions': 'Giới từ (in, on, at, by...)',
  'Prepositions of Time': 'Giới từ chỉ thời gian',
  'Prepositions of Place': 'Giới từ chỉ nơi chốn',
  'Articles': 'Mạo từ (a, an, the)',
  'Determiners': 'Từ hạn định',
  'Subject-Verb Agreement': 'Sự hòa hợp Chủ ngữ & Động từ',
  'Comparatives and Superlatives': 'So sánh hơn & So sánh nhất',
  'Comparatives': 'So sánh hơn',
  'Superlatives': 'So sánh nhất',
  'Adjectives and Adverbs': 'Tính từ & Trạng từ',
  'Conjunctions': 'Liên từ (and, but, although, because...)',
  'Tag Questions': 'Câu hỏi đuôi (Tag Questions)',
  'Inversion': 'Đảo ngữ (Inversion)',
  'Subjunctive': 'Thể giả định (Subjunctive Mood)',
  'Phrasal Verbs': 'Cụm động từ (Phrasal Verbs)',
  'Collocations': 'Cụm từ cố định (Collocations)',
  'Contextual Vocabulary': 'Từ vựng theo ngữ cảnh',
  'Vocabulary': 'Từ vựng tiếng Anh',
  'Reading Comprehension': 'Kỹ năng đọc hiểu',
  'Listening Comprehension': 'Kỹ năng nghe hiểu',
  'Grammar': 'Ngữ pháp tiếng Anh',
};

/**
 * Trả về tên chủ đề định dạng song ngữ: Topic (Tên tiếng Việt)
 * Ví dụ: "Present Continuous (Thì hiện tại tiếp diễn)"
 */
export function formatTopicBilingual(topic) {
  if (!topic) return 'Ngữ pháp tiếng Anh';
  const cleanTopic = String(topic).trim();

  // Nếu đã chứa tiếng Việt trong ngoặc rồi thì giữ nguyên
  if (cleanTopic.includes('(') && cleanTopic.includes('Thì')) return cleanTopic;

  // Tra bảng từ điển
  if (TOPIC_TRANSLATIONS[cleanTopic]) {
    return `${cleanTopic} (${TOPIC_TRANSLATIONS[cleanTopic]})`;
  }

  // Tra cứu tương đối
  for (const [key, viName] of Object.entries(TOPIC_TRANSLATIONS)) {
    if (cleanTopic.toLowerCase() === key.toLowerCase()) {
      return `${cleanTopic} (${viName})`;
    }
  }

  return cleanTopic;
}

/**
 * Trả về tên tiếng Việt của chủ đề
 */
export function getVietnameseTopicName(topic) {
  if (!topic) return '';
  const cleanTopic = String(topic).trim();
  if (TOPIC_TRANSLATIONS[cleanTopic]) return TOPIC_TRANSLATIONS[cleanTopic];

  for (const [key, viName] of Object.entries(TOPIC_TRANSLATIONS)) {
    if (cleanTopic.toLowerCase().includes(key.toLowerCase())) {
      return viName;
    }
  }
  return cleanTopic;
}

/**
 * Bảng dịch các cụm từ mô tả quy tắc ngữ pháp học thuật hay gặp từ AI LLM
 */
const DESCRIPTIONS_PHRASES = [
  // Cấu trúc "Use of ... for ..."
  { en: /Use of present continuous for temporary situations with time expressions/gi, vi: 'Sử dụng thì hiện tại tiếp diễn cho các tình huống tạm thời với cách diễn đạt thời gian' },
  { en: /Use of present continuous to describe an action occurring at the moment of speaking/gi, vi: 'Sử dụng thì hiện tại tiếp diễn để miêu tả hành động đang diễn ra tại thời điểm nói' },
  { en: /Use of present continuous to describe an action occurring right now \(temporary situation\)/gi, vi: 'Sử dụng thì hiện tại tiếp diễn để miêu tả hành động đang diễn ra ngay lúc này (tình huống tạm thời)' },
  { en: /Use of present continuous for temporary situations/gi, vi: 'Sử dụng thì hiện tại tiếp diễn cho các tình huống tạm thời' },
  { en: /Use of present continuous/gi, vi: 'Sử dụng thì hiện tại tiếp diễn' },
  { en: /Use of present simple/gi, vi: 'Sử dụng thì hiện tại đơn' },
  { en: /Use of past simple/gi, vi: 'Sử dụng thì quá khứ đơn' },
  { en: /Use of past continuous/gi, vi: 'Sử dụng thì quá khứ tiếp diễn' },
  { en: /Use of present perfect/gi, vi: 'Sử dụng thì hiện tại hoàn thành' },
  { en: /Use of/gi, vi: 'Sử dụng' },

  // Cụm từ về tình huống, hành động
  { en: /temporary situations with time expressions/gi, vi: 'các tình huống tạm thời với cụm từ chỉ thời gian' },
  { en: /temporary situations/gi, vi: 'các tình huống tạm thời' },
  { en: /action occurring at the moment of speaking/gi, vi: 'hành động đang diễn ra tại thời điểm nói' },
  { en: /action occurring right now/gi, vi: 'hành động đang diễn ra ngay lúc này' },
  { en: /fixed future arrangements/gi, vi: 'kế hoạch hoặc sắp xếp cố định trong tương lai' },
  { en: /action in progress at the moment of speaking/gi, vi: 'hành động đang tiếp diễn tại thời điểm nói' },
  { en: /habitual actions/gi, vi: 'hành động lặp đi lặp lại theo thói quen' },
  { en: /general truths and scientific facts/gi, vi: 'chân lý và sự thật hiển nhiên' },
  { en: /general truths/gi, vi: 'chân lý / sự thật hiển nhiên' },
  { en: /stative verbs/gi, vi: 'động từ chỉ trạng thái (stative verbs)' },
  { en: /scheduled future events and timetables/gi, vi: 'sự kiện tương lai theo lịch trình và thời khóa biểu' },
  { en: /scheduled future events/gi, vi: 'sự kiện tương lai theo lịch trình' },
  { en: /timetables/gi, vi: 'thời khóa biểu / lịch trình' },
  { en: /temporary actions or current exceptions/gi, vi: 'hành động mang tính tạm thời hoặc ngoại lệ ở hiện tại' },
  { en: /temporary actions/gi, vi: 'hành động tạm thời' },
  { en: /current exceptions/gi, vi: 'ngoại lệ ở hiện tại' },

  // Câu giải thích mở đầu từ AI
  { en: /The question tests the distinction between the Present Simple tense, used for habitual actions indicated by the adverb 'usually', and the Present Continuous tense, used for temporary actions or current exceptions indicated by the time marker 'today' and the contrastive conjunction 'but'/gi, vi: "Câu hỏi kiểm tra sự phân biệt giữa thì Hiện tại đơn (dùng cho hành động thói quen qua trạng từ 'usually') và thì Hiện tại tiếp diễn (dùng cho hành động tạm thời qua dấu hiệu thời gian 'today' và liên từ tương phản 'but')" },
  { en: /The question tests the distinction between/gi, vi: 'Câu hỏi kiểm tra sự phân biệt giữa' },
  { en: /The question tests the use of/gi, vi: 'Câu hỏi kiểm tra cách sử dụng' },
  { en: /The question tests/gi, vi: 'Câu hỏi kiểm tra kiến thức' },
  { en: /The sentence requires a verb form that expresses a temporary, ongoing situation occurring during the current week/gi, vi: 'Câu yêu cầu dạng động từ diễn tả một tình huống tạm thời, đang tiếp diễn trong tuần hiện tại' },
  { en: /The sentence requires/gi, vi: 'Câu yêu cầu' },
  { en: /The correct answer requires/gi, vi: 'Đáp án chính xác đòi hỏi' },
  { en: /The correct answer is/gi, vi: 'Đáp án chính xác là' },
  { en: /indicated by the adverb/gi, vi: 'được nhận biết qua trạng từ' },
  { en: /indicated by the time marker/gi, vi: 'được nhận biết qua dấu hiệu thời gian' },
  { en: /contrastive conjunction/gi, vi: 'liên từ tương phản' },
  { en: /time expressions/gi, vi: 'cụm từ chỉ thời gian' },
  { en: /at the moment of speaking/gi, vi: 'tại thời điểm nói' },
  { en: /right now/gi, vi: 'ngay lúc này' },
  { en: /e\.g\.,/gi, vi: 'ví dụ:' },
  { en: /e\.g\./gi, vi: 'ví dụ:' },
  { en: /such as/gi, vi: 'chẳng hạn như' },
  { en: /for example/gi, vi: 'ví dụ' },
  { en: /Present Simple tense/gi, vi: 'thì Hiện tại đơn' },
  { en: /Present Continuous tense/gi, vi: 'thì Hiện tại tiếp diễn' },
  { en: /Routine actions or chân lý \/ sự thật hiển nhiên in passive voice/gi, vi: 'Hành động thường nhật hoặc chân lý / sự thật hiển nhiên ở thể bị động' },
  { en: /Routine actions/gi, vi: 'Hành động thường nhật' },
  { en: /rules, regulations, and/gi, vi: 'quy tắc, quy định và' },
  { en: /with the verb 'to be' for describing current facts or permanent characteristics/gi, vi: "với động từ 'to be' để mô tả sự thật hiện tại hoặc đặc tính lâu dài" },
  { en: /for habitual\/regular scheduled actions \(third-person singular agreement\)/gi, vi: 'cho hành động thói quen / lịch trình cố định (hòa hợp ngôi thứ 3 số ít)' },
  { en: /Singular nouns ending in -s \(collective\/uncountable\) and simple present tense for location/gi, vi: 'Danh từ số ít kết thúc bằng -s (tập hợp/không đếm được) và thì hiện tại đơn cho vị trí' },
  { en: /third-person singular agreement/gi, vi: 'hòa hợp ngôi thứ 3 số ít' },
  { en: /third-person singular/gi, vi: 'ngôi thứ 3 số ít' },
  { en: /in passive voice/gi, vi: 'ở thể bị động' },
];

/**
 * Chuẩn hóa các biến thể của chủ đề về một tên chủ đề gốc (Canonical Topic)
 * Giúp gộp các chủ đề tương tự (ví dụ: Simple Present, Present Simple Tense -> Present Simple)
 */
export function getCanonicalTopic(rawTopic) {
  if (!rawTopic) return 'Ngữ pháp chung';
  const clean = String(rawTopic).trim();
  const lower = clean.toLowerCase();

  // 1. Phân biệt / So sánh 2 thì (Present Simple vs. Present Continuous)
  if (lower.includes('vs') || lower.includes('versus')) {
    if (lower.includes('present simple') && (lower.includes('continuous') || lower.includes('progressive'))) {
      return 'Present Simple vs. Present Continuous';
    }
    return clean;
  }

  // 2. Thể bị động (Passive Voice)
  if (lower.includes('passive')) {
    return 'Passive Voice';
  }

  // 3. Các thì tiếp diễn (Continuous / Progressive)
  if (lower.includes('continuous') || lower.includes('progressive')) {
    if (lower.includes('past')) return 'Past Continuous';
    if (lower.includes('present perfect')) return 'Present Perfect Continuous';
    if (lower.includes('future perfect')) return 'Future Perfect Continuous';
    if (lower.includes('future')) return 'Future Continuous';
    return 'Present Continuous';
  }

  // 4. Các thì hoàn thành (Perfect)
  if (lower.includes('present perfect')) return 'Present Perfect';
  if (lower.includes('past perfect')) return 'Past Perfect';
  if (lower.includes('future perfect')) return 'Future Perfect';

  // 5. Thì hiện tại đơn (Present Simple)
  if (
    lower.includes('present simple') ||
    lower.includes('simple present') ||
    lower === 'present tense'
  ) {
    return 'Present Simple';
  }

  // 6. Thì quá khứ đơn (Past Simple)
  if (
    lower.includes('past simple') ||
    lower.includes('simple past') ||
    lower === 'past tense'
  ) {
    return 'Past Simple';
  }

  // 7. Thì tương lai đơn (Future Simple)
  if (lower.includes('future') && (lower.includes('simple') || lower.includes('will') || lower.includes('going to'))) {
    return 'Future Simple';
  }

  // 8. Sự hòa hợp Chủ ngữ & Động từ (Subject-Verb Agreement)
  if (lower.includes('subject') && lower.includes('verb')) {
    return 'Subject-Verb Agreement';
  }

  // 9. Câu điều kiện (Conditionals)
  if (lower.includes('condition')) {
    return 'Conditionals';
  }

  // 10. Mệnh đề quan hệ (Relative Clauses)
  if (lower.includes('relative clause')) {
    return 'Relative Clauses';
  }

  // 11. Câu gián tiếp / tường thuật (Reported Speech)
  if (lower.includes('reported speech') || lower.includes('indirect speech')) {
    return 'Reported Speech';
  }

  // 12. Động từ khuyết thiếu (Modal Verbs)
  if (lower.includes('modal')) {
    return 'Modal Verbs';
  }

  // 13. Danh động từ & Động từ nguyên mẫu (Gerunds and Infinitives)
  if (lower.includes('gerund') || lower.includes('infinitive')) {
    return 'Gerunds and Infinitives';
  }

  // 14. Giới từ (Prepositions)
  if (lower.includes('preposition')) {
    return 'Prepositions';
  }

  // 15. Mạo từ (Articles)
  if (lower.includes('article')) {
    return 'Articles';
  }

  // 16. So sánh hơn & So sánh nhất (Comparatives and Superlatives)
  if (lower.includes('comparative') || lower.includes('superlative')) {
    return 'Comparatives and Superlatives';
  }

  return clean;
}

/**
 * Dịch mô tả quy tắc / giải thích ngữ pháp sang tiếng Việt tự nhiên,
 * giữ nguyên các ví dụ tiếng Anh trong ngoặc kép hoặc nháy đơn.
 */
export function translateGrammarDescription(text) {
  if (!text || typeof text !== 'string') return '';
  let translated = text;

  for (const item of DESCRIPTIONS_PHRASES) {
    translated = translated.replace(item.en, item.vi);
  }

  return translated;
}

/**
 * Chuẩn hóa chuỗi không dấu phục vụ tìm kiếm tiếng Việt và tiếng Anh linh hoạt
 */
export function normalizeSearchText(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();
}


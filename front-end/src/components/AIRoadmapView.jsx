import React, { useState, useEffect, useRef } from 'react';
import { aiAPI } from '../services/api';
import { cleanCourseTitle, isCourseEnrolled } from '../utils/media';

// Các tùy chọn có sẵn phong phú cho 4 bước khảo sát định hướng lộ trình
export const STAGE_OPTIONS = {
  step_1: {
    title: 'Giai đoạn 1: Bạn là ai?',
    subtitle: 'Xác định đối tượng học viên & xuất phát điểm tiếng Anh hiện tại của bạn',
    level_tag: 'BƯỚC 01 • XÁC ĐỊNH ĐỐI TƯỢNG',
    step_label: 'Bạn là ai?',
    custom_placeholder: 'Ví dụ: Tôi là sinh viên năm cuối sắp ra trường / Tôi là kỹ sư CNTT muốn đọc tài liệu và phỏng vấn nước ngoài...',
    options: [
      {
        id: 'student',
        title: 'Học sinh / Sinh viên • Chuẩn bị tốt nghiệp & Chuẩn đầu ra',
        focus: 'Chuẩn đầu ra & Tốt nghiệp',
        desc: 'Cần thi lấy chứng chỉ TOEIC / CEFR để đáp ứng chuẩn đầu ra đại học hoặc chuẩn bị hồ sơ xin việc.',
        tags: [
          { icon: 'fa-solid fa-graduation-cap', label: 'Sinh viên' },
          { icon: 'fa-solid fa-award', label: 'Chuẩn đầu ra' },
          { icon: 'fa-solid fa-file-lines', label: 'Hồ sơ xin việc' },
        ],
      },
      {
        id: 'working',
        title: 'Người đi làm / Dân công sở • Cần tiếng Anh phát triển sự nghiệp',
        focus: 'Tiếng Anh văn phòng & Thăng tiến',
        desc: 'Muốn tự tin giao tiếp với sếp/đồng nghiệp, viết email chuẩn chỉnh, thuyết trình và tìm kiếm cơ hội thăng tiến.',
        tags: [
          { icon: 'fa-solid fa-briefcase', label: 'Người đi làm' },
          { icon: 'fa-solid fa-comments', label: 'Giao tiếp công sở' },
          { icon: 'fa-solid fa-chart-line', label: 'Thăng tiến sự nghiệp' },
        ],
      },
      {
        id: 'zero_basis',
        title: 'Mất gốc hoàn toàn • Chưa biết gì hoặc lâu năm không dùng tiếng Anh',
        focus: 'Xóa mất gốc & Lấy lại căn bản',
        desc: 'Sợ nói tiếng Anh, phát âm sai, muốn học lại bài bản từ bảng chữ cái, ngữ âm IPA và 12 thì ngữ pháp then chốt.',
        tags: [
          { icon: 'fa-solid fa-seedling', label: 'Xóa mất gốc A0-A1' },
          { icon: 'fa-solid fa-volume-high', label: 'Ngữ âm IPA chuẩn' },
          { icon: 'fa-solid fa-book-open', label: '12 thì cơ bản' },
        ],
      },
      {
        id: 'intermediate',
        title: 'Đã có nền tảng cơ bản (A2 - B1) • Muốn bứt phá trình độ cao hơn',
        focus: 'Nâng cao kỹ năng B1 - B2',
        desc: 'Đã nắm ngữ pháp cơ bản, muốn nâng cao vốn từ vựng học thuật, phản xạ nói trôi chảy hoặc luyện thi chứng chỉ cao.',
        tags: [
          { icon: 'fa-solid fa-brain', label: 'Nền tảng A2-B1' },
          { icon: 'fa-solid fa-bolt', label: 'Tăng tốc phản xạ' },
          { icon: 'fa-solid fa-trophy', label: 'Bứt phá điểm cao' },
        ],
      },
    ],
  },
  step_2: {
    title: 'Giai đoạn 2: Bạn học để làm gì?',
    subtitle: 'Xác định mục đích lớn nhất & động lực thúc đẩy bạn học tiếng Anh',
    level_tag: 'BƯỚC 02 • MỤC ĐÍCH HỌC TẬP',
    step_label: 'Học để làm gì?',
    custom_placeholder: 'Ví dụ: Tôi cần lấy bằng TOEIC 650 trong vòng 3 tháng tới để nộp bằng tốt nghiệp đại học...',
    options: [
      {
        id: 'exam_cert',
        title: 'Thi lấy chứng chỉ quốc tế TOEIC / IELTS (Ra trường, xin việc, định cư)',
        focus: 'Luyện thi chứng chỉ quốc tế',
        desc: 'Tập trung rèn luyện các dạng bài thi sát cấu trúc thật, phân tích bẫy đề thi và tối ưu thời gian làm bài.',
        tags: [
          { icon: 'fa-solid fa-bullseye', label: 'Chứng chỉ TOEIC/IELTS' },
          { icon: 'fa-solid fa-file-signature', label: 'Luyện đề thực tế' },
          { icon: 'fa-solid fa-award', label: 'Bằng cấp quốc tế' },
        ],
      },
      {
        id: 'communication',
        title: 'Tự tin giao tiếp thực tế & Thuyết trình đàm thoại trôi chảy',
        focus: 'Phản xạ giao tiếp tự nhiên',
        desc: 'Rèn phản xạ nghe nói trực tiếp, phát âm chuẩn ngữ điệu, xóa bỏ thói quen dịch nhẩm từ tiếng Việt sang tiếng Anh.',
        tags: [
          { icon: 'fa-solid fa-microphone', label: 'Nói tự nhiên' },
          { icon: 'fa-solid fa-users', label: 'Giao tiếp đời sống' },
          { icon: 'fa-solid fa-sparkles', label: 'Phản xạ tức thì' },
        ],
      },
      {
        id: 'career_growth',
        title: 'Phục vụ công việc, phỏng vấn công ty quốc tế & Đàm phán thương mại',
        focus: 'Tiếng Anh thương mại & Đi làm',
        desc: 'Trang bị kỹ năng viết email kinh doanh, phong thái đàm phán hợp đồng tự tin và phỏng vấn mô hình STAR.',
        tags: [
          { icon: 'fa-solid fa-building-columns', label: 'Tập đoàn đa quốc gia' },
          { icon: 'fa-solid fa-handshake', label: 'Kỹ năng đàm phán' },
          { icon: 'fa-solid fa-envelope', label: 'Email thương mại' },
        ],
      },
      {
        id: 'rebuild_foundation',
        title: 'Lấy lại nền tảng vững chắc & Xóa bỏ cảm giác sợ tiếng Anh',
        focus: 'Vững nền tảng 1000 từ & Ngữ pháp',
        desc: 'Xây dựng lại gốc ngữ pháp không sai sót, ghi nhớ 1000 từ vựng cốt lõi qua Flashcards và tự tin học lên cao.',
        tags: [
          { icon: 'fa-solid fa-spell-check', label: 'Ngữ pháp chắc chắn' },
          { icon: 'fa-solid fa-layer-group', label: '1000 từ thông dụng' },
          { icon: 'fa-solid fa-shield-heart', label: 'Hết sợ tiếng Anh' },
        ],
      },
    ],
  },
  step_3: {
    title: 'Giai đoạn 3: Mục tiêu điểm số hoặc Trình độ bạn muốn đạt?',
    subtitle: 'Xác định mốc điểm số đầu ra (TOEIC, IELTS, CEFR) hoặc mức cải thiện bạn kỳ vọng (ví dụ: nâng từ 500 lên 650)',
    level_tag: 'BƯỚC 03 • MỤC TIÊU ĐẦU RA',
    step_label: 'Mục tiêu điểm số',
    custom_placeholder: 'Ví dụ: Tôi muốn nâng điểm TOEIC từ 500 lên 650 / Muốn đạt IELTS 6.5 / Muốn đạt TOEIC 600 trong 2 tháng...',
    options: [
      {
        id: 'toeic_500_650',
        title: 'Mục tiêu TOEIC 500 - 650+ (Chuẩn tốt nghiệp hoặc Nâng band từ 450 - 500 lên 650+)',
        focus: 'TOEIC 500 - 650+ Bứt phá',
        desc: 'Mục tiêu phổ biến cho chuẩn đầu ra và xin việc. Tập trung vào Skimming & Scanning Part 7, câu hỏi ngắn Part 2 và bẫy ngữ pháp Part 5.',
        tags: [
          { icon: 'fa-solid fa-bolt', label: 'TOEIC 650+' },
          { icon: 'fa-solid fa-arrow-trend-up', label: 'Nâng band 500 ➔ 650' },
          { icon: 'fa-solid fa-graduation-cap', label: 'Chuẩn tốt nghiệp' },
        ],
      },
      {
        id: 'toeic_700_850',
        title: 'Mục tiêu TOEIC 700 - 850 - 900+ (Điểm số xuất sắc & Ứng tuyển tập đoàn quốc tế)',
        focus: 'TOEIC 850+ Chuyên sâu',
        desc: 'Dành cho học viên đã có nền tảng 600+, muốn bứt phá đỉnh cao 800 - 900+ để mở rộng cơ hội thăng tiến và làm việc quốc tế.',
        tags: [
          { icon: 'fa-solid fa-trophy', label: 'TOEIC 850+ Master' },
          { icon: 'fa-solid fa-fire', label: 'Bứt phá cực hạn' },
          { icon: 'fa-solid fa-building', label: 'Tập đoàn đa quốc gia' },
        ],
      },
      {
        id: 'ielts_academic',
        title: 'Mục tiêu IELTS Band 5.5 - 6.5 - 7.0+ Overall (Du học & Hồ sơ quốc tế)',
        focus: 'IELTS 6.0 - 7.0+ Academic',
        desc: 'Phát triển toàn diện 4 kỹ năng Nghe - Nói - Đọc - Viết, làm chủ phương pháp viết luận Academic Writing và đàm thoại Speaking.',
        tags: [
          { icon: 'fa-solid fa-plane-departure', label: 'Sẵn sàng du học' },
          { icon: 'fa-solid fa-pen-nib', label: 'Writing Task 1 & 2' },
          { icon: 'fa-solid fa-crown', label: 'IELTS 7.0+ Master' },
        ],
      },
      {
        id: 'cefr_b1_b2',
        title: 'Mục tiêu Giao tiếp Chuẩn CEFR B1 - B2 (Phản xạ lưu loát & Nhận Chứng chỉ số QR)',
        focus: 'Giao tiếp B1 - B2 Lưu loát',
        desc: 'Giao tiếp độc lập tự tin không cần dịch nhẩm trong đầu, làm chủ 3000 từ vựng đàm thoại và nhận Chứng chỉ số chính quy có mã QR.',
        tags: [
          { icon: 'fa-solid fa-comments', label: 'Giao tiếp B2 lưu loát' },
          { icon: 'fa-solid fa-award', label: 'Chứng chỉ số QR' },
          { icon: 'fa-solid fa-shield-check', label: 'Chứng nhận chính quy' },
        ],
      },
    ],
  },
  step_4: {
    title: 'Giai đoạn 4: Bạn muốn tìm khóa học phù hợp như thế nào?',
    subtitle: 'Chọn tiêu chí khóa học và định hướng đào tạo để AI quét CSDL và ghép nối lộ trình sát nhu cầu nhất',
    level_tag: 'BƯỚC 04 • TÌM KHÓA HỌC PHÙ HỢP',
    step_label: 'Khóa học phù hợp',
    custom_placeholder: 'Ví dụ: Tôi muốn khóa học có nhiều bài tập thực hành, có Trợ lý AI sửa lỗi, học trong vòng 2-3 tháng...',
    options: [
      {
        id: 'course_comprehensive',
        title: 'Lộ trình khóa học Toàn diện từ Nền tảng ➔ Đạt mục tiêu (Bài bản từ A đến Z)',
        focus: 'Khóa học toàn diện A - Z (Ngữ pháp + Từ vựng + Đề thi)',
        desc: 'AI sẽ tìm các khóa học có lộ trình bài bản, bắt đầu từ củng cố kiến thức nền móng, xây dựng vốn từ đến luyện đề hoàn chỉnh.',
        tags: [
          { icon: 'fa-solid fa-layer-group', label: 'Khóa học A-Z toàn diện' },
          { icon: 'fa-solid fa-seedling', label: 'Vững nền tảng' },
          { icon: 'fa-solid fa-book-open', label: 'Lộ trình đầy đủ' },
        ],
      },
      {
        id: 'course_intensive_test',
        title: 'Lộ trình khóa học Luyện đề thực chiến & Cấp tốc bứt tốc điểm số (1 - 2 tháng)',
        focus: 'Khóa học Luyện đề thực tế & Mẹo tránh bẫy',
        desc: 'AI sẽ ưu tiên các khóa học giải đề thi sát cấu trúc thật, phân tích bẫy đề thi và các bài trắc nghiệm chấm điểm tự động.',
        tags: [
          { icon: 'fa-solid fa-bolt', label: 'Cấp tốc 1 - 2 tháng' },
          { icon: 'fa-solid fa-file-signature', label: 'Luyện đề thực tế' },
          { icon: 'fa-solid fa-magnifying-glass-chart', label: 'Mẹo tránh bẫy' },
        ],
      },
      {
        id: 'course_communication',
        title: 'Lộ trình khóa học Giao tiếp thực hành & Ứng dụng công việc thực tế (Không nặng lý thuyết)',
        focus: 'Khóa học Giao tiếp phản xạ & Phát âm chuẩn',
        desc: 'AI sẽ chọn các khóa học tập trung vào đàm thoại thực chiến, phát âm chuẩn ngữ điệu, thuyết trình và giao tiếp nơi công sở.',
        tags: [
          { icon: 'fa-solid fa-microphone', label: 'Nói tự nhiên' },
          { icon: 'fa-solid fa-volume-high', label: 'Chuẩn phát âm IPA' },
          { icon: 'fa-solid fa-briefcase', label: 'Ứng dụng công sở' },
        ],
      },
      {
        id: 'course_smart_ai',
        title: 'Lộ trình Tự học thông minh kết hợp Trợ lý AI đồng hành 1-1 (Flashcards + AI sửa lỗi)',
        focus: 'Khóa học Tự học linh hoạt 30-45p/ngày cùng AI',
        desc: 'AI sẽ đề xuất các khóa học có Flashcards thông minh, bài kiểm tra chẩn đoán lỗ hổng kiến thức và Gia sư AI hỗ trợ 24/7.',
        tags: [
          { icon: 'fa-solid fa-wand-magic-sparkles', label: 'AI Chẩn đoán lỗi sai' },
          { icon: 'fa-solid fa-clone', label: 'Flashcards thông minh' },
          { icon: 'fa-solid fa-clock', label: '30 - 45 phút/ngày' },
        ],
      },
    ],
  },
};

// Helper an toàn không bao giờ render React Child là raw Object
const safeText = (val, fallback = '') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return val.label || val.name || val.title || val.text || val.value || JSON.stringify(val);
  }
  return fallback;
};

// Helper trích xuất thông tin tag an toàn
const getSafeTagInfo = (tag) => {
  if (!tag) return { icon: 'fa-solid fa-tag', label: '' };
  if (typeof tag === 'string') return { icon: 'fa-solid fa-tag', label: tag };
  if (typeof tag === 'object') {
    const label = tag.label || tag.name || tag.title || tag.text || tag.skill || '';
    const icon = tag.icon || 'fa-solid fa-tag';
    return { icon, label: String(label) };
  }
  return { icon: 'fa-solid fa-tag', label: String(tag) };
};

export default function AIRoadmapView({
  user,
  isLoggedIn,
  myCourses = [],
  onOpenAuthModal,
  onNavigateToCourses,
  onNavigateToLearning,
  onSelectCourse,
  onEnroll,
  embedded = false,
}) {
  // Xác định người dùng mới hoặc khách (chưa đăng ký khóa nào)
  const isNewOrGuest = !isLoggedIn || !Array.isArray(myCourses) || myCourses.length === 0;

  // 4 bước khảo sát chuẩn theo yêu cầu:
  // 1: Bạn là ai? | 2: Học để làm gì? | 3: Mục tiêu điểm số | 4: Thời gian & Cách học
  const numStages = 4;
  const currentStageKeys = ['step_1', 'step_2', 'step_3', 'step_4'];

  const [currentWizardStep, setCurrentWizardStep] = useState(1); // Bước hiện tại: 1 -> 4
  const [isWizardOpen, setIsWizardOpen] = useState(true); // Hiển thị Wizard lựa chọn giai đoạn
  const [stageSelections, setStageSelections] = useState({
    step_1: { selected_id: 'student', custom_input: '' },
    step_2: { selected_id: 'exam_cert', custom_input: '' },
    step_3: { selected_id: 'toeic_500_650', custom_input: '' },
    step_4: { selected_id: 'course_comprehensive', custom_input: '' },
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [roadmapData, setRoadmapData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Tham chiếu cuộn đến Wizard
  const wizardContainerRef = useRef(null);

  // Hiệu ứng cuộn và vạch nối bậc thang Timeline
  const [visibleIndices, setVisibleIndices] = useState(new Set([0, 1, 2, 3]));
  const [lineHeight, setLineHeight] = useState(0);
  const trackRef = useRef(null);
  const itemRefs = useRef([]);
  const dotRefs = useRef([]);

  // Xử lý thay đổi lựa chọn cho một bước khảo sát
  const handleSelectStageOption = (stageKey, optionId) => {
    setStageSelections((prev) => ({
      ...prev,
      [stageKey]: {
        ...prev[stageKey],
        selected_id: optionId,
      },
    }));
  };

  // Xử lý tự nhập mong muốn riêng cho từng bước
  const handleCustomInputChange = (stageKey, text) => {
    setStageSelections((prev) => ({
      ...prev,
      [stageKey]: {
        ...prev[stageKey],
        custom_input: text,
      },
    }));
  };

  // Chuẩn bị payload gửi lên Backend dựa trên 4 câu trả lời khảo sát
  const buildPayloadFromSelections = () => {
    const s1 = stageSelections.step_1 || {};
    const s2 = stageSelections.step_2 || {};
    const s3 = stageSelections.step_3 || {};
    const s4 = stageSelections.step_4 || {};

    const opt1 = (STAGE_OPTIONS.step_1.options || []).find((o) => o.id === s1.selected_id);
    const opt2 = (STAGE_OPTIONS.step_2.options || []).find((o) => o.id === s2.selected_id);
    const opt3 = (STAGE_OPTIONS.step_3.options || []).find((o) => o.id === s3.selected_id);
    const opt4 = (STAGE_OPTIONS.step_4.options || []).find((o) => o.id === s4.selected_id);

    const whoYouAre = s1.selected_id === 'custom' ? (s1.custom_input || 'Học viên cá nhân') : (opt1?.title || 'Sinh viên / Người học');
    const targetGoal = s2.selected_id === 'custom' ? (s2.custom_input || 'Luyện thi chứng chỉ') : (opt2?.title || 'Luyện thi chứng chỉ TOEIC / IELTS');
    const targetScore = s3.selected_id === 'custom' ? (s3.custom_input || 'TOEIC 650+') : (opt3?.title || 'TOEIC 500 - 650+');
    const coursePreference = s4.selected_id === 'custom' ? (s4.custom_input || 'Khóa học toàn diện A-Z') : (opt4?.title || 'Khóa học Toàn diện từ Nền tảng');

    let estimatedLevel = 'A2';
    if (s1.selected_id === 'zero_basis') estimatedLevel = 'A1';
    else if (s1.selected_id === 'intermediate') estimatedLevel = 'B1';
    else if (s1.selected_id === 'working') estimatedLevel = 'A2';

    // Tạo 4 giai đoạn lộ trình bậc thang bám sát hồ sơ học viên
    const customStages = [
      {
        stage_number: 1,
        title: `Giai đoạn 1: Nền tảng & Củng cố (Dành cho: ${whoYouAre})`,
        focus: opt1?.focus || 'Chuẩn hóa phát âm & Ngữ pháp căn bản',
        level_tag: 'CẤP ĐỘ CEFR A1 - A2 (NỀN TẢNG)',
        desc: `Bắt đầu từ xuất phát điểm '${whoYouAre}', hệ thống tập trung củng cố 12 thì ngữ pháp then chốt, chuẩn hóa ngữ âm IPA và tích lũy 1000 từ vựng cốt lõi.`,
        tags: opt1?.tags || [{ icon: 'fa-solid fa-seedling', label: 'Xây dựng gốc' }],
        custom_input: s1.custom_input || '',
        estimated_weeks: '3 - 4 tuần',
      },
      {
        stage_number: 2,
        title: `Giai đoạn 2: Tăng tốc kỹ năng cốt lõi (Mục đích: ${targetGoal})`,
        focus: opt2?.focus || 'Phát triển từ vựng chuyên sâu & Đọc hiểu',
        level_tag: 'CẤP ĐỘ CEFR B1 (TĂNG TỐC KỸ NĂNG)',
        desc: `Phục vụ mục đích '${targetGoal}', học viên được mở rộng vốn từ vựng chuyên đề, rèn kỹ thuật Skimming/Scanning đọc hiểu nhanh và phản xạ đàm thoại trực tiếp.`,
        tags: opt2?.tags || [{ icon: 'fa-solid fa-bolt', label: 'Tăng tốc B1' }],
        custom_input: s2.custom_input || '',
        estimated_weeks: '4 - 5 tuần',
      },
      {
        stage_number: 3,
        title: `Giai đoạn 3: Thực chiến bứt phá điểm số (Mục tiêu: ${targetScore})`,
        focus: opt3?.focus || 'Luyện đề thực tế & AI Chẩn đoán lỗi sai',
        level_tag: 'CẤP ĐỘ CEFR B2 (THỰC CHIẾN BỨT PHÁ)',
        desc: `Hướng tới mục tiêu '${targetScore}', giải đề thi thật dưới áp lực thời gian. Trợ lý AI tự động phân tích bẫy đề thi, chỉ ra lỗ hổng kiến thức và gợi ý bài ôn bù đắp kịp thời.`,
        tags: opt3?.tags || [{ icon: 'fa-solid fa-bullseye', label: 'Thực chiến đề thi' }],
        custom_input: s3.custom_input || '',
        estimated_weeks: '4 - 6 tuần',
      },
      {
        stage_number: 4,
        title: `Giai đoạn 4: Về đích & Cấp chứng chỉ số (${coursePreference})`,
        focus: opt4?.focus || 'Chinh phục mốc điểm cao nhất & Cấp chứng chỉ',
        level_tag: 'CẤP ĐỘ CEFR C1 (VỀ ĐÍCH & CHỨNG CHỈ)',
        desc: `Theo định hướng '${coursePreference}', tối đa hóa điểm số tuyệt đối, hoàn thành bài đánh giá năng lực chuẩn hóa để nhận Chứng chỉ số chính quy có mã QR xác thực.`,
        tags: opt4?.tags || [{ icon: 'fa-solid fa-award', label: 'Chứng chỉ số QR' }],
        custom_input: s4.custom_input || '',
        estimated_weeks: '3 - 4 tuần',
      },
    ];

    return {
      current_level: estimatedLevel,
      current_score: whoYouAre,
      target_goal: targetGoal,
      target_score: targetScore,
      custom_notes: `Học viên: ${whoYouAre} | Mục đích: ${targetGoal} | Mục tiêu điểm số: ${targetScore} | Định hướng khóa học: ${coursePreference}`,
      num_stages: 4,
      custom_stages: customStages,
    };
  };

  // Gọi API sinh Lộ trình AI bám sát từng giai đoạn
  const handleGenerateRoadmap = async (overridePayload = null) => {
    const payload = overridePayload || buildPayloadFromSelections();
    setIsGenerating(true);
    setErrorMsg('');
    setGenerationStep(1);

    const stepTimer1 = setTimeout(() => setGenerationStep(2), 600);
    const stepTimer2 = setTimeout(() => setGenerationStep(3), 1300);

    try {
      const response = await aiAPI.generateRoadmap(payload);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const generated = response?.data?.data || response?.data;
      if (generated && generated.steps && Array.isArray(generated.steps) && generated.steps.length > 0) {
        setRoadmapData(generated);
        setIsWizardOpen(false); // Đóng wizard, hiển thị lộ trình hoàn chỉnh
        try {
          localStorage.setItem('ai_personalized_roadmap', JSON.stringify(generated));
          localStorage.setItem('ai_roadmap_stage_selections', JSON.stringify(stageSelections));
        } catch (e) {}
        setVisibleIndices(new Set(generated.steps.map((_, i) => i)));
      } else {
        setErrorMsg('Không thể khởi tạo lộ trình theo yêu cầu. Vui lòng thử lại.');
      }
    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      console.error('Error generating AI roadmap:', err);
      setErrorMsg(err.response?.data?.message || 'Có lỗi kết nối tới AI. Đang chuẩn bị lộ trình phù hợp.');
    } finally {
      setIsGenerating(false);
      setGenerationStep(0);
    }
  };

  // Tự động load từ localStorage nếu có; người mới hoặc guest thì hiển thị Wizard chọn lộ trình
  useEffect(() => {
    let hasLoaded = false;
    try {
      const saved = localStorage.getItem('ai_personalized_roadmap');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
          setRoadmapData(parsed);
          hasLoaded = true;
          // Nếu đã có khóa học từ trước thì đóng wizard để xem kết quả
          if (!isNewOrGuest) {
            setIsWizardOpen(false);
          }
        }
      }
      const savedSelections = localStorage.getItem('ai_roadmap_stage_selections');
      if (savedSelections) {
        setStageSelections(JSON.parse(savedSelections));
      }
    } catch (e) {}

    // Lưu ý: Nếu là người mới hoặc guest thì KHÔNG tự động gọi API sinh lộ trình.
    // Giữ Wizard mở để học viên tự chọn từng giai đoạn trước!
    if (!hasLoaded && !isNewOrGuest) {
      handleGenerateRoadmap();
    }
  }, [isNewOrGuest]);

  // IntersectionObserver theo dõi các bước cuộn
  useEffect(() => {
    if (!roadmapData?.steps || typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        const index = Number(entry.target.dataset.index);
        if (entry.isIntersecting) {
          setVisibleIndices((prev) => {
            const next = new Set(prev);
            next.add(index);
            return next;
          });
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '0px 0px -20px 0px',
    });

    (itemRefs.current || []).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [roadmapData]);

  // Cập nhật chiều dài đường kẻ tiến trình động
  useEffect(() => {
    const updateLineHeight = () => {
      if (!visibleIndices || visibleIndices.size === 0 || !dotRefs.current || !dotRefs.current.length || !trackRef.current) {
        setLineHeight(0);
        return;
      }
      try {
        const maxIdx = Math.max(...Array.from(visibleIndices));
        const targetDot = dotRefs.current[maxIdx];
        if (targetDot && trackRef.current) {
          const trackRect = trackRef.current.getBoundingClientRect();
          const dotRect = targetDot.getBoundingClientRect();
          const height = dotRect.top - trackRect.top + dotRect.height / 2 - 14;
          setLineHeight(Math.max(16, height));
        }
      } catch (e) {
        setLineHeight(0);
      }
    };

    updateLineHeight();
    window.addEventListener('resize', updateLineHeight);
    return () => window.removeEventListener('resize', updateLineHeight);
  }, [visibleIndices, roadmapData]);

  // Kiểm tra khóa học đã ghi danh chưa và lấy tiến độ
  const getEnrollmentInfo = (course) => {
    if (!course || !Array.isArray(myCourses) || myCourses.length === 0) {
      return { enrolled: false, progress: 0, isCompleted: false };
    }
    const courseId = String(course.id || course.course_id || '').toLowerCase();
    const enrolledItem = myCourses.find((c) => {
      const cObj = c.course || c;
      const cId = String(cObj.id || c.course_id || '').toLowerCase();
      return cId && cId === courseId;
    });

    if (!enrolledItem) {
      const isEnr = isCourseEnrolled(course, myCourses);
      return { enrolled: isEnr, progress: 0, isCompleted: false };
    }

    const progress = Math.min(
      100,
      Math.max(0, Math.round(enrolledItem.progress_percent != null ? enrolledItem.progress_percent : 0))
    );
    const isCompleted = progress >= 100 || enrolledItem.status === 'COMPLETED';
    return { enrolled: true, progress, isCompleted, enrollment: enrolledItem };
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };


  return (
    <div className="ai-roadmap-page-container" style={{ maxWidth: '1280px', margin: '0 auto', padding: embedded ? '10px 0 40px 0' : '0 16px 60px 16px' }}>
      {/* 1. Header Banner & Giới thiệu tính năng (Chỉ hiển thị khi xem toàn màn hình) */}
      {!embedded && (
        <div
          className="roadmap-hero-card"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0369a1 100%)',
            borderRadius: '20px',
            padding: '34px 30px',
            color: '#ffffff',
            marginBottom: '26px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '840px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '5px 12px', borderRadius: '20px', marginBottom: '14px' }}>
              <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#fbbf24', fontSize: '0.85rem' }}></i>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#fef3c7', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Lộ Trình Tùy Biến Theo Từng Giai Đoạn (AI Multi-Stage Engine)
              </span>
            </div>

            <h1 style={{ fontSize: '2.05rem', fontWeight: '900', lineHeight: '1.25', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
              Tùy Chọn Từng Giai Đoạn <span style={{ color: '#38bdf8' }}>Theo Mục Tiêu Của Bạn</span>
            </h1>

            <p style={{ fontSize: '0.96rem', lineHeight: '1.65', color: '#cbd5e1', margin: '0 0 22px 0' }}>
              Bạn có thể <strong>chọn nhiều hướng học tập cho từng chặng</strong> (từ lấy gốc phát âm, tăng tốc từ vựng đến giải đề thực chiến), hoặc <strong>tự nhập mong muốn riêng</strong> cho bất kỳ giai đoạn nào. Hệ thống sẽ tự động ghép nối các khóa học thực tế để bạn theo dõi tiến độ học tập.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setIsWizardOpen(!isWizardOpen)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: isWizardOpen ? '#334155' : '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                <i className={isWizardOpen ? 'fa-solid fa-chevron-up' : 'fa-solid fa-sliders'}></i>
                <span>{isWizardOpen ? 'Thu gọn cài đặt từng giai đoạn' : 'Tùy chỉnh 4 giai đoạn theo ý muốn'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenerateRoadmap()}
                disabled={isGenerating}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '0.92rem',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  opacity: isGenerating ? 0.7 : 1,
                }}
              >
                <i className={isGenerating ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate'}></i>
                <span>{isGenerating ? 'AI đang cập nhật...' : 'Khởi tạo lại lộ trình'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
                title="In lộ trình học tập"
              >
                <i className="fa-solid fa-print"></i>
                <span>In lộ trình</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
                title="Sao chép liên kết"
              >
                <i className={copiedLink ? 'fa-solid fa-check' : 'fa-solid fa-share-nodes'}></i>
                <span>{copiedLink ? 'Đã sao chép!' : 'Chia sẻ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. BẢNG TÙY CHỈNH TỪNG GIAI ĐOẠN - STEP-BY-STEP WIZARD THEO YÊU CẦU NGƯỜI DÙNG */}
      <div
        ref={wizardContainerRef}
        className="stage-selector-container"
        style={{
          backgroundColor: 'var(--bg-surface, #ffffff)',
          border: '2px solid #0284c7',
          borderRadius: '20px',
          padding: '24px 26px',
          marginBottom: '28px',
          boxShadow: '0 10px 30px rgba(2, 132, 199, 0.08)',
          display: isWizardOpen || !roadmapData ? 'block' : 'none',
        }}
      >
        {/* Header của Wizard */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            paddingBottom: '14px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '20px', fontSize: '0.74rem', fontWeight: '800', marginBottom: '6px' }}>
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              <span>KHẢO SÁT ĐỊNH HƯỚNG LỘ TRÌNH AI (BƯỚC {currentWizardStep} / 4)</span>
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: '900',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Thiết Kế Lộ Trình Học Tập Phù Hợp Riêng Cho Bạn</span>
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Hoàn thành 4 bước định hướng bên dưới, Trợ lý AI sẽ tự động phân tích và đề xuất lộ trình khóa học tối ưu nhất.
            </p>
          </div>

          {/* Badge tiến độ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '5px 12px', borderRadius: '10px' }}>
              <i className="fa-solid fa-chart-pie" style={{ marginRight: '5px' }}></i>
              Tiến độ: {Math.round((currentWizardStep / 4) * 100)}%
            </span>
          </div>
        </div>

        {/* Thanh Stepper Indicator (Hiển thị 4 bước định hướng) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '24px',
            backgroundColor: '#f8fafc',
            padding: '10px',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
          }}
        >
          {currentStageKeys.map((key, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentWizardStep;
            const isCurrent = stepNum === currentWizardStep;
            const stageConf = STAGE_OPTIONS[key];

            return (
              <button
                key={key}
                type="button"
                onClick={() => setCurrentWizardStep(stepNum)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: isCurrent ? '2px solid #0284c7' : '1px solid transparent',
                  backgroundColor: isCurrent ? '#ffffff' : isCompleted ? '#ecfdf5' : 'transparent',
                  cursor: 'pointer',
                  boxShadow: isCurrent ? '0 2px 8px rgba(2, 132, 199, 0.15)' : 'none',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted ? '#10b981' : isCurrent ? '#0284c7' : '#cbd5e1',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.78rem',
                    fontWeight: '800',
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? <i className="fa-solid fa-check"></i> : stepNum}
                </div>
                <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  <div
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: isCurrent ? '800' : '600',
                      color: isCurrent ? '#0284c7' : isCompleted ? '#059669' : '#64748b',
                    }}
                  >
                    Bước {stepNum}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: '#94a3b8',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {stageConf.step_label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Nội dung DUY NHẤT của Bước hiện tại (currentWizardStep) */}
        {(() => {
          const currentStageKey = currentStageKeys[currentWizardStep - 1] || 'step_1';
          const stageConfig = STAGE_OPTIONS[currentStageKey];
          const currentSel = stageSelections[currentStageKey] || { selected_id: stageConfig.options[0]?.id, custom_input: '' };
          const isCustom = currentSel.selected_id === 'custom';

          return (
            <div
              style={{
                backgroundColor: 'var(--bg-main, #f8fafc)',
                border: '1.5px solid var(--border-color, #e2e8f0)',
                borderRadius: '16px',
                padding: '22px 24px',
                animation: 'fadeIn 0.25s ease-out',
              }}
            >
              {/* Header của bước hiện tại */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '18px',
                  flexWrap: 'wrap',
                  gap: '10px',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '900',
                      fontSize: '1.1rem',
                      boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)',
                    }}
                  >
                    {currentWizardStep}
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)', display: 'block' }}>
                      {stageConfig.title}
                    </strong>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      {stageConfig.subtitle}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: '800',
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    letterSpacing: '0.5px',
                  }}
                >
                  {stageConfig.level_tag}
                </span>
              </div>

              {/* Lưới các tùy chọn có sẵn cho bước này */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                {stageConfig.options.map((opt) => {
                  const isSelected = currentSel.selected_id === opt.id;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectStageOption(currentStageKey, opt.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '16px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #0284c7' : '1px solid var(--border-color, #cbd5e1)',
                        backgroundColor: isSelected ? '#f0f9ff' : 'var(--bg-surface, #ffffff)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.12)' : 'none',
                      }}
                    >
                      <input
                        type="radio"
                        name={`radio_${currentStageKey}`}
                        checked={isSelected}
                        onChange={() => handleSelectStageOption(currentStageKey, opt.id)}
                        style={{ marginTop: '4px', cursor: 'pointer', width: '16px', height: '16px', accentColor: '#0284c7' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.92rem',
                            fontWeight: '800',
                            color: isSelected ? '#0369a1' : 'var(--text-main)',
                            lineHeight: '1.35',
                            marginBottom: '6px',
                          }}
                        >
                          {opt.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.45', marginBottom: '8px' }}>
                          {opt.desc}
                        </div>
                        {opt.tags && Array.isArray(opt.tags) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {opt.tags.map((t, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: isSelected ? '#e0f2fe' : '#f1f5f9',
                                  color: isSelected ? '#0369a1' : '#475569',
                                  fontWeight: '600',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                {t.icon && <i className={t.icon} style={{ fontSize: '0.65rem' }}></i>}
                                <span>{t.label}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Tùy chọn Tự nhập theo ý muốn cho bước này */}
                <div
                  onClick={() => handleSelectStageOption(currentStageKey, 'custom')}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    borderRadius: '12px',
                    border: isCustom ? '2px solid #8b5cf6' : '1.5px dashed #cbd5e1',
                    backgroundColor: isCustom ? '#f5f3ff' : 'var(--bg-surface, #ffffff)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isCustom ? '0 4px 12px rgba(139, 92, 246, 0.15)' : 'none',
                  }}
                >
                  <input
                    type="radio"
                    name={`radio_${currentStageKey}`}
                    checked={isCustom}
                    onChange={() => handleSelectStageOption(currentStageKey, 'custom')}
                    style={{ marginTop: '4px', cursor: 'pointer', width: '16px', height: '16px', accentColor: '#8b5cf6' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.92rem',
                        fontWeight: '800',
                        color: isCustom ? '#6d28d9' : 'var(--text-main)',
                        lineHeight: '1.35',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <i className="fa-solid fa-pen-to-square" style={{ color: '#8b5cf6' }}></i>
                      <span>✏️ Tự nhập câu trả lời riêng cho Bước {currentWizardStep}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
                      Bạn có tình trạng hoặc mong muốn riêng biệt? Nhập chi tiết bên dưới, Trợ lý AI sẽ tự động phân tích và điều chỉnh lộ trình cho bạn.
                    </div>
                  </div>
                </div>
              </div>

              {/* Ô input hiển thị khi chọn Tự nhập hoặc muốn ghi chú thêm cho bước này */}
              {(isCustom || currentSel.custom_input) && (
                <div style={{ marginTop: '14px', animation: 'fadeIn 0.2s ease-out' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '6px',
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      color: isCustom ? '#6d28d9' : '#0369a1',
                    }}
                  >
                    <i className="fa-solid fa-feather-pointed"></i>
                    <span>
                      {isCustom
                        ? `Nhập câu trả lời cụ thể cho Bước ${currentWizardStep}:`
                        : `Ghi chú bổ sung cho Bước ${currentWizardStep} (Tùy chọn):`}
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder={stageConfig.custom_placeholder || 'Nhập chi tiết mong muốn của bạn...'}
                    value={currentSel.custom_input || ''}
                    onChange={(e) => handleCustomInputChange(currentStageKey, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: isCustom ? '2px solid #8b5cf6' : '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      fontSize: '0.9rem',
                      color: 'var(--text-main)',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                      outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })()}

        {/* Thanh Điều Hướng Dưới Chân (Footer Navigation Controls) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginTop: '22px',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            paddingTop: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Nút Quay lại */}
          <div>
            {currentWizardStep > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setCurrentWizardStep((prev) => Math.max(1, prev - 1));
                  wizardContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-main)',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>
                  Quay lại: {STAGE_OPTIONS[currentStageKeys[currentWizardStep - 2]]?.step_label || `Bước ${currentWizardStep - 1}`}
                </span>
              </button>
            ) : roadmapData ? (
              <button
                type="button"
                onClick={() => setIsWizardOpen(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                Đóng khảo sát (Xem lộ trình hiện tại)
              </button>
            ) : (
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                <i className="fa-solid fa-circle-info" style={{ marginRight: '5px' }}></i>
                Bước 1: Xác định bạn là ai & xuất phát điểm
              </span>
            )}
          </div>

          {/* Nút Tiếp theo hoặc Hoàn tất */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentWizardStep < numStages ? (
              <button
                type="button"
                onClick={() => {
                  setCurrentWizardStep((prev) => Math.min(numStages, prev + 1));
                  wizardContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>
                  Tiếp theo: {STAGE_OPTIONS[currentStageKeys[currentWizardStep]]?.step_label || `Bước ${currentWizardStep + 1}`}
                </span>
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleGenerateRoadmap()}
                disabled={isGenerating}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 28px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)',
                  transition: 'all 0.2s ease',
                }}
              >
                <i className={isGenerating ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-wand-magic-sparkles'}></i>
                <span>{isGenerating ? 'AI đang tìm khóa học & ghép lộ trình...' : '✨ AI Tìm Khóa Học & Tạo Lộ Trình Phù Hợp (4 Giai Đoạn)'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Banner thông báo lộ trình đã được AI cấu hình xong kèm nút Mở lại Wizard */}
      {roadmapData && !isWizardOpen && !isGenerating && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #bae6fd',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}
            >
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                Lộ trình học tập phù hợp đã được AI thiết kế theo {numStages} giai đoạn bạn chọn
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Bao gồm các khóa học bám sát từ CSDL, phân định rõ khóa đã đăng ký và khóa đề xuất thêm.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsWizardOpen(true);
              setCurrentWizardStep(1);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1px solid #0284c7',
              backgroundColor: '#f0f9ff',
              color: '#0284c7',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-sliders"></i>
            <span>Tùy chỉnh lại các giai đoạn</span>
          </button>
        </div>
      )}

      {/* Thông báo lỗi nếu có */}
      {errorMsg && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3. Trạng thái Đang tư duy AI */}
      {isGenerating && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '20px',
            padding: '50px 30px',
            textAlign: 'center',
            marginBottom: '32px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ position: 'relative', width: '70px', height: '70px', margin: '0 auto 20px auto' }}>
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '4px solid #e0f2fe',
                borderTopColor: '#0284c7',
                animation: 'spin 1s linear infinite',
              }}
            />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#0284c7', fontSize: '1.4rem' }}>
              <i className="fa-solid fa-brain"></i>
            </div>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
            {generationStep === 1 && 'Đang tiếp nhận cấu hình từng giai đoạn của bạn...'}
            {generationStep === 2 && 'Đang ghép nối các khóa học thực tế phù hợp từ CSDL...'}
            {generationStep === 3 && 'Đang tối ưu các bước học và chẩn đoán tiến độ...'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto' }}>
            Hệ thống đang cấu trúc lộ trình bậc thang dựa trên chính xác từng lựa chọn của bạn.
          </p>
        </div>
      )}

      {/* 4. GIAO DIỆN LỘ TRÌNH BẬC THANG TIMELINE (HIỂN THỊ SAU KHI ĐÃ HOÀN TẤT CHỌN GIAI ĐOẠN) */}
      {roadmapData && !isGenerating && !isWizardOpen && (
        <section className="landing-timeline-section" style={{ marginTop: '10px' }}>
          <div className="landing-timeline-layout">
            {/* Cột trái: Sticky Overview Card */}
            <div className="timeline-sticky-sidebar">
              <span className="landing-section-pill" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}>
                <i className="fa-solid fa-route" style={{ marginRight: '6px' }}></i>
                LỘ TRÌNH ĐÀO TẠO CÁ NHÂN HÓA
              </span>

              <h2 className="landing-section-title" style={{ marginTop: '14px', fontSize: '1.65rem' }}>
                {safeText(roadmapData.roadmap_title, 'Lộ Trình Học Tập Cá Nhân Hóa')}
              </h2>

              <p className="landing-section-desc" style={{ marginTop: '12px', fontSize: '0.92rem', lineHeight: '1.68' }}>
                {safeText(roadmapData.roadmap_summary, 'Lộ trình được xây dựng theo từng giai đoạn bạn đã chọn, gắn liền với các khóa học thực tế trong hệ thống.')}
              </p>

              <div className="timeline-sidebar-badges" style={{ marginTop: '20px' }}>
                <div className="timeline-sidebar-badge-item">
                  <i className="fa-solid fa-bullseye" style={{ color: '#0284c7' }}></i>
                  <span>Mục tiêu: <strong>{safeText(roadmapData.target_band, 'Mục tiêu cá nhân hóa')}</strong></span>
                </div>
                <div className="timeline-sidebar-badge-item">
                  <i className="fa-solid fa-clock" style={{ color: '#f59e0b' }}></i>
                  <span>Thời lượng: <strong>{safeText(roadmapData.total_duration, `${(roadmapData.steps?.length || 4) * 4} tuần`)}</strong></span>
                </div>
                <div className="timeline-sidebar-badge-item">
                  <i className="fa-solid fa-layer-group" style={{ color: '#10b981' }}></i>
                  <span>Số chặng: <strong>{roadmapData.steps?.length || numStages} Giai đoạn</strong></span>
                </div>
                <div className="timeline-sidebar-badge-item">
                  <i className="fa-solid fa-shield-check" style={{ color: '#8b5cf6' }}></i>
                  <span>100% Khóa học thực tế trong hệ thống</span>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsWizardOpen(true);
                    setCurrentWizardStep(1);
                    wizardContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                  }}
                >
                  <i className="fa-solid fa-sliders"></i>
                  <span>Đổi lựa chọn từng giai đoạn</span>
                </button>

                {onNavigateToCourses && (
                  <button
                    type="button"
                    onClick={onNavigateToCourses}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      backgroundColor: 'transparent',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-color, #cbd5e1)',
                      padding: '11px 18px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="fa-solid fa-book-open"></i>
                    <span>Xem toàn bộ danh mục khóa học</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cột phải: Timeline Track bậc thang */}
            <div className="timeline-track" ref={trackRef}>
              <div className="timeline-track-bg-line"></div>
              <div className="timeline-track-progress-line" style={{ height: `${lineHeight}px` }}></div>

              {(roadmapData.steps || []).map((step, idx) => {
                const isVisible = visibleIndices.has(idx);

                return (
                  <div
                    key={step.step_number || idx}
                    ref={(el) => (itemRefs.current[idx] = el)}
                    data-index={idx}
                    className={`timeline-item ${isVisible ? 'is-visible' : ''}`}
                    style={{ marginBottom: '50px' }}
                  >
                    <div ref={(el) => (dotRefs.current[idx] = el)} className="timeline-item-dot"></div>

                    <div className="timeline-item-content">
                      {/* Tiền tố giai đoạn */}
                      <span className="timeline-item-phase">
                        <i className="fa-solid fa-circle-dot" style={{ fontSize: '0.75rem' }}></i>
                        {safeText(step.phase, `BƯỚC 0${idx + 1}`)}
                      </span>

                      {/* Tiêu đề in hoa */}
                      <h3 className="timeline-item-title" style={{ marginTop: '4px', marginBottom: '8px' }}>
                        {safeText(step.title, `GIAI ĐOẠN 0${idx + 1}`)}
                      </h3>

                      {/* Đoạn mô tả sư phạm */}
                      <p className="timeline-item-desc" style={{ marginBottom: '14px' }}>
                        {safeText(step.desc, '')}
                      </p>

                      {/* Thẻ tags kỹ năng */}
                      {step.tags && Array.isArray(step.tags) && step.tags.length > 0 && (
                        <div className="timeline-item-tags" style={{ marginBottom: '18px' }}>
                          {step.tags.map((rawTag, tIdx) => {
                            const tagInfo = getSafeTagInfo(rawTag);
                            return (
                              <span key={tIdx} className="timeline-item-tag">
                                {tagInfo.icon && <i className={tagInfo.icon}></i>}
                                <span>{tagInfo.label}</span>
                              </span>
                            );
                          })}
                          {step.estimated_weeks && (
                            <span
                              className="timeline-item-tag"
                              style={{ backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}
                            >
                              <i className="fa-solid fa-hourglass-half"></i>
                              <span>Dự kiến: {safeText(step.estimated_weeks, '3 - 4 tuần')}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* KHỐI KHÓA HỌC CHO CHẶNG NÀY: PHÂN BIỆT RÕ RỆT ĐÃ ĐĂNG KÝ VÀ CHƯA ĐĂNG KÝ */}
                      {step.recommended_courses && Array.isArray(step.recommended_courses) && step.recommended_courses.length > 0 && (
                        <div
                          className="step-recommended-courses-box"
                          style={{
                            backgroundColor: 'var(--bg-subtle, #f8fafc)',
                            border: '1px solid var(--border-color, #e2e8f0)',
                            borderRadius: '14px',
                            padding: '16px',
                            marginTop: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="fa-solid fa-sparkles" style={{ color: '#0284c7' }}></i>
                              <span>Khóa học bám sát cho chặng này (CSDL):</span>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '14px' }}>
                            {step.recommended_courses.map((course) => {
                              if (!course || typeof course !== 'object') return null;

                              const { enrolled, progress, isCompleted } = getEnrollmentInfo(course);
                              const isFree = course.is_free || Number(course.price || 0) === 0;

                              return (
                                <div
                                  key={course.id}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    backgroundColor: enrolled ? '#f0fdf4' : 'var(--bg-surface, #ffffff)',
                                    border: enrolled ? '2px solid #10b981' : '1px solid var(--border-color, #e2e8f0)',
                                    borderRadius: '14px',
                                    padding: '14px',
                                    boxShadow: enrolled
                                      ? '0 4px 14px rgba(16, 185, 129, 0.12)'
                                      : '0 2px 8px rgba(0, 0, 0, 0.04)',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                  }}
                                >
                                  {/* Badge trạng thái trên cùng */}
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    {enrolled ? (
                                      <span
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          backgroundColor: isCompleted ? '#fef3c7' : '#dcfce7',
                                          color: isCompleted ? '#92400e' : '#15803d',
                                          fontSize: '0.72rem',
                                          fontWeight: '800',
                                          padding: '3px 8px',
                                          borderRadius: '6px',
                                        }}
                                      >
                                        <i className={isCompleted ? 'fa-solid fa-trophy' : 'fa-solid fa-circle-check'}></i>
                                        <span>{isCompleted ? 'HOÀN THÀNH 100%' : 'ĐÃ ĐĂNG KÝ • ĐANG HỌC'}</span>
                                      </span>
                                    ) : (
                                      <span
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          backgroundColor: '#f1f5f9',
                                          color: '#64748b',
                                          fontSize: '0.72rem',
                                          fontWeight: '700',
                                          padding: '3px 8px',
                                          borderRadius: '6px',
                                        }}
                                      >
                                        <i className="fa-solid fa-circle-notch"></i>
                                        <span>Chưa đăng ký</span>
                                      </span>
                                    )}

                                    <span
                                      style={{
                                        fontSize: '0.74rem',
                                        fontWeight: '800',
                                        color: isFree ? '#10b981' : '#f59e0b',
                                      }}
                                    >
                                      {isFree ? 'Miễn phí' : `${Number(course.price || 0).toLocaleString('vi-VN')} đ`}
                                    </span>
                                  </div>

                                  {/* Thumbnail & Title */}
                                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                    <div
                                      style={{
                                        width: '85px',
                                        height: '65px',
                                        borderRadius: '8px',
                                        backgroundColor: '#e2e8f0',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                        position: 'relative',
                                      }}
                                    >
                                      {course.thumbnail_url ? (
                                        <img
                                          src={course.thumbnail_url}
                                          alt={course.title}
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0284c7', color: '#ffffff' }}>
                                          <i className="fa-solid fa-book-open"></i>
                                        </div>
                                      )}
                                      <span
                                        style={{
                                          position: 'absolute',
                                          bottom: '2px',
                                          right: '2px',
                                          backgroundColor: 'rgba(15, 23, 42, 0.85)',
                                          color: '#ffffff',
                                          fontSize: '0.6rem',
                                          fontWeight: '800',
                                          padding: '1px 4px',
                                          borderRadius: '4px',
                                        }}
                                      >
                                        {course.level || 'CEFR'}
                                      </span>
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: '700', marginBottom: '2px' }}>
                                        {course.category || 'Tiếng Anh'}
                                      </div>
                                      <h4
                                        style={{
                                          margin: '0 0 4px 0',
                                          fontSize: '0.88rem',
                                          fontWeight: '800',
                                          color: 'var(--text-main)',
                                          lineHeight: '1.3',
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden',
                                        }}
                                        title={course.title}
                                      >
                                        {cleanCourseTitle(course.title)}
                                      </h4>
                                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                        <i className="fa-solid fa-chalkboard-user" style={{ marginRight: '4px' }}></i>
                                        <span>{course.teacher_name || 'TL-English Mentor'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Thanh tiến độ nếu ĐÃ ĐĂNG KÝ */}
                                  {enrolled ? (
                                    <div style={{ backgroundColor: '#ffffff', padding: '8px 10px', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '10px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: '700', color: isCompleted ? '#15803d' : '#0369a1', marginBottom: '4px' }}>
                                        <span>Tiến độ bài học:</span>
                                        <span>{progress}%</span>
                                      </div>
                                      <div style={{ width: '100%', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                                        <div
                                          style={{
                                            width: `${progress}%`,
                                            height: '100%',
                                            background: isCompleted ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #38bdf8, #0284c7)',
                                            borderRadius: '99px',
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: '0.74rem', color: '#64748b', fontStyle: 'italic', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <i className="fa-solid fa-lightbulb" style={{ color: '#f59e0b' }}></i>
                                      <span>Khóa học cốt lõi cho chặng này. Đăng ký ngay để mở khóa.</span>
                                    </div>
                                  )}

                                  {/* Nút hành động */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
                                    {enrolled ? (
                                      <button
                                        type="button"
                                        onClick={() => onNavigateToLearning && onNavigateToLearning(course)}
                                        style={{
                                          flex: 1,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '6px',
                                          backgroundColor: '#10b981',
                                          color: '#ffffff',
                                          border: 'none',
                                          padding: '7px 12px',
                                          borderRadius: '8px',
                                          fontSize: '0.8rem',
                                          fontWeight: '700',
                                          cursor: 'pointer',
                                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                                        }}
                                      >
                                        <i className="fa-solid fa-play" style={{ fontSize: '0.7rem' }}></i>
                                        <span>Tiếp tục học ngay</span>
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => onSelectCourse && onSelectCourse(course)}
                                          style={{
                                            flex: 1,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '5px',
                                            backgroundColor: '#ffffff',
                                            color: '#0284c7',
                                            border: '1px solid #0284c7',
                                            padding: '7px 10px',
                                            borderRadius: '8px',
                                            fontSize: '0.78rem',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                          }}
                                        >
                                          <span>Xem khóa</span>
                                          <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }}></i>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => onEnroll ? onEnroll(course) : (onSelectCourse && onSelectCourse(course))}
                                          style={{
                                            flex: 1.2,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '5px',
                                            backgroundColor: '#0284c7',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '7px 10px',
                                            borderRadius: '8px',
                                            fontSize: '0.78rem',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                                          }}
                                        >
                                          <i className="fa-solid fa-bolt" style={{ fontSize: '0.7rem' }}></i>
                                          <span>Đăng ký khóa</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

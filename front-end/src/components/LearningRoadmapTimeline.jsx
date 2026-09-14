import React, { useState, useEffect, useRef } from 'react';

const ROADMAP_STEPS = [
  {
    id: 1,
    phase: 'BƯỚC 01 • CẤP ĐỘ CEFR A1 - A2',
    title: 'XÂY DỰNG GỐC NGỮ PHÁP & PHÁT ÂM CƠ BẢN',
    desc: 'Bắt đầu hành trình với hệ thống bài giảng ngữ pháp cốt lõi và phát âm quốc tế IPA chuẩn xác. Từng bài học được chia nhỏ khoa học từ 12 thì cơ bản, cách đặt câu đến phản xạ từ vựng ban đầu. Hệ thống giúp học viên mất gốc lấy lại sự tự tin, nắm chắc nền tảng vững vàng trước khi bước vào các kỹ năng nâng cao.',
    tags: [
      { icon: 'fa-solid fa-book-open', label: 'Quyết tâm lấy gốc Tiếng Anh' },
      { icon: 'fa-solid fa-spell-check', label: 'Ngữ pháp A1 - A2' },
      { icon: 'fa-solid fa-volume-high', label: 'Chuẩn hóa ngữ âm IPA' },
    ],
  },
  {
    id: 2,
    phase: 'BƯỚC 02 • CẤP ĐỘ CEFR B1',
    title: 'MỞ RỘNG VỐN TỪ VỰNG & RÈN LUYỆN ĐỌC HIỂU',
    desc: 'Chuyển tiếp sang giai đoạn tăng tốc với kho học liệu từ vựng chuyên sâu theo chủ đề đời sống, công sở và học thuật. Người học được trang bị kỹ năng Skimming & Scanning để giải mã các bài đọc dài, hiểu sâu cấu trúc ngữ pháp phức tạp và hình thành phản xạ tư duy tiếng Anh trực tiếp mà không cần dịch từng từ.',
    tags: [
      { icon: 'fa-solid fa-layer-group', label: 'Từ vựng & Đọc hiểu B1' },
      { icon: 'fa-solid fa-brain', label: 'Chinh phục 3000 từ vựng cốt lõi' },
      { icon: 'fa-solid fa-briefcase', label: 'Tiếng Anh văn phòng thực tế' },
    ],
  },
  {
    id: 3,
    phase: 'BƯỚC 03 • CẤP ĐỘ CEFR B2',
    title: 'LUYỆN ĐỀ THỰC CHIẾN & TỰ ĐỘNG CHẨN ĐOÁN LỖI SAI',
    desc: 'Thử sức với ngân hàng đề thi trắc nghiệm chuẩn hóa mô phỏng bài thi quốc tế (TOEIC, IELTS, CEFR). Sau mỗi lần nộp bài, hệ thống tự động phân tích chi tiết từng lỗi sai, chẩn đoán lỗ hổng kiến thức ngữ pháp và đề xuất bài giảng ôn tập bù đắp kịp thời, giúp học viên tiến bộ vượt bậc mà không sợ tái phạm lỗi cũ.',
    tags: [
      { icon: 'fa-solid fa-file-signature', label: 'Luyện đề TOEIC / IELTS Nâng cao' },
      { icon: 'fa-solid fa-magnifying-glass-chart', label: 'Phân tích lỗi sai thông minh' },
      { icon: 'fa-solid fa-graduation-cap', label: 'Chinh phục ngữ pháp B2' },
    ],
  },
  {
    id: 4,
    phase: 'BƯỚC 04 • CẤP ĐỘ CEFR C1 - C2',
    title: 'LÀM CHỦ GIAO TIẾP PHẢN XẠ & CẤP CHỨNG CHỈ SỐ',
    desc: 'Chinh phục đỉnh cao ngôn ngữ qua các bài luyện đàm thoại giao tiếp chuyên nghiệp, được chỉnh sửa ngữ pháp và phong thái diễn đạt tự nhiên chuẩn bản xứ. Hoàn tất bài đánh giá năng lực cuối khóa để nhận Chứng chỉ số điện tử CEFR tích hợp mã QR xác thực chính quy, sẵn sàng cho công việc và cơ hội toàn cầu.',
    tags: [
      { icon: 'fa-solid fa-comments', label: 'Giao tiếp C1 Chuyên nghiệp' },
      { icon: 'fa-solid fa-award', label: 'Chứng chỉ CEFR QR Code' },
      { icon: 'fa-solid fa-shield-check', label: 'Đánh giá năng lực chuẩn hóa' },
    ],
  },
];

export default function LearningRoadmapTimeline({ onExploreClick }) {
  const [visibleIndices, setVisibleIndices] = useState(new Set([0])); // Bước 1 sẵn sàng hiển thị
  const [lineHeight, setLineHeight] = useState(0);
  const trackRef = useRef(null);
  const itemRefs = useRef([]);
  const dotRefs = useRef([]);

  useEffect(() => {
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
      threshold: 0.2,
      rootMargin: '0px 0px -40px 0px',
    });

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Tính toán chiều dài đường kẻ nối động khi cuộn đến từng bước
  useEffect(() => {
    const updateLineHeight = () => {
      if (visibleIndices.size === 0) {
        setLineHeight(0);
        return;
      }
      const maxIdx = Math.max(...Array.from(visibleIndices));
      const targetDot = dotRefs.current[maxIdx];
      if (targetDot && trackRef.current) {
        const trackRect = trackRef.current.getBoundingClientRect();
        const dotRect = targetDot.getBoundingClientRect();
        const height = dotRect.top - trackRect.top + dotRect.height / 2 - 14;
        setLineHeight(Math.max(16, height));
      }
    };

    updateLineHeight();
    window.addEventListener('resize', updateLineHeight);
    return () => window.removeEventListener('resize', updateLineHeight);
  }, [visibleIndices]);

  const maxVisibleIndex = visibleIndices.size > 0 ? Math.max(...Array.from(visibleIndices)) : -1;

  const handleScrollToCourses = () => {
    const el = document.getElementById('courses-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (onExploreClick) {
      onExploreClick();
    }
  };

  return (
    <section className="landing-timeline-section">
      <div className="landing-timeline-layout">
        {/* Cột trái: Tiêu đề cố định & Giới thiệu tổng quan */}
        <div className="timeline-sticky-sidebar">
          <span className="landing-section-pill">LỘ TRÌNH ĐÀO TẠO BẬC THANG</span>
          <h2 className="landing-section-title" style={{ marginTop: '10px', fontSize: '1.65rem' }}>
            Hành Trình Chinh Phục Khóa Học Tại TL-ENGLISH
          </h2>
          <p className="landing-section-desc" style={{ marginTop: '10px', fontSize: '0.92rem', lineHeight: '1.6' }}>
            Hệ thống khóa học được thiết kế tuần tự theo tiêu chuẩn sư phạm Châu Âu (CEFR). Dù bạn bắt đầu từ con số 0 hay muốn bứt phá điểm số, lộ trình rõ ràng sẽ dẫn lối thành công.
          </p>

          <div className="timeline-sidebar-badges">
            <div className="timeline-sidebar-badge-item">
              <i className="fa-solid fa-circle-check"></i>
              <span>100% Khóa học bám sát khung CEFR (A1 - C2)</span>
            </div>
            <div className="timeline-sidebar-badge-item">
              <i className="fa-solid fa-circle-check"></i>
              <span>Luyện tập bài tập tương tác sau mỗi bài học</span>
            </div>
            <div className="timeline-sidebar-badge-item">
              <i className="fa-solid fa-circle-check"></i>
              <span>Phân tích lỗi sai & cấp chứng chỉ xác thực QR</span>
            </div>
          </div>

          <button
            type="button"
            className="btn-view-all-courses"
            style={{
              marginTop: '24px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              borderColor: '#0284c7',
              width: '100%',
              justifyContent: 'center',
            }}
            onClick={handleScrollToCourses}
          >
            <span>Xem các khóa học tương ứng</span>
            <i className="fa-solid fa-arrow-down"></i>
          </button>
        </div>

        {/* Cột phải: Giao diện đi xuống dạng Milestone / Timeline với hiệu ứng cuộn mượt */}
        <div className="timeline-track" ref={trackRef}>
          {/* Đường ray nền tĩnh (xám nhạt) */}
          <div className="timeline-track-bg-line"></div>

          {/* Đường kẻ động chạy xuống theo bước hiển thị */}
          <div
            className="timeline-track-progress-line"
            style={{ height: `${lineHeight}px` }}
          ></div>

          {/* Danh sách 4 bước */}
          {ROADMAP_STEPS.map((step, idx) => {
            const isVisible = visibleIndices.has(idx);
            const isCurrent = idx === maxVisibleIndex;

            return (
              <div
                key={step.id}
                ref={(el) => (itemRefs.current[idx] = el)}
                data-index={idx}
                className={`timeline-item ${isVisible ? 'is-visible' : ''} ${isCurrent ? 'is-current' : ''}`}
                style={{
                  transitionDelay: `${idx * 0.08}s`,
                }}
              >
                {/* Chấm tròn mốc lộ trình */}
                <div
                  ref={(el) => (dotRefs.current[idx] = el)}
                  className="timeline-item-dot"
                ></div>

                {/* Nội dung chi tiết từng bước */}
                <div className="timeline-item-content">
                  <div className="timeline-item-phase">
                    <span>{step.phase}</span>
                  </div>
                  <h3 className="timeline-item-title">{step.title}</h3>
                  <p className="timeline-item-desc">{step.desc}</p>
                  <div className="timeline-item-tags">
                    {step.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="timeline-item-tag">
                        <i className={tag.icon}></i>
                        <span>{tag.label}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

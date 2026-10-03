import React, { useState, useEffect, useRef } from 'react';

// Dữ liệu từ vựng chất lượng cao phân loại theo 3 chủ đề chuẩn CEFR
const VOCABULARY_DECKS = [
  {
    id: 'daily_life',
    title: 'Giao Tiếp & Đời Sống Hàng Ngày',
    level: 'A1 - A2',
    icon: 'fa-comments',
    color: '#0284c7',
    description: '15 từ vựng căn bản giúp bạn tự tin giao tiếp, mô tả thói quen và các hoạt động thường nhật.',
    cards: [
      {
        id: 1,
        word: 'Accomplish',
        ipa: '/əˈkɑːm.plɪʃ/',
        type: 'Verb',
        meaning: 'Hoàn thành, đạt được (mục tiêu)',
        english_def: 'To finish something successfully or to achieve something.',
        example: 'She accomplished her goal of speaking fluent English in 6 months.',
        example_vi: 'Cô ấy đã đạt được mục tiêu nói tiếng Anh lưu loát trong 6 tháng.',
        collocation: 'accomplish a mission / goal',
      },
      {
        id: 2,
        word: 'Punctual',
        ipa: '/ˈpʌŋk.tʃu.əl/',
        type: 'Adjective',
        meaning: 'Đúng giờ, không trễ hẹn',
        english_def: 'Arriving or doing something at the expected correct time.',
        example: 'Please be punctual for the morning interview.',
        example_vi: 'Xin vui lòng đến đúng giờ cho buổi phỏng vấn sáng nay.',
        collocation: 'punctual attendance / arrival',
      },
      {
        id: 3,
        word: 'Convenient',
        ipa: '/kənˈviː.ni.ənt/',
        type: 'Adjective',
        meaning: 'Tiện lợi, thuận tiện',
        english_def: 'Suitable for your purposes and needs and causing the least difficulty.',
        example: 'Online learning is very convenient for busy students.',
        example_vi: 'Học trực tuyến rất thuận tiện cho sinh viên bận rộn.',
        collocation: 'convenient location / time',
      },
      {
        id: 4,
        word: 'Recommend',
        ipa: '/ˌrek.əˈmend/',
        type: 'Verb',
        meaning: 'Khuyên bảo, giới thiệu, đề xuất',
        english_def: 'To suggest that someone or something would be good or suitable.',
        example: 'I highly recommend this English grammar course.',
        example_vi: 'Tôi nhiệt tình giới thiệu khóa học ngữ pháp tiếng Anh này.',
        collocation: 'strongly recommend',
      },
      {
        id: 5,
        word: 'Opportunity',
        ipa: '/ˌɑː.pɚˈtuː.nə.t̬i/',
        type: 'Noun',
        meaning: 'Cơ hội, thời cơ thuận lợi',
        english_def: 'An occasion or situation that makes it possible to do something.',
        example: 'This scholarship is a great opportunity for your future career.',
        example_vi: 'Học bổng này là một cơ hội tuyệt vời cho sự nghiệp tương lai của bạn.',
        collocation: 'seize / miss an opportunity',
      },
      {
        id: 6,
        word: 'Leisure',
        ipa: '/ˈliː.ʒɚ/',
        type: 'Noun',
        meaning: 'Thời gian rảnh rỗi, giải trí',
        english_def: 'The time when you are not working or doing other duties.',
        example: 'What do you usually do in your leisure time?',
        example_vi: 'Bạn thường làm gì vào thời gian rảnh rỗi của mình?',
        collocation: 'leisure activities / interests',
      },
      {
        id: 7,
        word: 'Colleague',
        ipa: '/ˈkɑː.liːɡ/',
        type: 'Noun',
        meaning: 'Đồng nghiệp, bạn cùng cơ quan',
        english_def: 'One of a group of people who work together.',
        example: 'He gets along very well with all of his colleagues.',
        example_vi: 'Anh ấy rất hòa thuận với tất cả các đồng nghiệp của mình.',
        collocation: 'work colleague / trusted colleague',
      },
      {
        id: 8,
        word: 'Delicious',
        ipa: '/dɪˈlɪʃ.əs/',
        type: 'Adjective',
        meaning: 'Thơm ngon, ngon miệng',
        english_def: 'Having a very pleasant taste or smell.',
        example: 'The traditional Vietnamese pho was absolutely delicious.',
        example_vi: 'Món phở truyền thống Việt Nam thực sự rất ngon.',
        collocation: 'delicious meal / flavor',
      },
      {
        id: 9,
        word: 'Habit',
        ipa: '/ˈhæb.ɪt/',
        type: 'Noun',
        meaning: 'Thói quen, tập quán',
        english_def: 'Something that you do often and regularly, sometimes without knowing.',
        example: 'Reading books every night is a healthy study habit.',
        example_vi: 'Đọc sách mỗi tối là một thói quen học tập lành mạnh.',
        collocation: 'form / break a habit',
      },
      {
        id: 10,
        word: 'Schedule',
        ipa: '/ˈskedʒ.uːl/',
        type: 'Noun / Verb',
        meaning: 'Lịch trình, thời khóa biểu; lên lịch',
        english_def: 'A list of planned activities or things to be done showing times.',
        example: 'The final exam is scheduled for next Monday morning.',
        example_vi: 'Kỳ thi cuối kỳ đã được lên lịch vào sáng thứ Hai tuần tới.',
        collocation: 'busy schedule / ahead of schedule',
      },
      {
        id: 11,
        word: 'Celebrate',
        ipa: '/ˈsel.ə.breɪt/',
        type: 'Verb',
        meaning: 'Ăn mừng, kỷ niệm, tán dương',
        english_def: 'To take part in special enjoyable activities for an event.',
        example: 'We celebrated our graduation with family and close friends.',
        example_vi: 'Chúng tôi đã ăn mừng lễ tốt nghiệp cùng gia đình và bạn bè thân thiết.',
        collocation: 'celebrate success / an anniversary',
      },
      {
        id: 12,
        word: 'Journey',
        ipa: '/ˈdʒɝː.ni/',
        type: 'Noun',
        meaning: 'Hành trình, chuyến đi dài',
        english_def: 'The act of travelling from one place to another, especially in a vehicle.',
        example: 'Learning a new foreign language is a lifelong journey.',
        example_vi: 'Học một ngoại ngữ mới là một hành trình dài suốt đời.',
        collocation: 'safe journey / learning journey',
      },
      {
        id: 13,
        word: 'Hesitate',
        ipa: '/ˈhez.ə.teɪt/',
        type: 'Verb',
        meaning: 'Do dự, ngập ngừng, lưỡng lự',
        english_def: 'To pause before you do or say something, often because you are uncertain.',
        example: 'Do not hesitate to ask questions if you do not understand the lesson.',
        example_vi: 'Đừng ngần ngại đặt câu hỏi nếu bạn không hiểu bài giảng.',
        collocation: 'do not hesitate to do sth',
      },
      {
        id: 14,
        word: 'Enthusiastic',
        ipa: '/ɪnˌθuː.ziˈæs.tɪk/',
        type: 'Adjective',
        meaning: 'Nhiệt tình, hào hứng, say mê',
        english_def: 'Showing energetic interest and excitement in something.',
        example: 'The students are very enthusiastic about practicing English with AI.',
        example_vi: 'Các học viên rất hào hứng với việc luyện tập tiếng Anh cùng AI.',
        collocation: 'enthusiastic support / response',
      },
      {
        id: 15,
        word: 'Maintain',
        ipa: '/meɪnˈteɪn/',
        type: 'Verb',
        meaning: 'Duy trì, giữ gìn, bảo tồn',
        english_def: 'To continue to have; to keep in existence, or not allow to become less.',
        example: 'You must practice every single day to maintain your speaking skills.',
        example_vi: 'Bạn phải luyện tập mỗi ngày để duy trì kỹ năng nói của mình.',
        collocation: 'maintain a streak / standard',
      },
    ],
  },
  {
    id: 'business_work',
    title: 'Tiếng Anh Công Sở & Đàm Phán',
    level: 'B1 - B2',
    icon: 'fa-briefcase',
    color: '#7c3aed',
    description: '15 từ vựng chuyên nghiệp dùng trong công việc, họp hành, báo cáo và thương thảo kinh doanh.',
    cards: [
      {
        id: 101,
        word: 'Negotiate',
        ipa: '/nəˈɡoʊ.ʃi.eɪt/',
        type: 'Verb',
        meaning: 'Đàm phán, thương lượng',
        english_def: 'To have formal discussions with someone in order to reach an agreement.',
        example: 'The manager successfully negotiated a multi-million dollar contract.',
        example_vi: 'Người quản lý đã đàm phán thành công một hợp đồng trị giá hàng triệu đô la.',
        collocation: 'negotiate terms / a contract',
      },
      {
        id: 102,
        word: 'Collaborate',
        ipa: '/kəˈlæb.ə.reɪt/',
        type: 'Verb',
        meaning: 'Hợp tác, phối hợp làm việc',
        english_def: 'To work with another person or group in order to achieve something.',
        example: 'Two departments need to collaborate closely on this new project.',
        example_vi: 'Hai phòng ban cần hợp tác chặt chẽ trong dự án mới này.',
        collocation: 'collaborate with / on',
      },
      {
        id: 103,
        word: 'Deadline',
        ipa: '/ˈded.laɪn/',
        type: 'Noun',
        meaning: 'Hạn chót, thời hạn hoàn thành',
        english_def: 'A time or day by which something must be done.',
        example: 'We are working overtime to meet the strict project deadline.',
        example_vi: 'Chúng tôi đang làm thêm giờ để kịp hạn chót nghiêm ngặt của dự án.',
        collocation: 'meet / miss a deadline',
      },
      {
        id: 104,
        word: 'Objective',
        ipa: '/əbˈdʒek.tɪv/',
        type: 'Noun',
        meaning: 'Mục tiêu, mục đích định hướng',
        english_def: 'Something that you plan to do or achieve.',
        example: 'Our primary objective this quarter is increasing user satisfaction.',
        example_vi: 'Mục tiêu hàng đầu của chúng tôi trong quý này là gia tăng sự hài lòng của người dùng.',
        collocation: 'achieve / set an objective',
      },
      {
        id: 105,
        word: 'Strategy',
        ipa: '/ˈstræt̬.ə.dʒi/',
        type: 'Noun',
        meaning: 'Chiến lược, kế hoạch hành động',
        english_def: 'A detailed plan for achieving success in situations such as business or war.',
        example: 'The company launched an effective digital marketing strategy.',
        example_vi: 'Công ty đã triển khai một chiến lược tiếp thị số rất hiệu quả.',
        collocation: 'marketing / business strategy',
      },
      {
        id: 106,
        word: 'Proposal',
        ipa: '/prəˈpoʊ.zəl/',
        type: 'Noun',
        meaning: 'Bản đề xuất, tờ trình',
        english_def: 'A formal suggestion, plan, or offer for people to consider.',
        example: 'The board of directors approved our software proposal unanimously.',
        example_vi: 'Hội đồng quản trị đã nhất trí thông qua bản đề xuất phần mềm của chúng tôi.',
        collocation: 'submit / approve a proposal',
      },
      {
        id: 107,
        word: 'Productivity',
        ipa: '/ˌproʊ.dʌkˈtɪv.ə.t̬i/',
        type: 'Noun',
        meaning: 'Năng suất, hiệu suất làm việc',
        english_def: 'The rate at which a person, company, or country does useful work.',
        example: 'Flexible working hours have greatly improved team productivity.',
        example_vi: 'Giờ làm việc linh hoạt đã cải thiện đáng kể năng suất của cả đội ngũ.',
        collocation: 'boost / increase productivity',
      },
      {
        id: 108,
        word: 'Budget',
        ipa: '/ˈbʌdʒ.ɪt/',
        type: 'Noun',
        meaning: 'Ngân sách, quỹ tài chính',
        english_def: 'A plan to show how much money a person or organization will earn and spend.',
        example: 'We must keep all project expenses strictly within the approved budget.',
        example_vi: 'Chúng ta phải giữ mọi chi phí dự án nghiêm ngặt trong ngân sách đã duyệt.',
        collocation: 'allocated budget / on a tight budget',
      },
      {
        id: 109,
        word: 'Revenue',
        ipa: '/ˈrev.ə.nuː/',
        type: 'Noun',
        meaning: 'Doanh thu, tiền thu được từ kinh doanh',
        english_def: 'The money that a government or company receives regularly.',
        example: 'Annual recurring revenue increased by 25 percent compared to last year.',
        example_vi: 'Doanh thu định kỳ hàng năm đã tăng 25% so với năm ngoái.',
        collocation: 'generate / increase revenue',
      },
      {
        id: 110,
        word: 'Perspective',
        ipa: '/pɚˈspek.tɪv/',
        type: 'Noun',
        meaning: 'Góc nhìn, quan điểm, tầm nhìn',
        english_def: 'A particular way of considering something.',
        example: 'Try to see the problem from the customer’s perspective.',
        example_vi: 'Hãy thử nhìn nhận vấn đề từ góc nhìn của khách hàng.',
        collocation: 'from a perspective / broad perspective',
      },
      {
        id: 111,
        word: 'Client',
        ipa: '/ˈklaɪ.ənt/',
        type: 'Noun',
        meaning: 'Khách hàng (sử dụng dịch vụ)',
        english_def: 'A person or organization that uses a service or buys goods.',
        example: 'Building long-term trust with clients is our core philosophy.',
        example_vi: 'Xây dựng sự tin cậy lâu dài với khách hàng là triết lý cốt lõi của chúng tôi.',
        collocation: 'potential client / satisfy a client',
      },
      {
        id: 112,
        word: 'Priority',
        ipa: '/praɪˈɔːr.ə.t̬i/',
        type: 'Noun',
        meaning: 'Ưu tiên, quyền ưu tiên',
        english_def: 'Something that is very important and must be dealt with before other things.',
        example: 'Customer security and data privacy are our top priorities.',
        example_vi: 'Bảo mật và quyền riêng tư của khách hàng là ưu tiên hàng đầu của chúng tôi.',
        collocation: 'top priority / high priority',
      },
      {
        id: 113,
        word: 'Feedback',
        ipa: '/ˈfiːd.bæk/',
        type: 'Noun',
        meaning: 'Ý kiến phản hồi, nhận xét',
        english_def: 'Information or statements of opinion about something you have done.',
        example: 'We appreciate constructive feedback to make our website even better.',
        example_vi: 'Chúng tôi trân trọng các phản hồi mang tính xây dựng để giúp website hoàn thiện hơn.',
        collocation: 'constructive / positive feedback',
      },
      {
        id: 114,
        word: 'Feasible',
        ipa: '/ˈfiː.zə.bəl/',
        type: 'Adjective',
        meaning: 'Khả thi, có thể thực hiện được',
        english_def: 'Able to be made, done, or achieved, or is reasonable.',
        example: 'Is it economically feasible to implement this AI feature this month?',
        example_vi: 'Liệu có khả thi về mặt kinh tế khi triển khai tính năng AI này ngay trong tháng?',
        collocation: 'economically / technically feasible',
      },
      {
        id: 115,
        word: 'Implement',
        ipa: '/ˈɪm.plə.ment/',
        type: 'Verb',
        meaning: 'Triển khai, thực thi (kế hoạch, chính sách)',
        english_def: 'To start using a plan, system, or law.',
        example: 'The team successfully implemented the new authentication system.',
        example_vi: 'Đội ngũ đã triển khai thành công hệ thống xác thực mới.',
        collocation: 'implement a solution / policy',
      },
    ],
  },
  {
    id: 'academic_ielts',
    title: 'Học Thuật IELTS & TOEIC Nâng Cao',
    level: 'B2 - C1',
    icon: 'fa-graduation-cap',
    color: '#059669',
    description: '15 từ vựng học thuật học thức, xuất hiện thường xuyên trong các bài thi IELTS Reading/Writing và TOEIC.',
    cards: [
      {
        id: 201,
        word: 'Substantiate',
        ipa: '/səbˈstæn.ʃi.eɪt/',
        type: 'Verb',
        meaning: 'Chứng minh, dẫn chứng xác thực',
        english_def: 'To show something to be true, or to support a statement with evidence.',
        example: 'You must substantiate your arguments with verified empirical data.',
        example_vi: 'Bạn phải chứng minh luận điểm của mình bằng dữ liệu thực nghiệm đã kiểm chứng.',
        collocation: 'substantiate a claim / hypothesis',
      },
      {
        id: 202,
        word: 'Coherent',
        ipa: '/koʊˈhɪr.ənt/',
        type: 'Adjective',
        meaning: 'Mạch lạc, chặt chẽ, dễ hiểu',
        english_def: 'Clear and carefully considered, and each part connects or follows in a natural way.',
        example: 'The candidate wrote a coherent and well-structured IELTS Task 2 essay.',
        example_vi: 'Thí sinh đã viết một bài luận IELTS Task 2 rất mạch lạc và chặt chẽ.',
        collocation: 'coherent argument / paragraph',
      },
      {
        id: 203,
        word: 'Discrepancy',
        ipa: '/dɪˈskrep.ən.si/',
        type: 'Noun',
        meaning: 'Sự khác biệt, điểm sai lệch, bất nhất',
        english_def: 'A difference between two things that should be the same.',
        example: 'There was a slight discrepancy between the two financial reports.',
        example_vi: 'Có một sự sai lệch nhỏ giữa hai bản báo cáo tài chính.',
        collocation: 'discrepancy between / notice a discrepancy',
      },
      {
        id: 204,
        word: 'Empirical',
        ipa: '/emˈpɪr.ɪ.kəl/',
        type: 'Adjective',
        meaning: 'Dựa trên thực nghiệm, kinh nghiệm thực tế',
        english_def: 'Based on what is experienced or seen rather than on theory.',
        example: 'There is strong empirical evidence supporting this teaching methodology.',
        example_vi: 'Có bằng chứng thực nghiệm mạnh mẽ ủng hộ phương pháp giảng dạy này.',
        collocation: 'empirical evidence / study',
      },
      {
        id: 205,
        word: 'Paradigm',
        ipa: '/ˈper.ə.daɪm/',
        type: 'Noun',
        meaning: 'Mô thức, mẫu hình, hệ hình mẫu',
        english_def: 'A model of something, or a very clear and typical example of something.',
        example: 'Generative AI represents a new paradigm in modern educational technology.',
        example_vi: 'AI tạo sinh đại diện cho một mô thức mới trong công nghệ giáo dục hiện đại.',
        collocation: 'paradigm shift / shift in paradigm',
      },
      {
        id: 206,
        word: 'Inevitable',
        ipa: '/ɪnˈev.ə.t̬ə.bəl/',
        type: 'Adjective',
        meaning: 'Không thể tránh khỏi, tất yếu',
        english_def: 'Certain to happen and unable to be avoided or prevented.',
        example: 'Mistakes are an inevitable part of the language learning process.',
        example_vi: 'Sai lầm là một phần tất yếu trong quá trình học ngoại ngữ.',
        collocation: 'inevitable consequence / outcome',
      },
      {
        id: 207,
        word: 'Comprehensive',
        ipa: '/ˌkɑːm.prəˈhen.sɪv/',
        type: 'Adjective',
        meaning: 'Toàn diện, bao quát mọi khía cạnh',
        english_def: 'Complete and including everything that is necessary.',
        example: 'The university offers a comprehensive curriculum for computer science.',
        example_vi: 'Trường đại học cung cấp một chương trình giảng dạy toàn diện cho ngành CNTT.',
        collocation: 'comprehensive overview / guide',
      },
      {
        id: 208,
        word: 'Synthesize',
        ipa: '/ˈsɪn.θə.saɪz/',
        type: 'Verb',
        meaning: 'Tổng hợp (thông tin từ nhiều nguồn)',
        english_def: 'To combine different ideas, styles, or systems into a whole.',
        example: 'Students need to synthesize information from multiple academic papers.',
        example_vi: 'Sinh viên cần tổng hợp thông tin từ nhiều bài báo học thuật khác nhau.',
        collocation: 'synthesize information / findings',
      },
      {
        id: 209,
        word: 'Articulate',
        ipa: '/ɑːrˈtɪk.jə.lət/',
        type: 'Adjective / Verb',
        meaning: 'Diễn đạt lưu loát, rõ ràng; phát âm rành rọt',
        english_def: 'Able to express thoughts and arguments clearly and effectively.',
        example: 'She is an articulate speaker who can explain complex ideas simply.',
        example_vi: 'Cô ấy là một diễn giả lưu loát, có thể giải thích những ý tưởng phức tạp một cách đơn giản.',
        collocation: 'articulate speaker / thoughts',
      },
      {
        id: 210,
        word: 'Resilient',
        ipa: '/rɪˈzɪl.jənt/',
        type: 'Adjective',
        meaning: 'Kiên cường, có khả năng phục hồi nhanh',
        english_def: 'Able to be happy, successful, etc. again after something difficult.',
        example: 'Resilient learners do not give up when facing difficult grammar tests.',
        example_vi: 'Những người học kiên cường không bỏ cuộc khi đối mặt với bài thi ngữ pháp khó.',
        collocation: 'resilient mindset / attitude',
      },
      {
        id: 211,
        word: 'Ambiguous',
        ipa: '/æmˈbɪɡ.ju.əs/',
        type: 'Adjective',
        meaning: 'Mơ hồ, nước đôi, đa nghĩa',
        english_def: 'Having or expressing more than one possible meaning, sometimes intentionally.',
        example: 'Avoid using ambiguous language in official thesis reports.',
        example_vi: 'Tránh dùng ngôn từ mơ hồ, đa nghĩa trong các bản báo cáo khóa luận chính thức.',
        collocation: 'ambiguous statement / meaning',
      },
      {
        id: 212,
        word: 'Criterion',
        ipa: '/kraɪˈtɪr.i.ən/',
        type: 'Noun',
        meaning: 'Tiêu chuẩn, tiêu chí đánh giá',
        english_def: 'A standard by which you judge, decide, or deal with something.',
        example: 'Pronunciation accuracy is a key criterion in speaking assessments.',
        example_vi: 'Độ chính xác phát âm là một tiêu chí then chốt trong đánh giá kỹ năng nói.',
        collocation: 'meet the criteria / selection criterion',
      },
      {
        id: 213,
        word: 'Nuance',
        ipa: '/ˈnuː.ɑːns/',
        type: 'Noun',
        meaning: 'Sắc thái tinh tế, khác biệt nhỏ',
        english_def: 'A very slight difference in appearance, meaning, sound, etc.',
        example: 'Understanding cultural nuances helps you communicate like a native.',
        example_vi: 'Hiểu được những sắc thái văn hóa tinh tế giúp bạn giao tiếp như người bản xứ.',
        collocation: 'subtle nuance / cultural nuance',
      },
      {
        id: 214,
        word: 'Simultaneous',
        ipa: '/ˌsaɪ.məlˈteɪ.ni.əs/',
        type: 'Adjective',
        meaning: 'Đồng thời, xảy ra cùng một lúc',
        english_def: 'Happening or being done at exactly the same time.',
        example: 'There was simultaneous translation available for all international delegates.',
        example_vi: 'Có phiên dịch đồng thời dành cho tất cả các đại biểu quốc tế.',
        collocation: 'simultaneous interpretation / release',
      },
      {
        id: 215,
        word: 'Advocate',
        ipa: '/ˈæd.və.keɪt/',
        type: 'Verb / Noun',
        meaning: 'Ủng hộ, tán thành; người chủ trương',
        english_def: 'To publicly support or suggest an idea, development, or way of doing.',
        example: 'Many educators strongly advocate incorporating AI tutors into homework practice.',
        example_vi: 'Nhiều nhà giáo dục nhiệt tình ủng hộ việc đưa gia sư AI vào luyện tập bài về nhà.',
        collocation: 'advocate for / strong advocate',
      },
    ],
  },
];

export default function FlashcardStudyView({ user, onRecordStudySession }) {
  // 1. State danh sách các Chủ đề / Bộ thẻ tự tạo (Lưu vào localStorage)
  const [customDecks, setCustomDecks] = useState(() => {
    try {
      const saved = localStorage.getItem('elearning_custom_decks');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'custom_personal',
        title: 'Sổ Tay Từ Vựng Tự Tạo',
        level: 'Cá nhân hóa',
        icon: 'fa-book-bookmark',
        color: '#8b5cf6',
        description: 'Chủ đề từ vựng linh hoạt do bạn hoặc giảng viên tự thêm để ôn tập theo nhu cầu.',
        isCustomDeck: true,
      },
    ];
  });

  // Tự động đồng bộ các chủ đề tự tạo vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem('elearning_custom_decks', JSON.stringify(customDecks));
    } catch (e) {
      console.error(e);
    }
  }, [customDecks]);

  // 2. State từ vựng tự tạo (gắn theo từng deckId, lưu vào localStorage)
  const [customWords, setCustomWords] = useState(() => {
    try {
      const saved = localStorage.getItem('elearning_custom_flashcards');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    // Mặc định cung cấp 2 từ mẫu trong Sổ tay cá nhân
    return [
      {
        id: 'custom_1',
        deckId: 'custom_personal',
        isCustom: true,
        word: 'Serendipity',
        ipa: '/ˌser.ənˈdɪp.ə.t̬i/',
        type: 'Noun',
        meaning: 'Sự tình cờ may mắn phát hiện ra những điều tốt đẹp',
        english_def: 'The occurrence of events by chance in a happy or beneficial way.',
        example: 'Finding this comprehensive e-learning platform was pure serendipity.',
        example_vi: 'Tìm thấy nền tảng học trực tuyến toàn diện này đúng là một sự may mắn tình cờ.',
        collocation: 'pure serendipity / pleasant serendipity',
      },
      {
        id: 'custom_2',
        deckId: 'custom_personal',
        isCustom: true,
        word: 'Perseverance',
        ipa: '/ˌpɝː.səˈvɪr.əns/',
        type: 'Noun',
        meaning: 'Sự kiên trì, bền bỉ vượt khó khăn',
        english_def: 'Persistence in doing something despite difficulty or delay in achieving success.',
        example: 'Through dedication and perseverance, she mastered fluent English.',
        example_vi: 'Bằng sự tận tâm và kiên trì, cô ấy đã thành thạo tiếng Anh trôi chảy.',
        collocation: 'show perseverance / great perseverance',
      },
    ];
  });

  // Tự động đồng bộ từ vựng tự tạo vào LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('elearning_custom_flashcards', JSON.stringify(customWords));
    } catch (e) {
      console.error(e);
    }
  }, [customWords]);

  // 3. Tổng hợp danh sách các Chủ đề / Bộ thẻ được phép học (CHỈ những bộ đã được Phê duyệt PUBLISHED hoặc bộ hệ thống)
  // Các đề tài PENDING (chờ duyệt) hoặc REJECTED (bị từ chối) của Giảng viên TUYỆT ĐỐI KHÔNG hiển thị cho học viên
  const allDecks = [
    // 3 bộ gốc: lấy từ mặc định cộng thêm các từ mới được thêm vào đúng bộ đó
    ...VOCABULARY_DECKS.map((d) => ({
      ...d,
      cards: [
        ...d.cards,
        ...customWords.filter((w) => w.deckId === d.id),
      ],
    })),
    // Các bộ do Giáo viên tạo đã qua phản biện và phê duyệt xuất bản (PUBLISHED)
    ...customDecks
      .filter((d) => d.status === 'PUBLISHED' || (!d.status && d.id === 'custom_personal'))
      .map((d) => ({
        ...d,
        cards: customWords.filter((w) => w.deckId === d.id),
      })),
  ];

  // State quản lý bộ thẻ & thẻ hiện tại
  const [selectedDeckId, setSelectedDeckId] = useState('daily_life');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0); // 1.0x hoặc 0.8x
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoPronounce, setAutoPronounce] = useState(false);

  // State Modal Tạo Chủ Đề / Bộ Thẻ Mới
  const [isCreateDeckModalOpen, setIsCreateDeckModalOpen] = useState(false);
  const [newDeckForm, setNewDeckForm] = useState({
    title: '',
    level: 'B1 - B2',
    color: '#0284c7',
    description: '',
  });
  const [createDeckError, setCreateDeckError] = useState('');

  // State Modal Thêm Từ Vựng Mới
  const [isAddWordModalOpen, setIsAddWordModalOpen] = useState(false);
  const [newWordForm, setNewWordForm] = useState({
    deckId: 'daily_life',
    word: '',
    ipa: '',
    type: 'Noun',
    meaning: '',
    english_def: '',
    example: '',
    example_vi: '',
    collocation: '',
  });
  const [addWordError, setAddWordError] = useState('');

  // Tiến độ ghi nhớ từ vựng (Lưu tạm vào State / LocalStorage)
  const [masteredWordIds, setMasteredWordIds] = useState(() => {
    try {
      const saved = localStorage.getItem('flashcard_mastered_words');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [reviewWordIds, setReviewWordIds] = useState(() => {
    try {
      const saved = localStorage.getItem('flashcard_review_words');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Chế độ kiểm tra nhanh Mini-Quiz (5 câu hỏi)
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Lấy bộ thẻ đang chọn
  const currentDeck = allDecks.find((d) => d.id === selectedDeckId) || allDecks[0];
  const cards = currentDeck.cards || [];
  const currentCard = cards.length > 0 ? (cards[currentCardIndex] || cards[0]) : null;

  // Lưu tiến độ vào LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('flashcard_mastered_words', JSON.stringify(masteredWordIds));
      localStorage.setItem('flashcard_review_words', JSON.stringify(reviewWordIds));
    } catch (e) {}
  }, [masteredWordIds, reviewWordIds]);

  // Reset thẻ khi đổi bộ
  useEffect(() => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsQuizMode(false);
  }, [selectedDeckId]);

  // Đảm bảo currentCardIndex hợp lệ khi danh sách thẻ thay đổi (ví dụ sau khi xóa thẻ)
  useEffect(() => {
    if (cards.length > 0 && currentCardIndex >= cards.length) {
      setCurrentCardIndex(Math.max(0, cards.length - 1));
    }
  }, [cards.length, currentCardIndex]);

  // Tự động phát âm khi chuyển thẻ nếu bật Auto-pronounce
  useEffect(() => {
    if (autoPronounce && currentCard && currentCard.word) {
      handlePronounce(currentCard.word);
    }
  }, [currentCardIndex, autoPronounce, selectedDeckId]);

  // Hủy âm thanh khi unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 1. Hàm phát âm giọng đọc bản xứ bằng Web Speech API
  const handlePronounce = (textToSpeak, e) => {
    if (e) e.stopPropagation();
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ tính năng phát âm Text-to-Speech.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'en-US';
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // 2. Lật thẻ
  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  // 3. Đánh dấu "Đã thuộc"
  const handleMarkMastered = () => {
    if (!currentCard) return;
    if (!masteredWordIds.includes(currentCard.id)) {
      setMasteredWordIds((prev) => [...prev, currentCard.id]);
      setReviewWordIds((prev) => prev.filter((id) => id !== currentCard.id));
    }

    // Ghi nhận phiên học cho Streak
    if (onRecordStudySession) {
      onRecordStudySession();
    }

    handleNextCard();
  };

  // 4. Đánh dấu "Cần ôn lại"
  const handleMarkReview = () => {
    if (!currentCard) return;
    if (!reviewWordIds.includes(currentCard.id)) {
      setReviewWordIds((prev) => [...prev, currentCard.id]);
      setMasteredWordIds((prev) => prev.filter((id) => id !== currentCard.id));
    }
    handleNextCard();
  };

  // 5. Thêm thẻ từ vựng mới (gắn vào đúng chủ đề được chọn)
  const handleSaveNewWord = (e) => {
    e.preventDefault();
    if (!newWordForm.word.trim()) {
      setAddWordError('Vui lòng nhập từ vựng tiếng Anh.');
      return;
    }
    if (!newWordForm.meaning.trim()) {
      setAddWordError('Vui lòng nhập nghĩa tiếng Việt.');
      return;
    }

    const targetDeck = newWordForm.deckId || selectedDeckId || 'daily_life';

    const newCard = {
      id: `custom_${Date.now()}`,
      deckId: targetDeck,
      isCustom: true,
      word: newWordForm.word.trim(),
      ipa: newWordForm.ipa.trim() || `/${newWordForm.word.trim().toLowerCase()}/`,
      type: newWordForm.type,
      meaning: newWordForm.meaning.trim(),
      english_def: newWordForm.english_def.trim() || 'Custom user vocabulary word.',
      example: newWordForm.example.trim() || `Example with "${newWordForm.word.trim()}".`,
      example_vi: newWordForm.example_vi.trim() || `Ví dụ với từ "${newWordForm.word.trim()}".`,
      collocation: newWordForm.collocation.trim(),
    };

    setCustomWords((prev) => [newCard, ...prev]);
    setIsAddWordModalOpen(false);
    setNewWordForm({
      deckId: targetDeck,
      word: '',
      ipa: '',
      type: 'Noun',
      meaning: '',
      english_def: '',
      example: '',
      example_vi: '',
      collocation: '',
    });
    setAddWordError('');

    // Chuyển sang xem đúng chủ đề vừa thêm từ và đặt vào thẻ mới tạo
    setSelectedDeckId(targetDeck);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  // 6. Xóa thẻ từ vựng tự tạo
  const handleDeleteCustomCard = (cardId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa thẻ từ vựng này khỏi bộ thẻ?')) {
      return;
    }
    setCustomWords((prev) => prev.filter((c) => c.id !== cardId));
    setMasteredWordIds((prev) => prev.filter((id) => id !== cardId));
    setReviewWordIds((prev) => prev.filter((id) => id !== cardId));
    setCurrentCardIndex(0);
  };

  // 7. Tạo chủ đề / bộ thẻ mới (Dành cho Giáo viên & Admin)
  const handleCreateNewDeck = (e) => {
    e.preventDefault();
    if (!newDeckForm.title.trim()) {
      setCreateDeckError('Vui lòng nhập tên chủ đề từ vựng.');
      return;
    }

    const newDeck = {
      id: `deck_${Date.now()}`,
      title: newDeckForm.title.trim(),
      level: newDeckForm.level || 'B1 - B2',
      color: newDeckForm.color || '#0284c7',
      description: newDeckForm.description.trim() || 'Chủ đề từ vựng chuyên đề do giáo viên / quản trị viên biên soạn.',
      icon: 'fa-layer-group',
      isCustomDeck: true,
    };

    setCustomDecks((prev) => [...prev, newDeck]);
    setIsCreateDeckModalOpen(false);
    setNewDeckForm({
      title: '',
      level: 'B1 - B2',
      color: '#0284c7',
      description: '',
    });
    setCreateDeckError('');

    // Chuyển sang chủ đề vừa tạo
    setSelectedDeckId(newDeck.id);
    setCurrentCardIndex(0);
  };

  // 8. Xóa chủ đề tự tạo
  const handleDeleteDeck = (deckId, deckTitle, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa chủ đề "${deckTitle}" cùng tất cả các từ vựng bên trong?`)) {
      return;
    }
    setCustomDecks((prev) => prev.filter((d) => d.id !== deckId));
    setCustomWords((prev) => prev.filter((w) => w.deckId !== deckId));
    if (selectedDeckId === deckId) {
      setSelectedDeckId('daily_life');
    }
  };

  // Chuyển thẻ tiếp theo
  const handleNextCard = () => {
    setIsFlipped(false);
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      setCurrentCardIndex(0); // Lặp lại từ đầu
    }
  };

  // Quay lại thẻ trước
  const handlePrevCard = () => {
    setIsFlipped(false);
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
    } else {
      setCurrentCardIndex(cards.length - 1);
    }
  };

  // Xáo trộn thẻ ngẫu nhiên
  const handleShuffle = () => {
    const randomIndex = Math.floor(Math.random() * cards.length);
    setCurrentCardIndex(randomIndex);
    setIsFlipped(false);
  };

  // 5. Khởi tạo bài kiểm tra nhanh Mini-Quiz (5 câu ngẫu nhiên)
  const handleStartMiniQuiz = () => {
    const shuffledCards = [...cards].sort(() => 0.5 - Math.random());
    const selectedFive = shuffledCards.slice(0, 5);

    const questions = selectedFive.map((card) => {
      // 1 đáp án đúng + 3 đáp án sai từ các thẻ khác
      const otherCards = cards.filter((c) => c.id !== card.id).sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = [
        { text: card.meaning, isCorrect: true },
        ...otherCards.map((c) => ({ text: c.meaning, isCorrect: false })),
      ].sort(() => 0.5 - Math.random());

      return {
        word: card.word,
        ipa: card.ipa,
        type: card.type,
        options,
      };
    });

    setQuizQuestions(questions);
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
    setIsQuizMode(true);
  };

  // Trả lời câu hỏi trong quiz
  const handleSelectQuizAnswer = (option) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(option);

    if (option.isCorrect) {
      setQuizScore((prev) => prev + 1);
    }

    setTimeout(() => {
      if (currentQuizIndex < quizQuestions.length - 1) {
        setCurrentQuizIndex((prev) => prev + 1);
        setSelectedAnswer(null);
      } else {
        setQuizFinished(true);
        // Ghi nhận Streak học hôm nay khi hoàn thành quiz
        if (onRecordStudySession) {
          onRecordStudySession();
        }
      }
    }, 1200);
  };

  // Thống kê tiến độ bộ thẻ hiện tại
  const deckCardsCount = cards.length;
  const deckMasteredCount = cards.filter((c) => masteredWordIds.includes(c.id)).length;
  const progressPercent = deckCardsCount > 0 ? Math.round((deckMasteredCount / deckCardsCount) * 100) : 0;
  const isCurrentMastered = currentCard ? masteredWordIds.includes(currentCard.id) : false;
  const isCurrentReview = currentCard ? reviewWordIds.includes(currentCard.id) : false;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px 16px', color: '#1e293b' }}>
      {/* Banner Giới thiệu Flashcards */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)',
          borderRadius: '20px',
          padding: '26px 30px',
          color: '#ffffff',
          marginBottom: '24px',
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.2)', fontSize: '0.78rem', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '8px' }}>
            <i className="fa-solid fa-volume-high" style={{ color: '#fef08a' }}></i>
            <span>HỌC TỪ VỰNG TƯƠNG TÁC & PHÁT ÂM CHUẨN IPA</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '900', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Thẻ Ghi Nhớ Thông Minh (Smart Flashcards)
          </h1>
          <p style={{ margin: 0, fontSize: '0.92rem', color: '#bfdbfe', maxWidth: '650px', lineHeight: '1.5' }}>
            Luyện trí nhớ dài hạn với phương pháp lật thẻ (Active Recall) kết hợp giọng phát âm bản xứ (Audio Speech) và kiểm tra phản xạ tức thì.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Nút Tạo Chủ Đề / Bộ Thẻ Mới (Dành cho Giáo viên & Admin) */}
          <button
            onClick={() => {
              setNewDeckForm({
                title: '',
                level: 'B1 - B2',
                color: '#0284c7',
                description: '',
              });
              setCreateDeckError('');
              setIsCreateDeckModalOpen(true);
            }}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              transition: 'transform 0.15s ease',
            }}
            title="Tạo chủ đề / bộ thẻ từ vựng mới (Giáo viên & Admin)"
          >
            <i className="fa-solid fa-folder-plus"></i>
            <span>+ Tạo chủ đề mới</span>
          </button>

          {/* Nút Thêm Từ Vựng Mới (Có dropdown chọn chủ đề muốn thêm vào) */}
          <button
            onClick={() => {
              setNewWordForm({
                deckId: selectedDeckId,
                word: '',
                ipa: '',
                type: 'Noun',
                meaning: '',
                english_def: '',
                example: '',
                example_vi: '',
                collocation: '',
              });
              setAddWordError('');
              setIsAddWordModalOpen(true);
            }}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
              transition: 'transform 0.15s ease',
            }}
            title="Thêm từ vựng mới vào chủ đề đã chọn"
          >
            <i className="fa-solid fa-plus-circle"></i>
            <span>+ Thêm từ vựng mới</span>
          </button>

          {!isQuizMode && (
            <button
              onClick={handleStartMiniQuiz}
              disabled={cards.length === 0}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                backgroundColor: cards.length === 0 ? '#94a3b8' : '#f59e0b',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: '800',
                cursor: cards.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: cards.length === 0 ? 'none' : '0 4px 12px rgba(245, 158, 11, 0.4)',
              }}
            >
              <i className="fa-solid fa-bolt"></i>
              <span>Kiểm tra nhanh 5 câu</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs chọn Chủ đề / Bộ thẻ (bao gồm các bộ CEFR & các bộ tự tạo của Giáo viên/Admin) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '22px' }}>
        {allDecks.map((deck) => {
          const isSelected = selectedDeckId === deck.id;
          const totalInDeck = deck.cards?.length || 0;
          const masteredInDeck = (deck.cards || []).filter((c) => masteredWordIds.includes(c.id)).length;
          const percent = totalInDeck > 0 ? Math.round((masteredInDeck / totalInDeck) * 100) : 0;

          return (
            <div
              key={deck.id}
              onClick={() => setSelectedDeckId(deck.id)}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '16px 18px',
                border: isSelected ? `2px solid ${deck.color}` : '1px solid #e2e8f0',
                boxShadow: isSelected ? `0 4px 16px -2px ${deck.color}25` : '0 2px 4px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: deck.color, backgroundColor: `${deck.color}15`, padding: '2px 8px', borderRadius: '6px' }}>
                  {deck.level}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>
                    {masteredInDeck}/{totalInDeck} từ ({percent}%)
                  </span>

                  {deck.isCustomDeck && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteDeck(deck.id, deck.title, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        fontSize: '0.8rem',
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                      title="Xóa chủ đề tự tạo này"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  )}
                </div>
              </div>

              <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>
                {deck.title}
              </h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.78rem', color: '#64748b', lineHeight: '1.4' }}>
                {deck.description}
              </p>
              {/* Progress bar */}
              <div style={{ width: '100%', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${percent}%`, height: '100%', backgroundColor: deck.color, borderRadius: '4px', transition: 'width 0.3s' }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          CHẾ ĐỘ 1: HỌC THẺ TƯƠNG TÁC (FLASHCARD STUDY MODE)
         ========================================================================= */}
      {!isQuizMode ? (
        cards.length === 0 ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '60px 24px',
              textAlign: 'center',
              border: '2px dashed #cbd5e1',
              marginBottom: '24px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#f3e8ff',
                color: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                margin: '0 auto 16px auto',
              }}
            >
              <i className="fa-solid fa-book-bookmark"></i>
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
              Sổ tay từ vựng của bạn đang trống!
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.92rem', maxWidth: '520px', margin: '0 auto 24px auto', lineHeight: '1.5' }}>
              Học viên, Giảng viên hoặc Quản trị viên đều có thể tự tạo từ vựng vào đây để luyện phát âm chuẩn IPA và lật thẻ ghi nhớ Active Recall.
            </p>
            <button
              onClick={() => {
                setNewWordForm({
                  word: '',
                  ipa: '',
                  type: 'Noun',
                  meaning: '',
                  english_def: '',
                  example: '',
                  example_vi: '',
                  collocation: '',
                });
                setAddWordError('');
                setIsAddWordModalOpen(true);
              }}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
              }}
            >
              <i className="fa-solid fa-plus-circle"></i>
              <span>+ Thêm từ vựng đầu tiên</span>
            </button>
          </div>
        ) : (
        <div>
          {/* Thanh công cụ hỗ trợ phát âm & điều khiển */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569' }}>
                Thẻ {currentCardIndex + 1} / {cards.length}
              </span>
              {isCurrentMastered && (
                <span style={{ fontSize: '0.72rem', backgroundColor: '#d1fae5', color: '#059669', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>
                  ✓ Đã thuộc
                </span>
              )}
              {isCurrentReview && (
                <span style={{ fontSize: '0.72rem', backgroundColor: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>
                  ⏳ Cần ôn lại
                </span>
              )}
              {currentCard?.isCustom && (
                <span style={{ fontSize: '0.72rem', backgroundColor: '#f3e8ff', color: '#7c3aed', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>
                  ★ Tự tạo
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Chọn tốc độ phát âm */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748b' }}>
                <span>Tốc độ đọc:</span>
                <button
                  onClick={() => setSpeechRate(1.0)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: speechRate === 1.0 ? '#2563eb' : '#ffffff',
                    color: speechRate === 1.0 ? '#ffffff' : '#334155',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  1.0x Chuẩn
                </button>
                <button
                  onClick={() => setSpeechRate(0.8)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: speechRate === 0.8 ? '#2563eb' : '#ffffff',
                    color: speechRate === 0.8 ? '#ffffff' : '#334155',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  0.8x Chậm
                </button>
              </div>

              {/* Nút Auto-pronounce */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748b', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoPronounce}
                  onChange={(e) => setAutoPronounce(e.target.checked)}
                />
                <span>Tự đọc từ vựng</span>
              </label>

              {/* Xáo trộn */}
              <button
                onClick={handleShuffle}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Xáo trộn ngẫu nhiên thứ tự thẻ"
              >
                <i className="fa-solid fa-shuffle"></i>
                <span>Xáo trộn</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              THẺ 3D FLIP CARD TƯƠNG TÁC
             ========================================================================= */}
          <div
            onClick={handleFlipCard}
            style={{
              perspective: '1200px',
              cursor: 'pointer',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                minHeight: '340px',
                borderRadius: '24px',
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* MẶT TRƯỚC CỦA THẺ (FRONT: Tiếng Anh + Phiên âm + Nút phát âm) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  backgroundColor: '#ffffff',
                  borderRadius: '24px',
                  padding: '36px 30px',
                  border: '1.5px solid #e2e8f0',
                  boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                {/* Header mặt trước */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: currentDeck.color, backgroundColor: `${currentDeck.color}15`, padding: '4px 12px', borderRadius: '12px' }}>
                      [{currentCard?.type}]
                    </span>
                    {currentCard?.isCustom && (
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#7c3aed', backgroundColor: '#f3e8ff', padding: '3px 8px', borderRadius: '8px' }}>
                        Từ của bạn
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {currentCard?.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomCard(currentCard.id, e)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fca5a5',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                        title="Xóa từ vựng này khỏi sổ tay cá nhân"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                        <span>Xóa từ này</span>
                      </button>
                    )}
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Nhấp vào thẻ để lật mặt sau
                    </span>
                  </div>
                </div>

                {/* Phần thân từ vựng & âm thanh */}
                <div style={{ margin: 'auto 0' }}>
                  <h2
                    style={{
                      fontSize: '2.8rem',
                      fontWeight: '900',
                      color: '#0f172a',
                      margin: '0 0 10px 0',
                      letterSpacing: '-1px',
                    }}
                  >
                    {currentCard.word}
                  </h2>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', backgroundColor: '#f1f5f9', padding: '6px 16px', borderRadius: '20px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '1.15rem', color: '#475569', fontWeight: '600', fontFamily: 'monospace' }}>
                      {currentCard.ipa}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handlePronounce(currentCard.word, e)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: isSpeaking ? '#059669' : currentDeck.color,
                        border: 'none',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}
                      title="Nghe phát âm chuẩn giọng bản xứ"
                    >
                      <i className={`fa-solid ${isSpeaking ? 'fa-volume-high' : 'fa-volume-low'}`}></i>
                    </button>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', fontStyle: 'italic' }}>
                    "{currentCard.english_def}"
                  </p>
                </div>

                {/* Gợi ý lật thẻ */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748b' }}>
                  <i className="fa-solid fa-arrows-rotate" style={{ color: currentDeck.color }}></i>
                  <span>Nhấp vào bất kỳ đâu để xem nghĩa tiếng Việt & câu ví dụ</span>
                </div>
              </div>

              {/* MẶT SAU CỦA THẺ (BACK: Nghĩa tiếng Việt + Câu ví dụ + Collocation) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  backgroundColor: '#ffffff',
                  borderRadius: '24px',
                  padding: '36px 30px',
                  border: `2px solid ${currentDeck.color}`,
                  boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'center',
                  transform: 'rotateY(180deg)',
                }}
              >
                {/* Header mặt sau */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#059669', backgroundColor: '#d1fae5', padding: '4px 12px', borderRadius: '12px' }}>
                    ĐỊNH NGHĨA & NGỮ CẢNH
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {currentCard?.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomCard(currentCard.id, e)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fca5a5',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                        title="Xóa từ vựng này khỏi sổ tay cá nhân"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                        <span>Xóa</span>
                      </button>
                    )}
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Mặt sau thẻ
                    </span>
                  </div>
                </div>

                {/* Nội dung chi tiết */}
                <div style={{ margin: 'auto 0', maxWidth: '600px' }}>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                    {currentCard.word} [{currentCard.type}]
                  </div>

                  <h3
                    style={{
                      fontSize: '1.9rem',
                      fontWeight: '900',
                      color: '#0f172a',
                      margin: '0 0 16px 0',
                    }}
                  >
                    {currentCard.meaning}
                  </h3>

                  {/* Câu ví dụ ngữ cảnh có nút phát âm cả câu */}
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '14px',
                      padding: '14px 18px',
                      border: '1px solid #e2e8f0',
                      textAlign: 'left',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#1e293b', lineHeight: '1.45' }}>
                        "{currentCard.example}"
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handlePronounce(currentCard.example, e)}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          backgroundColor: '#e2e8f0',
                          border: 'none',
                          color: '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                        title="Nghe phát âm cả câu ví dụ"
                      >
                        <i className="fa-solid fa-volume-high" style={{ fontSize: '0.75rem' }}></i>
                      </button>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>
                      → {currentCard.example_vi}
                    </div>
                  </div>

                  {/* Cụm từ hay đi kèm (Collocation) */}
                  {currentCard.collocation && (
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                      <strong style={{ color: currentDeck.color }}>Cụm từ ghi nhớ: </strong>
                      <code style={{ backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', color: '#0f172a', fontWeight: '700' }}>
                        {currentCard.collocation}
                      </code>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748b' }}>
                  <i className="fa-solid fa-arrows-rotate" style={{ color: currentDeck.color }}></i>
                  <span>Nhấp để lật lại mặt trước</span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              BỘ ĐIỀU HƯỚNG & ĐÁNH GIÁ MỨC ĐỘ THUỘC TỪ
             ========================================================================= */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '16px 20px',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Nút lùi */}
            <button
              onClick={handlePrevCard}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#334155',
                fontSize: '0.88rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Từ trước</span>
            </button>

            {/* 2 Nút Đánh dấu ghi nhớ */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleMarkReview}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  backgroundColor: isCurrentReview ? '#dc2626' : '#fee2e2',
                  border: '1px solid #fca5a5',
                  color: isCurrentReview ? '#ffffff' : '#b91c1c',
                  fontSize: '0.88rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                <i className="fa-solid fa-clock-rotate-left"></i>
                <span>Cần ôn lại</span>
              </button>

              <button
                onClick={handleMarkMastered}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  backgroundColor: isCurrentMastered ? '#047857' : '#059669',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                  transition: 'all 0.2s',
                }}
              >
                <i className="fa-solid fa-check"></i>
                <span>Đã thuộc từ này</span>
              </button>
            </div>

            {/* Nút tiến */}
            <button
              onClick={handleNextCard}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#334155',
                fontSize: '0.88rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Từ sau</span>
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
        )
      ) : (
        /* =========================================================================
            CHẾ ĐỘ 2: MINI-QUIZ KIỂM TRA PHẢN XẠ NHANH 5 CÂU
           ========================================================================= */
        <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '32px 24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.06)' }}>
          {!quizFinished ? (
            <div>
              {/* Header Quiz */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#f59e0b', backgroundColor: '#fef3c7', padding: '4px 12px', borderRadius: '12px' }}>
                  CÂU HỎI {currentQuizIndex + 1} / {quizQuestions.length}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#059669' }}>
                  Điểm hiện tại: {quizScore}/{quizQuestions.length}
                </span>
              </div>

              {/* Từ vựng câu hỏi */}
              <div style={{ textAlign: 'center', margin: '24px 0 32px 0' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '700' }}>
                  Nghĩa của từ vựng này là gì?
                </span>
                <h2 style={{ fontSize: '2.4rem', fontWeight: '900', color: '#0f172a', margin: '8px 0' }}>
                  {quizQuestions[currentQuizIndex]?.word}
                </h2>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem', color: '#64748b', fontFamily: 'monospace' }}>
                    {quizQuestions[currentQuizIndex]?.ipa}
                  </span>
                  <button
                    onClick={() => handlePronounce(quizQuestions[currentQuizIndex]?.word)}
                    style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '1.1rem' }}
                    title="Nghe phát âm"
                  >
                    <i className="fa-solid fa-volume-high"></i>
                  </button>
                </div>
              </div>

              {/* 4 Lựa chọn trả lời */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {quizQuestions[currentQuizIndex]?.options.map((option, idx) => {
                  let btnBg = '#f8fafc';
                  let btnBorder = '#e2e8f0';
                  let btnColor = '#1e293b';

                  if (selectedAnswer !== null) {
                    if (option.isCorrect) {
                      btnBg = '#d1fae5';
                      btnBorder = '#10b981';
                      btnColor = '#065f46';
                    } else if (selectedAnswer.text === option.text && !option.isCorrect) {
                      btnBg = '#fee2e2';
                      btnBorder = '#ef4444';
                      btnColor = '#991b1b';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectQuizAnswer(option)}
                      disabled={selectedAnswer !== null}
                      style={{
                        padding: '16px',
                        borderRadius: '14px',
                        backgroundColor: btnBg,
                        border: `1.5px solid ${btnBorder}`,
                        color: btnColor,
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        cursor: selectedAnswer === null ? 'pointer' : 'default',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <span
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: '#e2e8f0',
                          color: '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          flexShrink: 0,
                        }}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option.text}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => setIsQuizMode(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  ← Thoát chế độ kiểm tra và quay lại học thẻ
                </button>
              </div>
            </div>
          ) : (
            /* Kết thúc Quiz */
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: quizScore >= 4 ? '#d1fae5' : '#fef3c7',
                  color: quizScore >= 4 ? '#059669' : '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  margin: '0 auto 16px',
                }}
              >
                <i className={quizScore >= 4 ? 'fa-solid fa-trophy' : 'fa-solid fa-star'}></i>
              </div>

              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0f172a', margin: '0 0 8px 0' }}>
                {quizScore === 5 ? 'Tuyệt đối 5/5! Xuất sắc!' : quizScore >= 3 ? 'Làm tốt lắm!' : 'Cần ôn tập thêm!'}
              </h2>
              <p style={{ margin: '0 0 20px 0', fontSize: '0.95rem', color: '#64748b' }}>
                Bạn đã trả lời đúng <strong>{quizScore}/{quizQuestions.length} câu hỏi</strong>.
                <br />
                <span style={{ color: '#059669', fontWeight: '700' }}>
                  ✓ Đã ghi nhận vào Chuỗi ngày học (Daily Streak 🔥)!
                </span>
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  onClick={handleStartMiniQuiz}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    backgroundColor: '#2563eb',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                  }}
                >
                  <i className="fa-solid fa-arrows-rotate" style={{ marginRight: '6px' }}></i>
                  Làm lại đề khác
                </button>

                <button
                  onClick={() => setIsQuizMode(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Quay lại lật thẻ
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: THÊM THẺ TỪ VỰNG MỚI (Học viên, Giáo viên & Admin đều có thể thêm)
         ========================================================================= */}
      {isAddWordModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setIsAddWordModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '22px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
              }}
            >
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '800', color: '#7c3aed', backgroundColor: '#f3e8ff', padding: '3px 10px', borderRadius: '12px', marginBottom: '6px' }}>
                  <i className="fa-solid fa-book-bookmark"></i>
                  <span>SỔ TAY TỪ VỰNG CÁ NHÂN</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#0f172a' }}>
                  Thêm Thẻ Từ Vựng Mới
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Học viên, Giáo viên và Quản trị viên đều có thể thêm từ vựng để luyện phát âm & phản xạ Active Recall.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddWordModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '8px',
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveNewWord} style={{ padding: '24px' }}>
              {addWordError && (
                <div
                  style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fca5a5',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{addWordError}</span>
                </div>
              )}

              {/* Row 0: Chọn Chủ Đề / Bộ Thẻ muốn thêm vào */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                  Thêm vào Chủ Đề / Bộ Thẻ nào? <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={newWordForm.deckId}
                  onChange={(e) => setNewWordForm({ ...newWordForm, deckId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #8b5cf6',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    outline: 'none',
                    backgroundColor: '#faf5ff',
                    color: '#6b21a8',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                >
                  {allDecks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.level}) {d.isCustomDeck ? '★ Chủ đề tự tạo' : ''}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Từ vựng mới sẽ được phân loại và hiển thị trong đúng chủ đề này.
                </span>
              </div>

              {/* Row 1: Từ tiếng Anh & Phiên âm & Loại từ */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                    Từ vựng tiếng Anh <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Resilient, Serendipity..."
                    value={newWordForm.word}
                    onChange={(e) => setNewWordForm({ ...newWordForm, word: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                    Phiên âm IPA
                  </label>
                  <input
                    type="text"
                    placeholder="VD: /rɪˈzɪl.jənt/"
                    value={newWordForm.ipa}
                    onChange={(e) => setNewWordForm({ ...newWordForm, ipa: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                    Loại từ
                  </label>
                  <select
                    value={newWordForm.type}
                    onChange={(e) => setNewWordForm({ ...newWordForm, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 10px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="Noun">Noun (Danh từ)</option>
                    <option value="Verb">Verb (Động từ)</option>
                    <option value="Adjective">Adjective (Tính từ)</option>
                    <option value="Adverb">Adverb (Trạng từ)</option>
                    <option value="Idiom">Idiom (Thành ngữ)</option>
                    <option value="Phrasal Verb">Phrasal Verb (Cụm động từ)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Nghĩa tiếng Việt */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                  Nghĩa tiếng Việt <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Kiên cường, có khả năng phục hồi nhanh trước khó khăn"
                  value={newWordForm.meaning}
                  onChange={(e) => setNewWordForm({ ...newWordForm, meaning: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Row 3: Định nghĩa tiếng Anh (tùy chọn) */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                  Định nghĩa tiếng Anh (English definition)
                </label>
                <input
                  type="text"
                  placeholder="VD: Able to quickly return to a previous good condition after difficulties..."
                  value={newWordForm.english_def}
                  onChange={(e) => setNewWordForm({ ...newWordForm, english_def: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Row 4: Câu ví dụ tiếng Anh & Dịch nghĩa tiếng Việt */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                    Câu ví dụ tiếng Anh
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Highly resilient people face challenges with optimism."
                    value={newWordForm.example}
                    onChange={(e) => setNewWordForm({ ...newWordForm, example: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                    Dịch nghĩa câu ví dụ
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Những người kiên cường đối mặt thử thách với sự lạc quan."
                    value={newWordForm.example_vi}
                    onChange={(e) => setNewWordForm({ ...newWordForm, example_vi: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Row 5: Cụm từ đi kèm (Collocation) */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                  Cụm từ ghi nhớ (Collocation / Phrasal)
                </label>
                <input
                  type="text"
                  placeholder="VD: highly resilient / resilient economy / bounce back"
                  value={newWordForm.collocation}
                  onChange={(e) => setNewWordForm({ ...newWordForm, collocation: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddWordModalOpen(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Lưu Thẻ Vào Chủ Đề Này</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TẠO CHỦ ĐỀ / BỘ THẺ TỪ VỰNG MỚI (Dành cho Giáo viên & Admin)
         ========================================================================= */}
      {isCreateDeckModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setIsCreateDeckModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '22px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
              }}
            >
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '3px 10px', borderRadius: '12px', marginBottom: '6px' }}>
                  <i className="fa-solid fa-folder-plus"></i>
                  <span>QUẢN LÝ CHỦ ĐỀ TỪ VỰNG</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#0f172a' }}>
                  Tạo Chủ Đề / Bộ Thẻ Mới
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Giáo viên & Quản trị viên có thể tạo các chủ đề mới để phân loại và soạn từ vựng theo chuyên đề.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateDeckModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '8px',
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateNewDeck} style={{ padding: '24px' }}>
              {createDeckError && (
                <div
                  style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fca5a5',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{createDeckError}</span>
                </div>
              )}

              {/* Tên chủ đề */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                  Tên Chủ Đề / Bộ Thẻ <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Từ Vựng Công Nghệ Thông Tin (IT), Tiếng Anh Du Lịch, IELTS Writing..."
                  value={newDeckForm.title}
                  onChange={(e) => setNewDeckForm({ ...newDeckForm, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Cấp độ & Màu sắc */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                    Trình độ áp dụng (Level)
                  </label>
                  <select
                    value={newDeckForm.level}
                    onChange={(e) => setNewDeckForm({ ...newDeckForm, level: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="A1 - A2">A1 - A2 (Căn bản)</option>
                    <option value="B1 - B2">B1 - B2 (Trung cấp)</option>
                    <option value="B2 - C1">B2 - C1 (Nâng cao)</option>
                    <option value="IELTS Master">IELTS Master</option>
                    <option value="TOEIC 800+">TOEIC 800+</option>
                    <option value="Chuyên ngành">Chuyên ngành</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                    Màu sắc chủ đạo
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '42px' }}>
                    {[
                      { hex: '#0284c7', name: 'Xanh biển' },
                      { hex: '#059669', name: 'Xanh ngọc' },
                      { hex: '#8b5cf6', name: 'Tím' },
                      { hex: '#d97706', name: 'Vàng cam' },
                      { hex: '#db2777', name: 'Hồng' },
                      { hex: '#dc2626', name: 'Đỏ' },
                    ].map((c) => (
                      <div
                        key={c.hex}
                        onClick={() => setNewDeckForm({ ...newDeckForm, color: c.hex })}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          backgroundColor: c.hex,
                          cursor: 'pointer',
                          border: newDeckForm.color === c.hex ? '3px solid #0f172a' : '2px solid transparent',
                          transform: newDeckForm.color === c.hex ? 'scale(1.15)' : 'scale(1)',
                          transition: 'all 0.15s ease',
                        }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Mô tả ngắn */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                  Mô tả ngắn về chủ đề
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả mục tiêu từ vựng của chủ đề này (VD: 20 từ vựng cốt lõi thường gặp trong tài liệu kỹ thuật phần mềm)..."
                  value={newDeckForm.description}
                  onChange={(e) => setNewDeckForm({ ...newDeckForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'none',
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateDeckModalOpen(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <i className="fa-solid fa-folder-plus"></i>
                  <span>Tạo Chủ Đề Mới</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

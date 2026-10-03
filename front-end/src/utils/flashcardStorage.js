// Quản lý lưu trữ và chia sẻ dữ liệu Flashcards giữa Admin, Teacher và Student
export const DEFAULT_VOCABULARY_DECKS = [
  {
    id: 'daily_life',
    title: 'Giao Tiếp & Đời Sống Hàng Ngày',
    level: 'A1 - A2',
    icon: 'fa-comments',
    color: '#0284c7',
    description: '15 từ vựng căn bản giúp bạn tự tin giao tiếp, mô tả thói quen và các hoạt động thường nhật.',
    author: 'Admin',
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
    author: 'Admin',
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
    author: 'Admin',
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

export const VOCABULARY_DECKS = DEFAULT_VOCABULARY_DECKS;

export const getStoredCustomDecks = () => {
  try {
    const saved = localStorage.getItem('elearning_custom_decks');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading custom decks:', e);
  }
  return [
    {
      id: 'custom_personal',
      title: 'Sổ Tay Từ Vựng Chuyên Đề',
      level: 'B1 - B2',
      icon: 'fa-book-bookmark',
      color: '#8b5cf6',
      description: 'Chủ đề từ vựng linh hoạt do giảng viên và quản trị viên biên soạn.',
      author: 'Giảng viên',
      isCustomDeck: true,
      created_at: '2026-09-01',
    },
  ];
};

export const saveStoredCustomDecks = (decks) => {
  try {
    localStorage.setItem('elearning_custom_decks', JSON.stringify(decks));
  } catch (e) {
    console.error('Error saving custom decks:', e);
  }
};

export const getStoredCustomWords = () => {
  try {
    const saved = localStorage.getItem('elearning_custom_flashcards');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading custom words:', e);
  }
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
};

export const saveStoredCustomWords = (words) => {
  try {
    localStorage.setItem('elearning_custom_flashcards', JSON.stringify(words));
  } catch (e) {
    console.error('Error saving custom words:', e);
  }
};

export const getDeckOverrides = () => {
  try {
    const saved = localStorage.getItem('elearning_deck_overrides');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export const saveDeckOverrides = (overrides) => {
  try {
    localStorage.setItem('elearning_deck_overrides', JSON.stringify(overrides));
  } catch {}
};

export const getDeletedDeckIds = () => {
  try {
    const saved = localStorage.getItem('elearning_deleted_deck_ids');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const saveDeletedDeckIds = (ids) => {
  try {
    localStorage.setItem('elearning_deleted_deck_ids', JSON.stringify(ids));
  } catch {}
};

export const getWordOverrides = () => {
  try {
    const saved = localStorage.getItem('elearning_word_overrides');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export const saveWordOverrides = (overrides) => {
  try {
    localStorage.setItem('elearning_word_overrides', JSON.stringify(overrides));
  } catch {}
};

export const getDeletedWordIds = () => {
  try {
    const saved = localStorage.getItem('elearning_deleted_word_ids');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const saveDeletedWordIds = (ids) => {
  try {
    localStorage.setItem('elearning_deleted_word_ids', JSON.stringify(ids));
  } catch {}
};

export const getAllDecksWithWords = (forUser = null) => {
  const customDecks = getStoredCustomDecks();
  const customWords = getStoredCustomWords();
  const deckOverrides = getDeckOverrides();
  const deletedDeckIds = getDeletedDeckIds();
  const wordOverrides = getWordOverrides();
  const deletedWordIds = getDeletedWordIds();

  // 3 bộ gốc mặc định được gán chính thức cho Admin quản lý (mặc định luôn PUBLISHED)
  const builtIn = DEFAULT_VOCABULARY_DECKS
    .filter((d) => !deletedDeckIds.includes(d.id))
    .map((d) => {
      const override = deckOverrides[d.id] || {};
      const baseCards = d.cards
        .filter((c) => !deletedWordIds.includes(c.id))
        .map((c) => ({
          ...c,
          deckId: d.id,
          isCustom: true,
          ...(wordOverrides[c.id] || {}),
        }));
      const extraCards = customWords
        .filter((w) => w.deckId === d.id && !deletedWordIds.includes(w.id))
        .map((w) => ({
          ...w,
          ...(wordOverrides[w.id] || {}),
        }));

      return {
        ...d,
        author: 'Admin',
        authorRole: 'ADMIN',
        status: override.status || 'PUBLISHED',
        isCustomDeck: true,
        ...override,
        cards: [...baseCards, ...extraCards],
      };
    });

  const custom = customDecks
    .filter((d) => !deletedDeckIds.includes(d.id))
    .map((d) => {
      const override = deckOverrides[d.id] || {};
      const cards = customWords
        .filter((w) => w.deckId === d.id && !deletedWordIds.includes(w.id))
        .map((w) => ({
          ...w,
          ...(wordOverrides[w.id] || {}),
        }));
      return {
        ...d,
        author: d.author || 'Giảng viên',
        authorRole: d.authorRole || 'TEACHER',
        status: override.status || d.status || 'PUBLISHED',
        isCustomDeck: true,
        ...override,
        cards,
      };
    });

  const all = [...builtIn, ...custom];

  // Phân quyền hiển thị theo người dùng
  if (!forUser) return all;

  // 1. Phản biện viên (REVIEWER) & Quản trị viên (ADMIN): Thấy toàn bộ để kiểm duyệt và quản lý
  if (forUser.role === 'ADMIN' || forUser.role === 'REVIEWER') {
    return all;
  }

  // 2. Giảng viên (TEACHER):
  // Chỉ thấy các bộ của chính mình tạo + các bộ hệ thống/Admin đã duyệt
  // KHÔNG thấy đề tài của các giảng viên khác (chờ duyệt/nháp)
  if (forUser.role === 'TEACHER') {
    return all.filter((d) => {
      // Bộ hệ thống mặc định của Admin
      if (d.author === 'Admin' || d.authorRole === 'ADMIN') return true;
      // Bộ do chính giảng viên này tạo
      const isOwner =
        (forUser.id && d.authorId && String(d.authorId) === String(forUser.id)) ||
        (forUser.full_name && d.author === forUser.full_name) ||
        (forUser.email && d.authorEmail === forUser.email);
      return isOwner;
    });
  }

  // 3. Học viên (STUDENT) hoặc Khách:
  // Chỉ xem các đề tài đã được Phê duyệt xuất bản (PUBLISHED)
  return all.filter((d) => d.status === 'PUBLISHED');
};

// Cập nhật trạng thái duyệt đề tài flashcard (Dành cho Reviewer / Admin)
export const updateDeckStatus = (deckId, status, rejectionReason = null, reviewerName = 'Thẩm định viên') => {
  const customDecks = getStoredCustomDecks();
  const deckExists = customDecks.some((d) => d.id === deckId);

  if (deckExists) {
    const updated = customDecks.map((d) => {
      if (d.id === deckId) {
        return {
          ...d,
          status,
          rejectionReason: status === 'REJECTED' ? rejectionReason : null,
          reviewedBy: reviewerName,
          reviewedAt: new Date().toISOString(),
        };
      }
      return d;
    });
    saveStoredCustomDecks(updated);
  } else {
    // Nếu là deck gốc mặc định, lưu vào overrides
    const overrides = getDeckOverrides();
    overrides[deckId] = {
      ...(overrides[deckId] || {}),
      status,
      rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString(),
    };
    saveDeckOverrides(overrides);
  }
};

// Giảng viên gửi lại đề tài sau khi đã chỉnh sửa theo phản biện
export const resubmitDeckForReview = (deckId) => {
  const customDecks = getStoredCustomDecks();
  const deckExists = customDecks.some((d) => d.id === deckId);

  if (deckExists) {
    const updated = customDecks.map((d) => {
      if (d.id === deckId) {
        return {
          ...d,
          status: 'PENDING',
          rejectionReason: null,
          resubmittedAt: new Date().toISOString(),
        };
      }
      return d;
    });
    saveStoredCustomDecks(updated);
  } else {
    const overrides = getDeckOverrides();
    overrides[deckId] = {
      ...(overrides[deckId] || {}),
      status: 'PENDING',
      rejectionReason: null,
      resubmittedAt: new Date().toISOString(),
    };
    saveDeckOverrides(overrides);
  }
};

export const speakWord = (wordText, rate = 1.0) => {
  if (!('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis API not supported in this browser.');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(wordText);
  utterance.lang = 'en-US';
  utterance.rate = rate;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
  if (enVoice) {
    utterance.voice = enVoice;
  }
  window.speechSynthesis.speak(utterance);
};

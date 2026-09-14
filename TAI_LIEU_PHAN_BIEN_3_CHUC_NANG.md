# CẨM NANG ÔN TẬP & PHẢN BIỆN ĐỒ ÁN TỐT NGHIỆP
## 3 CHỨC NĂNG TRỌNG TÂM CỦA HỆ THỐNG E-LEARNING AI

> **Dành cho:** Sinh viên bảo vệ Đồ án Tốt nghiệp  
> **Mục tiêu:** Nắm chắc bản chất kỹ thuật, vị trí từng file mã nguồn, luồng dữ liệu thực tế và trả lời tự tin 100% câu hỏi của Hội đồng chấm thi.

---

## 🧭 TỔNG QUAN 3 CHỨC NĂNG TRỌNG TÂM

1. **Chức năng 1 (Học viên):** Phân tích lỗi sai & Luyện tập thích ứng (*Adaptive Mistake Remediation*)
2. **Chức năng 2 (Học viên):** Trợ lý Giao tiếp AI & Sửa ngữ pháp 1-1 (*AI Communication & Grammar Analyzer*)
3. **Chức năng 3 (Giảng viên):** Bóc tách & Import đề thi từ Word (`.docx`) và Excel (`.xlsx`) (*Smart Exam Bulk Import*)

---

# 📌 CHỨC NĂNG 1: PHÂN TÍCH LỖI SAI & LUYỆN TẬP THÍCH ỨNG (HỌC VIÊN)

### 1. Ý nghĩa & Giá trị Sư phạm
- **Vấn đề thực tế:** Học viên khi làm bài kiểm tra trắc nghiệm thường chỉ biết điểm số (VD: 6/10) nhưng không biết mình yếu phần ngữ pháp nào để tự khắc phục.
- **Giải pháp của hệ thống:** Tự động phát hiện các câu làm sai trong CSDL, dùng AI để chẩn đoán chính xác quy tắc ngữ pháp bị sai (Past Perfect, Relative Clauses, Conditionals...), gom nhóm lại thành các "Chủ đề yếu" (Weak Topics), sau đó cho phép học viên bấm **1 nút duy nhất** để AI sinh ngay 5 câu trắc nghiệm mới đúng vào lỗ hổng đó để ôn luyện triệt để.

### 2. Vị trí File Mã Nguồn (Code Mapping)
| Thành phần | Đường dẫn File | Nhiệm vụ chính |
| :--- | :--- | :--- |
| **Frontend Giao diện** | `front-end/src/components/AdaptivePathView.jsx` | Màn hình hiển thị danh sách câu sai, bộ lọc theo chủ đề và nút "Luyện tập tất cả câu sai". |
| **Frontend Modal thi** | `front-end/src/components/WeakTopicPracticeModal.jsx` | Modal làm bài thi luyện tập điểm yếu tức thì với bộ đếm giờ và chấm điểm trực tiếp. |
| **Backend Phân tích lỗi** | `back-end/elearning/apps/ai/services.py` (`QuestionAnalysisAIService`) | Tự động phân tích câu hỏi bằng AI và lưu kết quả vào bảng `QuestionAIAnalysis`. |
| **Backend API Danh sách** | `back-end/elearning/apps/recommendations/views.py` (`StudentMistakesAnalyticsAPIView`) | API trích xuất danh sách câu hỏi sai từ bảng `StudentAnswer` của học viên đang đăng nhập. |
| **Backend Sinh đề ôn** | `back-end/elearning/apps/recommendations/views.py` (`GenerateWeakTopicQuizAPIView`) | API nhận chủ đề yếu $\rightarrow$ gọi LLM sinh đề thi thích ứng $\rightarrow$ trả về JSON chuẩn. |
| **Backend System Prompt**| `back-end/elearning/apps/ai/prompts.py` | `QUESTION_ANALYSIS_SYSTEM_PROMPT` và `WEAK_TOPIC_QUIZ_SYSTEM_PROMPT`. |

### 3. Luồng hoạt động kỹ thuật (Data Flow)
```text
[Học viên nộp bài thi]
       │
       ▼
1. Bảng StudentAnswer lưu: is_correct = False
       │
       ▼
2. AI phân tích ngữ cảnh câu hỏi (QuestionAIAnalysis):
   - Topic: "Past Perfect"
   - Sub-topic: "Hành động xảy ra trước một hành động khác trong quá khứ"
   - Confidence: 0.95
       │
       ▼
3. API getStudentMistakes() gom nhóm theo Topic & đếm số lần sai
       │
       ▼
4. Học viên bấm "Luyện tập":
   - Backend gọi Groq/Gemini với Prompt WEAK_TOPIC_QUIZ_SYSTEM_PROMPT
   - Sinh đúng 5 câu trắc nghiệm mới 100% bám sát Topic "Past Perfect"
   - Học viên làm bài xong -> Đánh dấu lỗi sai đã được khắc phục (is_resolved = True)
```

### 4. Các câu hỏi Hội đồng hay hỏi & Câu trả lời mẫu
- **Hỏi:** *Dữ liệu lỗi sai này lấy từ đâu? AI có tự bịa ra điểm yếu của học viên không?*
  - **Đáp:** *Dạ không, dữ liệu hoàn toàn xuất phát từ bài làm thật của học viên trong CSDL PostgreSQL. Khi học viên làm bài thi trong bảng `QuizAttempt`, các câu trả lời sai có cờ `is_correct=False` trong bảng `StudentAnswer` mới được đưa vào phân tích.*
- **Hỏi:** *Tại sao lại dùng AI để phân tích câu hỏi mà không dùng thuật toán tìm từ khóa (Regex Keyword)?*
  - **Đáp:** *Dạ vì ngôn ngữ tự nhiên có tính đa nghĩa. Ví dụ: từ 'that' vừa có thể là Mệnh đề quan hệ (Relative Clause), vừa có thể là Liên từ (Conjunction). Nếu chỉ bắt từ khóa thì độ chính xác rất thấp. AI có khả năng hiểu cấu trúc ngữ pháp và ngữ nghĩa để phân loại chính xác.*

---

# 📌 CHỨC NĂNG 2: TRỢ LÝ GIA SƯ AI & SỬA NGỮ PHÁP 1-1 (HỌC VIÊN)

### 1. Ý nghĩa & Giá trị Sư phạm
- Cung cấp phòng luyện nói và đàm thoại phản xạ 1-1 với AI 24/7 theo các chủ đề đời sống (Roleplay), kèm tính năng **soát lỗi ngữ pháp và đề xuất cách diễn đạt tự nhiên hơn**.

### 2. Vị trí File Mã Nguồn (Code Mapping)
| Thành phần | Đường dẫn File | Nhiệm vụ chính |
| :--- | :--- | :--- |
| **Frontend Giao diện** | `front-end/src/components/AICommunicationView.jsx` | Giao diện phòng chat real-time, chọn chủ đề hội thoại và hiển thị box sửa lỗi ngữ pháp. |
| **Backend API Chat** | `back-end/elearning/apps/ai/views.py` (`ChatMessageListCreateAPIView`) | Tiếp nhận tin nhắn, duy trì ngữ cảnh phiên chat (`ChatSession`) và trả lời của AI. |
| **Backend Soát lỗi** | `back-end/elearning/apps/ai/views.py` (`GrammarCheckAPIView`) | Nhận câu tiếng Anh của học viên $\rightarrow$ trả về JSON chi tiết lỗi sai và câu chuẩn. |
| **Backend AI Engine** | `back-end/elearning/apps/ai/services.py` (`AIService`) | Điều phối tin nhắn, tích hợp đa nhà cung cấp LLM (Groq Cloud, Google Gemini). |
| **Backend System Prompt**| `back-end/elearning/apps/ai/prompts.py` | `build_system_prompt()` và `GRAMMAR_ANALYZER_SYSTEM_PROMPT`. |

### 3. Luồng hoạt động kỹ thuật (Data Flow)
```text
[Học viên gửi tin nhắn: "She go to school yesterday"]
       │
       ├──> Luồng 1 (Gia sư đàm thoại):
       │    - Backend gửi lịch sử chat + System Prompt tới LLM
       │    - AI phản hồi tự nhiên, khuyến khích học viên trò chuyện tiếp
       │
       └──> Luồng 2 (Soát lỗi ngữ pháp độc lập):
            - Gọi GRAMMAR_ANALYZER_SYSTEM_PROMPT
            - Trả về JSON:
              {
                "has_errors": true,
                "error_segment": "go",
                "correction": "went",
                "error_type": "Past Simple Tense",
                "explanation_vi": "Diễn tả hành động đã xảy ra trong quá khứ (yesterday), dùng 'went'."
              }
```

### 4. Các câu hỏi Hội đồng hay hỏi & Câu trả lời mẫu
- **Hỏi:** *Làm thế nào để AI nhớ được ngữ cảnh các câu chat trước đó?*
  - **Đáp:** *Dạ mỗi cuộc hội thoại được định danh bằng một `session_id` trong bảng `ChatSession`. Mỗi khi người dùng gửi tin nhắn mới, backend sẽ truy vấn danh sách các `ChatMessage` gần nhất trong session đó và gửi kèm vào mảng messages cho LLM để đảm bảo AI duy trì ngữ cảnh liền mạch.*
- **Hỏi:** *Nếu học viên nhập tiếng Việt vào ô chat thì hệ thống có bắt lỗi ngữ pháp tiếng Anh không?*
  - **Đáp:** *Dạ em đã cấu hình trong `GRAMMAR_ANALYZER_SYSTEM_PROMPT` quy tắc nhận diện ngôn ngữ: nếu người dùng gõ tiếng Việt, hệ thống sẽ tự động bỏ qua kiểm tra ngữ pháp tiếng Anh và chỉ phản hồi nội dung trò chuyện bình thường.*

---

# 📌 CHỨC NĂNG 3: BÓC TÁCH & IMPORT ĐỀ THI TỪ WORD/EXCEL (GIẢNG VIÊN)

### 1. Ý nghĩa & Giá trị Thực tiễn
- Giúp giảng viên tiết kiệm 95% thời gian nhập liệu. Thay vì phải tạo thủ công từng câu hỏi một, giảng viên chỉ cần tải lên file Word (`.docx`) hoặc Excel (`.xlsx`) sẵn có, hệ thống sẽ tự động bóc tách thành ngân hàng đề thi hoàn chỉnh.

### 2. Vị trí File Mã Nguồn (Code Mapping)
| Thành phần | Đường dẫn File | Nhiệm vụ chính |
| :--- | :--- | :--- |
| **Frontend Modal Import** | `front-end/src/components/QuizImportModal.jsx` | Giao diện chọn file, tải file mẫu, xem trước (Preview) và sửa trực tiếp câu hỏi trước khi lưu. |
| **Backend Parsers** | `back-end/elearning/apps/quiz_import/parsers.py` | Các bộ phân tích: `ExcelQuizParser` (openpyxl), `WordQuizParser` (python-docx/XML regex). |
| **Backend Service** | `back-end/elearning/apps/quiz_import/services.py` (`QuizImportService`) | Điều phối bóc tách, validate tính hợp lệ và thực hiện lưu vào Database. |
| **Backend API Preview** | `back-end/elearning/apps/quiz_import/views.py` (`QuizFileParsePreviewAPIView`) | Nhận file tải lên $\rightarrow$ trả về mảng JSON câu hỏi cho frontend preview. |
| **Backend API Lưu CSDL**| `back-end/elearning/apps/quiz_import/views.py` (`QuizBulkImportExecuteAPIView`) | Nhận dữ liệu đã duyệt $\rightarrow$ lưu hàng loạt câu hỏi vào đề thi. |
| **Backend Tải file mẫu** | `back-end/elearning/apps/quiz_import/views.py` (`DownloadSampleQuizTemplateAPIView`) | Xuất file mẫu chuẩn Word/Excel để giảng viên điền theo. |

### 3. Luồng hoạt động kỹ thuật (Data Flow)
```text
[Giảng viên tải lên file .docx hoặc .xlsx]
       │
       ▼
1. Backend kiểm tra đuôi file & dung lượng (tối đa 10MB)
       │
       ▼
2. Bộ phân tích (Parser) đọc dữ liệu:
   - Excel: Dùng openpyxl đọc các cột: Nội dung, Đáp án A, B, C, D, Đáp án đúng, Điểm, Giải thích
   - Word: Dùng biểu thức chính quy (Regex) bóc tách theo mẫu: "Question 1:", "A.", "B.", "Answer:"
       │
       ▼
3. Trả về kết quả Form Preview trên màn hình để Giảng viên rà soát
       │
       ▼
4. Giảng viên bấm "Xác nhận Lưu":
   - Backend bọc trong transaction.atomic()
   - Lưu 1 lúc: Quiz -> Question -> 4 AnswerOption
   - Nếu có lỗi bất kỳ câu nào -> Rollback 100%, không sinh rác database
```

### 4. Các câu hỏi Hội đồng hay hỏi & Câu trả lời mẫu
- **Hỏi:** *Nếu file của giảng viên bị thiếu cột, thiếu đáp án đúng hoặc sai định dạng thì hệ thống xử lý thế nào?*
  - **Đáp:** *Dạ trong `QuizImportService`, em có bộ thẩm định (Validator). Nếu câu hỏi không có đáp án đúng, hoặc ít hơn 2 phương án lựa chọn, hệ thống sẽ cảnh báo chi tiết lỗi ở dòng/câu số mấy để giảng viên sửa ngay trên bảng Preview trước khi lưu.*
- **Hỏi:** *Làm thế nào để đảm bảo tính toàn vẹn dữ liệu khi import 50-100 câu hỏi?*
  - **Đáp:** *Dạ em sử dụng cơ chế `transaction.atomic()` của Django ORM. Toàn bộ thao tác tạo đề thi, câu hỏi và các lựa chọn đáp án được thực hiện trong một Transaction duy nhất. Nếu có bất kỳ sự cố nào xảy ra giữa chừng, toàn bộ giao dịch sẽ được Rollback về trạng thái ban đầu.*

---

## 🎯 KỊCH BẢN DEMO BẢO VỆ 12 PHÚT HOÀN HẢO

1. **Phút 1 - 2 (Giới thiệu):**
   - Đăng nhập tài khoản Học viên. Giới thiệu tổng quan hệ thống E-Learning chuẩn CEFR.
2. **Phút 3 - 6 (Demo Chức năng 1 - Luyện lỗi sai AI):**
   - Vào mục **Luyện đề** $\rightarrow$ Làm một bài kiểm tra ngắn $\rightarrow$ Cố tình chọn sai 2 câu (ví dụ về thì quá khứ hoặc câu điều kiện) $\rightarrow$ Nộp bài.
   - Chuyển sang tab **"Luyện Lỗi Sai AI"** $\rightarrow$ Chỉ cho hội đồng thấy hệ thống đã bóc tách chính xác chủ đề bị sai.
   - Bấm nút **"Luyện tập"** $\rightarrow$ Modal AI sinh ngay 5 câu mới đúng vào chủ đề đó $\rightarrow$ Làm bài và hoàn thành bài luyện.
3. **Phút 7 - 9 (Demo Chức năng 2 - Giao tiếp AI):**
   - Vào tab **"Giao tiếp AI"** $\rightarrow$ Chọn chủ đề hội thoại (Roleplay du lịch hoặc công việc).
   - Gõ một câu cố tình sai ngữ pháp: *"She don't like eating apples"* $\rightarrow$ AI vừa trò chuyện vừa hiển thị box sửa lỗi: Đổi `don't` thành `doesn't`.
4. **Phút 10 - 12 (Demo Chức năng 3 - Import đề thi Giảng viên):**
   - Đăng xuất $\rightarrow$ Đăng nhập tài khoản Giảng viên.
   - Bấm nút **"Import Đề thi"** trên thanh điều hướng.
   - Bấm nút tải file mẫu Excel/Word $\rightarrow$ Tải lên file đề thi có sẵn $\rightarrow$ Màn hình Preview bóc tách thành công $\rightarrow$ Bấm lưu đề thi vào khóa học.
5. **Hết giờ $\rightarrow$ Tự tin chuyển sang phần hỏi đáp của Hội đồng!**

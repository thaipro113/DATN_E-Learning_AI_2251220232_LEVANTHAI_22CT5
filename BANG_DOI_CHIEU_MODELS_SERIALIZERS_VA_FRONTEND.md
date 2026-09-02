# 📑 BẢNG ĐỐI CHIẾU TOÀN DIỆN MODELS & SERIALIZERS (BACK-END) VỚI GIAO DIỆN (FRONT-END)
> **Dự án**: Hệ thống E-Learning Học Tiếng Anh Cá Nhân Hóa Tích Hợp Trợ Lý AI (DATN)  
> **Sinh viên thực hiện**: Lê Văn Thái - 2251220232 - 22CT5  
> **Thời gian rà soát & lập tài liệu**: 2026-09-02  
> **Mục đích**: Rà soát 100% các thực thể CSDL (Models), bộ tuần tự hóa (Serializers) của toàn bộ 7 Django Apps để đối chiếu với các Form nhập liệu, Modal, Card và Màn hình hiển thị trên Front-End (React Vite), chỉ rõ các trường dữ liệu đang bị thiếu và giải pháp khắc phục.

---

## 🧭 MỤC LỤC TỔNG QUAN

1. [APP 1: `courses` (Khóa học, Chương, Bài học, Danh mục, Tài liệu)](#1-app-courses-quản-lý-khóa-học-chương-bài-học-danh-mục-tài-liệu)
2. [APP 2: `accounts` (Người dùng, Phân quyền, Hồ sơ cá nhân)](#2-app-accounts-quản-lý-tài-khoản-phân-quyền-và-hồ-sơ)
3. [APP 3: `learning` (Ghi danh, Tiến độ học tập, Chứng chỉ hoàn thành)](#3-app-learning-ghi-danh-tiến-độ-học-tập-và-chứng-chỉ)
4. [APP 4: `assessments` (Đề thi, Ngân hàng câu hỏi, Lượt thi, Báo cáo kết quả)](#4-app-assessments-đề-thi-ngân-hàng-câu-hỏi-lượt-thi-báo-cáo)
5. [APP 5: `ai` (Gia sư ảo, Phân tích sửa lỗi ngữ pháp, AI Sinh đề)](#5-app-ai-trợ-lý-ai-gia-sư-ảo-kiểm-tra-ngữ-pháp)
6. [APP 6: `recommendations` (Lộ trình thích ứng, Phân tích kỹ năng, Gợi ý khóa học)](#6-app-recommendations-lộ-trình-học-tập-cá-nhân-hóa-phân-tích-kỹ-năng)
7. [APP 7: `quiz_import` (Import đề thi hàng loạt Word/Excel/Văn bản thô)](#7-app-quiz_import-import-đề-thi-hàng-loạt)
8. [KẾ HOẠCH HÀNH ĐỘNG NÂNG CẤP FRONT-END (ACTION PLAN)](#8-kế-hoạch-hành-động-nâng-cấp-front-end)

---

## 1. APP `courses` (Quản lý Khóa học, Chương, Bài học, Danh mục, Tài liệu)

### 📌 1.1. Model `Course` & Serializers
- **File Backend**: `back-end/elearning/apps/courses/models.py` & `serializers.py`
- **Serializers liên quan**: `CourseCreateUpdateSerializer`, `CourseListSerializer`, `CourseDetailSerializer`
- **Components Front-End đối chiếu**: 
  - `TeacherDashboardView.jsx` (Form Tạo khóa học & Card danh sách khóa học)
  - `TeacherCourseCurriculumModal.jsx` (Form Chỉnh sửa khóa học & Quản lý giáo trình)
  - `CourseCatalogView.jsx` & `CourseDetailModal.jsx` (Giao diện xem khóa học của học viên)
  - `AdminDashboardView.jsx` (Quản lý khóa học của Quản trị viên)

| Trường Backend (Model / Serializer) | Kiểu dữ liệu | Có trên FE? | Tình trạng & Phân tích chi tiết |
| :--- | :--- | :---: | :--- |
| `id` | UUID (BaseModel) | ✅ Có | Dùng làm khóa chính định danh khóa học. |
| `title` | CharField(255) | ✅ Có | Tiêu đề khóa học, có trên tất cả các form và view. |
| `slug` | SlugField(280) | ⚠️ Thiếu hiển thị | Tự động sinh từ `title`. FE dùng làm param URL nhưng chưa hiển thị ra thông tin khóa học. |
| `description` | TextField | ✅ Có | Đã có trong form tạo, sửa và modal chi tiết. |
| `level` | Choices (`A1` - `C2`) | ✅ Có | Đã có dropdown chọn trình độ CEFR. |
| `thumbnail_url` | TextField | ✅ Có | Hỗ trợ nhập URL ảnh và tải ảnh từ máy (Base64). |
| `price` | DecimalField | ✅ Có | Đã có ô nhập học phí VND. |
| `is_free` | BooleanField | ✅ Có | Checkbox miễn phí (nếu tích chọn thì price = 0). |
| **`status`** (`DRAFT`, `PUBLISHED`, `ARCHIVED`) | ChoiceField | ❌ **THIẾU TRÊN FORM TẠO/SỬA** | • **Form Tạo Khóa học** (`TeacherDashboardView.jsx`): Bị hardcode cứng `status: 'PUBLISHED'`. Giáo viên không thể lưu khóa học dưới dạng **Bản nháp (DRAFT)** để soạn bài trước khi công khai.<br>• **Modal Sửa Khóa học** (`TeacherCourseCurriculumModal.jsx`): Hoàn toàn thiếu ô chọn `status`.<br>• **Card Khóa học (UI List)**: Chưa có nhãn Badge hiển thị trạng thái xuất bản (`status_display`). |
| **`category_id` / `category`** | ForeignKey | ⚠️ **THIẾU TRONG FORM SỬA** | • Form Tạo Khóa học đã có chọn danh mục.<br>• Tuy nhiên **Form Sửa Khóa học** (`TeacherCourseCurriculumModal.jsx`) lại **thiếu ô đổi Danh mục** (`category_id`). |
| `teacher` | ForeignKey -> CustomUser | ✅ Có | Hiển thị tên và avatar giáo viên phụ trách. |
| `total_chapters` | Integer (property) | ✅ Có | Hiển thị số lượng chương học. |
| `total_lessons` | Integer (property) | ✅ Có | Hiển thị số lượng bài học. |
| **`created_at` / `updated_at`** | DateTimeField | ❌ **THIẾU HIỂN THỊ** | Chưa hiển thị ngày xuất bản và ngày cập nhật gần nhất trên Card hay Modal Chi tiết. |

---

### 📌 1.2. Model `Chapter` & Serializers
- **Serializers**: `ChapterCreateUpdateSerializer`, `ChapterSimpleSerializer`
- **Components Front-End đối chiếu**: `TeacherCourseCurriculumModal.jsx`, `CourseDetailModal.jsx`, `MyLearningView.jsx`

| Trường Backend | Kiểu dữ liệu | Có trên FE? | Tình trạng & Phân tích chi tiết |
| :--- | :--- | :---: | :--- |
| `id` | UUID | ✅ Có | Định danh chương học. |
| `title` | CharField(255) | ✅ Có | Tiêu đề chương học. |
| `description` | TextField | ✅ Có | Mô tả ngắn mục tiêu chương học. |
| **`order_index`** | PositiveIntegerField | ❌ **THIẾU TRONG FORM** | • Form Thêm/Sửa chương chỉ có `title` và `description`.<br>• **Thiếu trường `order_index`**: Giáo viên không thể chủ động điều chỉnh số thứ tự chương (Chương 1, 2, 3...) hoặc sắp xếp lại vị trí. |
| **`total_lessons`** | Integer (MethodField) | ⚠️ **Thiếu hiển thị** | Chưa hiển thị tổng số bài học ngay trên thanh Header của từng chương trong Modal quản lý. |

---

### 📌 1.3. Model `Lesson` & Serializers
- **Serializers**: `LessonCreateUpdateSerializer`, `LessonDetailResponseSerializer`, `LessonSimpleSerializer`
- **Components Front-End đối chiếu**: `TeacherCourseCurriculumModal.jsx`, `MyLearningView.jsx`, `CourseDetailModal.jsx`

| Trường Backend | Kiểu dữ liệu | Có trên FE? | Tình trạng & Phân tích chi tiết |
| :--- | :--- | :---: | :--- |
| `id` | UUID | ✅ Có | Định danh bài học. |
| `title` | CharField(255) | ✅ Có | Tiêu đề bài học. |
| **`content`** | TextField (Markdown) | ⚠️ **CHƯA HỖ TRỢ ĐỦ MARKDOWN** | • Form thêm/sửa bài học chỉ có 1 ô `textarea` ngắn (2 dòng).<br>• Chưa có trình soạn thảo Markdown Preview đầy đủ để giáo viên soạn nội dung bài giảng lý thuyết chuẩn mực (tiêu đề, định dạng, ví dụ ngữ pháp). |
| `video_url` | TextField | ✅ Có | Hỗ trợ YouTube Embed URL và Video tải trực tiếp từ máy tính. |
| `duration_minutes` | PositiveIntegerField | ✅ Có | Ô nhập thời lượng bài giảng (phút). |
| **`order_index`** | PositiveIntegerField | ❌ **THIẾU TRONG FORM** | • Thiếu ô nhập thứ tự bài học trong chương (`order_index`). |
| `is_preview` | BooleanField | ✅ Có | Checkbox cho phép học viên học thử miễn phí. |
| **`materials_count`** | Integer (MethodField) | ⚠️ **Thiếu hiển thị** | Chưa hiển thị số lượng file đính kèm trên danh sách bài học thu nhỏ. |

---

### 📌 1.4. Model `Category` & `Material`
| Model & Trường Backend | Kiểu dữ liệu | Có trên FE? | Tình trạng & Phân tích chi tiết |
| :--- | :--- | :---: | :--- |
| `Category.name` | CharField | ✅ Có | Đã hiển thị trong dropdown chọn và bộ lọc. |
| **`Category.icon_url`** | URLField | ❌ **Chưa hiển thị** | Đang dùng icon FontAwesome tĩnh, chưa dùng icon động từ model. |
| **`Category.description`** | TextField | ❌ **Chưa hiển thị** | Chưa hiển thị mô tả danh mục trên giao diện. |
| **`Category.is_active`** | BooleanField | ❌ **Chưa có trang CRUD** | Admin Dashboard chưa có bảng Quản lý Danh mục (CRUD Category). |
| `Material.title` | CharField | ✅ Có | Tên tài liệu đính kèm. |
| `Material.file_url` | URLField | ✅ Có | Hỗ trợ link URL và file tải lên từ máy tính. |
| **`Material.file_type_display`** | CharField | ⚠️ **Thiếu badge icon** | Chưa hiển thị icon tương ứng (PDF / Word / Audio) trên giao diện học viên. |
| **`Material.file_size_bytes`** | BigIntegerField | ⚠️ **Thiếu định dạng size** | Chưa format dung lượng file (KB/MB) kèm nút Download ở màn hình học viên. |

---

## 2. APP `accounts` (Quản lý Tài khoản, Phân quyền và Hồ sơ)

### 📌 Model `CustomUser` & Serializers
- **File Backend**: `back-end/elearning/apps/accounts/models.py` & `serializers.py`
- **Serializers**: `UserResponseSerializer`, `RegisterSerializer`, `UpdateProfileSerializer`, `AdminUserUpdateSerializer`
- **Components Front-End đối chiếu**: 
  - `AuthModal.jsx` (Đăng ký / Đăng nhập)
  - `UserProfileModal.jsx` (Hồ sơ cá nhân & Đổi mật khẩu)
  - `AdminDashboardView.jsx` (Quản lý người dùng của Admin)
  - `Header.jsx` (Hiển thị avatar, tên, vai trò)

| Trường Backend | Kiểu dữ liệu | Có trên FE? | Tình trạng & Phân tích chi tiết |
| :--- | :--- | :---: | :--- |
| `email` | EmailField | ✅ Có | Đăng ký, đăng nhập và hiển thị thông tin. |
| `full_name` | CharField(255) | ✅ Có | Họ tên người dùng. |
| `role` (`STUDENT`, `TEACHER`, `ADMIN`) | ChoiceField | ✅ Có | Phân quyền vai trò người dùng trong hệ thống. |
| `level` (`A1` - `C2`) | ChoiceField | ✅ Có | Trình độ CEFR ban đầu và hiện tại. |
| `avatar_url` | TextField | ✅ Có | Hỗ trợ URL ảnh và tải ảnh từ máy tính. |
| `phone_number` | CharField(20) | ✅ Có (ở Profile) / ❌ **Thiếu ở Admin** | Đã có trong Form Đăng ký và Hồ sơ cá nhân. Nhưng **Bảng Quản trị Admin** chưa hiển thị trường này. |
| `bio` | TextField | ✅ Có (ở Profile) / ❌ **Thiếu ở Admin** | Đã có trong Hồ sơ cá nhân, Admin Dashboard chưa hiển thị. |
| `is_active` | BooleanField | ✅ Có | Nút Khóa / Mở khóa tài khoản trong Admin Dashboard. |
| `is_staff` | BooleanField | ⚠️ Backend only | Quyền truy cập trang quản trị Django. |
| **`created_at`** | DateTimeField | ❌ **Thiếu trong Admin** | Bảng Admin chưa hiển thị ngày người dùng đăng ký tài khoản. |
| **Admin Sửa User Form** | Serializer Admin | ❌ **THIẾU MODAL ADMIN EDIT** | Admin mới có đổi Role và Lock/Unlock, chưa có Modal cập nhật `full_name`, `phone_number`, `level` khi cần hỗ trợ học viên. |

---

## 3. APP `learning` (Ghi danh, Tiến độ học tập và Chứng chỉ)

### 📌 3.1. Model `Enrollment` & `LessonProgress`
- **File Backend**: `back-end/elearning/apps/learning/models.py` & `serializers.py`
- **Serializers**: `EnrollmentListSerializer`, `EnrollmentDetailSerializer`, `LessonProgressSimpleSerializer`
- **Components Front-End đối chiếu**: `MyLearningView.jsx`, `TeacherGradebookView.jsx`, `AdminDashboardView.jsx`

| Trường Backend | Kiểu dữ liệu | Có trên FE? | Tình trạng & Phân tích chi tiết |
| :--- | :--- | :---: | :--- |
| `student` & `course` | ForeignKey | ✅ Có | Xác định học viên ghi danh khóa học nào. |
| `progress_percent` | DecimalField | ✅ Có | Hiển thị thanh phần trăm hoàn thành khóa học. |
| **`status`** (`ACTIVE`, `COMPLETED`, `CANCELLED`) | ChoiceField | ⚠️ **THIẾU BADGE TRẠNG THÁI** | Chưa có nhãn Badge phân loại: *Đang học / Đã hoàn thành / Đã hủy* trên thẻ khóa học của học viên. |
| **`enrolled_at` & `completed_at`** | DateTimeField | ❌ **THIẾU HIỂN THỊ** | Chưa hiển thị ngày bắt đầu ghi danh và ngày hoàn thành khóa học trên màn hình học tập và Sổ điểm giáo viên (`TeacherGradebookView.jsx`). |
| `LessonProgress.is_completed` | BooleanField | ✅ Có | Đánh dấu tích xanh hoàn thành từng bài học. |
| **`LessonProgress.last_watched_second`** | PositiveIntegerField | ⚠️ **CHƯA TỰ ĐỘNG RESUME VIDEO** | Đã gửi lưu số giây đã xem lên Backend, nhưng khi học viên mở lại video chưa tự động tua tiếp tục đến vị trí dừng trước đó. |

---

### 📌 3.2. Model `Certificate`
- **Serializers**: `CertificateDetailSerializer`, `CertificateSimpleSerializer`
- **Components Front-End đối chiếu**: `CertificateModal.jsx`, `CertificateVerifyView.jsx`

| Trường Backend | Kiểu dữ liệu | Có trên FE? | Tình trạng & Phân tích chi tiết |
| :--- | :--- | :---: | :--- |
| `certificate_code` | CharField (Unique) | ✅ Có | Mã chứng chỉ duy nhất (Ví dụ: `CERT-2026-B1-ABC123`). |
| `issued_at` | DateTimeField | ✅ Có | Ngày cấp chứng chỉ tốt nghiệp. |
| `student_name`, `course_title`, `course_level`, `teacher_name` | Nested Read-only | ✅ Có | Hiển thị đầy đủ trên phôi chứng chỉ điện tử. |
| **`pdf_url`** | URLField | ⚠️ **CHƯA CÓ NÚT TẢI PDF TRỰC TIẾP** | Modal Chứng chỉ hiện tại dùng lệnh in trình duyệt (`window.print`), chưa có nút tải file PDF trực tiếp từ `pdf_url` của server. |

---

## 4. APP `assessments` (Đề thi, Ngân hàng câu hỏi, Lượt thi, Báo cáo)

### 📌 4.1. Model `Quiz` & Serializers
- **File Backend**: `back-end/elearning/apps/assessments/models.py` & `serializers.py`
- **Serializers**: `QuizCreateUpdateSerializer`, `QuizListSerializer`, `QuizDetailTeacherSerializer`, `QuizDetailStudentSerializer`
- **Components Front-End đối chiếu**: `QuizExamView.jsx`, `TeacherAIQuizModal.jsx`, `StudentProgressQuizModal.jsx`

| Trường Backend | Kiểu dữ liệu | Có trên FE? | Tình trạng & Phân tích chi tiết |
| :--- | :--- | :---: | :--- |
| `title` & `description` | CharField / TextField | ✅ Có | Tiêu đề và mô tả đề thi. |
| **`quiz_type`** (`PLACEMENT`, `PRACTICE`, `FINAL`) | ChoiceField | ⚠️ **CHƯA PHÂN LOẠI TRÊN UI** | Danh sách đề thi chưa có tab lọc theo: *Đánh giá đầu vào (`PLACEMENT`) / Luyện tập (`PRACTICE`) / Đề thi cuối khóa (`FINAL`)*. |
| `level` (`A1` - `C2`, `ALL`) | ChoiceField | ✅ Có | Trình độ mục tiêu của đề thi. |
| `time_limit_minutes` | PositiveIntegerField | ✅ Có | Thời gian làm bài và đồng hồ đếm ngược. |
| `passing_score` | DecimalField | ✅ Có | Tỷ lệ % điểm đạt chuẩn (VD: 70%). |
| **`lesson_id`** | ForeignKey | ❌ **THIẾU TRONG FORM TẠO ĐỀ** | Form tạo đề thi AI / thủ công mới chỉ cho chọn `course_id`, **chưa cho gắn vào bài học cụ thể (`lesson_id`)** để tự động xuất hiện sau bài học. |
| **`is_published`** | BooleanField | ❌ **THIẾU NÚT XUẤT BẢN** | Giáo viên chưa có toggle chuyển đổi giữa Đề thi nháp và Đề thi công khai. |
| `total_questions` & `total_points` | Properties | ✅ Có | Hiển thị tổng số câu và thang điểm tối đa. |

---

### 📌 4.2. Model `Question` & `AnswerOption`
| Trường Backend | Kiểu dữ liệu | Có trên FE? | Tình trạng & Phân tích chi tiết |
| :--- | :--- | :---: | :--- |
| `content` | TextField | ✅ Có | Nội dung câu hỏi. |
| **`question_type`** (`SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, `FILL_IN_THE_BLANK`) | ChoiceField | ⚠️ **CHƯA HỖ TRỢ ĐỦ DẠNG CÂU HỎI** | UI làm bài hiện tại mới chỉ hỗ trợ dạng trắc nghiệm 1 đáp án (`SINGLE_CHOICE`). Chưa có giao diện làm bài cho trắc nghiệm chọn nhiều (`MULTIPLE_CHOICE` dạng checkbox), Đúng/Sai (`TRUE_FALSE`), và điền từ (`FILL_IN_THE_BLANK`). |
| `skill` (`LISTENING`, `READING`, `WRITING`, `SPEAKING`, `GRAMMAR`, `VOCABULARY`) | ChoiceField | ✅ Có | Kỹ năng đánh giá của câu hỏi. |
| **`audio_url` & `image_url`** | URLField | ❌ **THIẾU TRÊN MÀN HÌNH LÀM BÀI** | Màn hình làm bài thi chưa có Audio Player `<audio controls>` (cho bài thi Listening) và thẻ `<img>` (cho câu hỏi có hình minh họa). |
| `explanation` | TextField | ✅ Có | Lời giải thích chi tiết, hiển thị sau khi nộp bài. |
| **`points`** | DecimalField | ⚠️ **Thiếu hiển thị trọng số** | Chưa hiển thị điểm số riêng của từng câu hỏi (VD: "Câu 1 (2.0 điểm)"). |
| `AnswerOption.content` & `is_correct` | TextField / Boolean | ✅ Có | Đáp án trắc nghiệm (ẩn `is_correct` với học viên, hiện với giáo viên). |

---

### 📌 4.3. Model `QuizAttempt` & `StudentAnswer`
- **Serializers**: `QuizAttemptResultSerializer`, `StudentAnswerDetailSerializer`, `SkillPerformanceSerializer`
- **Components Front-End đối chiếu**: `QuizExamView.jsx` (Màn hình xem kết quả thi)

| Trường Backend | Kiểu dữ liệu | Có trên FE? | Tình trạng & Phân tích chi tiết |
| :--- | :--- | :---: | :--- |
| `score`, `max_score`, `percentage`, `is_passed` | Decimal / Boolean | ✅ Có | Điểm số, tỷ lệ % đúng và kết quả Đạt / Chưa đạt. |
| **`skill_breakdown`** | List of Objects (MethodField) | ❌ **THIẾU BẢNG PHÂN TÍCH KỸ NĂNG** | Backend đã tính toán sẵn tỷ lệ % theo từng kỹ năng: *Grammar: 85%, Reading: 60%, Listening: 40%...*. Màn hình kết quả thi **chưa hiển thị biểu đồ/thanh tiến trình phân tích kỹ năng** này cho học viên. |
| **`time_spent_seconds`** | Integer (MethodField) | ❌ **THIẾU HIỂN THỊ THỜI GIAN LÀM** | Chưa hiển thị tổng thời gian thực tế học viên đã làm bài thi (phút:giây). |
| **`status` (`ABANDONED`)** | ChoiceField | ⚠️ **Thiếu nút hủy bài thi** | Chưa có nút xác nhận hủy bỏ/bỏ dở bài thi giữa chừng. |

---

## 5. APP `ai` (Trợ lý AI, Gia sư ảo, Kiểm tra ngữ pháp)

### 📌 Model `ChatSession` & `ChatMessage`
- **File Backend**: `back-end/elearning/apps/ai/models.py` & `serializers.py`
- **Serializers**: `ChatSessionDetailSerializer`, `ChatMessageSerializer`, `GrammarCheckResponseSerializer`
- **Components Front-End đối chiếu**: `FloatingAITutor.jsx`, `AICommunicationView.jsx`, `AdminDashboardView.jsx`

| Trường Backend | Kiểu dữ liệu | Có trên FE? | Tình trạng & Phân tích chi tiết |
| :--- | :--- | :---: | :--- |
| `session_type` (`GENERAL`, `LESSON_TUTOR`, `GRAMMAR_CHECK`, `ROLEPLAY`) | ChoiceField | ✅ Có | Các chế độ trò chuyện với Trợ lý AI. |
| `target_level` | ChoiceField | ✅ Có | Trình độ mục tiêu của phiên chat. |
| **`lesson_id` (Gắn phiên chat với bài học)** | ForeignKey | ❌ **THIẾU NÚT TỰ ĐỘNG GẮN BÀI HỌC** | Chưa có nút *"Hỏi AI về bài học này"* ở giao diện học tập để tự động tạo phiên chat kèm `course_id` và `lesson_id`. |
| `ChatMessage.content` | TextField | ✅ Có | Nội dung tin nhắn trao đổi. |
| `ChatMessage.grammar_corrections` | JSONField | ✅ Có | Bảng phân tích chi tiết lỗi sai và sửa đổi ngữ pháp từ AI. |
| **`ChatMessage.audio_url`** | URLField | ❌ **THIẾU NÚT PHÁT ÂM THANH** | Chưa có nút icon loa (Text-to-Speech / Audio player) để học viên bấm nghe AI đọc mẫu phát âm tiếng Anh. |
| **`model_used` & `token_count`** | CharField / Integer | ❌ **THIẾU TRONG ADMIN DASHBOARD** | Tab "Hạ Tầng & AI Quota" ở Admin Dashboard chưa hiển thị bảng thống kê chi tiết lượng token và mô hình AI (`gemini-1.5-flash`) đã tiêu thụ. |

---

## 6. APP `recommendations` (Lộ trình học tập cá nhân hóa, Phân tích kỹ năng)

### 📌 6.1. Model `LearningPath` & `LearningPathStep`
- **File Backend**: `back-end/elearning/apps/recommendations/models.py` & `serializers.py`
- **Serializers**: `LearningPathDetailSerializer`, `LearningPathStepSerializer`
- **Components Front-End đối chiếu**: `AdaptivePathView.jsx`

| Trường Backend | Kiểu dữ liệu | Có trên FE? | Tình trạng & Phân tích chi tiết |
| :--- | :--- | :---: | :--- |
| `title`, `target_level`, `progress_percentage` | CharField / Float | ✅ Có | Tiêu đề lộ trình, trình độ mục tiêu và % tiến độ. |
| **`goal_description` & `current_estimated_level`** | TextField / ChoiceField | ❌ **THIẾU HIỂN THỊ TRÊN HEADER** | Chưa hiển thị mục tiêu của học viên và trình độ hiện tại ước tính ở đầu lộ trình. |
| **`LearningPathStep.step_type`** (`COURSE`, `LESSON`, `QUIZ`, `AI_PRACTICE`) | ChoiceField | ❌ **THIẾU NÚT HÀNH ĐỘNG THEO CHẶNG** | Chưa render nút hành động tương ứng cho từng loại chặng: Chặng `LESSON` -> *"Học bài ngay"*; Chặng `QUIZ` -> *"Làm bài kiểm tra"*; Chặng `AI_PRACTICE` -> *"Luyện cùng AI"*. |
| **`target_skill_display` & `estimated_minutes`** | CharField / Integer | ❌ **THIẾU THÔNG SỐ CHẶNG** | Chưa hiển thị kỹ năng trọng tâm và thời gian ước tính (phút) của từng bước học. |

---

### 📌 6.2. Model `SkillGapAnalysis` & `CourseRecommendation`
- **Serializers**: `SkillGapAnalysisSerializer`, `CourseRecommendationSerializer`
- **Components Front-End đối chiếu**: `SkillGapsView.jsx`, `RecommendedCoursesSection.jsx`

| Trường Backend | Kiểu dữ liệu | Có trên FE? | Tình trạng & Phân tích chi tiết |
| :--- | :--- | :---: | :--- |
| `proficiency_score` (0 - 100) | FloatField | ✅ Có | Thanh đo phần trăm độ thành thạo kỹ năng. |
| **`weak_topics`** | JSONField (Array) | ❌ **THIẾU DANH SÁCH CHỦ ĐỀ YẾU** | Giao diện mới có thanh %, **chưa hiển thị danh sách các chủ đề còn yếu** (VD: *'Past Simple vs Present Perfect', 'Prepositions of Place'*). |
| **`recommended_action`** | TextField | ❌ **THIẾU LỜI KHUYÊN TỪ AI** | Chưa hiển thị khung đề xuất hành động cụ thể mà AI khuyến nghị học viên thực hiện. |
| `relevance_score` & `reason` | Float / TextField | ✅ Có | Điểm tương thích % và lý do AI đề xuất khóa học. |
| **`is_dismissed`** | BooleanField | ❌ **THIẾU NÚT ẨN GỢI Ý** | Chưa có nút *"Ẩn / Không quan tâm"* để loại bỏ gợi ý khóa học không muốn học. |

---

## 7. APP `quiz_import` (Import đề thi hàng loạt)

### 📌 Model `QuizImportBatch` & Serializers
- **File Backend**: `back-end/elearning/apps/quiz_import/models.py` & `serializers.py`
- **Serializers**: `CreateQuizImportBatchSerializer`, `QuizImportBatchDetailSerializer`, `ConfirmImportRequestSerializer`
- **Components Front-End đối chiếu**: `QuizImportModal.jsx`, `AdminDashboardView.jsx` (Tab Import)

| Trường Backend | Kiểu dữ liệu | Có trên FE? | Tình trạng & Phân tích chi tiết |
| :--- | :--- | :---: | :--- |
| `title`, `source_type`, `file`, `raw_text`, `use_ai` | Char / Choice / File | ✅ Có | Đầy đủ form tải tệp (.docx, .xlsx, .csv), dán văn bản và tùy chọn Gemini AI. |
| `parsed_data` | JSONField | ✅ Có | Bảng xem trước (Preview) danh sách câu hỏi và đáp án trước khi lưu. |
| **`error_log`** | TextField | ❌ **THIẾU HIỂN THỊ CHI TIẾT LỖI** | Khi import bị lỗi (`status = 'FAILED'`), chưa có khung xem chi tiết `error_log` để giáo viên biết sai ở dòng nào. |
| **`total_parsed` vs `total_imported`** | PositiveIntegerField | ⚠️ **Thiếu hiển thị tỷ lệ** | Chưa hiển thị rõ tỷ lệ: *Đã trích xuất thành công X câu / Đã lưu Y câu vào đề thi*. |

---

## 8. KẾ HOẠCH HÀNH ĐỘNG NÂNG CẤP FRONT-END (ACTION PLAN)

Dưới đây là danh sách các hạng mục cần bổ sung vào Front-End sắp xếp theo mức độ quan trọng:

### 🔴 MỨC ĐỘ 1: ƯU TIÊN CAO (Ảnh hưởng trực tiếp đến Nghiệp vụ & Đánh giá Đồ án)
1. **Khóa học (`Course` & `Chapter` & `Lesson`):**
   - Thêm trường chọn **`status` (DRAFT / PUBLISHED / ARCHIVED)** trong Form Tạo Khóa học (`TeacherDashboardView.jsx`) và Form Sửa Khóa học (`TeacherCourseCurriculumModal.jsx`).
   - Thêm trường chọn đổi **`category_id`** trong Form Sửa Khóa học.
   - Thêm trường nhập số thứ tự **`order_index`** trong Form Thêm/Sửa Chương học và Bài học.
   - Hiển thị Badge trạng thái xuất bản (`status_display`) trên các Card khóa học.
2. **Đề thi & Câu hỏi (`Assessments`):**
   - Bổ sung khung phát âm thanh `<audio controls>` cho câu hỏi nghe (`audio_url`) và thẻ hiển thị ảnh minh họa (`image_url`) trong `QuizExamView.jsx`.
   - Bổ sung Bảng phân tích chi tiết kỹ năng **`skill_breakdown`** ở màn hình kết quả sau khi nộp bài thi.
   - Thêm trường chọn **`lesson_id`** trong Form tạo đề thi.
3. **Lộ trình học tập & Phân tích kỹ năng (`Recommendations`):**
   - Hiển thị danh sách các chủ đề kiến thức còn yếu **`weak_topics`** và lời khuyên **`recommended_action`** từ AI trong `SkillGapsView.jsx`.
   - Bổ sung nút bấm điều hướng hành động trực tiếp cho từng chặng **`step_type`** trong `AdaptivePathView.jsx` (*Vào học bài / Làm đề thi / Luyện chat AI*).

### 🟡 MỨC ĐỘ 2: ƯU TIÊN TRUNG BÌNH (Tối ưu Trải nghiệm người dùng - UX)
4. **Tiến độ học tập (`Learning`):**
   - Tự động tua tiếp tục video bài giảng theo số giây đã xem trước đó (`last_watched_second`).
   - Hiển thị ngày bắt đầu ghi danh `enrolled_at` và ngày hoàn thành `completed_at` trong Sổ điểm giáo viên (`TeacherGradebookView.jsx`).
   - Thêm nút tải file PDF trực tiếp từ `pdf_url` trong `CertificateModal.jsx`.
5. **Trợ lý AI (`AI`):**
   - Thêm nút *"Hỏi AI về bài học này"* ở thanh công cụ bài học (`MyLearningView.jsx`) để tự động khởi tạo phiên chat gắn kèm `course_id` và `lesson_id`.
   - Bổ sung icon loa phát âm thanh đọc mẫu (`audio_url`).

### 🟢 MỨC ĐỘ 3: ƯU TIÊN HOÀN THIỆN QUẢN TRỊ (Admin & Import)
6. **Quản trị hệ thống (`AdminDashboardView.jsx`):**
   - Hiển thị số điện thoại `phone_number`, trình độ `level`, ngày đăng ký `created_at` trong bảng User.
   - Bổ sung trang Quản lý Danh mục Khóa học (CRUD `Category`).
   - Hiển thị chi tiết `error_log` khi phiên import đề thi bị lỗi trong `QuizImportModal.jsx`.

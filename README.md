# ĐỒ ÁN TỐT NGHIỆP: XÂY DỰNG NỀN TẢNG E-LEARNING TIẾNG ANH TÍCH HỢP TRÍ TUỆ NHÂN TẠO HỖ TRỢ HỌC TẬP VÀ CÁ NHÂN HÓA LỘ TRÌNH

> **English Title:** Development of an AI-Integrated English E-learning Platform for Intelligent Learning and Personalized Learning Paths  
> **Sinh viên thực hiện:** Lê Văn Thái (MSSV: 2251220232 - Lớp: 22CT5)  
> **Kiến trúc hệ thống:** Modular Monolith (1 Backend Django REST Framework + 1 Database PostgreSQL + 1 Frontend React TypeScript)

---

## 📖 1. Giới thiệu tổng quan

Hệ thống **E-learning tiếng Anh tích hợp AI** là nền tảng học tập trực tuyến thông minh giúp người học không chỉ tiếp cận các khóa học chất lượng mà còn có một trợ lý gia sư ảo (AI Tutor Agent) đồng hành 24/7 và hệ thống đề xuất lộ trình học tập cá nhân hóa (Personalized Learning Path) dựa trên dữ liệu phân tích học tập (Learning Analytics).

### 🎯 Mục tiêu cốt lõi
1. **Quản lý học tập toàn diện:** Quản lý đa vai trò (*Student*, *Teacher*, *Admin*), tổ chức khóa học theo cấu trúc chuẩn `Course` $\rightarrow$ `Chapter` $\rightarrow$ `Lesson` $\rightarrow$ `Material`.
2. **Đánh giá & Kiểm tra:** Hệ thống câu hỏi trắc nghiệm, quản lý lượt làm bài (`QuizAttempt`), chấm điểm tự động và phân tích câu sai.
3. **AI English Tutor Agent:** Trợ lý ảo AI có khả năng **Tool Calling** để truy vấn thông tin học tập của học viên, giải thích ngữ pháp, sửa lỗi và hội thoại thông minh.
4. **AI Quiz Generator & On-Demand Practice:** 
   - Hỗ trợ **Giáo viên** sinh ngân hàng câu hỏi tự động theo chủ đề, độ khó với cấu trúc JSON chuẩn.
   - Hỗ trợ **Học viên** tự động tạo đề ôn tập trắc nghiệm thích ứng (Adaptive Practice Quiz) theo Chapter và nội dung các bài học đã hoàn thành.
5. **Cá nhân hóa lộ trình (Learning Analytics & Recommendation):** Đánh giá năng lực theo từng kỹ năng/chủ đề dựa trên thuật toán tính điểm kỹ năng (Skill Score) và đề xuất bài học tiếp theo phù hợp với điểm yếu của học viên.
6. **Quiz Import & Interactive Form Builder:** Giáo viên tải lên file Excel/CSV, hệ thống bóc tách dữ liệu và tự động điền vào Form Preview trên giao diện để giáo viên rà soát, sửa trực tiếp trên ô nhập liệu trước khi ấn tạo bài trắc nghiệm.

---

## 🏗️ 2. Kiến trúc hệ thống (System Architecture)

Dự án áp dụng mô hình **Modular Monolith** nhằm tối ưu hóa hiệu năng, giảm thiểu độ phức tạp triển khai của Microservices nhưng vẫn đảm bảo tính độc lập, tường minh giữa các module nghiệp vụ.

```text
               +--------------------------------------------------+
               |             ReactJS + TypeScript Client          |
               |                (Bootstrap / Custom UI)           |
               +--------------------------------------------------+
                                        │
                                        ▼ HTTPS / REST API + JWT
               +--------------------------------------------------+
               |              Django REST Framework               |
               |              (Modular Monolith Core)             |
               |                                                  |
               |  ├── apps/accounts         ├── apps/ai           |
               |  ├── apps/courses          ├── apps/recommendations
               |  ├── apps/learning         └── apps/quiz_import  |
               |  ├── apps/assessments                            |
               |  └── common (permissions, pagination, exceptions)|
               +────────────────────────┬─────────────────────────+
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
        +──────────────────────+                +──────────────────────+
        | PostgreSQL Database  |                |     LLM API Cloud    |
        |  (18 Relational DBs) |                | (Gemini / OpenAI API)|
        +----------------------+                +----------------------+
```

---

## 🛠️ 3. Ngăn xếp công nghệ (Technology Stack)

| Thành phần | Công nghệ / Thư viện chính | Ghi chú |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Bootstrap 5, Vite, Axios | Tách cấu trúc theo Feature-based |
| **Backend** | Python 3.12+, Django 5.x, Django REST Framework | Service-Layer Architecture |
| **Database** | PostgreSQL 16+ | ORM chuẩn hóa 18 bảng thực thể |
| **Authentication** | SimpleJWT (Access Token & Refresh Token) | Phân quyền RBAC (Role-based) |
| **AI Integration** | Google Gemini API / OpenAI API | Tích hợp backend-side (bảo mật key) |
| **File Processing** | `openpyxl`, `pandas` | Bóc tách & thẩm định dữ liệu Excel/CSV |
| **API Documentation**| `drf-spectacular` (Swagger UI & Redoc) | OpenAPI 3.0 tự động |
| **Testing** | `pytest`, `pytest-django` | Unit Test & Integration Test |

---

## 🧩 4. Các module chức năng chính

### 1. `apps/accounts`
- Quản lý tài khoản `CustomUser` (sử dụng Email làm định danh, Full name, Avatar, Level A1-C2).
- Xác thực phân quyền: Student, Teacher, Admin.
- API Đăng ký, Đăng nhập (JWT), Refresh Token, Đổi mật khẩu, Cập nhật Profile.

### 2. `apps/courses`
- Quản lý Danh mục (`Category`), Khóa học (`Course`), Chương học (`Chapter`), Bài học (`Lesson`), Tài liệu đính kèm (`Material`).
- Quản lý trạng thái khóa học (`DRAFT`, `PUBLISHED`, `ARCHIVED`).

### 3. `apps/learning`
- Đăng ký khóa học (`Enrollment`).
- Ghi nhận và theo dõi tiến độ bài học (`LessonProgress`).

### 4. `apps/assessments`
- Quản lý Đề kiểm tra (`Quiz`), Câu hỏi (`Question`), Lựa chọn (`Option`).
- Hỗ trợ đề thi theo Khóa học, Chương học, Bài học và Đề ôn tập nhanh AI.
- Lịch sử làm bài (`QuizAttempt`), Chi tiết câu trả lời (`AttemptAnswer`), Chấm điểm trắc nghiệm tự động.

### 5. `apps/ai`
- **AI Tutor Agent:** Trợ lý ảo hỗ trợ giải thích kiến thức, sửa ngữ pháp, đồng thời sử dụng các tool nội bộ (`get_user_progress`, `get_skill_score`, `get_quiz_result`) để phản hồi sát thực tế.
- **AI Quiz Generator & On-demand Practice:** 
  - Sinh câu hỏi trắc nghiệm tự động từ Topic / Context cho giáo viên.
  - Sinh đề ôn tập nhanh cho học viên dựa theo Chapter và các bài học đã hoàn thành trong CSDL.

### 6. `apps/recommendations`
- **Learning Analytics:** Tổng hợp dữ liệu kết quả quiz, bài học đã hoàn thành.
- **Skill Score Engine:** Tính điểm kỹ năng:
  $$\text{SkillScore} = 0.6 \times \text{QuizScore} + 0.2 \times \text{CompletionRate} + 0.2 \times \text{RecentPerformance}$$
- **Recommendation Service:** Nhận diện chủ đề yếu (Weak Topics) và đề xuất bài học tiếp theo kèm câu giải thích AI.

### 7. `apps/quiz_import`
- Xử lý tải lên file Excel (`.xlsx`) hoặc `.csv`.
- Bóc tách dữ liệu bảng, kiểm tra tính hợp lệ (Validation) từng dòng, thông báo lỗi cụ thể.
- **Auto-fill Form & Interactive Preview:** Tự động đổ dữ liệu câu hỏi vào các ô input trên Form React UI để giáo viên rà soát, chỉnh sửa trực tiếp trước khi công bố (Publish).

---

## 📂 5. Cấu trúc thư mục dự án

```text
DATN_2251220232_LEVANTHAI_22CT5/
├── back-end/
│   ├── .venv/
│   └── elearning/
│       ├── config/             # Django root settings & urls
│       ├── apps/               # Modular Monolith Apps
│       │   ├── accounts/       # Authentication & User
│       │   ├── courses/        # Course & Lesson Management
│       │   ├── learning/       # Enrollment & Progress
│       │   ├── assessments/    # Quiz & Attempt Engine
│       │   ├── ai/             # AI Tutor Agent & Quiz Generator
│       │   ├── recommendations/# Analytics & Personalized Learning
│       │   └── quiz_import/    # Excel/CSV Parser & Builder
│       ├── common/             # Base models, permissions, exceptions
│       ├── manage.py
│       ├── requirements.txt
│       └── .env.example
├── front-end/
│   ├── src/
│   │   ├── components/         # Common UI components
│   │   ├── layouts/            # Main, Auth, Dashboard layouts
│   │   ├── pages/              # App Pages
│   │   ├── features/           # Feature-based logic & views
│   │   │   ├── auth/
│   │   │   ├── courses/
│   │   │   ├── learning/
│   │   │   ├── quizzes/
│   │   │   ├── ai-tutor/
│   │   │   ├── recommendations/
│   │   │   └── quiz-import/
│   │   ├── services/           # Axios API clients
│   │   ├── hooks/              # Custom React hooks
│   │   ├── types/              # TypeScript interfaces
│   │   └── routes/             # React Router config
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
├── Lo_trinh_do_an_Elearning_React_Django_AI_1_nguoi_revised.docx
└── README.md
```

---

## 🚀 6. Lộ trình phát triển 12 giai đoạn

- [x] **Giai đoạn 1:** Phân tích yêu cầu & Chuẩn hóa tài liệu kiến trúc (Docs & Specs).
- [ ] **Giai đoạn 2:** Thiết kế cơ sở dữ liệu & các sơ đồ UML (Use Case, ERD, Class, Sequence).
- [ ] **Giai đoạn 3:** Khởi tạo Django REST Framework Core, JWT Auth & PostgreSQL.
- [ ] **Giai đoạn 4:** Xây dựng Module Courses & Learning Progress.
- [ ] **Giai đoạn 5:** Xây dựng Module Assessments & Quiz Engine.
- [ ] **Giai đoạn 6:** Tích hợp Frontend React với Core API.
- [ ] **Giai đoạn 7:** Tích hợp AI English Tutor Agent với Tool Calling.
- [ ] **Giai đoạn 8:** Tích hợp AI Quiz Generator cho giáo viên.
- [ ] **Giai đoạn 9:** Xây dựng Learning Analytics & Recommendation Engine.
- [ ] **Giai đoạn 10:** Xây dựng XLSX/CSV Parser & Quiz Import.
- [ ] **Giai đoạn 11:** Kiểm thử toàn diện (Unit Test, Integration Test) & Docker hóa.
- [ ] **Giai đoạn 12:** Hoàn thiện báo cáo, slide thuyết trình và chuẩn bị bảo vệ tốt nghiệp.

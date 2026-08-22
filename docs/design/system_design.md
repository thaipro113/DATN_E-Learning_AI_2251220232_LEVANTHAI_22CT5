# TÀI LIỆU THIẾT KẾ KIẾN TRÚC HỆ THỐNG VÀ SƠ ĐỒ UML (SYSTEM DESIGN)

> **Đồ án tốt nghiệp:** Xây dựng nền tảng E-learning tiếng Anh tích hợp trí tuệ nhân tạo hỗ trợ học tập và cá nhân hóa lộ trình  
> **Sinh viên:** Lê Văn Thái (MSSV: 2251220232 - Lớp: 22CT5)  
> **Kiến trúc:** Modular Monolith

---

## 1. Sơ đồ ngữ cảnh (Context Diagram)

```mermaid
flowchart TD
    subgraph Users [Người dùng hệ thống]
        Student["👨‍🎓 Học viên (Student)"]
        Teacher["👩‍🏫 Giáo viên (Teacher)"]
        Admin["👨‍💼 Quản trị viên (Admin)"]
    end

    subgraph System ["HỆ THỐNG E-LEARNING TIẾNG ANH TÍCH HỢP AI"]
        CorePlatform["Nền tảng E-learning Core\n(Modular Monolith)"]
    end

    subgraph ExternalServices [Dịch vụ bên ngoài]
        LLMProvider["🤖 LLM Cloud API\n(Google Gemini / OpenAI)"]
        Storage["📂 Cloud/Local Media Storage\n(Videos, Audios, Docs)"]
    end

    Student <-->|Đăng ký, học bài, làm quiz, chat AI Tutor, nhận lộ trình| CorePlatform
    Teacher <-->|Quản lý khóa học, AI sinh quiz, upload Excel/CSV| CorePlatform
    Admin <-->|Quản trị tài khoản, danh mục, thống kê| CorePlatform

    CorePlatform <-->|Gửi prompt, nhận phản hồi JSON/Text, Tool Calling| LLMProvider
    CorePlatform <-->|Upload/truy xuất tài liệu học tập, media| Storage
```

---

## 2. Sơ đồ kiến trúc tổng thể (System Architecture)

```mermaid
graph TD
    subgraph ClientLayer ["Client Layer (Frontend)"]
        ReactApp["ReactJS + TypeScript SPA\n(Bootstrap / Custom UI / Feature-based)"]
    end

    subgraph APIGateway ["API Interface"]
        REST["RESTful API (HTTPS + JWT Auth)"]
    end

    subgraph BackendLayer ["Django REST Framework (Modular Monolith)"]
        AccountsApp["📦 apps.accounts\n(User, Role, JWT, Profile)"]
        CoursesApp["📦 apps.courses\n(Category, Course, Chapter, Lesson, Material)"]
        LearningApp["📦 apps.learning\n(Enrollment, LessonProgress)"]
        AssessmentsApp["📦 apps.assessments\n(Quiz, Question, Option, Attempt, Scoring)"]
        AIApp["📦 apps.ai\n(AI Tutor Agent, Quiz Generator, Tool Calling)"]
        RecApp["📦 apps.recommendations\n(Analytics, Skill Score, Recommendation Engine)"]
        ImportApp["📦 apps.quiz_import\n(XLSX/CSV Parser, Validator, Quiz Builder)"]
        Common["🛠️ common\n(Exceptions, Permissions, Pagination, Responses)"]
    end

    subgraph PersistenceLayer ["Data & AI Services"]
        Postgres[(PostgreSQL Database\n18 Relational Tables)]
        LLM["🤖 External LLM API\n(Gemini / OpenAI)"]
    end

    ReactApp -->|JSON Requests| REST
    REST --> AccountsApp
    REST --> CoursesApp
    REST --> LearningApp
    REST --> AssessmentsApp
    REST --> AIApp
    REST --> RecApp
    REST --> ImportApp

    AccountsApp --> Postgres
    CoursesApp --> Postgres
    LearningApp --> Postgres
    AssessmentsApp --> Postgres
    RecApp --> Postgres
    ImportApp --> Postgres
    
    AIApp --> Postgres
    AIApp -->|Prompt / Structured Output| LLM
```

---

## 3. Sơ đồ Use Case tổng thể (Use Case Diagram)

```mermaid
flowchart LR
    subgraph StudentUseCases [Chức năng Học viên]
        UC_S1((Đăng ký / Đăng nhập))
        UC_S2((Xem & Đăng ký khóa học))
        UC_S3((Học bài & Ghi nhận tiến độ))
        UC_S4((Làm Quiz & Xem kết quả))
        UC_S5((Chat với AI English Tutor Agent))
        UC_S6((Xem Skill Score & Lộ trình đề xuất))
    end

    subgraph TeacherUseCases [Chức năng Giáo viên]
        UC_T1((CRUD Khóa học / Chương / Bài học))
        UC_T2((Upload video, tài liệu bài học))
        UC_T3((Tạo Quiz thủ công))
        UC_T4((Dùng AI sinh Quiz tự động))
        UC_T5((Upload Quiz từ Excel / CSV))
        UC_T6((Xem thống kê học tập học viên))
    end

    subgraph AdminUseCases [Chức năng Admin]
        UC_A1((Quản lý User & Phân quyền))
        UC_A2((Quản lý Danh mục khóa học))
        UC_A3((Khóa / Mở tài khoản))
        UC_A4((Xem Dashboard thống kê toàn hệ thống))
    end

    Student --> UC_S1
    Student --> UC_S2
    Student --> UC_S3
    Student --> UC_S4
    Student --> UC_S5
    Student --> UC_S6

    Teacher --> UC_T1
    Teacher --> UC_T2
    Teacher --> UC_T3
    Teacher --> UC_T4
    Teacher --> UC_T5
    Teacher --> UC_T6

    Admin --> UC_A1
    Admin --> UC_A2
    Admin --> UC_A3
    Admin --> UC_A4
```

---

## 4. Các sơ đồ tuần tự trọng tâm (Sequence Diagrams)

### 4.1. Luồng AI English Tutor Agent (kèm Tool Calling)
```mermaid
sequenceDiagram
    autonumber
    actor Student as 👨‍🎓 Học viên
    participant UI as 💻 React Frontend
    participant API as 🛡️ Django AI View
    participant Agent as 🧠 AI Tutor Agent Service
    participant Tool as ⚙️ Internal Data Tools
    participant DB as 🗄️ PostgreSQL
    participant LLM as 🤖 LLM (Gemini/OpenAI)

    Student->>UI: Gửi câu hỏi ("Giải thích câu số 3 bài quiz vừa rồi của em")
    UI->>API: POST /api/v1/ai/tutor/chat {message, conversation_id}
    API->>Agent: Xử lý ngữ cảnh chat & xác thực học viên
    Agent->>LLM: Gửi Prompt kèm danh sách Tools định nghĩa
    LLM-->>Agent: Yêu cầu gọi Tool `get_quiz_result(attempt_id)`
    Agent->>Tool: get_quiz_result(user_id)
    Tool->>DB: Truy vấn kết quả làm bài & câu sai gần nhất
    DB-->>Tool: Trả về kết quả câu hỏi số 3
    Tool-->>Agent: Dữ liệu thực tế câu hỏi số 3
    Agent->>LLM: Trả về kết quả tool output cho LLM
    LLM-->>Agent: Phản hồi giải thích chi tiết & ngữ cảnh hóa
    Agent->>DB: Lưu lịch sử tin nhắn (AIConversation, AIMessage)
    Agent-->>API: Trả về câu trả lời hoàn chỉnh
    API-->>UI: 200 OK {response: "..."}
    UI-->>Student: Hiển thị phản hồi từ Gia sư ảo
```

### 4.2. Luồng AI Quiz Generator cho Giáo viên
```mermaid
sequenceDiagram
    autonumber
    actor Teacher as 👩‍🏫 Giáo viên
    participant UI as 💻 React Frontend
    participant API as 🛡️ Django AI View
    participant GenService as ⚡ AI Quiz Generator Service
    participant LLM as 🤖 LLM API
    participant Validator as 🔍 JSON Schema Validator
    participant DB as 🗄️ PostgreSQL

    Teacher->>UI: Chọn Topic ("Tenses"), Level ("B1"), Số câu (5), Context
    UI->>API: POST /api/v1/ai/quizzes/generate {topic, level, count}
    API->>GenService: Chuẩn bị Prompt & Strict JSON Schema
    GenService->>LLM: Gọi LLM sinh câu hỏi theo Schema
    LLM-->>GenService: Trả về JSON raw
    GenService->>Validator: Kiểm tra tính hợp lệ (câu hỏi, options, đáp án đúng, giải thích)
    alt Validation Thành công
        Validator-->>GenService: Validated Questions JSON
        GenService-->>API: Danh sách câu hỏi đề xuất
        API-->>UI: 200 OK {questions: [...]}
        UI-->>Teacher: Hiển thị giao diện Preview & Cho phép chỉnh sửa
        Teacher->>UI: Chỉnh sửa và bấm "Lưu & Công bố"
        UI->>API: POST /api/v1/quizzes {course_id, questions}
        API->>DB: Lưu Quiz, Questions, Options vào DB
        DB-->>API: Lưu thành công
        API-->>UI: 201 Created
        UI-->>Teacher: Thông báo công bố Quiz thành công!
    else Validation Thất bại
        Validator-->>GenService: Báo lỗi cấu trúc
        GenService-->>API: Lỗi format JSON
        API-->>UI: 500 Internal Error / Yêu cầu sinh lại
    end
```

### 4.3. Luồng Upload Quiz từ Excel/CSV
```mermaid
sequenceDiagram
    autonumber
    actor Teacher as 👩‍🏫 Giáo viên
    participant UI as 💻 React Frontend
    participant API as 🛡️ Django Import View
    participant Parser as 📑 File Parser Service
    participant Validator as 🔍 Row Validator
    participant DB as 🗄️ PostgreSQL

    Teacher->>UI: Chọn và tải lên file (.xlsx / .csv)
    UI->>API: POST /api/v1/quiz-imports (multipart/form-data)
    API->>DB: Tạo ImportJob (status: PENDING)
    API->>Parser: Đọc file với openpyxl / pandas
    Parser->>Validator: Thẩm định từng hàng (Cột, nội dung, đáp án A-D, đáp án đúng)
    alt Có lỗi dữ liệu
        Validator->>DB: Ghi nhận ImportError (Row number, Error message)
        Validator->>DB: Cập nhật ImportJob (status: FAILED / PARTIAL)
        API-->>UI: Trả về danh sách lỗi chi tiết từng dòng để giáo viên sửa
    else Dữ liệu hợp lệ
        Validator->>DB: Cập nhật ImportJob (status: PARSED, parsed_data)
        API-->>UI: Trả về danh sách câu hỏi đã bóc tách
        UI-->>Teacher: Hiển thị giao diện Preview toàn bộ câu hỏi
        Teacher->>UI: Xác nhận bấm "Publish Quiz"
        UI->>API: POST /api/v1/quiz-imports/{id}/publish
        API->>DB: Lưu các bản ghi Quiz, Question, Option chính thức
        API-->>UI: 200 OK (Publish thành công)
    end
```

### 4.4. Luồng Cá nhân hóa Lộ trình (Personalized Learning)
```mermaid
sequenceDiagram
    autonumber
    actor Student as 👨‍🎓 Học viên
    participant UI as 💻 React Frontend
    participant API as 🛡️ Django Recommendation View
    participant Analytics as 📊 Learning Analytics Service
    participant Engine as 🎯 Rule-based Recommendation Engine
    participant LLM as 🤖 LLM Explainer
    participant DB as 🗄️ PostgreSQL

    Student->>UI: Truy cập trang "Lộ trình học tập cá nhân"
    UI->>API: GET /api/v1/recommendations/me
    API->>Analytics: Tổng hợp dữ liệu học tập (Quiz attempts, hoàn thành bài học, thời gian)
    Analytics->>DB: Lấy lịch sử làm quiz & tiến độ bài học
    DB-->>Analytics: Dữ liệu chi tiết
    Analytics->>Analytics: Tính Skill Score từng chủ đề: 0.6*Quiz + 0.2*Completion + 0.2*Recent
    Analytics->>Engine: Danh sách Skill Scores & Weak Topics (< 60%)
    Engine->>DB: Tìm các bài học/khóa học tương ứng với Weak Topics
    DB-->>Engine: Khóa học / Bài học đề xuất
    Engine->>LLM: Gửi dữ liệu điểm yếu để sinh lời khuyên động lực ngắn gọn
    LLM-->>Engine: Câu giải thích ("Bạn đang gặp khó khăn ở Thì Quá khứ đơn, hãy ôn bài...")
    Engine->>DB: Lưu/Cập nhật bản ghi Recommendation
    Engine-->>API: Danh sách bài học đề xuất + Điểm kỹ năng + Lời khuyên
    API-->>UI: 200 OK {skills: [...], recommendations: [...]}
    UI-->>Student: Hiển thị Dashboard năng lực & Bài học nên học tiếp theo
```

# THIẾT KẾ CƠ SỞ DỮ LIỆU & SƠ ĐỒ THỰC THỂ QUAN HỆ (ERD)

> **Hệ quản trị CSDL:** PostgreSQL  
> **Tổng số bảng thực thể:** 18 bảng (chia theo 7 modules của Modular Monolith)

---

## 1. Sơ đồ thực thể quan hệ (Mermaid ERD)

```mermaid
erDiagram
    users ||--o{ courses : "teaches"
    users ||--o{ enrollments : "registers"
    users ||--o{ lesson_progress : "tracks"
    users ||--o{ quiz_attempts : "takes"
    users ||--o{ ai_conversations : "chats"
    users ||--o{ user_skill_scores : "evaluates"
    users ||--o{ recommendations : "receives"
    users ||--o{ import_jobs : "creates"

    categories ||--o{ courses : "categorizes"
    courses ||--o{ chapters : "contains"
    chapters ||--o{ lessons : "contains"
    lessons ||--o{ materials : "attaches"
    courses ||--o{ enrollments : "enrolled_in"
    courses ||--o{ quizzes : "has_quizzes"
    chapters ||--o{ quizzes : "has_quizzes"
    lessons ||--o{ lesson_progress : "progress_of"
    lessons ||--o{ quizzes : "has_quizzes"

    quizzes ||--o{ questions : "contains"
    questions ||--o{ options : "has_options"
    quizzes ||--o{ quiz_attempts : "attempts"
    quiz_attempts ||--o{ attempt_answers : "details"
    questions ||--o{ attempt_answers : "answers_to"
    options ||--o{ attempt_answers : "chosen_option"

    ai_conversations ||--o{ ai_messages : "contains"
    skills ||--o{ user_skill_scores : "scored_in"
    import_jobs ||--o{ import_errors : "logs_errors"

    users {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        string role "STUDENT | TEACHER | ADMIN"
        string level "A1 | A2 | B1 | B2 | C1 | C2"
        string avatar_url
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    categories {
        bigint id PK
        string name UK
        string slug UK
        string description
    }

    courses {
        uuid id PK
        bigint category_id FK
        uuid teacher_id FK
        string title
        string slug UK
        text description
        string level "A1 | A2 | B1 | B2 | C1 | C2"
        string thumbnail_url
        string status "DRAFT | PUBLISHED | ARCHIVED"
        timestamp created_at
    }

    chapters {
        uuid id PK
        uuid course_id FK
        string title
        int order_index
    }

    lessons {
        uuid id PK
        uuid chapter_id FK
        string title
        text content
        string video_url
        int order_index
        int duration_minutes
    }

    materials {
        uuid id PK
        uuid lesson_id FK
        string title
        string file_url
        string file_type "PDF | DOCX | MP3"
    }

    enrollments {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        string status "ACTIVE | COMPLETED | CANCELLED"
        timestamp enrolled_at
    }

    lesson_progress {
        uuid id PK
        uuid user_id FK
        uuid lesson_id FK
        boolean completed
        int progress_percent
        timestamp completed_at
    }

    quizzes {
        uuid id PK
        uuid course_id FK "nullable"
        uuid chapter_id FK "nullable"
        uuid lesson_id FK "nullable"
        string title
        text description
        string quiz_type "LESSON | CHAPTER | FINAL | PRACTICE_AI"
        int time_limit_minutes
        int pass_score
        string status "DRAFT | PUBLISHED"
    }

    questions {
        uuid id PK
        uuid quiz_id FK
        string topic "Grammar | Vocab | Tenses..."
        text question_text
        string question_type "SINGLE_CHOICE | MULTIPLE_CHOICE | TRUE_FALSE"
        text explanation
        string source "MANUAL | AI_GENERATED | FILE_IMPORT"
    }

    options {
        uuid id PK
        uuid question_id FK
        text option_text
        boolean is_correct
    }

    quiz_attempts {
        uuid id PK
        uuid quiz_id FK
        uuid user_id FK
        float score
        int total_questions
        int correct_answers
        boolean is_passed
        timestamp started_at
        timestamp submitted_at
    }

    attempt_answers {
        uuid id PK
        uuid attempt_id FK
        uuid question_id FK
        uuid option_id FK
        boolean is_correct
    }

    ai_conversations {
        uuid id PK
        uuid user_id FK
        string title
        timestamp created_at
    }

    ai_messages {
        uuid id PK
        uuid conversation_id FK
        string role "user | assistant | system"
        text content
        jsonb metadata
        timestamp created_at
    }

    skills {
        bigint id PK
        string name UK "Tenses | Passive Voice | Conditionals..."
        string category "Grammar | Vocabulary | Listening"
    }

    user_skill_scores {
        uuid id PK
        uuid user_id FK
        bigint skill_id FK
        float score "0 - 100"
        timestamp updated_at
    }

    recommendations {
        uuid id PK
        uuid user_id FK
        string recommendation_type "LESSON | COURSE | REVISE_QUIZ"
        text reason "AI-generated justification"
        uuid target_course_id FK "nullable"
        uuid target_lesson_id FK "nullable"
        float priority_score
        timestamp created_at
    }

    import_jobs {
        uuid id PK
        uuid teacher_id FK
        string file_name
        string file_url
        string status "PENDING | PARSED | PUBLISHED | FAILED"
        int total_rows
        int success_rows
        int error_rows
        timestamp created_at
    }

    import_errors {
        uuid id PK
        uuid import_job_id FK
        int row_number
        string error_message
    }
```

---

## 2. Chi tiết 18 bảng theo từng module chức năng

### Nhóm 1: `apps.accounts` (Người dùng & Phân quyền)
1. **`users`**: Bảng người dùng tùy chỉnh kế thừa `AbstractBaseUser`. Lưu email (khóa chính đăng nhập), họ tên, vai trò (`STUDENT`, `TEACHER`, `ADMIN`), trình độ ngoại ngữ (`A1`-`C2`), ảnh đại diện.

### Nhóm 2: `apps.courses` (Khóa học, Chương, Bài học & Tài liệu)
2. **`categories`**: Danh mục khóa học (Tiếng Anh giao tiếp, IELTS, TOEIC, Ngữ pháp cơ bản...).
3. **`courses`**: Khóa học do giáo viên quản lý, có cấp độ, trạng thái (`DRAFT`, `PUBLISHED`, `ARCHIVED`).
4. **`chapters`**: Chương học trong khóa, có thứ tự sắp xếp `order_index`.
5. **`lessons`**: Bài học chi tiết, lưu nội dung bài viết, link video bài giảng, thời lượng học.
6. **`materials`**: Tài liệu đính kèm bài học (File PDF, Slide, Audio nghe).

### Nhóm 3: `apps.learning` (Ghi danh & Tiến độ học tập)
7. **`enrollments`**: Lưu thông tin học viên đăng ký tham gia khóa học.
8. **`lesson_progress`**: Tiến độ hoàn thành từng bài học (% hoàn thành, trạng thái `completed`, thời điểm hoàn thành).

### Nhóm 4: `apps.assessments` (Bài kiểm tra & Chấm điểm)
9. **`quizzes`**: Đề kiểm tra gắn liền với Khóa học (`course_id`), Chương học (`chapter_id`), Bài học (`lesson_id`) hoặc Đề ôn tập nhanh do AI sinh theo tiến độ bài học (`quiz_type`: `LESSON`, `CHAPTER`, `FINAL`, `PRACTICE_AI`), thời gian làm bài, điểm qua môn.
10. **`questions`**: Câu hỏi trắc nghiệm, lưu topic, loại câu hỏi, nguồn tạo (`MANUAL`, `AI_GENERATED`, `FILE_IMPORT`) và phần giải thích đáp án (`explanation`).
11. **`options`**: Các lựa chọn A, B, C, D cho câu hỏi kèm cờ `is_correct`.
12. **`quiz_attempts`**: Lịch sử mỗi lần học viên làm bài thi (Điểm số, số câu đúng, trạng thái Đạt/Chưa đạt).
13. **`attempt_answers`**: Chi tiết từng câu trả lời của học viên trong một lần thi để phân tích câu sai.

### Nhóm 5: `apps.ai` (Trợ lý ảo & Hội thoại)
14. **`ai_conversations`**: Các phiên hội thoại giữa học viên và AI English Tutor.
15. **`ai_messages`**: Toàn bộ tin nhắn theo vai trò (`user`, `assistant`, `system`), lưu kèm `metadata` phục vụ gọi Tool.

### Nhóm 6: `apps.recommendations` (Phân tích học tập & Đề xuất cá nhân hóa)
16. **`skills`**: Danh mục các kỹ năng/chủ đề tiếng Anh cụ thể (Hiện tại đơn, Mệnh đề quan hệ, Từ vựng Business...).
17. **`user_skill_scores`**: Điểm số đo lường năng lực của học viên theo từng kỹ năng (0 - 100 điểm).
18. **`recommendations`**: Các bài học hoặc đề ôn tập được gợi ý riêng cho từng học viên kèm câu giải thích lý do từ AI.

### Nhóm 7: `apps.quiz_import` (Xử lý tải lên câu hỏi từ File)
19. **`import_jobs`**: Lịch sử mỗi lần giáo viên upload file Excel/CSV, trạng thái xử lý và số lượng dòng.
20. **`import_errors`**: Báo lỗi chi tiết theo từng dòng (Row index, lý do lỗi) để giáo viên sửa file.

# 📋 TỔNG HỢP CÁC CHỨC NĂNG CHƯA HOÀN THIỆN, CÒN THIẾU HOẶC ĐANG DÙNG MOCK DATA

> **Dự án**: Nền Tảng Học Tiếng Anh Trực Tuyến Tích Hợp AI (E-Learning AI Platform)  
> **Ngày lập báo cáo**: 01/09/2026  
> **Phạm vi kiểm tra**: Toàn bộ 7 Apps Backend (`accounts`, `courses`, `learning`, `assessments`, `ai`, `recommendations`, `quiz_import`) và toàn bộ UI Frontend React.

---

## 📑 MỤC LỤC
1. [Tổng quan hiện trạng hệ thống](#1-tổng-quan-hiện-trạng-hệ-thống)
2. [Chi tiết các thành phần đang sử dụng Mock Data / Dữ liệu cứng (Hardcoded)](#2-chi-tiết-các-thành-phần-đang-sử-dụng-mock-data--dữ-liệu-cứng-hardcoded)
3. [Chi tiết các chức năng Backend đã có nhưng Frontend CHƯA LÀM GIAO DIỆN](#3-chi-tiết-các-chức-năng-backend-đã-có-nhưng-frontend-chưa-làm-giao-diện)
4. [Chi tiết các chức năng làm chưa đúng luồng hoặc thiếu bước xử lý](#4-chi-tiết-các-chức-năng-làm-chưa-đúng-luồng-hoặc-thiếu-bước-xử-lý)
5. [Kế hoạch hành động & Lộ trình hoàn thiện (Action Plan)](#5-kế-hoạch-hành-động--lộ-trình-hoàn-thiện-action-plan)

---

## 1. TỔNG QUAN HIỆN TRẠNG HỆ THỐNG

- **Backend (Django REST Framework + PostgreSQL)**: Đã hoàn thiện cấu trúc 7 module nghiệp vụ chuẩn hóa với đầy đủ Model, Serializer, Service Layer, Permission, OpenAPI Schema và Unit Test.
- **Frontend (React SPA + CSS Vanilla)**: Đã xây dựng giao diện tổng quan, catalog khóa học, studio giảng viên, phòng thi trắc nghiệm, AI Tutor, lộ trình thích ứng và ma trận kỹ năng.
- **Vấn đề tồn tại chính**:
  1. Một số component vẫn chứa **mảng dữ liệu mẫu (Mock data cứng)** chưa gọi API thật từ PostgreSQL.
  2. Một số chức năng Backend quan trọng (như Cập nhật Profile, Đổi mật khẩu, Sửa/Xóa khóa học & bài học, Xác thực chứng chỉ số công khai, Giao diện Admin) **chưa có giao diện người dùng tương ứng**.
  3. Luồng Import đề thi mới chỉ dừng ở bước bóc tách xem trước, **chưa có bước bấm lưu vào Đề thi đích trong CSDL**.

---

## 2. CHI TIẾT CÁC THÀNH PHẦN ĐANG SỬ DỤNG MOCK DATA / DỮ LIỆU CỨNG (HARDCODED)

### 🔴 2.1. Component `TeacherGradebookView.jsx` (Sổ điểm Giảng viên)
- **Vị trí tệp**: `front-end/src/components/TeacherGradebookView.jsx` (Dòng 6 – 51)
- **Hiện trạng Mock Data**:
  - Toàn bộ danh sách học viên, tiến độ hoàn thành, điểm số đề thi, trạng thái chứng chỉ đang là mảng tĩnh `students = [{ id: 1, name: 'Lê Văn Thái', ... }]`.
- **Hành vi cần sửa**:
  - Gọi API Backend thật để lấy danh sách học viên đã ghi danh vào các khóa học của giảng viên phụ trách kèm điểm số bài kiểm tra thực tế từ PostgreSQL.

---

### 🔴 2.2. Component `AdminDashboardView.jsx` (Bảng điều khiển Quản trị viên)
- **Vị trí tệp**: `front-end/src/components/AdminDashboardView.jsx` (Dòng 7 – 49)
- **Hiện trạng Mock Data & Lỗi kết nối**:
  - `stats`: Số liệu `completed_progress`, `total_users`, `total_lessons`, `total_courses`, `total_quizzes` là số cứng.
  - `courseDistribution` & `barData`: Dữ liệu biểu đồ cột và biểu đồ tròn là số cứng.
  - `recentActivities`: Bảng lịch sử điểm thi là mảng tĩnh.
  - `users`: Danh sách người dùng là `useState` tĩnh 4 tài khoản mẫu, chức năng khóa/mở khóa tài khoản và đổi vai trò chỉ sửa state tạm trên RAM chứ chưa gọi API `authAPI.updateUser(userId, data)`.
  - **Chưa được mount vào `App.jsx`**: Khi người dùng có role `ADMIN`, hệ thống chưa hiển thị Tab Admin và chưa render component này.
- **Hành vi cần sửa**:
  - Mount component vào `App.jsx` khi user có vai trò `ADMIN`.
  - Gọi API `authAPI.getUsers()` thật và cập nhật trạng thái `is_active`, `role` qua API `PATCH /api/v1/auth/users/<id>/`.

---

### 🔴 2.3. Component `MyLearningView.jsx` (Phòng học & Tiến độ của học viên)
- **Vị trí tệp**: `front-end/src/components/MyLearningView.jsx` (Dòng 6 – 29, 357 – 385)
- **Hiện trạng Mock Data**:
  - `lessons`: Danh sách 4 bài học đang được fix cứng trong `useState`.
  - `materials`: Tab tài liệu đính kèm đang hiển thị 2 tệp PDF và DOCX giả lập (`Slide_Bài_Giảng_Ngữ_Pháp_B1.pdf`, `Bai_Tap_Tu_Luyen_Kem_Dap_An.docx`).
  - Ghi chú cá nhân (`notes`) chỉ lưu trong state của React, chưa lưu vào CSDL.
  - Video Player là khung mô phỏng (UI box), chưa gắn thẻ `<video>` hoặc iframe YouTube và chưa kích hoạt API lưu giây dừng video (`track-progress`).
- **Hành vi cần sửa**:
  - Nhận `courseId` / `enrollment` động từ `MyCourses`.
  - Gọi API `learningAPI.getMyCourseDetail(courseIdentifier)` để lấy đúng danh sách Chapter, Lesson, Material và `last_watched_second` thực tế từ Backend.

---

### 🟡 2.4. Component `CertificateModal.jsx` (Chứng chỉ tốt nghiệp)
- **Vị trí tệp**: `front-end/src/components/CertificateModal.jsx` (Dòng 86 – 92)
- **Hiện trạng Mock Data**:
  - Mã xác thực chứng chỉ đang fix cứng là `EL-AI-2026-8914B6F5`.
  - Ngày cấp đang fix cứng là `31/08/2026`.
- **Hành vi cần sửa**:
  - Nhận object `certificate` thật được trả về từ API Backend `learningAPI.completeLesson` hoặc `learningAPI.getMyCertificates` để hiển thị đúng `certificate.certificate_code` và `certificate.issued_at`.

---

### 🟡 2.5. Component `QuizExamView.jsx` (Phòng thi trắc nghiệm)
- **Vị trí tệp**: `front-end/src/components/QuizExamView.jsx` (Dòng 36 – 57, 90 – 146)
- **Hiện trạng Mock Data**:
  - Có mảng dự phòng `fallbackQuizzes` và `sampleQuestions` khi API lỗi hoặc đề thi chưa có câu hỏi.
- **Hành vi cần sửa**:
  - Đảm bảo bắt buộc load dữ liệu câu hỏi và đáp án từ API `assessmentAPI.getQuizDetail(quizId)`.

---

## 3. CHI TIẾT CÁC CHỨC NĂNG BACKEND ĐÃ CÓ NHƯNG FRONTEND CHƯA LÀM GIAO DIỆN

| STT | App Backend | Tên Chức Năng Backend | Phương Thức / Endpoint | Hiện trạng trên Giao diện |
| :---: | :--- | :--- | :---: | :--- |
| **1** | `accounts` | **Chỉnh sửa Hồ sơ cá nhân** | `PATCH /api/v1/auth/me/` | ❌ **Chưa có UI**: Chưa có Form/Modal để người dùng sửa Họ tên, Bio, Trình độ mục tiêu, Số điện thoại. |
| **2** | `accounts` | **Đổi mật khẩu tài khoản** | `POST /api/v1/auth/change-password/` | ❌ **Chưa có UI**: Menu người dùng chưa có chức năng nhập Mật khẩu cũ & Mật khẩu mới. |
| **3** | `accounts` | **Giao diện Quản trị Admin** | `GET/PATCH /api/v1/auth/users/` | ⚠️ **Chưa kết nối**: File `AdminDashboardView.jsx` đã có nhưng chưa được gắn vào hệ thống Menu/Tab trong `App.jsx`. |
| **4** | `courses` | **Chỉnh sửa thông tin Khóa học** | `PATCH /api/v1/courses/<id>/` | ❌ **Chưa có UI**: Studio giảng viên chưa có nút và modal sửa Tiêu đề, Mô tả, Giá, Level của khóa học đã tạo. |
| **5** | `courses` | **Xóa Khóa học** | `DELETE /api/v1/courses/<id>/` | ❌ **Chưa có UI**: Chưa có nút Xóa / Lưu trữ khóa học. |
| **6** | `courses` | **Sửa / Xóa Chương học (Chapter)** | `PATCH/DELETE /api/v1/courses/chapters/<id>/` | ❌ **Chưa có UI**: Modal Soạn giáo trình chỉ có form Thêm chương, chưa có nút Sửa/Xóa từng chương. |
| **7** | `courses` | **Sửa / Xóa Bài học (Lesson)** | `PATCH/DELETE /api/v1/courses/lessons/<id>/` | ❌ **Chưa có UI**: Modal Soạn giáo trình chỉ có form Thêm bài học, chưa có nút Sửa link video / Xóa bài. |
| **8** | `courses` | **Upload Tài liệu đính kèm bài học (PDF/DOCX)** | `POST/DELETE /api/v1/courses/lessons/<id>/materials/` | ❌ **Chưa có UI**: Giảng viên chưa có giao diện tải file tài liệu đính kèm vào từng bài học. |
| **9** | `courses` | **Quản lý Danh mục (Admin)** | `POST/PATCH/DELETE /api/v1/courses/categories/` | ❌ **Chưa có UI**: Admin chưa có giao diện Thêm/Sửa/Xóa danh mục môn học. |
| **10** | `learning` | **Tra cứu & Xác thực Chứng chỉ số công khai** | `GET /api/v1/learning/certificates/<certificate_code>/` | ❌ **Chưa có UI**: Chưa có trang/form công khai để nhà tuyển dụng hoặc học viên nhập mã chứng chỉ tra cứu tính xác thực. |
| **11** | `assessments`| **Màn hình Quản lý Ngân hàng Đề thi (Giáo viên)** | `PATCH/DELETE /api/v1/assessments/quizzes/<id>/` | ❌ **Chưa có UI**: Chưa có bảng danh sách tất cả đề thi do giáo viên tạo kèm nút Sửa/Xóa đề thi. |
| **12** | `assessments`| **Sửa / Xóa từng Câu hỏi trong Đề thi** | `PATCH/DELETE /api/v1/assessments/questions/<id>/` | ❌ **Chưa có UI**: Chưa có giao diện chỉnh sửa thủ công nội dung câu hỏi hoặc đáp án đã lưu. |
| **13** | `assessments`| **Trang Lịch sử Làm bài thi của Học viên** | `GET /api/v1/assessments/my-attempts/` | ❌ **Chưa có UI**: Chưa có trang danh sách chi tiết các lần thi trước đây để học viên xem lại điểm và lời giải cũ. |
| **14** | `ai` | **Sidebar Lịch sử các Đoạn chat AI & Xóa phiên chat** | `GET/DELETE /api/v1/ai/sessions/<id>/` | ❌ **Chưa có UI**: Widget AI Tutor hiện là cửa sổ chat đơn, chưa có thanh danh sách các phiên chat cũ và nút xóa đoạn chat. |
| **15** | `recommendations` | **Nút Ẩn / Bỏ qua Đề xuất khóa học** | `POST /api/v1/recommendations/courses/<id>/dismiss/` | ❌ **Chưa có UI**: Chưa có nút "Ẩn đề xuất này" trên thẻ khóa học gợi ý. |
| **16** | `quiz_import` | **Lịch sử các Tệp Đề thi đã Import** | `GET /api/v1/quiz-import/batches/` | ❌ **Chưa có UI**: Giảng viên chưa có màn hình xem lại các tệp Word/Excel đã tải lên trước đây. |

---

## 4. CHI TIẾT CÁC CHỨC NĂNG LÀM CHƯA ĐÚNG LUỒNG HOẶC THIẾU BƯỚC XỬ LÝ

### ⚠️ 4.1. Luồng Import Đề thi tự động (`QuizImportModal.jsx`)
- **Vấn đề**: Hiện tại khi tải file hoặc dán văn bản, modal chỉ gọi API `uploadBatch` để hiển thị danh sách câu hỏi xem trước (Preview Data).
- **Thiếu sót**: 
  - Chưa có Dropdown cho giáo viên chọn **Khóa học đích / Đề thi đích** cần nạp câu hỏi vào.
  - Chưa có nút **"Xác nhận Lưu vào Đề thi"** để gọi API `confirmImport` (`POST /api/v1/quiz-import/batches/<id>/confirm/`).
  - Do đó, câu hỏi sau khi bóc tách chưa thực sự được ghi vào bảng câu hỏi trong CSDL.

### ⚠️ 4.2. Luồng Chuyển đổi và Phân quyền Vai trò (`App.jsx` & `Header.jsx`)
- **Vấn đề**: Khi người dùng đăng nhập bằng tài khoản có vai trò `ADMIN`, giao diện đang bị fallback về màn hình học viên hoặc studio giảng viên do chưa cấu hình điều hướng cho `ADMIN`.
- **Cần sửa**: Bổ sung tab `admin_dashboard` khi `user.role === 'ADMIN'`.

### ⚠️ 4.3. Luồng Theo dõi Thời gian học Video (`Resume Playback`)
- **Vấn đề**: Backend có endpoint `POST /api/v1/learning/lessons/<id>/track-progress/` để lưu lại thời điểm giây dừng của học viên khi xem video. Tuy nhiên, component `MyLearningView.jsx` đang dùng player mô phỏng nên chưa kích hoạt sự kiện gửi thời lượng giây về server.

---

## 5. KẾ HOẠCH HÀNH ĐỘNG & LỘ TRÌNH HOÀN THIỆN (ACTION PLAN)

### 🚀 GIAI ĐOẠN 1: Thay thế Mock Data bằng API Thật (Ưu tiên cao)
1. **Kết nối `TeacherGradebookView.jsx`**: Gọi API lấy danh sách học viên, tiến độ và điểm thi thực tế từ PostgreSQL.
2. **Kết nối `AdminDashboardView.jsx`**: 
   - Mount vào `App.jsx` cho tài khoản `ADMIN`.
   - Kết nối API `authAPI.getUsers()` và `authAPI.updateUser()`.
3. **Kết nối `MyLearningView.jsx`**: Đọc toàn bộ danh sách bài học, chương học và tài liệu động theo khóa học học viên đã ghi danh.
4. **Chuẩn hóa `CertificateModal.jsx`**: Đọc mã chứng chỉ `certificate_code` và ngày cấp thật từ API.

### 🚀 GIAI ĐOẠN 2: Hoàn thiện các Luồng Xử lý còn thiếu (Ưu tiên cao)
1. **Hoàn thiện `QuizImportModal.jsx`**: Thêm bước chọn Đề thi đích và gọi API `confirmImport` để lưu câu hỏi vào CSDL.
2. **Bổ sung Modal Cập nhật Hồ sơ & Đổi mật khẩu** vào menu Header người dùng.
3. **Bổ sung chức năng Sửa / Xóa Khóa học & Bài học** trong Studio Giảng viên.

### 🚀 GIAI ĐOẠN 3: Bổ sung các Trang Tính năng Mở rộng (Ưu tiên trung bình)
1. **Trang Tra cứu Chứng chỉ số công khai**: Nhập mã chứng chỉ để kiểm tra tính hợp lệ.
2. **Trang Lịch sử Làm bài thi của học viên**: Xem lại bảng điểm và chi tiết lời giải các lần thi trước.
3. **Sidebar lịch sử hội thoại AI Tutor**: Quản lý nhiều phiên trò chuyện và xóa hội thoại cũ.

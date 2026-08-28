from django.test import TestCase
from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.courses.models import Category, Course, Chapter, Lesson, CourseStatus
from apps.learning.models import Enrollment, LessonProgress, Certificate, EnrollmentStatus
from apps.learning.services import EnrollmentService, ProgressService, CertificateService


class LearningServicesTest(TestCase):
    """
    Bộ kiểm thử cho các tầng nghiệp vụ EnrollmentService, ProgressService, CertificateService.
    """

    def setUp(self):
        self.student = CustomUser.objects.create_user(
            email='student_serv@example.com',
            password='TestPassword123!',
            full_name='Student Service Tester',
            role=UserRole.STUDENT
        )
        self.teacher = CustomUser.objects.create_user(
            email='teacher_serv@example.com',
            password='TestPassword123!',
            full_name='Teacher Service Tester',
            role=UserRole.TEACHER
        )
        self.category = Category.objects.create(name='Service Test Cat')
        self.course = Course.objects.create(
            category=self.category,
            teacher=self.teacher,
            title='English Communication Pro',
            level=EnglishLevel.B1,
            status=CourseStatus.PUBLISHED
        )
        self.draft_course = Course.objects.create(
            category=self.category,
            teacher=self.teacher,
            title='Draft English Course',
            level=EnglishLevel.A1,
            status=CourseStatus.DRAFT
        )

        self.chapter = Chapter.objects.create(course=self.course, title='Chapter 1', order_index=1)
        self.lesson1 = Lesson.objects.create(chapter=self.chapter, title='Lesson 1: Greetings', order_index=1)
        self.lesson2 = Lesson.objects.create(chapter=self.chapter, title='Lesson 2: Introductions', order_index=2)

    # ------------------ 1. EnrollmentService Tests ------------------
    def test_enroll_course_success_with_auto_lesson_progress(self):
        """Học viên ghi danh thành công và hệ thống tự động tạo 2 bản ghi LessonProgress."""
        success, message, enrollment = EnrollmentService.enroll_course(self.student, str(self.course.id))
        self.assertTrue(success)
        self.assertIsNotNone(enrollment)
        self.assertEqual(enrollment.status, EnrollmentStatus.ACTIVE)
        self.assertEqual(enrollment.lesson_progresses.count(), 2)

    def test_enroll_course_draft_rejected(self):
        """Không cho phép ghi danh vào khóa học chưa xuất bản (DRAFT)."""
        success, message, enrollment = EnrollmentService.enroll_course(self.student, str(self.draft_course.id))
        self.assertFalse(success)
        self.assertIsNone(enrollment)

    def test_enroll_course_teacher_self_rejected(self):
        """Giáo viên không cần ghi danh vào khóa học do chính mình dạy."""
        success, message, enrollment = EnrollmentService.enroll_course(self.teacher, str(self.course.id))
        self.assertFalse(success)
        self.assertIn("không cần ghi danh", message)

    def test_enroll_duplicate_rejected(self):
        """Học viên không thể ghi danh trùng lặp khóa học đang học."""
        EnrollmentService.enroll_course(self.student, str(self.course.id))
        success, message, _ = EnrollmentService.enroll_course(self.student, str(self.course.id))
        self.assertFalse(success)
        self.assertIn("trước đó", message)

    def test_list_and_detail_student_enrollments(self):
        """Kiểm tra lấy danh sách khóa học của tôi và lấy chi tiết tiến độ."""
        EnrollmentService.enroll_course(self.student, str(self.course.id))

        enrollments = EnrollmentService.list_student_enrollments(self.student, {'status': 'ACTIVE'})
        self.assertEqual(enrollments.count(), 1)

        detail = EnrollmentService.get_student_enrollment_detail(self.student, str(self.course.id))
        self.assertIsNotNone(detail)
        self.assertEqual(detail.course.title, 'English Communication Pro')

    # ------------------ 2. ProgressService Tests ------------------
    def test_track_video_progress(self):
        """Kiểm tra lưu thời lượng giây xem video bài học."""
        EnrollmentService.enroll_course(self.student, str(self.course.id))
        success, message, progress = ProgressService.track_video_progress(
            self.student, str(self.lesson1.id), last_watched_second=150
        )
        self.assertTrue(success)
        self.assertEqual(progress.last_watched_second, 150)

    def test_complete_lesson_and_auto_certificate_issuing(self):
        """Kiểm tra hoàn thành tất cả bài học và tự động cấp chứng chỉ điện tử khi đạt 100%."""
        EnrollmentService.enroll_course(self.student, str(self.course.id))

        # Hoàn thành bài 1 (50%) -> Chưa có chứng chỉ
        _, _, _, enrollment, cert = ProgressService.complete_lesson(self.student, str(self.lesson1.id))
        self.assertEqual(float(enrollment.progress_percent), 50.00)
        self.assertIsNone(cert)

        # Hoàn thành bài 2 (100%) -> Tự động sinh chứng chỉ
        _, _, _, enrollment, cert = ProgressService.complete_lesson(self.student, str(self.lesson2.id))
        self.assertEqual(float(enrollment.progress_percent), 100.00)
        self.assertEqual(enrollment.status, EnrollmentStatus.COMPLETED)
        self.assertIsNotNone(cert)
        self.assertTrue(cert.certificate_code.startswith('CERT-'))

    # ------------------ 3. CertificateService Tests ------------------
    def test_certificate_service_verification(self):
        """Kiểm tra danh sách chứng chỉ và xác thực mã chứng chỉ công khai."""
        EnrollmentService.enroll_course(self.student, str(self.course.id))
        ProgressService.complete_lesson(self.student, str(self.lesson1.id))
        _, _, _, _, cert = ProgressService.complete_lesson(self.student, str(self.lesson2.id))

        # Danh sách chứng chỉ của học viên
        user_certs = CertificateService.list_student_certificates(self.student)
        self.assertEqual(user_certs.count(), 1)

        # Tra cứu mã hợp lệ
        valid_cert = CertificateService.get_certificate_by_code(cert.certificate_code)
        self.assertIsNotNone(valid_cert)
        self.assertEqual(valid_cert.enrollment.student, self.student)

        # Tra cứu mã không tồn tại
        invalid_cert = CertificateService.get_certificate_by_code('CERT-INVALID-CODE')
        self.assertIsNone(invalid_cert)

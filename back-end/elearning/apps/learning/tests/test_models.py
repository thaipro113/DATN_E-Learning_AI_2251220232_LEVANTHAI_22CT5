from django.test import TestCase
from django.db.utils import IntegrityError
from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.courses.models import Category, Course, Chapter, Lesson, CourseStatus
from apps.learning.models import Enrollment, LessonProgress, Certificate, EnrollmentStatus


class LearningModelTest(TestCase):
    """
    Bộ kiểm thử cho các Models trong apps/learning (Enrollment, LessonProgress, Certificate).
    """

    def setUp(self):
        self.student = CustomUser.objects.create_user(
            email='student_model@example.com',
            password='TestPassword123!',
            full_name='Student Model Tester',
            role=UserRole.STUDENT
        )
        self.teacher = CustomUser.objects.create_user(
            email='teacher_model@example.com',
            password='TestPassword123!',
            full_name='Teacher Model Tester',
            role=UserRole.TEACHER
        )
        self.category = Category.objects.create(name='Grammar Model Test')
        self.course = Course.objects.create(
            category=self.category,
            teacher=self.teacher,
            title='Learning Model Course',
            level=EnglishLevel.A2,
            status=CourseStatus.PUBLISHED
        )
        self.chapter = Chapter.objects.create(course=self.course, title='Unit 1', order_index=1)
        self.lesson1 = Lesson.objects.create(chapter=self.chapter, title='Lesson 1', order_index=1)
        self.lesson2 = Lesson.objects.create(chapter=self.chapter, title='Lesson 2', order_index=2)

    def test_enrollment_creation_and_defaults(self):
        """Kiểm tra tạo Enrollment với các giá trị mặc định."""
        enrollment = Enrollment.objects.create(
            student=self.student,
            course=self.course
        )
        self.assertEqual(enrollment.status, EnrollmentStatus.ACTIVE)
        self.assertEqual(float(enrollment.progress_percent), 0.00)
        self.assertIsNone(enrollment.completed_at)
        self.assertIn(self.student.full_name, str(enrollment))

    def test_enrollment_unique_together_constraint(self):
        """Kiểm tra ràng buộc học viên không được ghi danh trùng lặp 1 khóa học."""
        Enrollment.objects.create(student=self.student, course=self.course)

        with self.assertRaises(IntegrityError):
            Enrollment.objects.create(student=self.student, course=self.course)

    def test_enrollment_recalculate_progress_flow(self):
        """Kiểm tra hàm tự động tính toán lại % tiến độ và tự động cấp trạng thái COMPLETED khi đạt 100%."""
        enrollment = Enrollment.objects.create(student=self.student, course=self.course)
        lp1 = LessonProgress.objects.create(enrollment=enrollment, lesson=self.lesson1)
        lp2 = LessonProgress.objects.create(enrollment=enrollment, lesson=self.lesson2)

        # 1. Hoàn thành bài 1 (1/2 = 50%)
        lp1.mark_as_completed()
        enrollment.refresh_from_db()
        self.assertEqual(float(enrollment.progress_percent), 50.00)
        self.assertEqual(enrollment.status, EnrollmentStatus.ACTIVE)
        self.assertIsNone(enrollment.completed_at)

        # 2. Hoàn thành bài 2 (2/2 = 100%)
        lp2.mark_as_completed()
        enrollment.refresh_from_db()
        self.assertEqual(float(enrollment.progress_percent), 100.00)
        self.assertEqual(enrollment.status, EnrollmentStatus.COMPLETED)
        self.assertIsNotNone(enrollment.completed_at)

    def test_certificate_code_generation(self):
        """Kiểm tra thuật toán sinh mã chứng chỉ số duy nhất không trùng lặp."""
        code1 = Certificate.generate_unique_code('ielts-intensive-course')
        code2 = Certificate.generate_unique_code('ielts-intensive-course')

        self.assertTrue(code1.startswith('CERT-'))
        self.assertTrue(code2.startswith('CERT-'))
        self.assertNotEqual(code1, code2)

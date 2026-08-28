from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.accounts.services import AuthService
from apps.courses.models import Category, Course, Chapter, Lesson, CourseStatus
from apps.learning.models import Enrollment, LessonProgress, Certificate
from apps.learning.services import EnrollmentService, ProgressService


class LearningAPITest(APITestCase):
    """
    Bộ kiểm thử tích hợp (API Integration Tests) cho toàn bộ Endpoints của module Learning.
    """

    def setUp(self):
        self.password = 'StrongPassword123!'

        # 1. Tạo Học viên
        self.student = CustomUser.objects.create_user(
            email='student_api@example.com',
            password=self.password,
            full_name='Student API Tester',
            role=UserRole.STUDENT
        )
        self.student_tokens = AuthService.generate_tokens_for_user(self.student)

        # 2. Tạo Giáo viên
        self.teacher = CustomUser.objects.create_user(
            email='teacher_api@example.com',
            password=self.password,
            full_name='Teacher API Tester',
            role=UserRole.TEACHER
        )

        # 3. Tạo Khóa học mẫu
        self.category = Category.objects.create(name='API Category')
        self.course = Course.objects.create(
            category=self.category,
            teacher=self.teacher,
            title='IELTS 7.5 Masterclass',
            level=EnglishLevel.C1,
            price=0,
            status=CourseStatus.PUBLISHED
        )
        self.chapter = Chapter.objects.create(course=self.course, title='Chapter 1: Writing Task 2', order_index=1)
        self.lesson1 = Lesson.objects.create(chapter=self.chapter, title='Essay Structure', order_index=1)
        self.lesson2 = Lesson.objects.create(chapter=self.chapter, title='Coherence and Cohesion', order_index=2)

    # ==================== 1. TEST ENROLLMENT APIS ====================
    def test_enroll_course_api_success(self):
        """Học viên ghi danh vào khóa học thành công."""
        url = reverse('learning:enroll_course', kwargs={'course_id': self.course.id})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.student_tokens['access']}")
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['course']['title'], 'IELTS 7.5 Masterclass')
        self.assertEqual(response.data['data']['total_lessons_count'], 2)

    def test_enroll_course_unauthenticated(self):
        """Khách chưa đăng nhập thử ghi danh -> 401 Unauthorized."""
        url = reverse('learning:enroll_course', kwargs={'course_id': self.course.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_my_courses_list_api(self):
        """Lấy danh sách các khóa học đã ghi danh của học viên."""
        EnrollmentService.enroll_course(self.student, str(self.course.id))

        url = reverse('learning:my_courses')
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.student_tokens['access']}")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 1)

    def test_my_course_detail_api(self):
        """Xem chi tiết tiến độ khóa học của tôi theo course_id hoặc slug."""
        EnrollmentService.enroll_course(self.student, str(self.course.id))

        url = reverse('learning:my_course_detail', kwargs={'course_identifier': str(self.course.id)})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.student_tokens['access']}")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['course']['id'], str(self.course.id))
        self.assertEqual(len(response.data['data']['lesson_progresses']), 2)

    # ==================== 2. TEST PROGRESS & CERTIFICATE APIS ====================
    def test_track_video_progress_api(self):
        """API lưu giây video đang xem dở."""
        EnrollmentService.enroll_course(self.student, str(self.course.id))

        url = reverse('learning:track_lesson_progress', kwargs={'lesson_id': self.lesson1.id})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.student_tokens['access']}")
        response = self.client.post(url, {'last_watched_second': 95})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['last_watched_second'], 95)

    def test_complete_lesson_and_receive_certificate_api(self):
        """API đánh dấu hoàn thành bài học và tự động cấp chứng chỉ khi hoàn thành 100%."""
        EnrollmentService.enroll_course(self.student, str(self.course.id))

        # 1. Hoàn thành bài 1
        url_1 = reverse('learning:complete_lesson', kwargs={'lesson_id': self.lesson1.id})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.student_tokens['access']}")
        res_1 = self.client.post(url_1)

        self.assertEqual(res_1.status_code, status.HTTP_200_OK)
        self.assertFalse(res_1.data['data']['is_course_completed'])
        self.assertEqual(float(res_1.data['data']['progress_percent']), 50.00)
        self.assertIsNone(res_1.data['data']['certificate'])

        # 2. Hoàn thành bài 2 (Đạt 100% -> Nhận chứng chỉ)
        url_2 = reverse('learning:complete_lesson', kwargs={'lesson_id': self.lesson2.id})
        res_2 = self.client.post(url_2)

        self.assertEqual(res_2.status_code, status.HTTP_200_OK)
        self.assertTrue(res_2.data['data']['is_course_completed'])
        self.assertEqual(float(res_2.data['data']['progress_percent']), 100.00)
        self.assertIsNotNone(res_2.data['data']['certificate'])

        cert_code = res_2.data['data']['certificate']['certificate_code']

        # 3. Lấy danh sách chứng chỉ của tôi
        cert_list_url = reverse('learning:my_certificates')
        cert_list_res = self.client.get(cert_list_url)
        self.assertEqual(cert_list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(cert_list_res.data['data']), 1)

        # 4. Xác thực chứng chỉ công khai không cần đăng nhập
        self.client.credentials()  # Xóa token xác thực
        verify_url = reverse('learning:verify_certificate', kwargs={'certificate_code': cert_code})
        verify_res = self.client.get(verify_url)

        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertEqual(verify_res.data['data']['student_name'], self.student.full_name)
        self.assertEqual(verify_res.data['data']['course_title'], self.course.title)

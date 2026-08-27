from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.accounts.services import AuthService
from apps.courses.models import Category, Course, Chapter, Lesson, Material, CourseStatus, MaterialType
from apps.courses.services import CourseService, CurriculumService


class CoursesAPITest(APITestCase):
    """
    Bộ kiểm thử tích hợp (API Integration Tests) cho toàn bộ Endpoints của module Courses.
    """

    def setUp(self):
        self.password = 'StrongPassword123!'

        # 1. Tạo Giáo viên A
        self.teacher_a = CustomUser.objects.create_user(
            email='teacher_a@example.com',
            password=self.password,
            full_name='Teacher A',
            role=UserRole.TEACHER
        )
        self.teacher_a_tokens = AuthService.generate_tokens_for_user(self.teacher_a)

        # 2. Tạo Giáo viên B
        self.teacher_b = CustomUser.objects.create_user(
            email='teacher_b@example.com',
            password=self.password,
            full_name='Teacher B',
            role=UserRole.TEACHER
        )
        self.teacher_b_tokens = AuthService.generate_tokens_for_user(self.teacher_b)

        # 3. Tạo Admin
        self.admin_user = CustomUser.objects.create_superuser(
            email='admin_course@example.com',
            password=self.password,
            full_name='Admin Course'
        )
        self.admin_tokens = AuthService.generate_tokens_for_user(self.admin_user)

        # 4. Tạo Học viên
        self.student = CustomUser.objects.create_user(
            email='student_course@example.com',
            password=self.password,
            full_name='Student Course',
            role=UserRole.STUDENT
        )
        self.student_tokens = AuthService.generate_tokens_for_user(self.student)

        # 5. Dữ liệu mẫu
        self.category = Category.objects.create(
            name='Grammar Master',
            description='All about English Grammar'
        )
        self.course = CourseService.create_course(self.teacher_a, {
            'title': 'English Grammar 101',
            'description': 'Basic Grammar for Beginners',
            'category': self.category,
            'level': EnglishLevel.A1,
            'price': 0,
            'status': CourseStatus.PUBLISHED
        })
        self.chapter = CurriculumService.create_chapter(self.course, {'title': 'Chapter 1: Tenses'})
        self.lesson = CurriculumService.create_lesson(self.chapter, {
            'title': 'Lesson 1: Present Simple',
            'is_preview': True,
            'duration_minutes': 20
        })

    # ==================== 1. TEST CATEGORY APIS ====================
    def test_list_categories_public(self):
        """Khách / Học viên có thể lấy danh sách danh mục."""
        url = reverse('courses:category_list_create')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

    def test_create_category_admin_only(self):
        """Chỉ Admin mới có quyền tạo danh mục mới."""
        url = reverse('courses:category_list_create')
        payload = {'name': 'Business English', 'description': 'For professionals'}

        # Học viên thử tạo -> 403 Forbidden
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.student_tokens['access']}")
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Admin tạo -> 201 Created
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.admin_tokens['access']}")
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['name'], 'Business English')

    # ==================== 2. TEST COURSE APIS ====================
    def test_list_courses_with_filters(self):
        """Lấy danh sách khóa học có phân trang và bộ lọc."""
        url = reverse('courses:course_list_create')
        response = self.client.get(url, {'level': 'A1', 'is_free': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_create_course_teacher_only(self):
        """Chỉ Giáo viên hoặc Admin mới có quyền tạo khóa học."""
        url = reverse('courses:course_list_create')
        payload = {
            'title': 'IELTS Speaking Intensive',
            'description': 'Band 7.0 target',
            'category_id': self.category.id,
            'level': 'B2',
            'price': 499000
        }

        # Học viên tạo -> 403
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.student_tokens['access']}")
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Giáo viên tạo -> 201
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.teacher_a_tokens['access']}")
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['title'], 'IELTS Speaking Intensive')

    def test_get_my_teaching_courses(self):
        """Giáo viên xem các khóa học do chính mình giảng dạy."""
        url = reverse('courses:my_teaching_courses')
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.teacher_a_tokens['access']}")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)

    def test_update_course_owner_permission(self):
        """Chỉ giáo viên sở hữu mới có quyền chỉnh sửa khóa học."""
        url = reverse('courses:course_detail', kwargs={'identifier': str(self.course.id)})
        payload = {'title': 'English Grammar 101 - Updated'}

        # Giáo viên B thử sửa khóa học của Giáo viên A -> 403 Forbidden
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.teacher_b_tokens['access']}")
        response = self.client.patch(url, payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Giáo viên A sửa khóa học của mình -> 200 OK
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.teacher_a_tokens['access']}")
        response = self.client.patch(url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['title'], 'English Grammar 101 - Updated')

    # ==================== 3. TEST CURRICULUM APIS ====================
    def test_create_chapter_and_lesson(self):
        """Giáo viên tạo chương học và bài học mới."""
        chapter_url = reverse('courses:chapter_create', kwargs={'course_id': self.course.id})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.teacher_a_tokens['access']}")

        # 1. Tạo Chapter
        chapter_res = self.client.post(chapter_url, {'title': 'Chapter 2: Conditionals'})
        self.assertEqual(chapter_res.status_code, status.HTTP_201_CREATED)
        chapter_id = chapter_res.data['data']['id']

        # 2. Tạo Lesson
        lesson_url = reverse('courses:lesson_create', kwargs={'chapter_id': chapter_id})
        lesson_res = self.client.post(lesson_url, {
            'title': 'First Conditional',
            'content': 'If + Present Simple, Will + V',
            'duration_minutes': 15,
            'is_preview': False
        })
        self.assertEqual(lesson_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(lesson_res.data['data']['title'], 'First Conditional')

    def test_get_preview_lesson_success(self):
        """Học viên có thể xem chi tiết bài học thử (is_preview=True)."""
        url = reverse('courses:lesson_detail', kwargs={'lesson_id': str(self.lesson.id)})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.student_tokens['access']}")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['id'], str(self.lesson.id))

    def test_material_create_and_delete(self):
        """Giáo viên đính kèm tài liệu vào bài học và xóa tài liệu."""
        material_create_url = reverse('courses:material_create', kwargs={'lesson_id': str(self.lesson.id)})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.teacher_a_tokens['access']}")

        # Tạo tài liệu
        payload = {
            'title': 'Present Simple Exercises PDF',
            'file_url': 'https://example.com/ex.pdf',
            'file_type': 'PDF',
            'file_size_bytes': 204800
        }
        res = self.client.post(material_create_url, payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        material_id = res.data['data']['id']

        # Xóa tài liệu
        delete_url = reverse('courses:material_detail', kwargs={'material_id': material_id})
        del_res = self.client.delete(delete_url)
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)

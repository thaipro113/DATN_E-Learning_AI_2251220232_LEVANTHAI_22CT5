from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.ai.models import ChatSession, ChatMessage, SessionType, MessageSenderType


class AIViewsTest(APITestCase):
    """
    Bộ kiểm thử tích hợp (Integration Tests) cho các Endpoints AI Chatbot và Grammar Checker.
    """

    def setUp(self):
        # 1. Tạo Users
        self.student = CustomUser.objects.create_user(
            email='student.ai.view@example.com',
            password='Password123!',
            full_name='Student AI View',
            role=UserRole.STUDENT,
            level=EnglishLevel.B1
        )
        self.other_student = CustomUser.objects.create_user(
            email='other.ai.view@example.com',
            password='Password123!',
            full_name='Other AI View',
            role=UserRole.STUDENT
        )

        # 2. JWT Tokens
        self.token = str(RefreshToken.for_user(self.student).access_token)
        self.other_token = str(RefreshToken.for_user(self.other_student).access_token)

        # 3. Tạo phiên chat mẫu
        self.session = ChatSession.objects.create(
            student=self.student,
            title="Interview Preparation Roleplay",
            session_type=SessionType.ROLEPLAY,
            target_level=EnglishLevel.B2
        )

    def test_create_and_list_chat_sessions(self):
        """
        Kiểm tra POST & GET /api/v1/ai/sessions/:
        - Học viên tạo phiên chat mới (201).
        - Lấy danh sách các phiên chat của mình (200).
        """
        url = reverse('ai:session_list_create')

        # 1. Chưa đăng nhập -> 401
        res_unauth = self.client.get(url)
        self.assertEqual(res_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Đăng nhập -> Tạo session mới
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        create_payload = {
            'title': "Grammar Fix Session",
            'session_type': 'GRAMMAR_CHECK',
            'target_level': 'B1'
        }
        res_create = self.client.post(url, create_payload, format='json')
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_create.data['data']['title'], "Grammar Fix Session")

        # 3. Lấy danh sách sessions
        res_list = self.client.get(url)
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_list.data['results']), 2)

    def test_get_session_detail_and_isolation(self):
        """
        Kiểm tra GET /api/v1/ai/sessions/<session_id>/:
        - Học viên sở hữu xem được chi tiết (200).
        - Học viên khác không xem được (404 - Cách ly dữ liệu).
        """
        url = reverse('ai:session_detail', kwargs={'session_id': self.session.id})

        # 1. Học viên khác truy cập -> 404
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.other_token}')
        res_other = self.client.get(url)
        self.assertEqual(res_other.status_code, status.HTTP_404_NOT_FOUND)

        # 2. Học viên chính chủ truy cập -> 200
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        res_owner = self.client.get(url)
        self.assertEqual(res_owner.status_code, status.HTTP_200_OK)
        self.assertEqual(res_owner.data['data']['title'], "Interview Preparation Roleplay")

    def test_send_message_to_ai_tutor_endpoint(self):
        """
        Kiểm tra POST /api/v1/ai/sessions/<session_id>/send/:
        - Gửi câu hỏi đến AI Tutor và nhận câu trả lời phản hồi thành công (201).
        """
        url = reverse('ai:send_message', kwargs={'session_id': self.session.id})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        payload = {
            'content': "Can you ask me a question for a software developer job interview?"
        }
        response = self.client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user_message', response.data['data'])
        self.assertIn('ai_message', response.data['data'])
        self.assertEqual(response.data['data']['user_message']['content'], payload['content'])
        self.assertTrue(len(response.data['data']['ai_message']['content']) > 0)

    def test_grammar_check_direct_endpoint(self):
        """
        Kiểm tra POST /api/v1/ai/grammar-check/:
        - Phân tích và sửa lỗi ngữ pháp văn bản (200).
        """
        url = reverse('ai:grammar_check')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        payload = {
            'text': "I go to school yesterday and I meet my friend.",
            'target_level': 'B1'
        }
        response = self.client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['data']['has_errors'])
        self.assertIn('went', response.data['data']['corrected_text'])
        self.assertTrue(len(response.data['data']['errors']) > 0)

    def test_generate_teacher_quiz_api(self):
        """
        Kiểm tra POST /api/v1/ai/quizzes/generate/:
        - Giáo viên sinh câu hỏi theo chủ đề (200).
        - Học viên không có quyền (403).
        """
        url = reverse('ai:generate_teacher_quiz')

        # 1. Tạo Giáo viên
        teacher = CustomUser.objects.create_user(
            email='teacher.ai.view@example.com',
            password='Password123!',
            full_name='Teacher AI View',
            role=UserRole.TEACHER
        )
        teacher_token = str(RefreshToken.for_user(teacher).access_token)

        payload = {
            'topic': 'Present Perfect vs Past Simple',
            'level': 'B1',
            'count': 5,
            'skill': 'GRAMMAR'
        }

        # 2. Học viên gọi -> 403 Forbidden
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        res_student = self.client.post(url, payload, format='json')
        self.assertEqual(res_student.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Giáo viên gọi -> 200 OK
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {teacher_token}')
        res_teacher = self.client.post(url, payload, format='json')
        self.assertEqual(res_teacher.status_code, status.HTTP_200_OK)
        self.assertTrue(len(res_teacher.data['data']) >= 3)
        self.assertIn('content', res_teacher.data['data'][0])

    def test_generate_progress_quiz_api(self):
        """
        Kiểm tra POST /api/v1/ai/quizzes/generate-by-progress/:
        - Học viên sinh đề ôn tập AI sau khi hoàn thành bài học trong Chapter (201).
        """
        from apps.courses.models import Category, Course, Chapter, Lesson
        from apps.learning.models import Enrollment, LessonProgress

        # 1. Tạo khóa học, chương và bài học
        cat = Category.objects.create(name='View Test Cat')
        teacher = CustomUser.objects.create_user(
            email='teacher.prog.view@example.com',
            password='Password123!',
            full_name='Teacher Prog',
            role=UserRole.TEACHER
        )
        course = Course.objects.create(
            category=cat,
            teacher=teacher,
            title='IELTS Prep B1',
            level=EnglishLevel.B1,
            status='PUBLISHED'
        )
        chapter = Chapter.objects.create(course=course, title='Chapter 1: Reading Skills')
        lesson = Lesson.objects.create(chapter=chapter, title='Lesson 1: Skimming and Scanning')

        url = reverse('ai:generate_progress_quiz')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        # 2. Chưa ghi danh -> 400 Bad Request
        res_fail = self.client.post(url, {'chapter_id': str(chapter.id)}, format='json')
        self.assertEqual(res_fail.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Đã ghi danh & hoàn thành bài học -> 201 Created
        enrollment = Enrollment.objects.create(student=self.student, course=course)
        LessonProgress.objects.create(enrollment=enrollment, lesson=lesson, is_completed=True)

        res_success = self.client.post(url, {'chapter_id': str(chapter.id), 'num_questions': 5}, format='json')
        self.assertEqual(res_success.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res_success.data['success'])
        self.assertEqual(res_success.data['data']['quiz_type'], 'PRACTICE')
        self.assertTrue(res_success.data['data']['total_questions'] >= 3)


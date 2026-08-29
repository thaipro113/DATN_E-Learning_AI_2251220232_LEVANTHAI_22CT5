from decimal import Decimal
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.assessments.models import (
    Quiz,
    Question,
    AnswerOption,
    QuizAttempt,
    QuizType,
    QuestionType,
    SkillType,
    AttemptStatus
)


class AssessmentViewsTest(APITestCase):
    """
    Bộ kiểm thử tích hợp (Integration Tests) cho các Endpoints trong apps/assessments.
    """

    def setUp(self):
        # 1. Tạo Users
        self.teacher = CustomUser.objects.create_user(
            email='teacher.view@example.com',
            password='Password123!',
            full_name='Teacher View',
            role=UserRole.TEACHER
        )
        self.student = CustomUser.objects.create_user(
            email='student.view@example.com',
            password='Password123!',
            full_name='Student View',
            role=UserRole.STUDENT
        )

        # 2. JWT Tokens
        self.teacher_token = str(RefreshToken.for_user(self.teacher).access_token)
        self.student_token = str(RefreshToken.for_user(self.student).access_token)

        # 3. Tạo đề thi mẫu
        self.quiz = Quiz.objects.create(
            title="English Level Placement Test",
            quiz_type=QuizType.PLACEMENT,
            level=EnglishLevel.B1,
            time_limit_minutes=30,
            passing_score=Decimal('50.00'),
            is_published=True,
            created_by=self.teacher
        )

        self.q1 = Question.objects.create(
            quiz=self.quiz,
            content="What is the capital of England?",
            question_type=QuestionType.SINGLE_CHOICE,
            skill=SkillType.VOCABULARY,
            points=Decimal('2.00'),
            order_index=1,
            explanation="London is the capital and largest city of England."
        )
        self.opt_correct = AnswerOption.objects.create(
            question=self.q1,
            content="London",
            is_correct=True,
            order_index=1
        )
        self.opt_wrong = AnswerOption.objects.create(
            question=self.q1,
            content="Paris",
            is_correct=False,
            order_index=2
        )

    def test_quiz_list_api(self):
        """
        Kiểm tra GET /api/v1/assessments/quizzes/ (Public/Học viên).
        """
        url = reverse('assessments:quiz_list_create')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], "English Level Placement Test")

    def test_teacher_create_quiz_and_permissions(self):
        """
        Kiểm tra POST /api/v1/assessments/quizzes/:
        - Giáo viên được phép tạo đề thi (201).
        - Học viên bị chặn 403.
        """
        url = reverse('assessments:quiz_list_create')
        payload = {
            'title': "TOEIC Practice Test 1",
            'quiz_type': 'PRACTICE',
            'level': 'B2',
            'time_limit_minutes': 60,
            'passing_score': 60.00,
            'is_published': True
        }

        # 1. Học viên thử tạo -> 403
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        response_student = self.client.post(url, payload, format='json')
        self.assertEqual(response_student.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Giáo viên tạo -> 201
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher_token}')
        response_teacher = self.client.post(url, payload, format='json')
        self.assertEqual(response_teacher.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response_teacher.data['data']['title'], "TOEIC Practice Test 1")

    def test_quiz_detail_anti_cheating_views(self):
        """
        Kiểm tra GET /api/v1/assessments/quizzes/<quiz_id>/:
        - Học viên không thấy trường 'is_correct' trong options (Bảo mật chống lộ đề).
        - Giáo viên thấy đầy đủ trường 'is_correct'.
        """
        url = reverse('assessments:quiz_detail', kwargs={'quiz_id': self.quiz.id})

        # 1. Học viên xem đề thi
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        response_student = self.client.get(url)
        self.assertEqual(response_student.status_code, status.HTTP_200_OK)
        student_q1_opts = response_student.data['data']['questions'][0]['options']
        self.assertNotIn('is_correct', student_q1_opts[0])

        # 2. Giáo viên tạo đề xem
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher_token}')
        response_teacher = self.client.get(url)
        self.assertEqual(response_teacher.status_code, status.HTTP_200_OK)
        teacher_q1_opts = response_teacher.data['data']['questions'][0]['options']
        self.assertIn('is_correct', teacher_q1_opts[0])
        self.assertTrue(teacher_q1_opts[0]['is_correct'])

    def test_full_quiz_taking_grading_and_results_flow(self):
        """
        Kiểm tra toàn bộ luồng học viên: Bắt đầu làm bài -> Nộp bài -> Xem bảng điểm & Báo cáo kỹ năng.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')

        # 1. Bắt đầu làm bài (POST /start/)
        start_url = reverse('assessments:start_quiz_attempt', kwargs={'quiz_id': self.quiz.id})
        start_res = self.client.post(start_url)
        self.assertEqual(start_res.status_code, status.HTTP_201_CREATED)
        attempt_id = start_res.data['data']['attempt_id']
        self.assertIsNotNone(attempt_id)

        # 2. Nộp bài (POST /submit/)
        submit_url = reverse('assessments:submit_quiz_attempt', kwargs={'attempt_id': attempt_id})
        submit_payload = {
            'answers': [
                {
                    'question_id': str(self.q1.id),
                    'selected_option_id': str(self.opt_correct.id)
                }
            ]
        }
        submit_res = self.client.post(submit_url, submit_payload, format='json')
        self.assertEqual(submit_res.status_code, status.HTTP_200_OK)
        self.assertEqual(submit_res.data['data']['status'], 'COMPLETED')
        self.assertEqual(submit_res.data['data']['score'], '2.00')
        self.assertEqual(submit_res.data['data']['percentage'], '100.00')
        self.assertTrue(submit_res.data['data']['is_passed'])
        self.assertTrue(len(submit_res.data['data']['skill_breakdown']) > 0)

        # 3. Xem lại kết quả bài thi (GET /results/)
        results_url = reverse('assessments:quiz_attempt_results', kwargs={'attempt_id': attempt_id})
        results_res = self.client.get(results_url)
        self.assertEqual(results_res.status_code, status.HTTP_200_OK)
        self.assertEqual(results_res.data['data']['quiz_title'], "English Level Placement Test")
        self.assertEqual(results_res.data['data']['answers'][0]['explanation'], "London is the capital and largest city of England.")

        # 4. Xem lịch sử làm bài (GET /my-attempts/)
        history_url = reverse('assessments:my_quiz_attempts')
        history_res = self.client.get(history_url)
        self.assertEqual(history_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(history_res.data['results']), 1)

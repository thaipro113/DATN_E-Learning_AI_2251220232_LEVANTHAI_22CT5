from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.assessments.models import Quiz, QuizType
from apps.quiz_import.models import QuizImportBatch, ImportSourceType, BatchStatus


class QuizImportViewsTest(APITestCase):
    """
    Bộ kiểm thử tích hợp (Integration Tests) cho các Endpoints trong apps/quiz_import.
    """

    def setUp(self):
        # 1. Tạo Users
        self.teacher = CustomUser.objects.create_user(
            email='teacher.import.view@example.com',
            password='Password123!',
            full_name='Teacher Import View',
            role=UserRole.TEACHER
        )
        self.token = str(RefreshToken.for_user(self.teacher).access_token)

        # 2. Tạo Đề thi mẫu
        self.quiz = Quiz.objects.create(
            title="Import Target Quiz",
            quiz_type=QuizType.PRACTICE,
            level=EnglishLevel.B2,
            passing_score=80.0,
            is_published=True
        )

    def test_upload_quiz_raw_text_endpoint(self):
        """
        Kiểm tra POST /api/v1/quiz-import/upload/:
        - Bóc tách văn bản thô trả về 201 Created kèm Preview Data.
        - Chặn chưa đăng nhập (401).
        """
        url = reverse('quiz_import:upload_quiz')

        payload = {
            'title': 'Test Raw Upload',
            'source_type': 'RAW_TEXT',
            'raw_text': "1. What is AI?\n*A. Artificial Intelligence\nB. Apple Inc\nAnswer: A"
        }

        # 1. Chưa đăng nhập -> 401
        res_unauth = self.client.post(url, payload, format='json')
        self.assertEqual(res_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Đã đăng nhập -> 201
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        res_auth = self.client.post(url, payload, format='json')
        self.assertEqual(res_auth.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_auth.data['data']['total_parsed'], 1)
        self.assertEqual(len(res_auth.data['data']['parsed_data']), 1)

    def test_get_batch_detail_and_list_endpoints(self):
        """
        Kiểm tra GET /api/v1/quiz-import/batches/ và GET /api/v1/quiz-import/batches/<batch_id>/.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        batch = QuizImportBatch.objects.create(
            teacher=self.teacher,
            title="My Existing Batch",
            source_type=ImportSourceType.RAW_TEXT,
            status=BatchStatus.PARSED,
            total_parsed=1,
            parsed_data=[{'content': 'Sample?', 'options': [{'content': 'Yes', 'is_correct': True}]}]
        )

        # 1. Lấy danh sách batches
        url_list = reverse('quiz_import:list_batches')
        res_list = self.client.get(url_list)
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertTrue(len(res_list.data['data']) > 0)

        # 2. Lấy chi tiết batch
        url_detail = reverse('quiz_import:batch_detail', kwargs={'batch_id': batch.id})
        res_detail = self.client.get(url_detail)
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(res_detail.data['data']['title'], "My Existing Batch")

    def test_confirm_import_endpoint(self):
        """
        Kiểm tra POST /api/v1/quiz-import/batches/<batch_id>/confirm/:
        - Xác nhận chèn câu hỏi vào Đề thi thành công (200).
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        batch = QuizImportBatch.objects.create(
            teacher=self.teacher,
            title="Batch to Confirm",
            source_type=ImportSourceType.RAW_TEXT,
            status=BatchStatus.PARSED,
            total_parsed=1,
            parsed_data=[{
                'content': 'How are you?',
                'question_type': 'SINGLE_CHOICE',
                'skill': 'GRAMMAR',
                'points': 10.0,
                'explanation': 'Greeting expression',
                'options': [
                    {'content': 'Fine, thank you', 'is_correct': True},
                    {'content': 'Apple', 'is_correct': False}
                ]
            }]
        )

        url_confirm = reverse('quiz_import:confirm_import', kwargs={'batch_id': batch.id})
        payload = {
            'quiz_id': str(self.quiz.id)
        }

        res = self.client.post(url_confirm, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['imported_count'], 1)
        self.assertEqual(self.quiz.questions.count(), 1)

from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.courses.models import Category, Course
from apps.recommendations.models import (
    LearningPath,
    LearningPathStep,
    SkillGapAnalysis,
    CourseRecommendation,
    LearningPathStatus,
    StepType
)
from apps.recommendations.services import LearningPathService


class RecommendationsViewsTest(APITestCase):
    """
    Bộ kiểm thử tích hợp (Integration Tests) cho các Endpoints trong apps/recommendations.
    """

    def setUp(self):
        # 1. Tạo Giáo viên & Học viên
        self.teacher = CustomUser.objects.create_user(
            email='teacher.rec.view@example.com',
            password='Password123!',
            full_name='Teacher Rec View',
            role=UserRole.TEACHER
        )
        self.student = CustomUser.objects.create_user(
            email='student.rec.view@example.com',
            password='Password123!',
            full_name='Student Rec View',
            role=UserRole.STUDENT,
            level=EnglishLevel.B1
        )
        self.token = str(RefreshToken.for_user(self.student).access_token)

        # 2. Tạo Khóa học mẫu
        self.category = Category.objects.create(name="View Cat", slug="view-cat")
        self.course = Course.objects.create(
            teacher=self.teacher,
            title="IELTS Speaking Pro",
            slug="ielts-speaking-pro-view",
            category=self.category,
            level=EnglishLevel.B2,
            price=0,
            status='PUBLISHED'
        )

    def test_get_my_learning_path_endpoint(self):
        """
        Kiểm tra GET /api/v1/recommendations/my-learning-path/:
        - Tự động sinh lộ trình nếu học viên chưa có (200).
        - Chặn truy cập chưa đăng nhập (401).
        """
        url = reverse('recommendations:my_learning_path')

        # 1. Chưa đăng nhập -> 401
        res_unauth = self.client.get(url)
        self.assertEqual(res_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Đăng nhập -> 200 (Tự động sinh lộ trình)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        res_auth = self.client.get(url)
        self.assertEqual(res_auth.status_code, status.HTTP_200_OK)
        self.assertIn('steps', res_auth.data['data'])
        self.assertEqual(len(res_auth.data['data']['steps']), 5)

    def test_generate_new_learning_path_endpoint(self):
        """
        Kiểm tra POST /api/v1/recommendations/generate-path/:
        - Học viên yêu cầu AI tái tạo lộ trình mới (201).
        """
        url = reverse('recommendations:generate_learning_path')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        payload = {
            'target_level': 'C1',
            'goal_description': 'Pass C1 Advanced in 4 months'
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['data']['target_level'], 'C1')
        self.assertEqual(res.data['data']['goal_description'], payload['goal_description'])

    def test_complete_step_endpoint(self):
        """
        Kiểm tra PATCH /api/v1/recommendations/steps/<step_id>/complete/:
        - Đánh dấu hoàn thành bước thành công (200).
        """
        path = LearningPathService.generate_adaptive_learning_path(self.student)
        first_step = path.steps.first()

        url = reverse('recommendations:complete_step', kwargs={'step_id': first_step.id})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        res = self.client.patch(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['data']['is_completed'])

    def test_skill_gaps_and_course_recommendations_endpoints(self):
        """
        Kiểm tra GET skill-gaps và GET/POST courses recommendations.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        # 1. Skill gaps
        url_gaps = reverse('recommendations:skill_gaps')
        res_gaps = self.client.get(url_gaps)
        self.assertEqual(res_gaps.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_gaps.data['data']), 6)

        # 2. Course recommendations
        url_recs = reverse('recommendations:course_recommendations')
        res_recs = self.client.get(url_recs)
        self.assertEqual(res_recs.status_code, status.HTTP_200_OK)
        self.assertTrue(len(res_recs.data['data']) > 0)

        # 3. Dismiss recommendation
        rec_id = res_recs.data['data'][0]['id']
        url_dismiss = reverse('recommendations:dismiss_course_recommendation', kwargs={'recommendation_id': rec_id})
        res_dismiss = self.client.post(url_dismiss)
        self.assertEqual(res_dismiss.status_code, status.HTTP_200_OK)

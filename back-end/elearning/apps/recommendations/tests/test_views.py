from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import CustomUser

class MistakeAnalysisViewsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = CustomUser.objects.create_user(
            email='test_student@example.com',
            password='password123',
            full_name='Test Student'
        )
        self.client.force_authenticate(user=self.student)

    def test_student_mistakes_endpoint(self):
        url = reverse('recommendations:student_mistakes')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

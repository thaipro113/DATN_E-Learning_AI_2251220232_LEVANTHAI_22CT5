from django.test import TestCase
from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.accounts.services import AuthService


class AuthServiceTest(TestCase):
    """
    Bộ kiểm thử cho tầng nghiệp vụ AuthService.
    """

    def setUp(self):
        self.user_data = {
            'email': 'service_user@example.com',
            'password': 'StrongPassword123!',
            'confirm_password': 'StrongPassword123!',
            'full_name': 'Service Tester',
            'role': UserRole.STUDENT,
            'level': EnglishLevel.B1
        }

    def test_register_user_creates_user_and_tokens(self):
        """Kiểm tra hàm register_user tạo User trong DB và trả về cặp Token hợp lệ."""
        user, tokens = AuthService.register_user(self.user_data)

        self.assertIsInstance(user, CustomUser)
        self.assertEqual(user.email, 'service_user@example.com')
        self.assertEqual(user.level, EnglishLevel.B1)
        self.assertIn('access', tokens)
        self.assertIn('refresh', tokens)
        self.assertTrue(len(tokens['access']) > 20)

    def test_generate_tokens_contains_custom_claims(self):
        """Kiểm tra Token payload chứa các thông tin email, role, full_name."""
        user, _ = AuthService.register_user(self.user_data)
        tokens = AuthService.generate_tokens_for_user(user)

        from rest_framework_simplejwt.tokens import AccessToken
        access_token = AccessToken(tokens['access'])

        self.assertEqual(access_token['email'], user.email)
        self.assertEqual(access_token['role'], user.role)
        self.assertEqual(access_token['full_name'], user.full_name)

    def test_login_user_updates_last_login_and_returns_tokens(self):
        """Kiểm tra hàm login_user cập nhật last_login và sinh token mới."""
        user, _ = AuthService.register_user(self.user_data)
        initial_last_login = user.last_login

        user, tokens = AuthService.login_user(user)

        self.assertIsNotNone(user.last_login)
        if initial_last_login:
            self.assertGreaterEqual(user.last_login, initial_last_login)
        self.assertIn('access', tokens)
        self.assertIn('refresh', tokens)

    def test_update_profile_service(self):
        """Kiểm tra hàm update_profile cập nhật đúng các trường thông tin."""
        user, _ = AuthService.register_user(self.user_data)
        update_data = {
            'full_name': 'Updated Name',
            'level': EnglishLevel.B2,
            'bio': 'Learning English for work',
            'phone_number': '0987654321'
        }

        updated_user = AuthService.update_profile(user, update_data)

        self.assertEqual(updated_user.full_name, 'Updated Name')
        self.assertEqual(updated_user.level, EnglishLevel.B2)
        self.assertEqual(updated_user.bio, 'Learning English for work')
        self.assertEqual(updated_user.phone_number, '0987654321')

    def test_change_password_service(self):
        """Kiểm tra hàm change_password băm và lưu mật khẩu mới."""
        user, _ = AuthService.register_user(self.user_data)
        AuthService.change_password(user, 'NewBrandPassword456!')

        # Kiểm tra mật khẩu cũ không còn dùng được
        self.assertFalse(user.check_password('StrongPassword123!'))
        # Kiểm tra mật khẩu mới hoạt động
        self.assertTrue(user.check_password('NewBrandPassword456!'))

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.accounts.services import AuthService


class AccountsAPITest(APITestCase):
    """
    Bộ kiểm thử tích hợp (API Integration Tests) cho toàn bộ Endpoints của module Accounts.
    """

    def setUp(self):
        self.register_url = reverse('accounts:register')
        self.login_url = reverse('accounts:login')
        self.refresh_url = reverse('accounts:token_refresh')
        self.profile_url = reverse('accounts:user_profile')
        self.change_password_url = reverse('accounts:change_password')

        self.user_password = 'ValidPassword123!'
        self.user = CustomUser.objects.create_user(
            email='existing_user@example.com',
            password=self.user_password,
            full_name='Existing User',
            role=UserRole.STUDENT,
            level=EnglishLevel.A2
        )
        self.tokens = AuthService.generate_tokens_for_user(self.user)

    # ------------------ 1. Test Register API ------------------
    def test_register_success(self):
        """Đăng ký tài khoản mới thành công."""
        payload = {
            'email': 'new_student@example.com',
            'full_name': 'New Student',
            'password': 'StrongPassword123!',
            'confirm_password': 'StrongPassword123!',
            'role': 'STUDENT',
            'level': 'B1'
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('tokens', response.data['data'])
        self.assertEqual(response.data['data']['user']['email'], 'new_student@example.com')

    def test_register_duplicate_email_fails(self):
        """Đăng ký với email đã tồn tại sẽ thất bại."""
        payload = {
            'email': 'existing_user@example.com',
            'full_name': 'Another User',
            'password': 'StrongPassword123!',
            'confirm_password': 'StrongPassword123!'
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_register_mismatched_password_fails(self):
        """Đăng ký với mật khẩu xác nhận không khớp sẽ thất bại."""
        payload = {
            'email': 'mismatch@example.com',
            'full_name': 'Mismatch User',
            'password': 'StrongPassword123!',
            'confirm_password': 'DifferentPassword123!'
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ------------------ 2. Test Login API ------------------
    def test_login_success(self):
        """Đăng nhập thành công với đúng email và mật khẩu."""
        payload = {
            'email': 'existing_user@example.com',
            'password': self.user_password
        }
        response = self.client.post(self.login_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('tokens', response.data['data'])
        self.assertEqual(response.data['data']['user']['email'], 'existing_user@example.com')

    def test_login_wrong_password_fails(self):
        """Đăng nhập sai mật khẩu sẽ thất bại."""
        payload = {
            'email': 'existing_user@example.com',
            'password': 'WrongPassword123!'
        }
        response = self.client.post(self.login_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_login_inactive_user_fails(self):
        """Đăng nhập với tài khoản bị vô hiệu hóa sẽ thất bại."""
        self.user.is_active = False
        self.user.save()

        payload = {
            'email': 'existing_user@example.com',
            'password': self.user_password
        }
        response = self.client.post(self.login_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ------------------ 3. Test Token Refresh API ------------------
    def test_token_refresh_success(self):
        """Làm mới token thành công với Refresh Token hợp lệ."""
        payload = {'refresh': self.tokens['refresh']}
        response = self.client.post(self.refresh_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('access', response.data['data'])

    def test_token_refresh_invalid_token_fails(self):
        """Làm mới token thất bại khi gửi token rác."""
        payload = {'refresh': 'invalid.token.here'}
        response = self.client.post(self.refresh_url, payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])

    # ------------------ 4. Test User Profile API ------------------
    def test_get_profile_unauthenticated_fails(self):
        """Truy cập hồ sơ khi chưa đăng nhập sẽ bị từ chối 401."""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_profile_authenticated_success(self):
        """Lấy thông tin hồ sơ của tài khoản đang đăng nhập."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.tokens['access']}")
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['email'], 'existing_user@example.com')

    def test_patch_profile_success(self):
        """Cập nhật thông tin cá nhân qua PATCH."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.tokens['access']}")
        payload = {
            'full_name': 'Nguyen Van Cap Nhat',
            'level': 'B2',
            'bio': 'Passionate about English'
        }
        response = self.client.patch(self.profile_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['full_name'], 'Nguyen Van Cap Nhat')
        self.assertEqual(response.data['data']['level'], 'B2')

    # ------------------ 5. Test Change Password API ------------------
    def test_change_password_success(self):
        """Đổi mật khẩu thành công."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.tokens['access']}")
        payload = {
            'old_password': self.user_password,
            'new_password': 'BrandNewPassword789!',
            'confirm_new_password': 'BrandNewPassword789!'
        }
        response = self.client.post(self.change_password_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

        # Xác thực mật khẩu mới có đăng nhập được không
        login_response = self.client.post(self.login_url, {
            'email': 'existing_user@example.com',
            'password': 'BrandNewPassword789!'
        })
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

    def test_change_password_wrong_old_password_fails(self):
        """Đổi mật khẩu thất bại khi nhập sai mật khẩu cũ."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.tokens['access']}")
        payload = {
            'old_password': 'WrongOldPassword!',
            'new_password': 'BrandNewPassword789!',
            'confirm_new_password': 'BrandNewPassword789!'
        }
        response = self.client.post(self.change_password_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

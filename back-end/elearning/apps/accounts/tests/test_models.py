from django.test import TestCase
from apps.accounts.models import CustomUser, UserRole, EnglishLevel


class CustomUserModelTest(TestCase):
    """
    Bộ kiểm thử cho CustomUser model và CustomUserManager.
    """

    def test_create_user_successful(self):
        """Kiểm tra tạo người dùng thành công với email và password."""
        user = CustomUser.objects.create_user(
            email='student@example.com',
            password='TestPassword123!',
            full_name='Nguyen Van A'
        )
        self.assertEqual(user.email, 'student@example.com')
        self.assertEqual(user.full_name, 'Nguyen Van A')
        self.assertTrue(user.check_password('TestPassword123!'))
        self.assertEqual(user.role, UserRole.STUDENT)
        self.assertEqual(user.level, EnglishLevel.A1)
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_normalizes_email(self):
        """Kiểm tra email được chuẩn hóa về chữ thường."""
        user = CustomUser.objects.create_user(
            email='Student@GMAIL.COM',
            password='TestPassword123!',
            full_name='Nguyen Van B'
        )
        self.assertEqual(user.email, 'Student@gmail.com')

    def test_create_user_without_email_raises_error(self):
        """Kiểm tra tạo người dùng không có email sẽ bắn ValueError."""
        with self.assertRaises(ValueError):
            CustomUser.objects.create_user(
                email='',
                password='TestPassword123!',
                full_name='No Email User'
            )

    def test_create_superuser_successful(self):
        """Kiểm tra tạo SuperUser với đầy đủ quyền quản trị."""
        admin_user = CustomUser.objects.create_superuser(
            email='admin@example.com',
            password='AdminPassword123!',
            full_name='Admin User'
        )
        self.assertEqual(admin_user.email, 'admin@example.com')
        self.assertEqual(admin_user.role, UserRole.ADMIN)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
        self.assertTrue(admin_user.is_active)

    def test_create_superuser_invalid_flags_raises_error(self):
        """Kiểm tra tạo SuperUser thiếu cờ is_staff/is_superuser sẽ bắn ValueError."""
        with self.assertRaises(ValueError):
            CustomUser.objects.create_superuser(
                email='admin_invalid@example.com',
                password='AdminPassword123!',
                full_name='Admin Invalid',
                is_staff=False
            )

        with self.assertRaises(ValueError):
            CustomUser.objects.create_superuser(
                email='admin_invalid2@example.com',
                password='AdminPassword123!',
                full_name='Admin Invalid 2',
                is_superuser=False
            )

    def test_user_role_properties(self):
        """Kiểm tra các properties tiện ích: is_student, is_teacher, is_admin_role."""
        student = CustomUser.objects.create_user(
            email='s@example.com',
            password='TestPassword123!',
            full_name='Student',
            role=UserRole.STUDENT
        )
        self.assertTrue(student.is_student)
        self.assertFalse(student.is_teacher)
        self.assertFalse(student.is_admin_role)

        teacher = CustomUser.objects.create_user(
            email='t@example.com',
            password='TestPassword123!',
            full_name='Teacher',
            role=UserRole.TEACHER
        )
        self.assertFalse(teacher.is_student)
        self.assertTrue(teacher.is_teacher)
        self.assertFalse(teacher.is_admin_role)

        admin = CustomUser.objects.create_user(
            email='a@example.com',
            password='TestPassword123!',
            full_name='Admin',
            role=UserRole.ADMIN
        )
        self.assertFalse(admin.is_student)
        self.assertFalse(admin.is_teacher)
        self.assertTrue(admin.is_admin_role)

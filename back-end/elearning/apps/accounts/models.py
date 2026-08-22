from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils.translation import gettext_lazy as _
from common.models import BaseModel
from .managers import CustomUserManager


class UserRole(models.TextChoices):
    STUDENT = 'STUDENT', _('Học viên')
    TEACHER = 'TEACHER', _('Giáo viên')
    ADMIN = 'ADMIN', _('Quản trị viên')


class EnglishLevel(models.TextChoices):
    A1 = 'A1', _('A1 - Beginner (Mới bắt đầu)')
    A2 = 'A2', _('A2 - Elementary (Sơ cấp)')
    B1 = 'B1', _('B1 - Intermediate (Trung cấp)')
    B2 = 'B2', _('B2 - Upper-Intermediate (Trung cao cấp)')
    C1 = 'C1', _('C1 - Advanced (Cao cấp)')
    C2 = 'C2', _('C2 - Proficiency (Thành thạo)')


class CustomUser(AbstractBaseUser, PermissionsMixin, BaseModel):
    """
    Custom User Model supporting Role-Based Access Control and English Proficiency Levels.
    Inherits UUID 'id', 'created_at', and 'updated_at' from BaseModel.
    """
    email = models.EmailField(
        _('Địa chỉ email'),
        unique=True,
        max_length=255,
        help_text=_('Dùng làm tên đăng nhập')
    )
    full_name = models.CharField(
        _('Họ và tên'),
        max_length=255,
        help_text=_('Họ tên đầy đủ của người dùng')
    )
    role = models.CharField(
        _('Vai trò'),
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.STUDENT,
        help_text=_('Phân quyền trong hệ thống')
    )
    level = models.CharField(
        _('Trình độ tiếng Anh'),
        max_length=10,
        choices=EnglishLevel.choices,
        default=EnglishLevel.A1,
        help_text=_('Trình độ hiện tại theo khung CEFR')
    )
    avatar_url = models.URLField(
        _('Ảnh đại diện'),
        max_length=500,
        blank=True,
        null=True,
        help_text=_('Đường dẫn ảnh đại diện')
    )
    phone_number = models.CharField(
        _('Số điện thoại'),
        max_length=20,
        blank=True,
        null=True
    )
    bio = models.TextField(
        _('Tiểu sử ngắn'),
        blank=True,
        null=True
    )
    is_active = models.BooleanField(
        _('Trạng thái hoạt động'),
        default=True,
        help_text=_('Chỉ định xem tài khoản này có được phép đăng nhập hay không.')
    )
    is_staff = models.BooleanField(
        _('Quyền truy cập Admin'),
        default=False,
        help_text=_('Chỉ định xem người dùng có thể đăng nhập vào trang admin hay không.')
    )

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        db_table = 'users'
        verbose_name = _('Người dùng')
        verbose_name_plural = _('Danh sách người dùng')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} ({self.email}) - {self.get_role_display()}"

    @property
    def is_teacher(self):
        return self.role == UserRole.TEACHER

    @property
    def is_student(self):
        return self.role == UserRole.STUDENT

    @property
    def is_admin_role(self):
        return self.role == UserRole.ADMIN

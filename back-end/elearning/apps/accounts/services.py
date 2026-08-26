import uuid
from typing import Tuple, Dict, Any
from django.utils import timezone
from django.db.models import Q
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser


class AuthService:
    """
    Tầng xử lý nghiệp vụ cho Xác thực (Authentication) và Quản lý Người dùng.
    """

    @staticmethod
    def register_user(validated_data: Dict[str, Any]) -> Tuple[CustomUser, Dict[str, str]]:
        """
        Đăng ký người dùng mới, tự động băm mật khẩu và cấp Token JWT.
        """
        validated_data.pop('confirm_password', None)
        password = validated_data.pop('password')

        user = CustomUser.objects.create_user(
            password=password,
            **validated_data
        )

        tokens = AuthService.generate_tokens_for_user(user)
        return user, tokens

    @staticmethod
    def login_user(user: CustomUser) -> Tuple[CustomUser, Dict[str, str]]:
        """
        Đăng nhập người dùng, cập nhật mốc thời gian last_login và cấp Token JWT mới.
        """
        user.last_login = timezone.now()
        user.save(update_fields=['last_login', 'updated_at'])

        tokens = AuthService.generate_tokens_for_user(user)
        return user, tokens

    @staticmethod
    def generate_tokens_for_user(user: CustomUser) -> Dict[str, str]:
        """
        Sinh cặp JWT Access Token và Refresh Token cho người dùng kèm Custom Claims.
        """
        refresh = RefreshToken.for_user(user)
        refresh['email'] = user.email
        refresh['role'] = user.role
        refresh['full_name'] = user.full_name

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }

    @staticmethod
    def update_profile(user: CustomUser, validated_data: Dict[str, Any]) -> CustomUser:
        """
        Cập nhật thông tin hồ sơ cá nhân của người dùng.
        """
        for attr, value in validated_data.items():
            setattr(user, attr, value)
        user.save()
        return user

    @staticmethod
    def change_password(user: CustomUser, new_password: str) -> CustomUser:
        """
        Đổi mật khẩu mới cho người dùng (tự động băm và lưu).
        """
        user.set_password(new_password)
        user.save(update_fields=['password', 'updated_at'])
        return user


class UserService:
    """
    Tầng xử lý nghiệp vụ Quản trị Người dùng dành riêng cho Admin.
    """

    @staticmethod
    def list_users(filters: Dict[str, Any] = None):
        """
        Lấy danh sách tất cả tài khoản với bộ lọc nâng cao dành cho Admin.
        """
        filters = filters or {}
        queryset = CustomUser.objects.all()

        role = filters.get('role')
        if role:
            queryset = queryset.filter(role=role.upper())

        level = filters.get('level')
        if level:
            queryset = queryset.filter(level=level.upper())

        is_active = filters.get('is_active')
        if is_active is not None:
            if str(is_active).lower() in ['true', '1']:
                queryset = queryset.filter(is_active=True)
            elif str(is_active).lower() in ['false', '0']:
                queryset = queryset.filter(is_active=False)

        search = filters.get('search')
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(full_name__icontains=search) |
                Q(phone_number__icontains=search)
            )

        ordering = filters.get('ordering', '-created_at')
        allowed_orderings = ['created_at', '-created_at', 'email', '-email', 'full_name', '-full_name', 'role']
        if ordering in allowed_orderings:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-created_at')

        return queryset

    @staticmethod
    def get_user_by_id(user_id: str) -> CustomUser | None:
        """
        Tìm người dùng theo UUID ID.
        """
        try:
            uuid_obj = uuid.UUID(str(user_id))
            return CustomUser.objects.filter(id=uuid_obj).first()
        except (ValueError, TypeError):
            return None

    @staticmethod
    def admin_update_user(target_user: CustomUser, validated_data: Dict[str, Any]) -> CustomUser:
        """
        Admin cập nhật vai trò, trạng thái khóa tài khoản hoặc thông tin của user.
        """
        for attr, value in validated_data.items():
            setattr(target_user, attr, value)
        target_user.save()
        return target_user

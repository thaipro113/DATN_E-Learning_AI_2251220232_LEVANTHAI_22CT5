from django.contrib.auth.models import update_last_login
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser


class AuthService:
    """
    Tầng xử lý nghiệp vụ xác thực (Business Logic Layer) cho module Accounts.
    Tách biệt logic tạo người dùng, đăng nhập, cập nhật hồ sơ và đổi mật khẩu ra khỏi Views.
    """

    @staticmethod
    def generate_tokens_for_user(user: CustomUser) -> dict:
        """
        Sinh cặp mã xác thực JSON Web Token (Access Token & Refresh Token) cho người dùng.
        Đính kèm thông tin vai trò (role) và họ tên vào payload của token.
        """
        refresh = RefreshToken.for_user(user)

        # Thêm các Custom Claims vào Token để Frontend giải mã nhanh nếu cần
        refresh['email'] = user.email
        refresh['role'] = user.role
        refresh['full_name'] = user.full_name

        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }

    @staticmethod
    def register_user(validated_data: dict) -> tuple[CustomUser, dict]:
        """
        Thực hiện logic tạo tài khoản mới trong cơ sở dữ liệu
        và tự động tạo cặp JWT Token đăng nhập ngay sau khi đăng ký thành công.
        """
        clean_data = validated_data.copy()
        clean_data.pop('confirm_password', None)

        password = clean_data.pop('password')
        email = clean_data.pop('email')

        # Sử dụng CustomUserManager để băm mật khẩu và lưu
        user = CustomUser.objects.create_user(
            email=email,
            password=password,
            **clean_data
        )

        # Sinh token đăng nhập tự động
        tokens = AuthService.generate_tokens_for_user(user)

        return user, tokens

    @staticmethod
    def login_user(user: CustomUser) -> tuple[CustomUser, dict]:
        """
        Xử lý nghiệp vụ đăng nhập:
        - Cập nhật thời điểm đăng nhập cuối cùng (last_login).
        - Sinh cặp JWT Access/Refresh token mới.
        """
        update_last_login(None, user)
        tokens = AuthService.generate_tokens_for_user(user)
        return user, tokens

    @staticmethod
    def update_profile(user: CustomUser, validated_data: dict) -> CustomUser:
        """
        Cập nhật các trường thông tin hồ sơ của người dùng.
        """
        for attr, value in validated_data.items():
            setattr(user, attr, value)
        user.save()
        return user

    @staticmethod
    def change_password(user: CustomUser, new_password: str) -> None:
        """
        Cập nhật mật khẩu mới và băm an toàn vào CSDL.
        """
        user.set_password(new_password)
        user.save()

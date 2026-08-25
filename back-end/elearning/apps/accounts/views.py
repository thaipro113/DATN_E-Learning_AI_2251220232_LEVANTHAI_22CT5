from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.views import TokenRefreshView

from common.responses import success_response, error_response
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserResponseSerializer,
    UpdateProfileSerializer,
    ChangePasswordSerializer
)
from .services import AuthService
from .schemas import (
    register_schema,
    login_schema,
    token_refresh_schema,
    get_profile_schema,
    update_profile_schema,
    change_password_schema
)


class RegisterAPIView(APIView):
    """
    API Endpoint phục vụ đăng ký tài khoản mới (Học viên hoặc Giáo viên).
    """
    permission_classes = [AllowAny]

    @register_schema
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu đăng ký không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        user, tokens = AuthService.register_user(serializer.validated_data)

        response_data = {
            "user": UserResponseSerializer(user).data,
            "tokens": tokens
        }

        return success_response(
            data=response_data,
            message="Đăng ký tài khoản thành công!",
            status_code=status.HTTP_201_CREATED
        )


class LoginAPIView(APIView):
    """
    API Endpoint phục vụ đăng nhập hệ thống bằng Email và Mật khẩu.
    """
    permission_classes = [AllowAny]

    @login_schema
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Đăng nhập không thành công.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.validated_data['user']
        user, tokens = AuthService.login_user(user)

        response_data = {
            "user": UserResponseSerializer(user).data,
            "tokens": tokens
        }

        return success_response(
            data=response_data,
            message="Đăng nhập thành công!",
            status_code=status.HTTP_200_OK
        )


@token_refresh_schema
class CustomTokenRefreshView(TokenRefreshView):
    """
    API Endpoint cấp mới Access Token từ Refresh Token khi Access Token hết hạn.
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            return success_response(
                data=response.data,
                message="Làm mới Access Token thành công!",
                status_code=status.HTTP_200_OK
            )
        
        return error_response(
            message="Refresh Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
            errors=response.data,
            status_code=response.status_code
        )


class UserProfileView(APIView):
    """
    API Endpoint quản lý thông tin tài khoản hiện tại:
    - GET: Lấy thông tin cá nhân của người dùng đăng nhập.
    - PATCH: Cập nhật thông tin hồ sơ (họ tên, level tiếng Anh, avatar, SĐT, bio).
    """
    permission_classes = [IsAuthenticated]

    @get_profile_schema
    def get(self, request):
        serializer = UserResponseSerializer(request.user)
        return success_response(
            data=serializer.data,
            message="Lấy thông tin tài khoản thành công!",
            status_code=status.HTTP_200_OK
        )

    @update_profile_schema
    def patch(self, request):
        serializer = UpdateProfileSerializer(
            instance=request.user,
            data=request.data,
            partial=True
        )
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu cập nhật không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        updated_user = AuthService.update_profile(request.user, serializer.validated_data)

        return success_response(
            data=UserResponseSerializer(updated_user).data,
            message="Cập nhật thông tin hồ sơ thành công!",
            status_code=status.HTTP_200_OK
        )


class ChangePasswordView(APIView):
    """
    API Endpoint đổi mật khẩu người dùng đã xác thực.
    """
    permission_classes = [IsAuthenticated]

    @change_password_schema
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        if not serializer.is_valid():
            return error_response(
                message="Đổi mật khẩu không thành công.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        new_password = serializer.validated_data['new_password']
        AuthService.change_password(request.user, new_password)

        return success_response(
            message="Đổi mật khẩu thành công! Vui lòng sử dụng mật khẩu mới cho lần đăng nhập tiếp theo.",
            status_code=status.HTTP_200_OK
        )

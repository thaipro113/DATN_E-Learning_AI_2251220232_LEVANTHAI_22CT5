from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.views import TokenRefreshView

from common.responses import success_response, error_response
from .serializers import RegisterSerializer, LoginSerializer, UserResponseSerializer
from .services import AuthService
from .schemas import register_schema, login_schema, token_refresh_schema


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

        # Gọi tầng Service để thực hiện nghiệp vụ tạo người dùng và sinh JWT
        user, tokens = AuthService.register_user(serializer.validated_data)

        # Định dạng dữ liệu trả về
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

        # Gọi tầng Service để cập nhật last_login và sinh token
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

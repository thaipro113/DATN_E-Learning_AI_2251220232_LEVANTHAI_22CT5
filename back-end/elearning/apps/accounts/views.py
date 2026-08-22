from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiResponse

from common.responses import success_response, error_response
from .serializers import RegisterSerializer, UserResponseSerializer
from .services import AuthService


class RegisterAPIView(APIView):
    """
    API Endpoint phục vụ đăng ký tài khoản mới (Học viên hoặc Giáo viên).
    """
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Auth'],
        summary='Đăng ký tài khoản mới', 
        description='Tiếp nhận email, họ tên, mật khẩu, vai trò và trình độ tiếng Anh để tạo tài khoản mới. Trả về thông tin User kèm cặp Access/Refresh Token.',
        request=RegisterSerializer,
        responses={
            201: OpenApiResponse(
                description='Đăng ký thành công',
                response=UserResponseSerializer
            ),
            400: OpenApiResponse(
                description='Dữ liệu đầu vào không hợp lệ hoặc Email đã tồn tại'
            )
        }
    )
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

        # Định dạng dữ liệu trả về thông qua UserResponseSerializer
        response_data = {
            "user": UserResponseSerializer(user).data,
            "tokens": tokens
        }

        return success_response(
            data=response_data,
            message="Đăng ký tài khoản thành công!",
            status_code=status.HTTP_201_CREATED
        )

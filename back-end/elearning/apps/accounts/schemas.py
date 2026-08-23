from drf_spectacular.utils import extend_schema, OpenApiResponse
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    AuthResponseSerializer,
    TokenResponseSerializer
)

# Schema tài liệu cho API Đăng ký
register_schema = extend_schema(
    tags=['Auth'],
    summary='Đăng ký tài khoản mới',
    description='Tiếp nhận email, họ tên, mật khẩu, vai trò và trình độ tiếng Anh để tạo tài khoản mới. Trả về thông tin User kèm cặp Access/Refresh Token.',
    request=RegisterSerializer,
    responses={
        201: OpenApiResponse(
            description='Đăng ký thành công',
            response=AuthResponseSerializer
        ),
        400: OpenApiResponse(
            description='Dữ liệu đầu vào không hợp lệ hoặc Email đã tồn tại'
        )
    }
)

# Schema tài liệu cho API Đăng nhập
login_schema = extend_schema(
    tags=['Auth'],
    summary='Đăng nhập tài khoản',
    description='Xác thực thông tin đăng nhập bằng Email và Password. Trả về thông tin User và cặp Access/Refresh Token.',
    request=LoginSerializer,
    responses={
        200: OpenApiResponse(
            description='Đăng nhập thành công',
            response=AuthResponseSerializer
        ),
        400: OpenApiResponse(
            description='Email hoặc Mật khẩu không chính xác, hoặc tài khoản bị khóa'
        )
    }
)

# Schema tài liệu cho API Làm mới Token
token_refresh_schema = extend_schema(
    tags=['Auth'],
    summary='Làm mới Access Token',
    description='Gửi Refresh Token còn hiệu lực lên để nhận lại Access Token mới.',
    responses={
        200: OpenApiResponse(
            description='Cấp mới token thành công',
            response=TokenResponseSerializer
        ),
        401: OpenApiResponse(
            description='Refresh Token không hợp lệ hoặc đã hết hạn'
        )
    }
)

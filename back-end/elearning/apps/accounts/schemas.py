from drf_spectacular.utils import extend_schema, OpenApiResponse
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserResponseSerializer,
    UpdateProfileSerializer,
    ChangePasswordSerializer,
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

# Schema tài liệu cho API Lấy thông tin cá nhân
get_profile_schema = extend_schema(
    tags=['Auth'],
    summary='Lấy thông tin tài khoản hiện tại',
    description='Yêu cầu Access Token (Bearer Token). Trả về đầy đủ thông tin hồ sơ của người dùng đang đăng nhập.',
    responses={
        200: OpenApiResponse(
            description='Lấy thông tin thành công',
            response=UserResponseSerializer
        ),
        401: OpenApiResponse(
            description='Chưa đăng nhập hoặc Token không hợp lệ/hết hạn'
        )
    }
)

# Schema tài liệu cho API Cập nhật thông tin cá nhân
update_profile_schema = extend_schema(
    tags=['Auth'],
    summary='Cập nhật hồ sơ cá nhân',
    description='Cho phép người dùng chỉnh sửa họ tên, trình độ tiếng Anh (CEFR), avatar, số điện thoại và tiểu sử cá nhân.',
    request=UpdateProfileSerializer,
    responses={
        200: OpenApiResponse(
            description='Cập nhật hồ sơ thành công',
            response=UserResponseSerializer
        ),
        400: OpenApiResponse(
            description='Dữ liệu cập nhật không hợp lệ'
        ),
        401: OpenApiResponse(
            description='Chưa đăng nhập'
        )
    }
)

# Schema tài liệu cho API Đổi mật khẩu
change_password_schema = extend_schema(
    tags=['Auth'],
    summary='Đổi mật khẩu tài khoản',
    description='Yêu cầu mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới. Mật khẩu mới phải đạt độ mạnh bảo mật và khác mật khẩu cũ.',
    request=ChangePasswordSerializer,
    responses={
        200: OpenApiResponse(
            description='Đổi mật khẩu thành công'
        ),
        400: OpenApiResponse(
            description='Mật khẩu cũ không đúng hoặc mật khẩu mới không hợp lệ'
        ),
        401: OpenApiResponse(
            description='Chưa đăng nhập'
        )
    }
)

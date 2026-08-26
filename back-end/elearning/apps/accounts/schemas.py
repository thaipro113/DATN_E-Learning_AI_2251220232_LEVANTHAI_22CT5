from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UpdateProfileSerializer,
    ChangePasswordSerializer,
    AuthResponseSerializer,
    UserResponseSerializer,
    TokenResponseSerializer,
    AdminUserUpdateSerializer
)

# Schema Đăng ký
register_schema = extend_schema(
    tags=['Authentication'],
    summary='Đăng ký tài khoản mới',
    description='Cho phép Học viên (STUDENT) hoặc Giáo viên (TEACHER) đăng ký tài khoản mới. Trả về thông tin user và cặp Token JWT.',
    request=RegisterSerializer,
    responses={
        201: OpenApiResponse(description='Đăng ký thành công', response=AuthResponseSerializer),
        400: OpenApiResponse(description='Dữ liệu không hợp lệ hoặc Email đã tồn tại')
    }
)

# Schema Đăng nhập
login_schema = extend_schema(
    tags=['Authentication'],
    summary='Đăng nhập tài khoản',
    description='Xác thực qua Email và Password. Trả về Token JWT (Access Token & Refresh Token) và thông tin người dùng.',
    request=LoginSerializer,
    responses={
        200: OpenApiResponse(description='Đăng nhập thành công', response=AuthResponseSerializer),
        400: OpenApiResponse(description='Sai email/mật khẩu hoặc tài khoản bị khóa')
    }
)

# Schema Làm mới Token
token_refresh_schema = extend_schema(
    tags=['Authentication'],
    summary='Làm mới Access Token',
    description='Gửi Refresh Token còn hạn để nhận lại một Access Token mới mà không cần đăng nhập lại.',
    responses={
        200: OpenApiResponse(description='Cấp lại Access Token thành công', response=TokenResponseSerializer),
        401: OpenApiResponse(description='Refresh Token không hợp lệ hoặc đã hết hạn')
    }
)

# Schema Lấy thông tin cá nhân
get_profile_schema = extend_schema(
    tags=['User Profile'],
    summary='Xem thông tin cá nhân hiện tại',
    description='Yêu cầu Header Authorization: Bearer <access_token>. Trả về hồ sơ của user đang đăng nhập.',
    responses={
        200: OpenApiResponse(description='Lấy thông tin thành công', response=UserResponseSerializer),
        401: OpenApiResponse(description='Chưa xác thực hoặc token hết hạn')
    }
)

# Schema Cập nhật thông tin cá nhân
update_profile_schema = extend_schema(
    tags=['User Profile'],
    summary='Cập nhật thông tin cá nhân',
    description='Yêu cầu Bearer Token. Cho phép cập nhật họ tên, trình độ, avatar, số điện thoại, tiểu sử.',
    request=UpdateProfileSerializer,
    responses={
        200: OpenApiResponse(description='Cập nhật thành công', response=UserResponseSerializer),
        400: OpenApiResponse(description='Dữ liệu cập nhật không hợp lệ'),
        401: OpenApiResponse(description='Chưa xác thực')
    }
)

# Schema Đổi mật khẩu
change_password_schema = extend_schema(
    tags=['User Profile'],
    summary='Đổi mật khẩu',
    description='Yêu cầu Bearer Token. Yêu cầu nhập mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu mới.',
    request=ChangePasswordSerializer,
    responses={
        200: OpenApiResponse(description='Đổi mật khẩu thành công'),
        400: OpenApiResponse(description='Sai mật khẩu cũ hoặc mật khẩu mới không hợp lệ'),
        401: OpenApiResponse(description='Chưa xác thực')
    }
)

# ==================== ADMIN USER MANAGEMENT SCHEMAS ====================

admin_list_users_schema = extend_schema(
    tags=['Admin - User Management'],
    summary='Lấy danh sách tất cả tài khoản người dùng (Admin only)',
    description='Yêu cầu quyền Quản trị viên (ADMIN). Hỗ trợ phân trang, lọc theo vai trò (STUDENT/TEACHER/ADMIN), trạng thái hoạt động, trình độ và tìm kiếm.',
    parameters=[
        OpenApiParameter(name='role', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='Lọc theo vai trò: STUDENT, TEACHER, ADMIN'),
        OpenApiParameter(name='level', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='Lọc theo trình độ: A1, A2, B1, B2, C1, C2'),
        OpenApiParameter(name='is_active', type=OpenApiTypes.BOOL, location=OpenApiParameter.QUERY, description='Lọc theo trạng thái tài khoản (true/false)'),
        OpenApiParameter(name='search', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='Tìm kiếm theo email, họ tên hoặc số điện thoại'),
        OpenApiParameter(name='ordering', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='Sắp xếp: created_at, -created_at, email, full_name'),
    ],
    responses={
        200: OpenApiResponse(description='Lấy danh sách người dùng thành công', response=UserResponseSerializer(many=True)),
        403: OpenApiResponse(description='Không có quyền thực hiện (Yêu cầu role ADMIN)')
    }
)

admin_get_user_schema = extend_schema(
    tags=['Admin - User Management'],
    summary='Xem chi tiết một tài khoản người dùng bất kỳ (Admin only)',
    description='Yêu cầu quyền Quản trị viên (ADMIN). Tìm kiếm theo ID người dùng (UUID).',
    responses={
        200: OpenApiResponse(description='Lấy chi tiết thành công', response=UserResponseSerializer),
        403: OpenApiResponse(description='Không có quyền thực hiện'),
        404: OpenApiResponse(description='Không tìm thấy người dùng')
    }
)

admin_update_user_schema = extend_schema(
    tags=['Admin - User Management'],
    summary='Cập nhật vai trò, trạng thái khóa tài khoản của người dùng (Admin only)',
    description='Yêu cầu quyền Quản trị viên (ADMIN). Cho phép đổi vai trò (STUDENT/TEACHER/ADMIN), khóa/mở tài khoản (`is_active=False/True`).',
    request=AdminUserUpdateSerializer,
    responses={
        200: OpenApiResponse(description='Cập nhật tài khoản thành công', response=UserResponseSerializer),
        400: OpenApiResponse(description='Dữ liệu không hợp lệ'),
        403: OpenApiResponse(description='Không có quyền thực hiện'),
        404: OpenApiResponse(description='Không tìm thấy người dùng')
    }
)

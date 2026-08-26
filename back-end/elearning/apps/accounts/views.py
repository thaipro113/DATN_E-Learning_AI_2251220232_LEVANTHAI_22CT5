from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.views import TokenRefreshView

from common.responses import success_response, error_response
from common.permissions import IsAdminUserRole
from common.pagination import StandardResultsSetPagination
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UpdateProfileSerializer,
    ChangePasswordSerializer,
    UserResponseSerializer,
    AdminUserUpdateSerializer
)
from .services import AuthService, UserService
from .schemas import (
    register_schema,
    login_schema,
    token_refresh_schema,
    get_profile_schema,
    update_profile_schema,
    change_password_schema,
    admin_list_users_schema,
    admin_get_user_schema,
    admin_update_user_schema
)


class RegisterAPIView(APIView):
    """
    API Endpoint đăng ký tài khoản mới (Học viên hoặc Giáo viên).
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

        user_data = UserResponseSerializer(user).data
        return success_response(
            data={
                'user': user_data,
                'tokens': tokens
            },
            message="Đăng ký tài khoản thành công!",
            status_code=status.HTTP_201_CREATED
        )


class LoginAPIView(APIView):
    """
    API Endpoint đăng nhập hệ thống bằng Email và Mật khẩu.
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

        user_data = UserResponseSerializer(user).data
        return success_response(
            data={
                'user': user_data,
                'tokens': tokens
            },
            message="Đăng nhập thành công!",
            status_code=status.HTTP_200_OK
        )


class CustomTokenRefreshView(TokenRefreshView):
    """
    API Endpoint cấp lại Access Token mới từ Refresh Token.
    """
    @token_refresh_schema
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            return success_response(
                data=response.data,
                message="Làm mới token thành công!",
                status_code=status.HTTP_200_OK
            )
        return error_response(
            message="Token không hợp lệ hoặc đã hết hạn.",
            errors=response.data,
            status_code=response.status_code
        )


class UserProfileView(APIView):
    """
    API Endpoint xem và cập nhật hồ sơ cá nhân của người dùng đang đăng nhập.
    """
    permission_classes = [IsAuthenticated]

    @get_profile_schema
    def get(self, request):
        user_data = UserResponseSerializer(request.user).data
        return success_response(
            data=user_data,
            message="Lấy thông tin hồ sơ thành công!",
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
                message="Dữ liệu cập nhật hồ sơ không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        updated_user = AuthService.update_profile(request.user, serializer.validated_data)
        user_data = UserResponseSerializer(updated_user).data

        return success_response(
            data=user_data,
            message="Cập nhật hồ sơ cá nhân thành công!",
            status_code=status.HTTP_200_OK
        )


class ChangePasswordView(APIView):
    """
    API Endpoint đổi mật khẩu cho người dùng đã đăng nhập.
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
                message="Đổi mật khẩu thất bại.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        new_password = serializer.validated_data['new_password']
        AuthService.change_password(request.user, new_password)

        return success_response(
            data=None,
            message="Đổi mật khẩu thành công! Vui lòng sử dụng mật khẩu mới cho lần đăng nhập tiếp theo.",
            status_code=status.HTTP_200_OK
        )


# ==================== ADMIN USER MANAGEMENT VIEWS ====================

class AdminUserListAPIView(APIView):
    """
    API Endpoint dành cho Quản trị viên (Admin) xem danh sách tất cả tài khoản.
    """
    permission_classes = [IsAdminUserRole]

    @admin_list_users_schema
    def get(self, request):
        filters = {
            'role': request.query_params.get('role'),
            'level': request.query_params.get('level'),
            'is_active': request.query_params.get('is_active'),
            'search': request.query_params.get('search'),
            'ordering': request.query_params.get('ordering'),
        }

        users = UserService.list_users(filters=filters)

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(users, request)
        serializer = UserResponseSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)


class AdminUserDetailAPIView(APIView):
    """
    API Endpoint dành cho Quản trị viên (Admin) xem chi tiết hoặc cập nhật vai trò, trạng thái khóa của tài khoản.
    """
    permission_classes = [IsAdminUserRole]

    @admin_get_user_schema
    def get(self, request, user_id):
        target_user = UserService.get_user_by_id(user_id)
        if not target_user:
            return error_response(
                message="Không tìm thấy tài khoản người dùng yêu cầu.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        return success_response(
            data=UserResponseSerializer(target_user).data,
            message="Lấy thông tin tài khoản thành công!",
            status_code=status.HTTP_200_OK
        )

    @admin_update_user_schema
    def patch(self, request, user_id):
        target_user = UserService.get_user_by_id(user_id)
        if not target_user:
            return error_response(
                message="Không tìm thấy tài khoản người dùng để cập nhật.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        serializer = AdminUserUpdateSerializer(
            instance=target_user,
            data=request.data,
            partial=True,
            context={'current_admin': request.user}
        )
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu cập nhật tài khoản không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        updated_user = UserService.admin_update_user(target_user, serializer.validated_data)

        return success_response(
            data=UserResponseSerializer(updated_user).data,
            message="Cập nhật tài khoản người dùng thành công!",
            status_code=status.HTTP_200_OK
        )

from django.urls import path
from .views import (
    RegisterAPIView,
    LoginAPIView,
    CustomTokenRefreshView,
    UserProfileView,
    ChangePasswordView,
    AdminUserListAPIView,
    AdminUserDetailAPIView
)

app_name = 'accounts'

urlpatterns = [
    # Xác thực & Phiên đăng nhập
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),

    # Hồ sơ cá nhân & Đổi mật khẩu
    path('me/', UserProfileView.as_view(), name='user_profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),

    # Quản trị người dùng (Admin User Management)
    path('users/', AdminUserListAPIView.as_view(), name='admin_user_list'),
    path('users/<uuid:user_id>/', AdminUserDetailAPIView.as_view(), name='admin_user_detail'),
]

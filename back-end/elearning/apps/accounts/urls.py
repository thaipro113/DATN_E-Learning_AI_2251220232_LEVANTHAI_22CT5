from django.urls import path
from .views import (
    RegisterAPIView,
    LoginAPIView,
    CustomTokenRefreshView,
    UserProfileView,
    ChangePasswordView
)

app_name = 'accounts'

urlpatterns = [
    # Xác thực (Authentication)
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),

    # Hồ sơ cá nhân & Bảo mật (Profile & Security)
    path('me/', UserProfileView.as_view(), name='user_profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
]

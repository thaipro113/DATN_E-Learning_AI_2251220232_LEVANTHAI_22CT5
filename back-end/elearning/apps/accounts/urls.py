from django.urls import path
from .views import (
    RegisterAPIView,
    LoginAPIView,
    CustomTokenRefreshView
)

app_name = 'accounts'

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
]

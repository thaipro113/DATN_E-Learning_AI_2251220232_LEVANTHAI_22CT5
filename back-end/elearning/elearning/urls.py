"""
Root URL Configuration for E-learning AI Platform.
"""

from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView
)

urlpatterns = [
    path('', lambda request: redirect('swagger-ui'), name='home'),

    # Django Admin
    path('admin/', admin.site.urls),

    # OpenAPI 3.0 Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Modular App APIs
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/courses/', include('apps.courses.urls')),
    path('api/v1/learning/', include('apps.learning.urls')),
    path('api/v1/assessments/', include('apps.assessments.urls')),
    # path('api/v1/ai/', include('apps.ai.urls')),
    # path('api/v1/recommendations/', include('apps.recommendations.urls')),
    # path('api/v1/quiz-import/', include('apps.quiz_import.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

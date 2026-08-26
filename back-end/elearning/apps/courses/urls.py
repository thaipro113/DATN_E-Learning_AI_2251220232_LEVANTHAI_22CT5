from django.urls import path
from .views import (
    CategoryListCreateAPIView,
    CategoryDetailAPIView,
    CourseListCreateAPIView,
    TeacherCoursesAPIView,
    CourseDetailAPIView,
    CoursePublishAPIView
)

app_name = 'courses'

urlpatterns = [
    # Danh mục khóa học (Categories)
    path('categories/', CategoryListCreateAPIView.as_view(), name='category_list_create'),
    path('categories/<str:identifier>/', CategoryDetailAPIView.as_view(), name='category_detail'),

    # Khóa học (Courses)
    path('', CourseListCreateAPIView.as_view(), name='course_list_create'),
    path('teaching/', TeacherCoursesAPIView.as_view(), name='my_teaching_courses'),
    path('<str:identifier>/', CourseDetailAPIView.as_view(), name='course_detail'),
    path('<str:identifier>/publish/', CoursePublishAPIView.as_view(), name='course_publish'),
]

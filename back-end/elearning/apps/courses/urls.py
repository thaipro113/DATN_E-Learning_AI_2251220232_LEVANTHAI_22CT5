from django.urls import path
from .views import (
    CategoryListCreateAPIView,
    CategoryDetailAPIView,
    CourseListCreateAPIView,
    TeacherCoursesAPIView,
    CourseDetailAPIView,
    CoursePublishAPIView,
    ChapterListCreateAPIView,
    ChapterDetailAPIView,
    LessonCreateAPIView,
    LessonDetailAPIView,
    MaterialCreateAPIView,
    MaterialDetailAPIView
)

app_name = 'courses'

urlpatterns = [
    # 1. Danh mục khóa học (Categories)
    path('categories/', CategoryListCreateAPIView.as_view(), name='category_list_create'),
    path('categories/<str:identifier>/', CategoryDetailAPIView.as_view(), name='category_detail'),

    # 2. Khóa học (Courses)
    path('', CourseListCreateAPIView.as_view(), name='course_list_create'),
    path('teaching/', TeacherCoursesAPIView.as_view(), name='my_teaching_courses'),
    path('<str:identifier>/', CourseDetailAPIView.as_view(), name='course_detail'),
    path('<str:identifier>/publish/', CoursePublishAPIView.as_view(), name='course_publish'),

    # 3. Chương học (Chapters)
    path('<uuid:course_id>/chapters/', ChapterListCreateAPIView.as_view(), name='chapter_create'),
    path('chapters/<uuid:chapter_id>/', ChapterDetailAPIView.as_view(), name='chapter_detail'),

    # 4. Bài học (Lessons)
    path('chapters/<uuid:chapter_id>/lessons/', LessonCreateAPIView.as_view(), name='lesson_create'),
    path('lessons/<uuid:lesson_id>/', LessonDetailAPIView.as_view(), name='lesson_detail'),

    # 5. Tài liệu đính kèm (Materials)
    path('lessons/<uuid:lesson_id>/materials/', MaterialCreateAPIView.as_view(), name='material_create'),
    path('materials/<uuid:material_id>/', MaterialDetailAPIView.as_view(), name='material_detail'),
]

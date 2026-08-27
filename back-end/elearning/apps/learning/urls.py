from django.urls import path
from .views import (
    EnrollCourseAPIView,
    MyEnrollmentsAPIView,
    MyEnrollmentDetailAPIView
)

app_name = 'learning'

urlpatterns = [
    # 1. Ghi danh khóa học (Enrollment)
    path('enroll/<uuid:course_id>/', EnrollCourseAPIView.as_view(), name='enroll_course'),

    # 2. Khóa học của tôi (My Courses)
    path('my-courses/', MyEnrollmentsAPIView.as_view(), name='my_courses'),
    path('my-courses/<str:course_identifier>/', MyEnrollmentDetailAPIView.as_view(), name='my_course_detail'),
]

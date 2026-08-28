from django.urls import path
from .views import (
    EnrollCourseAPIView,
    MyEnrollmentsAPIView,
    MyEnrollmentDetailAPIView,
    TrackLessonProgressAPIView,
    CompleteLessonAPIView,
    MyCertificatesAPIView,
    CertificateVerificationAPIView
)

app_name = 'learning'

urlpatterns = [
    # 1. Ghi danh khóa học (Enrollment)
    path('enroll/<uuid:course_id>/', EnrollCourseAPIView.as_view(), name='enroll_course'),

    # 2. Khóa học của tôi (My Courses & Progress)
    path('my-courses/', MyEnrollmentsAPIView.as_view(), name='my_courses'),
    path('my-courses/<str:course_identifier>/', MyEnrollmentDetailAPIView.as_view(), name='my_course_detail'),

    # 3. Theo dõi & Hoàn thành bài học (Lesson Progress)
    path('lessons/<uuid:lesson_id>/track-progress/', TrackLessonProgressAPIView.as_view(), name='track_lesson_progress'),
    path('lessons/<uuid:lesson_id>/complete/', CompleteLessonAPIView.as_view(), name='complete_lesson'),

    # 4. Chứng chỉ (Certificates)
    path('certificates/', MyCertificatesAPIView.as_view(), name='my_certificates'),
    path('certificates/<str:certificate_code>/', CertificateVerificationAPIView.as_view(), name='verify_certificate'),
]

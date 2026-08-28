from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from common.responses import success_response, error_response
from common.pagination import StandardResultsSetPagination
from .serializers import (
    EnrollmentListSerializer,
    EnrollmentDetailSerializer,
    TrackLessonProgressSerializer,
    LessonProgressSimpleSerializer,
    CompleteLessonResponseSerializer,
    CertificateDetailSerializer
)
from .services import EnrollmentService, ProgressService, CertificateService
from .schemas import (
    enroll_course_schema,
    my_enrollments_schema,
    my_enrollment_detail_schema,
    track_video_progress_schema,
    complete_lesson_schema,
    my_certificates_schema,
    verify_certificate_schema
)


# ==================== ENROLLMENT VIEWS ====================

class EnrollCourseAPIView(APIView):
    """
    API Endpoint cho phép học viên ghi danh vào một khóa học.
    """
    permission_classes = [IsAuthenticated]

    @enroll_course_schema
    def post(self, request, course_id):
        success, message, enrollment = EnrollmentService.enroll_course(
            student=request.user,
            course_id=str(course_id)
        )

        if not success:
            return error_response(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        return success_response(
            data=EnrollmentDetailSerializer(enrollment).data,
            message=message,
            status_code=status.HTTP_201_CREATED
        )


class MyEnrollmentsAPIView(APIView):
    """
    API Endpoint lấy danh sách các khóa học mà học viên đã ghi danh (My Courses).
    """
    permission_classes = [IsAuthenticated]

    @my_enrollments_schema
    def get(self, request):
        filters = {
            'status': request.query_params.get('status'),
            'search': request.query_params.get('search'),
        }

        enrollments = EnrollmentService.list_student_enrollments(
            student=request.user,
            filters=filters
        )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(enrollments, request)
        serializer = EnrollmentListSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)


class MyEnrollmentDetailAPIView(APIView):
    """
    API Endpoint xem chi tiết tiến độ học tập của một khóa học đã ghi danh.
    """
    permission_classes = [IsAuthenticated]

    @my_enrollment_detail_schema
    def get(self, request, course_identifier):
        enrollment = EnrollmentService.get_student_enrollment_detail(
            student=request.user,
            course_identifier=str(course_identifier)
        )

        if not enrollment:
            return error_response(
                message="Bạn chưa ghi danh vào khóa học này hoặc khóa học không tồn tại.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        return success_response(
            data=EnrollmentDetailSerializer(enrollment).data,
            message="Lấy chi tiết tiến độ học tập thành công!",
            status_code=status.HTTP_200_OK
        )


# ==================== PROGRESS & CERTIFICATE VIEWS ====================

class TrackLessonProgressAPIView(APIView):
    """
    API Endpoint lưu vị trí giây dừng của video bài học (Resume Playback).
    """
    permission_classes = [IsAuthenticated]

    @track_video_progress_schema
    def post(self, request, lesson_id):
        serializer = TrackLessonProgressSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu thời lượng video không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        success, message, progress = ProgressService.track_video_progress(
            student=request.user,
            lesson_id=str(lesson_id),
            last_watched_second=serializer.validated_data['last_watched_second']
        )

        if not success:
            return error_response(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        return success_response(
            data=LessonProgressSimpleSerializer(progress).data,
            message=message,
            status_code=status.HTTP_200_OK
        )


class CompleteLessonAPIView(APIView):
    """
    API Endpoint đánh dấu hoàn thành bài học, tự động tính lại % tiến độ và cấp chứng chỉ nếu đạt 100%.
    """
    permission_classes = [IsAuthenticated]

    @complete_lesson_schema
    def post(self, request, lesson_id):
        success, message, progress, enrollment, certificate = ProgressService.complete_lesson(
            student=request.user,
            lesson_id=str(lesson_id)
        )

        if not success:
            return error_response(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        response_data = {
            'lesson_progress': LessonProgressSimpleSerializer(progress).data,
            'progress_percent': enrollment.progress_percent,
            'is_course_completed': bool(enrollment.progress_percent >= 100.0),
            'certificate': CertificateDetailSerializer(certificate).data if certificate else None
        }

        return success_response(
            data=response_data,
            message=message,
            status_code=status.HTTP_200_OK
        )


class MyCertificatesAPIView(APIView):
    """
    API Endpoint lấy danh sách chứng chỉ mà học viên đã đạt được.
    """
    permission_classes = [IsAuthenticated]

    @my_certificates_schema
    def get(self, request):
        certificates = CertificateService.list_student_certificates(student=request.user)
        serializer = CertificateDetailSerializer(certificates, many=True)

        return success_response(
            data=serializer.data,
            message="Lấy danh sách chứng chỉ thành công!",
            status_code=status.HTTP_200_OK
        )


class CertificateVerificationAPIView(APIView):
    """
    API Endpoint công khai để Tra cứu & Xác thực Chứng chỉ số theo mã certificate_code.
    """
    permission_classes = [AllowAny]

    @verify_certificate_schema
    def get(self, request, certificate_code):
        certificate = CertificateService.get_certificate_by_code(certificate_code=certificate_code)

        if not certificate:
            return error_response(
                message="Mã chứng chỉ không tồn tại hoặc không hợp lệ.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        return success_response(
            data=CertificateDetailSerializer(certificate).data,
            message="Chứng chỉ hợp lệ!",
            status_code=status.HTTP_200_OK
        )

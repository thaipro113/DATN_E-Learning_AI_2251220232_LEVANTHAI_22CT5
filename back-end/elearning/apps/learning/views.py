from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from common.responses import success_response, error_response
from common.pagination import StandardResultsSetPagination
from .serializers import (
    EnrollmentListSerializer,
    EnrollmentDetailSerializer
)
from .services import EnrollmentService
from .schemas import (
    enroll_course_schema,
    my_enrollments_schema,
    my_enrollment_detail_schema
)


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

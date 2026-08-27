from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .serializers import (
    EnrollmentListSerializer,
    EnrollmentDetailSerializer
)

# ==================== ENROLLMENT SCHEMAS ====================

enroll_course_schema = extend_schema(
    tags=['Learning - Enrollment'],
    summary='Ghi danh vào khóa học',
    description='Học viên đăng nhập và bấm ghi danh vào khóa học đã được xuất bản (PUBLISHED). Hệ thống sẽ tự động khởi tạo tiến độ các bài học.',
    responses={
        201: OpenApiResponse(
            description='Ghi danh thành công',
            response=EnrollmentDetailSerializer
        ),
        400: OpenApiResponse(description='Khóa học chưa mở đăng ký hoặc đã ghi danh trước đó'),
        401: OpenApiResponse(description='Yêu cầu đăng nhập'),
        404: OpenApiResponse(description='Không tìm thấy khóa học')
    }
)

my_enrollments_schema = extend_schema(
    tags=['Learning - Enrollment'],
    summary='Danh sách khóa học của tôi (My Courses)',
    description='Lấy danh sách tất cả các khóa học mà học viên hiện tại đã ghi danh kèm % tiến độ học tập.',
    parameters=[
        OpenApiParameter(name='status', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='Lọc theo trạng thái: ACTIVE (Đang học), COMPLETED (Đã hoàn thành)'),
        OpenApiParameter(name='search', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='Tìm kiếm theo tên khóa học hoặc tên giáo viên'),
    ],
    responses={
        200: OpenApiResponse(
            description='Lấy danh sách thành công',
            response=EnrollmentListSerializer(many=True)
        ),
        401: OpenApiResponse(description='Chưa xác thực')
    }
)

my_enrollment_detail_schema = extend_schema(
    tags=['Learning - Enrollment'],
    summary='Xem chi tiết tiến độ học tập của khóa học',
    description='Lấy toàn bộ cây bài học và trạng thái hoàn thành từng bài học trong khóa học mà học viên đã ghi danh.',
    responses={
        200: OpenApiResponse(
            description='Lấy chi tiết tiến độ thành công',
            response=EnrollmentDetailSerializer
        ),
        401: OpenApiResponse(description='Chưa xác thực'),
        404: OpenApiResponse(description='Bạn chưa ghi danh vào khóa học này')
    }
)

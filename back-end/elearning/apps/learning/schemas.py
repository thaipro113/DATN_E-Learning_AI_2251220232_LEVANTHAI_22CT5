from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .serializers import (
    EnrollmentListSerializer,
    EnrollmentDetailSerializer,
    TrackLessonProgressSerializer,
    LessonProgressSimpleSerializer,
    CompleteLessonResponseSerializer,
    CertificateDetailSerializer
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


# ==================== PROGRESS & CERTIFICATE SCHEMAS ====================

track_video_progress_schema = extend_schema(
    tags=['Learning - Progress'],
    summary='Lưu vị trí thời lượng xem video bài học (Resume Playback)',
    description='Gửi số giây (`last_watched_second`) mà học viên đang xem dở để tự động tiếp tục khi học lại sau này.',
    request=TrackLessonProgressSerializer,
    responses={
        200: OpenApiResponse(
            description='Lưu vị trí video thành công',
            response=LessonProgressSimpleSerializer
        ),
        400: OpenApiResponse(description='Dữ liệu không hợp lệ hoặc chưa ghi danh khóa học'),
        401: OpenApiResponse(description='Chưa xác thực')
    }
)

complete_lesson_schema = extend_schema(
    tags=['Learning - Progress'],
    summary='Đánh dấu hoàn thành bài học',
    description='Đánh dấu bài học đã hoàn thành (`is_completed=True`), tự động tính lại % tiến độ khóa học và tự động cấp Chứng chỉ điện tử khi đạt 100%.',
    responses={
        200: OpenApiResponse(
            description='Hoàn thành bài học thành công',
            response=CompleteLessonResponseSerializer
        ),
        400: OpenApiResponse(description='Chưa ghi danh vào khóa học chứa bài học này'),
        401: OpenApiResponse(description='Chưa xác thực'),
        404: OpenApiResponse(description='Không tìm thấy bài học')
    }
)

my_certificates_schema = extend_schema(
    tags=['Learning - Certificates'],
    summary='Danh sách chứng chỉ đã đạt được của tôi',
    description='Lấy danh sách toàn bộ các chứng chỉ hoàn thành khóa học mà học viên đang đăng nhập đã nhận được.',
    responses={
        200: OpenApiResponse(
            description='Lấy danh sách chứng chỉ thành công',
            response=CertificateDetailSerializer(many=True)
        ),
        401: OpenApiResponse(description='Chưa xác thực')
    }
)

verify_certificate_schema = extend_schema(
    tags=['Learning - Certificates'],
    summary='Tra cứu & Xác thực Chứng chỉ số (Public Verification)',
    description='Public API. Bất kỳ ai cũng có thể nhập Mã Chứng Chỉ (`certificate_code`) để kiểm tra tính hợp lệ, tên học viên, khóa học và ngày cấp.',
    responses={
        200: OpenApiResponse(
            description='Chứng chỉ hợp lệ',
            response=CertificateDetailSerializer
        ),
        404: OpenApiResponse(description='Mã chứng chỉ không tồn tại hoặc không hợp lệ')
    }
)

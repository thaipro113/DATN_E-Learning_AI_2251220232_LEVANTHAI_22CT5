from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .serializers import (
    CategorySerializer,
    CategoryCreateUpdateSerializer,
    CourseListSerializer,
    CourseDetailSerializer,
    CourseCreateUpdateSerializer
)

# ==================== CATEGORY SCHEMAS ====================

list_categories_schema = extend_schema(
    tags=['Courses - Categories'],
    summary='Lấy danh sách danh mục khóa học',
    description='Public API. Trả về danh sách tất cả các danh mục khóa học đang hoạt động kèm số lượng khóa học.',
    parameters=[
        OpenApiParameter(
            name='search',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description='Tìm kiếm danh mục theo tên hoặc mô tả'
        )
    ],
    responses={
        200: OpenApiResponse(
            description='Lấy danh sách thành công',
            response=CategorySerializer(many=True)
        )
    }
)

get_category_schema = extend_schema(
    tags=['Courses - Categories'],
    summary='Lấy chi tiết danh mục khóa học',
    description='Public API. Tìm kiếm danh mục theo ID hoặc Slug.',
    responses={
        200: OpenApiResponse(
            description='Lấy chi tiết thành công',
            response=CategorySerializer
        ),
        404: OpenApiResponse(
            description='Không tìm thấy danh mục'
        )
    }
)

create_category_schema = extend_schema(
    tags=['Courses - Categories'],
    summary='Tạo danh mục khóa học mới (Admin only)',
    description='Yêu cầu quyền Quản trị viên (ADMIN). Tạo danh mục mới trong hệ thống.',
    request=CategoryCreateUpdateSerializer,
    responses={
        201: OpenApiResponse(
            description='Tạo danh mục thành công',
            response=CategorySerializer
        ),
        400: OpenApiResponse(
            description='Dữ liệu không hợp lệ hoặc Tên danh mục đã tồn tại'
        ),
        403: OpenApiResponse(
            description='Không có quyền thực hiện (Yêu cầu role ADMIN)'
        )
    }
)

update_category_schema = extend_schema(
    tags=['Courses - Categories'],
    summary='Cập nhật danh mục khóa học (Admin only)',
    description='Yêu cầu quyền Quản trị viên (ADMIN). Chỉnh sửa tên, mô tả, icon hoặc trạng thái của danh mục.',
    request=CategoryCreateUpdateSerializer,
    responses={
        200: OpenApiResponse(
            description='Cập nhật thành công',
            response=CategorySerializer
        ),
        400: OpenApiResponse(
            description='Dữ liệu cập nhật không hợp lệ'
        ),
        404: OpenApiResponse(
            description='Không tìm thấy danh mục'
        )
    }
)

delete_category_schema = extend_schema(
    tags=['Courses - Categories'],
    summary='Xóa danh mục khóa học (Admin only)',
    description='Yêu cầu quyền Quản trị viên (ADMIN). Xóa danh mục nếu rỗng, hoặc chuyển sang trạng thái ẩn nếu đang chứa khóa học.',
    responses={
        200: OpenApiResponse(
            description='Xóa hoặc ẩn danh mục thành công'
        ),
        404: OpenApiResponse(
            description='Không tìm thấy danh mục'
        )
    }
)


# ==================== COURSE SCHEMAS ====================

list_courses_schema = extend_schema(
    tags=['Courses'],
    summary='Lấy danh sách khóa học kèm bộ lọc',
    description='Public API. Hỗ trợ lọc theo danh mục, trình độ CEFR (A1-C2), miễn phí/trả phí, tìm kiếm từ khóa và sắp xếp.',
    parameters=[
        OpenApiParameter(name='category', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='ID hoặc Slug danh mục'),
        OpenApiParameter(name='level', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='Trình độ tiếng Anh (A1, A2, B1, B2, C1, C2)'),
        OpenApiParameter(name='is_free', type=OpenApiTypes.BOOL, location=OpenApiParameter.QUERY, description='Lọc khóa miễn phí (true/false)'),
        OpenApiParameter(name='search', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='Tìm kiếm theo tiêu đề, mô tả hoặc tên giáo viên'),
        OpenApiParameter(name='ordering', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='Sắp xếp: created_at, -created_at, price, -price, title'),
        OpenApiParameter(name='status', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='Trạng thái (DRAFT/PUBLISHED/ARCHIVED - Giáo viên & Admin)'),
    ],
    responses={
        200: OpenApiResponse(
            description='Lấy danh sách khóa học thành công',
            response=CourseListSerializer(many=True)
        )
    }
)

my_teaching_courses_schema = extend_schema(
    tags=['Courses'],
    summary='Lấy danh sách khóa học do chính tôi giảng dạy',
    description='Yêu cầu quyền Giáo viên (TEACHER). Lấy danh sách toàn bộ các khóa học do giáo viên đang đăng nhập quản lý.',
    responses={
        200: OpenApiResponse(
            description='Lấy danh sách thành công',
            response=CourseListSerializer(many=True)
        ),
        403: OpenApiResponse(description='Yêu cầu quyền TEACHER')
    }
)

get_course_detail_schema = extend_schema(
    tags=['Courses'],
    summary='Lấy thông tin chi tiết toàn bộ khóa học',
    description='Public API. Tìm kiếm theo ID (UUID) hoặc Slug. Trả về chi tiết khóa học kèm danh sách các Chương, Bài học và Tài liệu.',
    responses={
        200: OpenApiResponse(
            description='Lấy chi tiết khóa học thành công',
            response=CourseDetailSerializer
        ),
        404: OpenApiResponse(
            description='Không tìm thấy khóa học hoặc khóa học chưa được xuất bản'
        )
    }
)

create_course_schema = extend_schema(
    tags=['Courses'],
    summary='Tạo khóa học mới (Teacher / Admin)',
    description='Yêu cầu quyền Giáo viên (TEACHER) hoặc Quản trị viên (ADMIN). Tạo khóa học mới ở trạng thái Bản nháp (DRAFT).',
    request=CourseCreateUpdateSerializer,
    responses={
        201: OpenApiResponse(
            description='Tạo khóa học thành công',
            response=CourseDetailSerializer
        ),
        400: OpenApiResponse(description='Dữ liệu đầu vào không hợp lệ'),
        403: OpenApiResponse(description='Không có quyền thực hiện')
    }
)

update_course_schema = extend_schema(
    tags=['Courses'],
    summary='Cập nhật thông tin khóa học (Chủ sở hữu / Admin)',
    description='Chỉ giáo viên tạo ra khóa học hoặc Admin mới có quyền chỉnh sửa thông tin khóa học.',
    request=CourseCreateUpdateSerializer,
    responses={
        200: OpenApiResponse(
            description='Cập nhật khóa học thành công',
            response=CourseDetailSerializer
        ),
        400: OpenApiResponse(description='Dữ liệu cập nhật không hợp lệ'),
        403: OpenApiResponse(description='Bạn không phải là chủ sở hữu của khóa học này'),
        404: OpenApiResponse(description='Không tìm thấy khóa học')
    }
)

delete_course_schema = extend_schema(
    tags=['Courses'],
    summary='Lưu trữ / Xóa khóa học (Chủ sở hữu / Admin)',
    description='Chuyển trạng thái khóa học sang ARCHIVED để bảo toàn lịch sử học tập của học viên.',
    responses={
        200: OpenApiResponse(description='Lưu trữ khóa học thành công'),
        403: OpenApiResponse(description='Không có quyền thực hiện'),
        404: OpenApiResponse(description='Không tìm thấy khóa học')
    }
)

publish_course_schema = extend_schema(
    tags=['Courses'],
    summary='Xuất bản khóa học ra công chúng (Chủ sở hữu / Admin)',
    description='Kiểm tra điều kiện (phải có ít nhất 1 chương và 1 bài học) rồi chuyển trạng thái sang PUBLISHED.',
    responses={
        200: OpenApiResponse(
            description='Xuất bản khóa học thành công',
            response=CourseDetailSerializer
        ),
        400: OpenApiResponse(description='Khóa học chưa đủ điều kiện xuất bản (thiếu chương hoặc bài học)'),
        403: OpenApiResponse(description='Không có quyền thực hiện')
    }
)

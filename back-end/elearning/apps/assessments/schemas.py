from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .serializers import (
    QuizListSerializer,
    QuizDetailTeacherSerializer,
    QuizDetailStudentSerializer,
    QuizCreateUpdateSerializer,
    QuestionDetailSerializer,
    QuestionCreateUpdateSerializer
)

# ==================== QUIZ SCHEMAS ====================

list_quizzes_schema = extend_schema(
    tags=['Assessments - Quizzes'],
    summary='Danh sách đề thi / bài kiểm tra',
    description='Lấy danh sách đề thi kèm bộ lọc: Đánh giá năng lực đầu vào (`PLACEMENT`), bài luyện tập (`PRACTICE`), đề cuối khóa (`FINAL`), trình độ (`level`), tìm kiếm.',
    parameters=[
        OpenApiParameter(name='quiz_type', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='Loại đề: PLACEMENT, PRACTICE, FINAL'),
        OpenApiParameter(name='level', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='Trình độ: A1, A2, B1, B2, C1, C2'),
        OpenApiParameter(name='course_id', type=OpenApiTypes.UUID, location=OpenApiParameter.QUERY, description='ID khóa học liên kết'),
        OpenApiParameter(name='search', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='Tìm kiếm theo tiêu đề hoặc mô tả'),
    ],
    responses={
        200: OpenApiResponse(
            description='Lấy danh sách thành công',
            response=QuizListSerializer(many=True)
        )
    }
)

create_quiz_schema = extend_schema(
    tags=['Assessments - Quizzes'],
    summary='Tạo đề thi mới (Giáo viên / Admin)',
    description='Giáo viên hoặc Admin tạo đề thi mới.',
    request=QuizCreateUpdateSerializer,
    responses={
        201: OpenApiResponse(
            description='Tạo đề thi thành công',
            response=QuizDetailTeacherSerializer
        ),
        400: OpenApiResponse(description='Dữ liệu không hợp lệ'),
        403: OpenApiResponse(description='Chỉ giáo viên hoặc admin mới có quyền tạo đề thi')
    }
)

get_quiz_detail_schema = extend_schema(
    tags=['Assessments - Quizzes'],
    summary='Xem chi tiết đề thi',
    description='Lấy chi tiết đề thi. Nếu là học viên thì ẩn đáp án đúng và lời giải thích để làm bài thi an toàn.',
    responses={
        200: OpenApiResponse(
            description='Lấy chi tiết thành công',
            response=QuizDetailStudentSerializer
        ),
        404: OpenApiResponse(description='Không tìm thấy đề thi')
    }
)

update_quiz_schema = extend_schema(
    tags=['Assessments - Quizzes'],
    summary='Cập nhật đề thi (Giáo viên tạo đề / Admin)',
    description='Chỉnh sửa thông tin đề thi.',
    request=QuizCreateUpdateSerializer,
    responses={
        200: OpenApiResponse(
            description='Cập nhật đề thi thành công',
            response=QuizDetailTeacherSerializer
        ),
        400: OpenApiResponse(description='Dữ liệu không hợp lệ'),
        403: OpenApiResponse(description='Bạn không có quyền chỉnh sửa đề thi này'),
        404: OpenApiResponse(description='Không tìm thấy đề thi')
    }
)

delete_quiz_schema = extend_schema(
    tags=['Assessments - Quizzes'],
    summary='Xóa đề thi (Giáo viên tạo đề / Admin)',
    description='Xóa vĩnh viễn đề thi và toàn bộ câu hỏi bên trong.',
    responses={
        200: OpenApiResponse(description='Xóa đề thi thành công'),
        403: OpenApiResponse(description='Bạn không có quyền xóa đề thi này'),
        404: OpenApiResponse(description='Không tìm thấy đề thi')
    }
)


# ==================== QUESTION SCHEMAS ====================

create_question_schema = extend_schema(
    tags=['Assessments - Questions'],
    summary='Thêm câu hỏi mới vào đề thi (Giáo viên / Admin)',
    description='Tạo câu hỏi trắc nghiệm hoặc điền từ kèm danh sách các lựa chọn đáp án.',
    request=QuestionCreateUpdateSerializer,
    responses={
        201: OpenApiResponse(
            description='Tạo câu hỏi thành công',
            response=QuestionDetailSerializer
        ),
        400: OpenApiResponse(description='Dữ liệu câu hỏi hoặc đáp án không hợp lệ'),
        403: OpenApiResponse(description='Không có quyền thêm câu hỏi vào đề thi này'),
        404: OpenApiResponse(description='Không tìm thấy đề thi')
    }
)

get_question_detail_schema = extend_schema(
    tags=['Assessments - Questions'],
    summary='Xem chi tiết câu hỏi',
    description='Lấy thông tin chi tiết một câu hỏi theo ID.',
    responses={
        200: OpenApiResponse(
            description='Lấy chi tiết câu hỏi thành công',
            response=QuestionDetailSerializer
        ),
        404: OpenApiResponse(description='Không tìm thấy câu hỏi')
    }
)

update_question_schema = extend_schema(
    tags=['Assessments - Questions'],
    summary='Cập nhật câu hỏi và đáp án (Giáo viên / Admin)',
    description='Chỉnh sửa nội dung câu hỏi, độ khó, điểm số hoặc danh sách đáp án.',
    request=QuestionCreateUpdateSerializer,
    responses={
        200: OpenApiResponse(
            description='Cập nhật câu hỏi thành công',
            response=QuestionDetailSerializer
        ),
        400: OpenApiResponse(description='Dữ liệu không hợp lệ'),
        403: OpenApiResponse(description='Không có quyền chỉnh sửa câu hỏi này'),
        404: OpenApiResponse(description='Không tìm thấy câu hỏi')
    }
)

delete_question_schema = extend_schema(
    tags=['Assessments - Questions'],
    summary='Xóa câu hỏi khỏi đề thi (Giáo viên / Admin)',
    description='Xóa câu hỏi và toàn bộ các lựa chọn đáp án liên quan.',
    responses={
        200: OpenApiResponse(description='Xóa câu hỏi thành công'),
        403: OpenApiResponse(description='Không có quyền xóa câu hỏi này'),
        404: OpenApiResponse(description='Không tìm thấy câu hỏi')
    }
)

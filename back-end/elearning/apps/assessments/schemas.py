from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .serializers import (
    QuizListSerializer,
    QuizDetailTeacherSerializer,
    QuizDetailStudentSerializer,
    QuizCreateUpdateSerializer,
    QuestionDetailSerializer,
    QuestionCreateUpdateSerializer,
    StartQuizAttemptResponseSerializer,
    QuizSubmissionRequestSerializer,
    QuizAttemptResultSerializer,
    QuizAttemptListSerializer
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


# ==================== QUIZ TAKING & GRADING SCHEMAS ====================

start_quiz_schema = extend_schema(
    tags=['Assessments - Quiz Taking'],
    summary='Bắt đầu làm bài thi (Học viên)',
    description='Học viên bấm bắt đầu làm bài. Hệ thống tạo lần thi `QuizAttempt` mới và trả về danh sách câu hỏi làm bài (ẩn đáp án đúng).',
    responses={
        201: OpenApiResponse(
            description='Bắt đầu làm bài thành công',
            response=StartQuizAttemptResponseSerializer
        ),
        400: OpenApiResponse(description='Đề thi chưa có câu hỏi nào'),
        401: OpenApiResponse(description='Chưa xác thực'),
        404: OpenApiResponse(description='Không tìm thấy đề thi')
    }
)

submit_quiz_schema = extend_schema(
    tags=['Assessments - Quiz Taking'],
    summary='Nộp bài thi & Chấm điểm tự động (Học viên)',
    description='Gửi toàn bộ danh sách câu trả lời của học viên. Hệ thống tự động chấm điểm, tính tỷ lệ % đúng, đánh giá đỗ/trượt và phân tích chi tiết từng kỹ năng.',
    request=QuizSubmissionRequestSerializer,
    responses={
        200: OpenApiResponse(
            description='Chấm điểm thành công',
            response=QuizAttemptResultSerializer
        ),
        400: OpenApiResponse(description='Bài thi đã nộp trước đó hoặc dữ liệu không hợp lệ'),
        401: OpenApiResponse(description='Chưa xác thực'),
        404: OpenApiResponse(description='Không tìm thấy lần thi')
    }
)

get_attempt_results_schema = extend_schema(
    tags=['Assessments - Quiz Taking'],
    summary='Xem kết quả & Lời giải chi tiết của lần thi',
    description='Xem bảng điểm, biểu đồ phân tích kỹ năng, chi tiết từng câu trả lời đúng/sai và lời giải thích.',
    responses={
        200: OpenApiResponse(
            description='Lấy kết quả thành công',
            response=QuizAttemptResultSerializer
        ),
        401: OpenApiResponse(description='Chưa xác thực'),
        404: OpenApiResponse(description='Không tìm thấy lần thi')
    }
)

list_my_attempts_schema = extend_schema(
    tags=['Assessments - Quiz Taking'],
    summary='Lịch sử làm bài thi của tôi (Học viên)',
    description='Lấy danh sách tất cả các lần thi đã thực hiện của học viên.',
    parameters=[
        OpenApiParameter(name='quiz_id', type=OpenApiTypes.UUID, location=OpenApiParameter.QUERY, description='Lọc theo đề thi cụ thể'),
        OpenApiParameter(name='is_passed', type=OpenApiTypes.BOOL, location=OpenApiParameter.QUERY, description='Lọc theo kết quả Đạt (true) hoặc Không đạt (false)'),
    ],
    responses={
        200: OpenApiResponse(
            description='Lấy lịch sử thành công',
            response=QuizAttemptListSerializer(many=True)
        ),
        401: OpenApiResponse(description='Chưa xác thực')
    }
)

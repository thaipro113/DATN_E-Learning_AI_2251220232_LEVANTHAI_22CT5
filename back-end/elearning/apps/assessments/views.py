from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from common.responses import success_response, error_response
from common.pagination import StandardResultsSetPagination
from common.permissions import IsTeacherUserRole
from .serializers import (
    QuizListSerializer,
    QuizDetailTeacherSerializer,
    QuizDetailStudentSerializer,
    QuizCreateUpdateSerializer,
    QuestionDetailSerializer,
    QuestionCreateUpdateSerializer,
    QuizSubmissionRequestSerializer,
    QuizAttemptResultSerializer,
    QuizAttemptListSerializer
)
from .services import QuizService, QuestionService, GradingService
from .schemas import (
    list_quizzes_schema,
    create_quiz_schema,
    get_quiz_detail_schema,
    update_quiz_schema,
    delete_quiz_schema,
    create_question_schema,
    get_question_detail_schema,
    update_question_schema,
    delete_question_schema,
    start_quiz_schema,
    submit_quiz_schema,
    get_attempt_results_schema,
    list_my_attempts_schema
)


# ==================== QUIZ VIEWS ====================

class QuizListCreateAPIView(APIView):
    """
    API Endpoint lấy danh sách đề thi (Public/Học viên) hoặc tạo đề thi mới (Giáo viên/Admin).
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsTeacherUserRole()]
        return [AllowAny()]

    @list_quizzes_schema
    def get(self, request):
        filters = {
            'quiz_type': request.query_params.get('quiz_type'),
            'level': request.query_params.get('level'),
            'course_id': request.query_params.get('course_id'),
            'search': request.query_params.get('search'),
        }

        quizzes = QuizService.list_quizzes(user=request.user, filters=filters)
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(quizzes, request)
        serializer = QuizListSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)

    @create_quiz_schema
    def post(self, request):
        serializer = QuizCreateUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu tạo đề thi không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        quiz = QuizService.create_quiz(creator=request.user, validated_data=serializer.validated_data)

        return success_response(
            data=QuizDetailTeacherSerializer(quiz).data,
            message="Tạo đề thi mới thành công!",
            status_code=status.HTTP_201_CREATED
        )


class QuizDetailAPIView(APIView):
    """
    API Endpoint xem chi tiết, cập nhật hoặc xóa Đề thi.
    """
    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT', 'DELETE']:
            return [IsTeacherUserRole()]
        return [AllowAny()]

    @get_quiz_detail_schema
    def get(self, request, quiz_id):
        quiz = QuizService.get_quiz_detail(quiz_id=str(quiz_id), user=request.user)
        if not quiz:
            return error_response(
                message="Không tìm thấy đề thi yêu cầu hoặc đề thi chưa phát hành.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        is_creator_or_admin = (
            request.user and request.user.is_authenticated and
            (request.user.role == 'ADMIN' or quiz.created_by == request.user)
        )
        if is_creator_or_admin:
            serializer = QuizDetailTeacherSerializer(quiz)
        else:
            serializer = QuizDetailStudentSerializer(quiz)

        return success_response(
            data=serializer.data,
            message="Lấy chi tiết đề thi thành công!",
            status_code=status.HTTP_200_OK
        )

    @update_quiz_schema
    def patch(self, request, quiz_id):
        quiz = QuizService.get_quiz_detail(quiz_id=str(quiz_id), user=request.user)
        if not quiz:
            return error_response(
                message="Không tìm thấy đề thi để cập nhật.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if request.user.role != 'ADMIN' and quiz.created_by != request.user:
            return error_response(
                message="Bạn không có quyền chỉnh sửa đề thi của người khác.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        serializer = QuizCreateUpdateSerializer(quiz, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu cập nhật đề thi không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        updated_quiz = QuizService.update_quiz(quiz=quiz, validated_data=serializer.validated_data)

        return success_response(
            data=QuizDetailTeacherSerializer(updated_quiz).data,
            message="Cập nhật đề thi thành công!",
            status_code=status.HTTP_200_OK
        )

    @delete_quiz_schema
    def delete(self, request, quiz_id):
        quiz = QuizService.get_quiz_detail(quiz_id=str(quiz_id), user=request.user)
        if not quiz:
            return error_response(
                message="Không tìm thấy đề thi để xóa.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if request.user.role != 'ADMIN' and quiz.created_by != request.user:
            return error_response(
                message="Bạn không có quyền xóa đề thi của người khác.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        QuizService.delete_quiz(quiz=quiz)

        return success_response(
            message="Đã xóa đề thi thành công!",
            status_code=status.HTTP_200_OK
        )


# ==================== QUESTION VIEWS ====================

class QuestionListCreateAPIView(APIView):
    """
    API Endpoint thêm câu hỏi mới vào đề thi (Giáo viên/Admin).
    """
    permission_classes = [IsTeacherUserRole]

    @create_question_schema
    def post(self, request, quiz_id):
        quiz = QuizService.get_quiz_detail(quiz_id=str(quiz_id), user=request.user)
        if not quiz:
            return error_response(
                message="Không tìm thấy đề thi để thêm câu hỏi.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if request.user.role != 'ADMIN' and quiz.created_by != request.user:
            return error_response(
                message="Bạn không có quyền thêm câu hỏi vào đề thi này.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        serializer = QuestionCreateUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu câu hỏi hoặc đáp án không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        question = QuestionService.create_question(quiz=quiz, validated_data=serializer.validated_data)

        return success_response(
            data=QuestionDetailSerializer(question).data,
            message="Thêm câu hỏi vào đề thi thành công!",
            status_code=status.HTTP_201_CREATED
        )


class QuestionDetailAPIView(APIView):
    """
    API Endpoint xem chi tiết, cập nhật hoặc xóa một Câu hỏi.
    """
    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT', 'DELETE']:
            return [IsTeacherUserRole()]
        return [AllowAny()]

    @get_question_detail_schema
    def get(self, request, question_id):
        question = QuestionService.get_question_by_id(question_id=str(question_id))
        if not question:
            return error_response(
                message="Không tìm thấy câu hỏi yêu cầu.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        return success_response(
            data=QuestionDetailSerializer(question).data,
            message="Lấy chi tiết câu hỏi thành công!",
            status_code=status.HTTP_200_OK
        )

    @update_question_schema
    def patch(self, request, question_id):
        question = QuestionService.get_question_by_id(question_id=str(question_id))
        if not question:
            return error_response(
                message="Không tìm thấy câu hỏi để cập nhật.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if request.user.role != 'ADMIN' and question.quiz.created_by != request.user:
            return error_response(
                message="Bạn không có quyền chỉnh sửa câu hỏi trong đề thi này.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        serializer = QuestionCreateUpdateSerializer(question, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu cập nhật câu hỏi không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        updated_question = QuestionService.update_question(
            question=question,
            validated_data=serializer.validated_data
        )

        return success_response(
            data=QuestionDetailSerializer(updated_question).data,
            message="Cập nhật câu hỏi thành công!",
            status_code=status.HTTP_200_OK
        )

    @delete_question_schema
    def delete(self, request, question_id):
        question = QuestionService.get_question_by_id(question_id=str(question_id))
        if not question:
            return error_response(
                message="Không tìm thấy câu hỏi để xóa.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if request.user.role != 'ADMIN' and question.quiz.created_by != request.user:
            return error_response(
                message="Bạn không có quyền xóa câu hỏi trong đề thi này.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        QuestionService.delete_question(question=question)

        return success_response(
            message="Đã xóa câu hỏi thành công!",
            status_code=status.HTTP_200_OK
        )


# ==================== QUIZ TAKING & GRADING VIEWS ====================

class StartQuizAttemptAPIView(APIView):
    """
    API Endpoint cho học viên bắt đầu làm bài thi.
    """
    permission_classes = [IsAuthenticated]

    @start_quiz_schema
    def post(self, request, quiz_id):
        success, message, attempt, quiz = GradingService.start_quiz_attempt(
            student=request.user,
            quiz_id=str(quiz_id)
        )

        if not success:
            return error_response(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        response_data = {
            'attempt_id': attempt.id,
            'quiz': QuizDetailStudentSerializer(quiz).data,
            'started_at': attempt.started_at,
            'time_limit_minutes': quiz.time_limit_minutes
        }

        return success_response(
            data=response_data,
            message=message,
            status_code=status.HTTP_201_CREATED
        )


class SubmitQuizAttemptAPIView(APIView):
    """
    API Endpoint cho học viên nộp bài và nhận kết quả chấm điểm tự động.
    """
    permission_classes = [IsAuthenticated]

    @submit_quiz_schema
    def post(self, request, attempt_id):
        serializer = QuizSubmissionRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu nộp bài không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        success, message, attempt = GradingService.submit_quiz_attempt(
            student=request.user,
            attempt_id=str(attempt_id),
            answers_data=serializer.validated_data.get('answers', [])
        )

        if not success:
            return error_response(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        return success_response(
            data=QuizAttemptResultSerializer(attempt).data,
            message=message,
            status_code=status.HTTP_200_OK
        )


class QuizAttemptResultAPIView(APIView):
    """
    API Endpoint xem kết quả chi tiết, bảng điểm và lời giải của lần thi.
    """
    permission_classes = [IsAuthenticated]

    @get_attempt_results_schema
    def get(self, request, attempt_id):
        attempt = GradingService.get_attempt_results(
            user=request.user,
            attempt_id=str(attempt_id)
        )

        if not attempt:
            return error_response(
                message="Không tìm thấy lần thi hoặc bạn không có quyền xem kết quả này.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        return success_response(
            data=QuizAttemptResultSerializer(attempt).data,
            message="Lấy kết quả lần thi thành công!",
            status_code=status.HTTP_200_OK
        )


class MyQuizAttemptsAPIView(APIView):
    """
    API Endpoint xem lịch sử tất cả các lần thi của học viên hiện tại.
    """
    permission_classes = [IsAuthenticated]

    @list_my_attempts_schema
    def get(self, request):
        filters = {
            'quiz_id': request.query_params.get('quiz_id'),
            'is_passed': request.query_params.get('is_passed'),
        }

        attempts = GradingService.list_student_attempts(
            student=request.user,
            filters=filters
        )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(attempts, request)
        serializer = QuizAttemptListSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)

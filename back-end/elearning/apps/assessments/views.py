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
    QuestionCreateUpdateSerializer
)
from .services import QuizService, QuestionService
from .schemas import (
    list_quizzes_schema,
    create_quiz_schema,
    get_quiz_detail_schema,
    update_quiz_schema,
    delete_quiz_schema,
    create_question_schema,
    get_question_detail_schema,
    update_question_schema,
    delete_question_schema
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

        # Giáo viên tạo đề / Admin xem đầy đủ đáp án; Học viên xem bản ẩn đáp án đúng
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

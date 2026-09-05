from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from common.responses import success_response, error_response
from common.pagination import StandardResultsSetPagination
from common.permissions import IsTeacherUserRole
from apps.assessments.serializers import QuizDetailStudentSerializer
from .models import ChatSession
from .serializers import (
    ChatSessionListSerializer,
    ChatSessionDetailSerializer,
    ChatSessionCreateSerializer,
    SendMessageRequestSerializer,
    ChatMessageSerializer,
    GrammarCheckRequestSerializer,
    GrammarCheckResponseSerializer,
    GenerateProgressQuizRequestSerializer,
    GenerateTeacherQuizRequestSerializer,
    GeneratedQuestionPreviewSerializer
)
from .services import AIService, AIQuizService
from .schemas import (
    list_sessions_schema,
    create_session_schema,
    get_session_detail_schema,
    delete_session_schema,
    send_message_schema,
    grammar_check_schema,
    generate_progress_quiz_schema,
    generate_teacher_quiz_schema
)

# ==================== CHAT SESSION VIEWS ====================

class ChatSessionListCreateAPIView(APIView):
    """
    API Endpoint lấy danh sách phiên trò chuyện của học viên hoặc tạo phiên chat mới.
    """
    permission_classes = [IsAuthenticated]

    @list_sessions_schema
    def get(self, request):
        filters = {
            'session_type': request.query_params.get('session_type'),
            'search': request.query_params.get('search'),
        }

        sessions = AIService.list_student_sessions(student=request.user, filters=filters)
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(sessions, request)
        serializer = ChatSessionListSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)

    @create_session_schema
    def post(self, request):
        serializer = ChatSessionCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu tạo phiên chat không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        session = AIService.create_session(
            student=request.user,
            validated_data=serializer.validated_data
        )

        return success_response(
            data=ChatSessionDetailSerializer(session).data,
            message="Khởi tạo phiên trò chuyện AI thành công!",
            status_code=status.HTTP_201_CREATED
        )


class ChatSessionDetailAPIView(APIView):
    """
    API Endpoint xem chi tiết phiên trò chuyện kèm lịch sử tin nhắn hoặc xóa phiên chat.
    """
    permission_classes = [IsAuthenticated]

    @get_session_detail_schema
    def get(self, request, session_id):
        session = AIService.get_session_detail(user=request.user, session_id=str(session_id))
        if not session:
            return error_response(
                message="Không tìm thấy phiên trò chuyện yêu cầu.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        return success_response(
            data=ChatSessionDetailSerializer(session).data,
            message="Lấy chi tiết phiên trò chuyện thành công!",
            status_code=status.HTTP_200_OK
        )

    @delete_session_schema
    def delete(self, request, session_id):
        deleted = AIService.delete_session(user=request.user, session_id=str(session_id))
        if not deleted:
            return error_response(
                message="Không tìm thấy phiên trò chuyện để xóa.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        return success_response(
            message="Đã xóa phiên trò chuyện thành công!",
            status_code=status.HTTP_200_OK
        )


# ==================== CHAT INTERACTION & GRAMMAR VIEWS ====================

class SendMessageAPIView(APIView):
    """
    API Endpoint gửi tin nhắn đến Trợ lý AI và nhận phản hồi tương tác kèm phân tích ngữ pháp.
    """
    permission_classes = [IsAuthenticated]

    @send_message_schema
    def post(self, request, session_id):
        serializer = SendMessageRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu tin nhắn không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        content = serializer.validated_data.get('content')
        audio_url = serializer.validated_data.get('audio_url')

        success, message, user_msg, ai_msg = AIService.send_message_and_get_ai_reply(
            student=request.user,
            session_id=str(session_id),
            content=content,
            audio_url=audio_url
        )

        if not success:
            return error_response(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        response_data = {
            'user_message': ChatMessageSerializer(user_msg).data,
            'ai_message': ChatMessageSerializer(ai_msg).data
        }

        return success_response(
            data=response_data,
            message=message,
            status_code=status.HTTP_201_CREATED
        )


class GrammarCheckAPIView(APIView):
    """
    API Endpoint kiểm tra & phân tích sửa lỗi ngữ pháp tiếng Anh.
    """
    permission_classes = [AllowAny]

    @grammar_check_schema
    def post(self, request):
        serializer = GrammarCheckRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu kiểm tra ngữ pháp không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        text = serializer.validated_data.get('text')
        target_level = serializer.validated_data.get('target_level', 'B1')

        result = AIService.check_grammar_text(text=text, target_level=target_level)

        return success_response(
            data=result,
            message="Phân tích ngữ pháp hoàn tất!",
            status_code=status.HTTP_200_OK
        )


# ==================== AI QUIZ GENERATOR VIEWS ====================

class GenerateProgressQuizAPIView(APIView):
    """
    API Endpoint cho phép học viên sinh đề ôn tập AI tức thời theo tiến độ các bài đã học trong Chapter (UC_S7).
    """
    permission_classes = [IsAuthenticated]

    @generate_progress_quiz_schema
    def post(self, request):
        serializer = GenerateProgressQuizRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu yêu cầu sinh đề ôn tập không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        chapter_id = serializer.validated_data.get('chapter_id')
        num_questions = serializer.validated_data.get('num_questions', 5)

        success, message, quiz = AIQuizService.generate_practice_quiz_by_progress(
            student=request.user,
            chapter_id=str(chapter_id),
            num_questions=num_questions
        )

        if not success:
            return error_response(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        return success_response(
            data=quiz,
            message=message,
            status_code=status.HTTP_201_CREATED
        )


class GenerateTeacherQuizAPIView(APIView):
    """
    API Endpoint cho phép Giáo viên / Admin sinh câu hỏi trắc nghiệm AI theo Chủ đề & Trình độ (UC_T4).
    """
    permission_classes = [IsAuthenticated, IsTeacherUserRole]

    @generate_teacher_quiz_schema
    def post(self, request):
        serializer = GenerateTeacherQuizRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu sinh câu hỏi không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        topic = serializer.validated_data.get('topic')
        level = serializer.validated_data.get('level', 'B1')
        count = serializer.validated_data.get('count', 10)
        skill = serializer.validated_data.get('skill', 'GRAMMAR')

        success, message, questions = AIQuizService.generate_quiz_for_teacher(
            teacher=request.user,
            topic=topic,
            level=level,
            count=count,
            skill=skill
        )

        if not success:
            return error_response(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        return success_response(
            data=GeneratedQuestionPreviewSerializer(questions, many=True).data,
            message=message,
            status_code=status.HTTP_200_OK
        )


class GenerateCourseDescriptionAPIView(APIView):
    """
    API Endpoint cho phép Giáo viên / Admin sinh mô tả khóa học chi tiết và tự động tư duy theo Tiêu đề + Trình độ CEFR.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        from .llm_client import get_llm_provider
        from .serializers import GenerateCourseDescriptionRequestSerializer

        serializer = GenerateCourseDescriptionRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu sinh mô tả khóa học không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        title = serializer.validated_data.get('title')
        target_type = serializer.validated_data.get('target_type', 'COURSE')
        chapter_title = serializer.validated_data.get('chapter_title', '')
        lesson_title = serializer.validated_data.get('lesson_title', '')
        category = serializer.validated_data.get('category', 'Tiếng Anh Tổng Quát')
        level = serializer.validated_data.get('level', 'B1')
        price = serializer.validated_data.get('price', 0)
        is_free = serializer.validated_data.get('is_free', True)

        try:
            llm = get_llm_provider()
            if target_type == 'CHAPTER':
                description = llm.generate_chapter_description(
                    course_title=title,
                    chapter_title=chapter_title or title,
                    level=level
                )
                msg = "AI đã tạo thành công mô tả mục tiêu chương học!"
            elif target_type == 'LESSON':
                description = llm.generate_lesson_content(
                    course_title=title,
                    chapter_title=chapter_title or "Chương tổng quát",
                    lesson_title=lesson_title or title,
                    level=level
                )
                msg = "AI đã tạo thành công tóm tắt trọng tâm bài giảng!"
            else:
                description = llm.generate_course_description(
                    title=title,
                    category=category,
                    level=level,
                    is_free=is_free,
                    price=float(price)
                )
                msg = "AI đã tạo thành công mô tả chi tiết cho khóa học!"

            return success_response(
                data={'description': description},
                message=msg,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return error_response(
                message=f"Lỗi khi gọi AI sinh mô tả: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class QuestionAnalysisAPIView(APIView):
    """
    API Endpoint: Phân tích học thuật chuyên sâu cho câu hỏi kiểm tra bằng LLM thật.
    Nhận ID câu hỏi hoặc nội dung câu hỏi, trả về phân tích JSON (topic, sub_topic, skill, difficulty, reason, confidence).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        question_id = request.data.get('question_id')
        from apps.ai.services import QuestionAnalysisAIService

        if question_id:
            from apps.assessments.models import Question
            try:
                question = Question.objects.get(id=question_id)
                ai_record = QuestionAnalysisAIService.analyze_and_store_question(
                    question=question,
                    student_answer=request.data.get('student_answer'),
                    force_refresh=request.data.get('force_refresh', False)
                )
                return success_response(
                    data={
                        'question_id': str(question.id),
                        'topic': ai_record.topic,
                        'sub_topic': ai_record.sub_topic,
                        'skill': ai_record.skill,
                        'difficulty': ai_record.difficulty,
                        'reason': ai_record.reason,
                        'confidence': ai_record.confidence,
                    },
                    message="Phân tích câu hỏi bằng AI thành công!",
                    status_code=status.HTTP_200_OK
                )
            except Question.DoesNotExist:
                return error_response(
                    message="Không tìm thấy câu hỏi với ID đã cung cấp.",
                    status_code=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                return error_response(
                    message=f"Lỗi khi gọi LLM phân tích: {str(e)}",
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        question_content = request.data.get('question_content')
        if not question_content:
            return error_response(
                message="Vui lòng cung cấp question_id hoặc question_content.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        try:
            analysis = QuestionAnalysisAIService.analyze_question_data({
                'question_content': question_content,
                'options_text': request.data.get('options_text', 'N/A'),
                'correct_answer': request.data.get('correct_answer', 'N/A'),
                'student_answer': request.data.get('student_answer', 'N/A'),
                'explanation': request.data.get('explanation', 'N/A'),
                'skill_type': request.data.get('skill_type', 'GRAMMAR')
            })
            return success_response(
                data=analysis,
                message="Phân tích câu hỏi bằng AI thành công!",
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return error_response(
                message=f"Lỗi khi gọi LLM phân tích: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



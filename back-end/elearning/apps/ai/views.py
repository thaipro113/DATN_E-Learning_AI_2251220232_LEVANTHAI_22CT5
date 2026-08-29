from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from common.responses import success_response, error_response
from common.pagination import StandardResultsSetPagination
from .models import ChatSession
from .serializers import (
    ChatSessionListSerializer,
    ChatSessionDetailSerializer,
    ChatSessionCreateSerializer,
    SendMessageRequestSerializer,
    ChatMessageSerializer,
    GrammarCheckRequestSerializer,
    GrammarCheckResponseSerializer
)
from .services import AIService
from .schemas import (
    list_sessions_schema,
    create_session_schema,
    get_session_detail_schema,
    delete_session_schema,
    send_message_schema,
    grammar_check_schema
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
    permission_classes = [IsAuthenticated]

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

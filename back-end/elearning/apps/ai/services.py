import uuid
from typing import Tuple, Dict, Any, List, Optional
from django.db import transaction
from django.db.models import Q
from apps.accounts.models import CustomUser
from .models import ChatSession, ChatMessage, SessionType, MessageSenderType
from .prompts import build_system_prompt
from .llm_client import get_llm_provider


class AIService:
    """
    Tầng xử lý nghiệp vụ cho Hệ thống Trợ lý Gia sư AI và Phân tích Ngữ pháp.
    """

    @staticmethod
    def create_session(student: CustomUser, validated_data: dict) -> ChatSession:
        """
        Khởi tạo phiên trò chuyện AI mới.
        """
        session = ChatSession.objects.create(student=student, **validated_data)
        return session

    @staticmethod
    def list_student_sessions(student: CustomUser, filters: Dict[str, Any] = None):
        """
        Lấy danh sách các phiên trò chuyện của học viên.
        """
        filters = filters or {}
        queryset = ChatSession.objects.filter(student=student, is_active=True).select_related('course', 'lesson')

        session_type = filters.get('session_type')
        if session_type:
            queryset = queryset.filter(session_type=session_type.upper())

        search = filters.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(course__title__icontains=search) |
                Q(lesson__title__icontains=search)
            )

        return queryset.order_by('-updated_at')

    @staticmethod
    def get_session_detail(user: CustomUser, session_id: str) -> Optional[ChatSession]:
        """
        Lấy chi tiết phiên trò chuyện kèm toàn bộ lịch sử tin nhắn.
        """
        try:
            session_uuid = uuid.UUID(str(session_id))
            queryset = ChatSession.objects.select_related('student', 'course', 'lesson').prefetch_related('messages')

            if user.role != 'ADMIN':
                queryset = queryset.filter(student=user)

            return queryset.filter(id=session_uuid).first()
        except (ValueError, TypeError):
            return None

    @staticmethod
    def delete_session(user: CustomUser, session_id: str) -> bool:
        """
        Xóa phiên trò chuyện.
        """
        session = AIService.get_session_detail(user=user, session_id=session_id)
        if not session:
            return False

        session.delete()
        return True

    @staticmethod
    def send_message_and_get_ai_reply(
        student: CustomUser,
        session_id: str,
        content: str,
        audio_url: str = None
    ) -> Tuple[bool, str, Optional[ChatMessage], Optional[ChatMessage]]:
        """
        Xử lý lượt trò chuyện giữa Học viên và AI Tutor:
        1. Lưu tin nhắn của Học viên vào CSDL.
        2. Tạo System Prompt theo ngữ cảnh phiên chat (Trình độ, Bài học, Loại phiên).
        3. Gửi đến LLM Provider (Gemini / Groq / Fallback Mock) để sinh câu trả lời & phân tích lỗi ngữ pháp.
        4. Lưu tin nhắn phản hồi của AI vào CSDL.
        """
        session = AIService.get_session_detail(user=student, session_id=session_id)
        if not session:
            return False, "Không tìm thấy phiên trò chuyện yêu cầu.", None, None

        if not content.strip():
            return False, "Nội dung tin nhắn không được để trống.", None, None

        with transaction.atomic():
            # 1. Lưu tin nhắn học viên
            user_message = ChatMessage.objects.create(
                session=session,
                sender_type=MessageSenderType.USER,
                content=content.strip(),
                audio_url=audio_url
            )

            # 2. Xây dựng System Prompt & Lịch sử tin nhắn
            course_title = session.course.title if session.course else None
            lesson_title = session.lesson.title if session.lesson else None

            system_prompt = build_system_prompt(
                session_type=session.session_type,
                target_level=session.target_level,
                course_title=course_title,
                lesson_title=lesson_title
            )

            # Lấy 10 tin nhắn gần nhất để duy trì ngữ cảnh
            recent_messages = list(session.messages.order_by('-created_at')[:10])
            recent_messages.reverse()

            history = []
            for msg in recent_messages:
                role = 'user' if msg.sender_type == MessageSenderType.USER else 'model'
                history.append({'role': role, 'content': msg.content})

            # 3. Gọi LLM Provider
            provider = get_llm_provider()
            reply_text, grammar_corrections, token_count, model_name = provider.generate_chat_response(
                messages=history,
                system_prompt=system_prompt
            )

            # 4. Lưu tin nhắn phản hồi của AI
            ai_message = ChatMessage.objects.create(
                session=session,
                sender_type=MessageSenderType.AI,
                content=reply_text,
                grammar_corrections=grammar_corrections or {},
                token_count=token_count,
                model_used=model_name
            )

            # Cập nhật thời điểm phiên chat
            session.save(update_fields=['updated_at'])

        return True, "Gửi tin nhắn và nhận phản hồi AI thành công!", user_message, ai_message

    @staticmethod
    def check_grammar_text(text: str, target_level: str = 'B1') -> Dict[str, Any]:
        """
        API Chuyên biệt: Phân tích & Sửa lỗi ngữ pháp/từ vựng cho một đoạn văn bản.
        """
        if not text or not text.strip():
            return {
                'has_errors': False,
                'original_text': '',
                'corrected_text': '',
                'errors_count': 0,
                'errors': [],
                'better_alternatives': [],
                'overall_comment_vi': "Vui lòng nhập đoạn văn bản cần kiểm tra."
            }

        provider = get_llm_provider()
        return provider.analyze_grammar(text=text.strip(), target_level=target_level)

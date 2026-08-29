from rest_framework import serializers
from .models import ChatSession, ChatMessage, SessionType, MessageSenderType
from apps.courses.models import Course, Lesson
from apps.accounts.models import EnglishLevel


# ==================== CHAT MESSAGE SERIALIZERS ====================

class ChatMessageSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị tin nhắn trong cuộc hội thoại (Tin nhắn người dùng hoặc AI).
    """
    sender_type_display = serializers.CharField(source='get_sender_type_display', read_only=True)

    class Meta:
        model = ChatMessage
        fields = [
            'id',
            'sender_type',
            'sender_type_display',
            'content',
            'audio_url',
            'grammar_corrections',
            'token_count',
            'model_used',
            'created_at'
        ]


class SendMessageRequestSerializer(serializers.Serializer):
    """
    Serializer tiếp nhận nội dung tin nhắn học viên gửi đến AI Tutor.
    """
    content = serializers.CharField(
        required=True,
        allow_blank=False,
        max_length=5000,
        error_messages={'required': "Vui lòng nhập nội dung tin nhắn."}
    )
    audio_url = serializers.URLField(
        required=False,
        allow_null=True,
        allow_blank=True,
        max_length=500
    )


class SendMessageResponseSerializer(serializers.Serializer):
    """
    Serializer phản hồi sau khi gửi tin nhắn (Bao gồm tin nhắn học viên và phản hồi từ AI).
    """
    user_message = ChatMessageSerializer()
    ai_message = ChatMessageSerializer()


# ==================== CHAT SESSION SERIALIZERS ====================

class ChatSessionListSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị danh sách các phiên trò chuyện của học viên.
    """
    session_type_display = serializers.CharField(source='get_session_type_display', read_only=True)
    target_level_display = serializers.CharField(source='get_target_level_display', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True, default=None)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True, default=None)
    total_messages = serializers.IntegerField(read_only=True)

    class Meta:
        model = ChatSession
        fields = [
            'id',
            'title',
            'session_type',
            'session_type_display',
            'target_level',
            'target_level_display',
            'course',
            'course_title',
            'lesson',
            'lesson_title',
            'total_messages',
            'is_active',
            'created_at',
            'updated_at'
        ]


class ChatSessionDetailSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị chi tiết phiên trò chuyện kèm toàn bộ lịch sử tin nhắn.
    """
    messages = ChatMessageSerializer(many=True, read_only=True)
    session_type_display = serializers.CharField(source='get_session_type_display', read_only=True)
    target_level_display = serializers.CharField(source='get_target_level_display', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True, default=None)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True, default=None)
    total_messages = serializers.IntegerField(read_only=True)

    class Meta:
        model = ChatSession
        fields = [
            'id',
            'title',
            'session_type',
            'session_type_display',
            'target_level',
            'target_level_display',
            'course',
            'course_title',
            'lesson',
            'lesson_title',
            'total_messages',
            'is_active',
            'messages',
            'created_at',
            'updated_at'
        ]


class ChatSessionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer tiếp nhận dữ liệu khi khởi tạo phiên chat AI mới.
    """
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        source='course',
        required=False,
        allow_null=True
    )
    lesson_id = serializers.PrimaryKeyRelatedField(
        queryset=Lesson.objects.all(),
        source='lesson',
        required=False,
        allow_null=True
    )

    class Meta:
        model = ChatSession
        fields = [
            'title',
            'session_type',
            'target_level',
            'course_id',
            'lesson_id'
        ]
        extra_kwargs = {
            'title': {'required': False, 'default': 'Cuộc trò chuyện mới'},
            'session_type': {'required': False, 'default': SessionType.GENERAL},
            'target_level': {'required': False, 'default': 'ALL'}
        }


# ==================== GRAMMAR CHECKER SERIALIZERS ====================

class GrammarCheckRequestSerializer(serializers.Serializer):
    """
    Serializer tiếp nhận đoạn văn bản tiếng Anh cần kiểm tra ngữ pháp.
    """
    text = serializers.CharField(
        required=True,
        allow_blank=False,
        max_length=5000,
        error_messages={'required': "Vui lòng nhập đoạn văn bản cần kiểm tra."}
    )
    target_level = serializers.ChoiceField(
        choices=EnglishLevel.choices + [('ALL', 'Mọi trình độ')],
        required=False,
        default='B1'
    )


class GrammarErrorItemSerializer(serializers.Serializer):
    error_segment = serializers.CharField()
    correction = serializers.CharField()
    error_type = serializers.CharField()
    explanation_vi = serializers.CharField()


class GrammarCheckResponseSerializer(serializers.Serializer):
    """
    Serializer cấu trúc kết quả phân tích & sửa lỗi ngữ pháp từ AI.
    """
    has_errors = serializers.BooleanField()
    original_text = serializers.CharField()
    corrected_text = serializers.CharField()
    errors_count = serializers.IntegerField()
    errors = GrammarErrorItemSerializer(many=True)
    better_alternatives = serializers.ListField(child=serializers.CharField())
    overall_comment_vi = serializers.CharField()

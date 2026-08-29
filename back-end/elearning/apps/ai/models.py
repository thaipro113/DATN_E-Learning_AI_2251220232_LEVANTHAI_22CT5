import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from common.models import BaseModel
from apps.accounts.models import EnglishLevel


class SessionType(models.TextChoices):
    GENERAL = 'GENERAL', _('Trợ lý học tập tổng quát')
    LESSON_TUTOR = 'LESSON_TUTOR', _('Gia sư bài học chuyên sâu')
    GRAMMAR_CHECK = 'GRAMMAR_CHECK', _('Kiểm tra & Sửa lỗi ngữ pháp')
    ROLEPLAY = 'ROLEPLAY', _('Luyện giao tiếp & Nhập vai theo ngữ cảnh')


class MessageSenderType(models.TextChoices):
    USER = 'USER', _('Học viên')
    AI = 'AI', _('Trợ lý AI')
    SYSTEM = 'SYSTEM', _('Chỉ dẫn hệ thống (System Prompt)')


class ChatSession(BaseModel):
    """
    Phiên trò chuyện giữa Học viên và Trợ lý AI (Gia sư ảo).
    """
    student = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.CASCADE,
        related_name='chat_sessions',
        verbose_name=_('Học viên')
    )
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ai_chat_sessions',
        verbose_name=_('Khóa học liên kết')
    )
    lesson = models.ForeignKey(
        'courses.Lesson',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ai_chat_sessions',
        verbose_name=_('Bài học liên kết')
    )
    title = models.CharField(_('Tiêu đề cuộc trò chuyện'), max_length=255, default='Cuộc trò chuyện mới')
    session_type = models.CharField(
        _('Loại phiên chat'),
        max_length=30,
        choices=SessionType.choices,
        default=SessionType.GENERAL
    )
    target_level = models.CharField(
        _('Trình độ tiếng Anh mục tiêu'),
        max_length=10,
        choices=EnglishLevel.choices + [('ALL', _('Mọi trình độ'))],
        default='ALL'
    )
    is_active = models.BooleanField(_('Đang hoạt động'), default=True)

    class Meta:
        db_table = 'ai_chat_sessions'
        verbose_name = _('Phiên trò chuyện AI')
        verbose_name_plural = _('Danh sách phiên trò chuyện AI')
        ordering = ['-updated_at']

    def __str__(self):
        return f"[{self.get_session_type_display()}] {self.student.full_name} - {self.title}"

    @property
    def total_messages(self) -> int:
        return self.messages.count()


class ChatMessage(BaseModel):
    """
    Tin nhắn trong phiên hội thoại AI (Lưu trữ nội dung trao đổi, phân tích lỗi ngữ pháp và thông tin token).
    """
    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name=_('Phiên chat')
    )
    sender_type = models.CharField(
        _('Người gửi'),
        max_length=20,
        choices=MessageSenderType.choices,
        default=MessageSenderType.USER
    )
    content = models.TextField(_('Nội dung tin nhắn'))
    audio_url = models.URLField(_('Tệp âm thanh phát âm'), max_length=500, blank=True, null=True)
    grammar_corrections = models.JSONField(
        _('Phân tích sửa lỗi ngữ pháp & từ vựng'),
        default=dict,
        blank=True,
        help_text="Chứa danh sách các lỗi sai phát hiện được và đề xuất sửa đổi"
    )
    token_count = models.PositiveIntegerField(_('Số token tiêu thụ'), default=0)
    model_used = models.CharField(_('Mô hình AI sử dụng'), max_length=100, default='gemini-1.5-flash')

    class Meta:
        db_table = 'ai_chat_messages'
        verbose_name = _('Tin nhắn AI')
        verbose_name_plural = _('Lịch sử tin nhắn AI')
        ordering = ['created_at']

    def __str__(self):
        sender = self.get_sender_type_display()
        return f"[{sender}] {self.content[:50]}..."

from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from common.models import BaseModel


class DeckCategory(models.TextChoices):
    SYSTEM = 'SYSTEM', _('Chuẩn hệ thống CEFR')
    TEACHER = 'TEACHER', _('Giảng viên & Khóa học')
    PERSONAL = 'PERSONAL', _('Sổ tay cá nhân học viên')


class DeckStatus(models.TextChoices):
    DRAFT = 'DRAFT', _('Bản nháp')
    PENDING = 'PENDING', _('Chờ phản biện duyệt')
    PUBLISHED = 'PUBLISHED', _('Đã xuất bản')
    REJECTED = 'REJECTED', _('Cần sửa đổi theo phản biện')


class AccessScope(models.TextChoices):
    PUBLIC = 'PUBLIC', _('Tự do / Công khai toàn hệ thống')
    ENROLLED = 'ENROLLED', _('Chỉ học viên đã đăng ký khóa học')


class FlashcardDeck(BaseModel):
    """
    Bộ thẻ / Đề tài từ vựng Flashcard.
    """
    code = models.CharField(
        _('Mã định danh'),
        max_length=120,
        unique=True,
        null=True,
        blank=True,
        help_text=_('Mã duy nhất như daily_life, toeic_900_an, hoặc để trống tự sinh')
    )
    title = models.CharField(_('Tên đề tài từ vựng'), max_length=255)
    description = models.TextField(_('Mô tả đề tài'), blank=True, default='')
    level = models.CharField(_('Cấp độ CEFR / Mục tiêu'), max_length=50, default='B1 - B2')
    color = models.CharField(_('Mã màu nhận diện'), max_length=30, default='#0284c7')
    icon = models.CharField(_('Icon FontAwesome'), max_length=60, default='fa-book-bookmark')
    category = models.CharField(
        _('Phân loại danh mục'),
        max_length=20,
        choices=DeckCategory.choices,
        default=DeckCategory.TEACHER
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='flashcard_decks',
        verbose_name=_('Tác giả tạo đề tài')
    )
    author_name = models.CharField(_('Tên hiển thị tác giả'), max_length=150, blank=True, default='')
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='flashcard_decks',
        verbose_name=_('Khóa học liên kết')
    )
    course_title = models.CharField(_('Tên khóa học liên kết'), max_length=255, blank=True, default='')
    access_scope = models.CharField(
        _('Phạm vi truy cập'),
        max_length=20,
        choices=AccessScope.choices,
        default=AccessScope.PUBLIC
    )
    is_public = models.BooleanField(_('Được công khai toàn trang'), default=True)
    status = models.CharField(
        _('Trạng thái thẩm định'),
        max_length=20,
        choices=DeckStatus.choices,
        default=DeckStatus.DRAFT
    )
    rejection_reason = models.TextField(_('Lý do phản biện từ chối'), blank=True, null=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_flashcard_decks',
        verbose_name=_('Người phản biện duyệt')
    )
    reviewed_at = models.DateTimeField(_('Thời gian phản biện duyệt'), null=True, blank=True)
    is_resubmitted = models.BooleanField(_('Đã nộp lại sau khi sửa'), default=False)
    resubmitted_at = models.DateTimeField(_('Thời gian nộp lại'), null=True, blank=True)
    previous_rejection_reason = models.TextField(_('Góp ý phản biện vòng trước'), blank=True, null=True)
    order = models.PositiveIntegerField(_('Thứ tự hiển thị'), default=0)

    class Meta:
        db_table = 'flashcard_decks'
        verbose_name = _('Đề tài Flashcard')
        verbose_name_plural = _('Các đề tài Flashcard')
        ordering = ['order', '-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = f"deck_{str(self.id)[:8]}"
        if self.course and not self.course_title:
            self.course_title = self.course.title
        if self.author and not self.author_name:
            self.author_name = self.author.full_name or self.author.email
        super().save(*args, **kwargs)


class Flashcard(BaseModel):
    """
    Thẻ từ vựng đơn lẻ trong bộ thẻ.
    """
    deck = models.ForeignKey(
        FlashcardDeck,
        on_delete=models.CASCADE,
        related_name='cards',
        verbose_name=_('Thuộc đề tài')
    )
    code = models.CharField(_('Mã từ vựng'), max_length=120, null=True, blank=True)
    word = models.CharField(_('Từ vựng tiếng Anh'), max_length=200, db_index=True)
    ipa = models.CharField(_('Phiên âm IPA'), max_length=120, blank=True, default='')
    part_of_speech = models.CharField(_('Loại từ'), max_length=60, default='Noun')
    meaning = models.TextField(_('Nghĩa tiếng Việt'))
    english_def = models.TextField(_('Định nghĩa tiếng Anh'), blank=True, default='')
    example = models.TextField(_('Ví dụ ngữ cảnh tiếng Anh'), blank=True, default='')
    example_vi = models.TextField(_('Dịch nghĩa ví dụ tiếng Việt'), blank=True, default='')
    collocation = models.TextField(_('Cụm từ collocations kết hợp'), blank=True, default='')
    audio_url = models.URLField(_('Đường dẫn âm thanh phát âm'), max_length=500, blank=True, null=True)
    order = models.PositiveIntegerField(_('Thứ tự trong đề tài'), default=0)

    class Meta:
        db_table = 'flashcards'
        verbose_name = _('Thẻ từ vựng Flashcard')
        verbose_name_plural = _('Các thẻ từ vựng Flashcard')
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.word} - {self.meaning[:30]}"


class UserCardProgress(BaseModel):
    """
    Tiến độ học tập và ghi nhớ thẻ từ vựng của học viên.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='flashcard_progress',
        verbose_name=_('Học viên')
    )
    card = models.ForeignKey(
        Flashcard,
        on_delete=models.CASCADE,
        related_name='user_progress',
        verbose_name=_('Thẻ từ vựng')
    )
    deck = models.ForeignKey(
        FlashcardDeck,
        on_delete=models.CASCADE,
        related_name='user_deck_progress',
        verbose_name=_('Đề tài')
    )
    is_mastered = models.BooleanField(_('Đã thuộc từ này'), default=False)
    is_review = models.BooleanField(_('Đang cần ôn tập lại'), default=False)
    study_count = models.PositiveIntegerField(_('Số lần lật thẻ ôn tập'), default=0)
    last_studied_at = models.DateTimeField(_('Lần ôn tập gần nhất'), auto_now=True)

    class Meta:
        db_table = 'user_card_progress'
        verbose_name = _('Tiến độ học từ vựng')
        verbose_name_plural = _('Tiến độ học từ vựng')
        unique_together = ('user', 'card')

    def __str__(self):
        return f"{self.user} - {self.card.word} (Mastered: {self.is_mastered})"

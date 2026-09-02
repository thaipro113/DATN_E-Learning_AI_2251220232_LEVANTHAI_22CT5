import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from common.models import BaseModel
from apps.accounts.models import EnglishLevel


class QuizType(models.TextChoices):
    PLACEMENT = 'PLACEMENT', _('Đánh giá năng lực đầu vào')
    PRACTICE = 'PRACTICE', _('Luyện tập theo bài/chương')
    FINAL = 'FINAL', _('Đề thi cuối khóa')


class QuestionType(models.TextChoices):
    SINGLE_CHOICE = 'SINGLE_CHOICE', _('Trắc nghiệm 1 đáp án')
    MULTIPLE_CHOICE = 'MULTIPLE_CHOICE', _('Trắc nghiệm nhiều đáp án')
    TRUE_FALSE = 'TRUE_FALSE', _('Đúng / Sai')
    FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK', _('Điền vào chỗ trống')


class SkillType(models.TextChoices):
    LISTENING = 'LISTENING', _('Kỹ năng Nghe')
    READING = 'READING', _('Kỹ năng Đọc')
    WRITING = 'WRITING', _('Kỹ năng Viết')
    SPEAKING = 'SPEAKING', _('Kỹ năng Nói')
    GRAMMAR = 'GRAMMAR', _('Ngữ pháp')
    VOCABULARY = 'VOCABULARY', _('Từ vựng')


class AttemptStatus(models.TextChoices):
    IN_PROGRESS = 'IN_PROGRESS', _('Đang làm bài')
    COMPLETED = 'COMPLETED', _('Đã hoàn thành')
    ABANDONED = 'ABANDONED', _('Đã hủy bài thi')


class Quiz(BaseModel):
    """
    Đề thi, bài kiểm tra hoặc bài luyện tập.
    """
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quizzes',
        verbose_name=_('Khóa học liên kết')
    )
    chapter = models.ForeignKey(
        'courses.Chapter',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quizzes',
        verbose_name=_('Chương học liên kết')
    )
    lesson = models.ForeignKey(
        'courses.Lesson',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quizzes',
        verbose_name=_('Bài học liên kết')
    )
    title = models.CharField(_('Tiêu đề đề thi'), max_length=255)
    description = models.TextField(_('Mô tả đề thi'), blank=True, default='')
    quiz_type = models.CharField(
        _('Loại đề thi'),
        max_length=20,
        choices=QuizType.choices,
        default=QuizType.PRACTICE
    )
    level = models.CharField(
        _('Trình độ mục tiêu'),
        max_length=10,
        choices=EnglishLevel.choices + [('ALL', _('Mọi trình độ'))],
        default='ALL'
    )
    time_limit_minutes = models.PositiveIntegerField(
        _('Thời gian làm bài (phút)'),
        default=30,
        help_text="0 = Không giới hạn thời gian"
    )
    passing_score = models.DecimalField(
        _('Điểm đạt (%)'),
        max_digits=5,
        decimal_places=2,
        default=50.00,
        help_text="Tỷ lệ % tối thiểu để vượt qua bài thi (VD: 50.00%)"
    )
    is_published = models.BooleanField(_('Đã phát hành công khai'), default=True)
    created_by = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_quizzes',
        verbose_name=_('Người tạo')
    )

    class Meta:
        db_table = 'quizzes'
        verbose_name = _('Đề thi / Bài kiểm tra')
        verbose_name_plural = _('Danh sách đề thi')
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_quiz_type_display()}] {self.title}"

    @property
    def total_questions(self) -> int:
        return self.questions.count()

    @property
    def total_points(self) -> float:
        return sum(float(q.points) for q in self.questions.all())


class Question(BaseModel):
    """
    Câu hỏi trong Đề thi / Ngân hàng câu hỏi.
    """
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='questions',
        verbose_name=_('Đề thi')
    )
    content = models.TextField(_('Nội dung câu hỏi'))
    question_type = models.CharField(
        _('Loại câu hỏi'),
        max_length=30,
        choices=QuestionType.choices,
        default=QuestionType.SINGLE_CHOICE
    )
    skill = models.CharField(
        _('Kỹ năng đánh giá'),
        max_length=20,
        choices=SkillType.choices,
        default=SkillType.GRAMMAR
    )
    level = models.CharField(
        _('Trình độ câu hỏi'),
        max_length=10,
        choices=EnglishLevel.choices,
        default=EnglishLevel.A1
    )
    audio_url = models.URLField(_('Tệp âm thanh (cho bài nghe)'), max_length=500, blank=True, null=True)
    image_url = models.URLField(_('Hình ảnh minh họa'), max_length=500, blank=True, null=True)
    explanation = models.TextField(
        _('Lời giải thích chi tiết'),
        blank=True,
        default='',
        help_text="Hiển thị cho học viên sau khi hoàn thành bài thi"
    )
    points = models.DecimalField(_('Điểm số'), max_digits=4, decimal_places=2, default=1.00)
    order_index = models.PositiveIntegerField(_('Thứ tự câu hỏi'), default=1)

    class Meta:
        db_table = 'questions'
        verbose_name = _('Câu hỏi')
        verbose_name_plural = _('Ngân hàng câu hỏi')
        ordering = ['order_index']
        unique_together = ('quiz', 'order_index')

    def __str__(self):
        return f"Câu {self.order_index}: {self.content[:60]}..."


class AnswerOption(BaseModel):
    """
    Lựa chọn đáp án của câu hỏi trắc nghiệm.
    """
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='options',
        verbose_name=_('Câu hỏi')
    )
    content = models.TextField(_('Nội dung đáp án'))
    is_correct = models.BooleanField(_('Đáp án đúng'), default=False)
    order_index = models.PositiveIntegerField(_('Thứ tự lựa chọn'), default=1)

    class Meta:
        db_table = 'answer_options'
        verbose_name = _('Lựa chọn đáp án')
        verbose_name_plural = _('Danh sách lựa chọn đáp án')
        ordering = ['order_index']

    def __str__(self):
        status = "[ĐÚNG]" if self.is_correct else "[SAI]"
        return f"{status} {self.content[:40]}"


class QuizAttempt(BaseModel):
    """
    Lần làm bài thi của học viên (Lịch sử làm bài, điểm số & đánh giá kết quả).
    """
    student = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.CASCADE,
        related_name='quiz_attempts',
        verbose_name=_('Học viên')
    )
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='attempts',
        verbose_name=_('Đề thi')
    )
    started_at = models.DateTimeField(_('Thời gian bắt đầu'), auto_now_add=True)
    completed_at = models.DateTimeField(_('Thời gian nộp bài'), null=True, blank=True)
    score = models.DecimalField(_('Điểm đạt được'), max_digits=6, decimal_places=2, default=0.00)
    max_score = models.DecimalField(_('Điểm tối đa'), max_digits=6, decimal_places=2, default=0.00)
    percentage = models.DecimalField(_('Tỷ lệ đúng (%)'), max_digits=5, decimal_places=2, default=0.00)
    is_passed = models.BooleanField(_('Đã vượt qua'), default=False)
    status = models.CharField(
        _('Trạng thái lần thi'),
        max_length=20,
        choices=AttemptStatus.choices,
        default=AttemptStatus.IN_PROGRESS
    )

    class Meta:
        db_table = 'quiz_attempts'
        verbose_name = _('Lần thi của học viên')
        verbose_name_plural = _('Danh sách lần thi')
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.student.full_name} - {self.quiz.title} ({self.score}/{self.max_score} điểm)"


class StudentAnswer(BaseModel):
    """
    Câu trả lời chi tiết của học viên cho từng câu hỏi trong lần thi.
    """
    attempt = models.ForeignKey(
        QuizAttempt,
        on_delete=models.CASCADE,
        related_name='student_answers',
        verbose_name=_('Lần thi')
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='student_answers',
        verbose_name=_('Câu hỏi')
    )
    selected_option = models.ForeignKey(
        AnswerOption,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='selected_by_students',
        verbose_name=_('Đáp án trắc nghiệm đã chọn')
    )
    text_answer = models.TextField(_('Câu trả lời tự luận / điền từ'), blank=True, default='')
    is_correct = models.BooleanField(_('Đúng hay sai'), default=False)
    score_earned = models.DecimalField(_('Điểm nhận được'), max_digits=4, decimal_places=2, default=0.00)

    class Meta:
        db_table = 'student_answers'
        verbose_name = _('Câu trả lời của học viên')
        verbose_name_plural = _('Danh sách câu trả lời')
        unique_together = ('attempt', 'question')

    def __str__(self):
        result = "ĐÚNG" if self.is_correct else "SAI"
        return f"{self.attempt.student.full_name} - Câu {self.question.order_index}: {result} (+{self.score_earned}đ)"

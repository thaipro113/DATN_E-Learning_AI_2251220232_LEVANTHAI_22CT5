import uuid
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from common.models import BaseModel


class EnrollmentStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', _('Đang học')
    COMPLETED = 'COMPLETED', _('Đã hoàn thành')
    CANCELLED = 'CANCELLED', _('Đã hủy ghi danh')


class Enrollment(BaseModel):
    """
    Thông tin ghi danh khóa học của học viên.
    """
    student = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.CASCADE,
        related_name='enrollments',
        verbose_name=_('Học viên')
    )
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='enrollments',
        verbose_name=_('Khóa học')
    )
    enrolled_at = models.DateTimeField(_('Thời gian ghi danh'), auto_now_add=True)
    status = models.CharField(
        _('Trạng thái học tập'),
        max_length=20,
        choices=EnrollmentStatus.choices,
        default=EnrollmentStatus.ACTIVE
    )
    progress_percent = models.DecimalField(
        _('Tiến độ hoàn thành (%)'),
        max_digits=5,
        decimal_places=2,
        default=0.00
    )
    completed_at = models.DateTimeField(_('Thời gian hoàn thành'), null=True, blank=True)

    class Meta:
        db_table = 'enrollments'
        verbose_name = _('Ghi danh khóa học')
        verbose_name_plural = _('Danh sách ghi danh')
        ordering = ['-enrolled_at']
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.student.full_name} - {self.course.title} ({self.progress_percent}%)"

    def recalculate_progress(self):
        """
        Tính toán lại phần trăm hoàn thành dựa trên số bài học trong khóa học.
        """
        total_lessons = self.course.total_lessons
        if total_lessons == 0:
            self.progress_percent = 0.00
            self.save(update_fields=['progress_percent', 'updated_at'])
            return self.progress_percent

        completed_lessons_count = self.lesson_progresses.filter(is_completed=True).count()
        percent = (completed_lessons_count / total_lessons) * 100.0
        self.progress_percent = round(min(percent, 100.0), 2)

        # Nếu đạt 100% thì tự động đánh dấu hoàn thành
        if self.progress_percent >= 100.0 and self.status != EnrollmentStatus.COMPLETED:
            self.status = EnrollmentStatus.COMPLETED
            self.completed_at = timezone.now()

        self.save(update_fields=['progress_percent', 'status', 'completed_at', 'updated_at'])
        return self.progress_percent


class LessonProgress(BaseModel):
    """
    Tiến độ học tập chi tiết của từng bài học (đã hoàn thành hay chưa, vị trí dừng video).
    """
    enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.CASCADE,
        related_name='lesson_progresses',
        verbose_name=_('Lần ghi danh')
    )
    lesson = models.ForeignKey(
        'courses.Lesson',
        on_delete=models.CASCADE,
        related_name='student_progresses',
        verbose_name=_('Bài học')
    )
    is_completed = models.BooleanField(_('Đã hoàn thành'), default=False)
    completed_at = models.DateTimeField(_('Thời gian hoàn thành'), null=True, blank=True)
    last_watched_second = models.PositiveIntegerField(_('Vị trí video dừng lại (giây)'), default=0)

    class Meta:
        db_table = 'lesson_progresses'
        verbose_name = _('Tiến độ bài học')
        verbose_name_plural = _('Danh sách tiến độ bài học')
        ordering = ['-updated_at']
        unique_together = ('enrollment', 'lesson')

    def __str__(self):
        status_text = "Hoàn thành" if self.is_completed else "Đang học"
        return f"{self.enrollment.student.full_name} - {self.lesson.title}: {status_text}"

    def mark_as_completed(self):
        """
        Đánh dấu hoàn thành bài học và tự động kích hoạt tính lại tiến độ của khóa học.
        """
        if not self.is_completed:
            self.is_completed = True
            self.completed_at = timezone.now()
            self.save(update_fields=['is_completed', 'completed_at', 'updated_at'])
            self.enrollment.recalculate_progress()


class Certificate(BaseModel):
    """
    Chứng chỉ điện tử cấp cho học viên sau khi hoàn thành 100% khóa học.
    """
    enrollment = models.OneToOneField(
        Enrollment,
        on_delete=models.CASCADE,
        related_name='certificate',
        verbose_name=_('Lần ghi danh')
    )
    certificate_code = models.CharField(
        _('Mã chứng chỉ duy nhất'),
        max_length=60,
        unique=True,
        help_text="Ví dụ: CERT-ELN-2026-ABC123XYZ"
    )
    issued_at = models.DateTimeField(_('Thời gian cấp'), auto_now_add=True)
    pdf_url = models.URLField(_('Đường dẫn tệp PDF chứng chỉ'), max_length=500, blank=True, null=True)

    class Meta:
        db_table = 'certificates'
        verbose_name = _('Chứng chỉ hoàn thành')
        verbose_name_plural = _('Danh sách chứng chỉ')
        ordering = ['-issued_at']

    def __str__(self):
        return f"Chứng chỉ [{self.certificate_code}] - {self.enrollment.student.full_name}"

    @classmethod
    def generate_unique_code(cls, course_slug: str) -> str:
        """
        Sinh mã chứng chỉ duy nhất không trùng lặp.
        """
        import random
        import string
        year = timezone.now().year
        random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        slug_prefix = course_slug[:6].upper().replace('-', '')
        code = f"CERT-{year}-{slug_prefix}-{random_suffix}"
        while cls.objects.filter(certificate_code=code).exists():
            random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            code = f"CERT-{year}-{slug_prefix}-{random_suffix}"
        return code

from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from common.models import BaseModel
from apps.accounts.models import EnglishLevel


class CourseStatus(models.TextChoices):
    DRAFT = 'DRAFT', _('Bản nháp')
    PUBLISHED = 'PUBLISHED', _('Đã xuất bản')
    ARCHIVED = 'ARCHIVED', _('Đã lưu trữ')


class MaterialType(models.TextChoices):
    PDF = 'PDF', _('Tài liệu PDF')
    DOCX = 'DOCX', _('Tài liệu Word')
    MP3 = 'MP3', _('Tệp âm thanh MP3')
    OTHER = 'OTHER', _('Tài liệu khác')


class Category(models.Model):
    """
    Danh mục phân loại khóa học (VD: Tiếng Anh Giao Tiếp, Ngữ Pháp, IELTS, TOEIC...).
    """
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(_('Tên danh mục'), max_length=150, unique=True)
    slug = models.SlugField(_('Slug định danh'), max_length=180, unique=True, blank=True)
    description = models.TextField(_('Mô tả danh mục'), blank=True, null=True)
    icon_url = models.URLField(_('Đường dẫn icon'), max_length=500, blank=True, null=True)
    is_active = models.BooleanField(_('Đang hoạt động'), default=True)
    created_at = models.DateTimeField(_('Ngày tạo'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Ngày cập nhật'), auto_now=True)

    class Meta:
        db_table = 'categories'
        verbose_name = _('Danh mục khóa học')
        verbose_name_plural = _('Danh mục khóa học')
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Course(BaseModel):
    """
    Thông tin khóa học chính do Giáo viên quản lý.
    """
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='courses',
        verbose_name=_('Danh mục')
    )
    teacher = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.CASCADE,
        related_name='teaching_courses',
        verbose_name=_('Giáo viên phụ trách')
    )
    title = models.CharField(_('Tiêu đề khóa học'), max_length=255)
    slug = models.SlugField(_('Slug định danh'), max_length=280, unique=True, blank=True)
    description = models.TextField(_('Mô tả tổng quan khóa học'))
    level = models.CharField(
        _('Trình độ khóa học'),
        max_length=10,
        choices=EnglishLevel.choices,
        default=EnglishLevel.A1
    )
    thumbnail_url = models.URLField(_('Ảnh đại diện khóa học'), max_length=500, blank=True, null=True)
    price = models.DecimalField(_('Học phí (VND)'), max_digits=12, decimal_places=0, default=0)
    is_free = models.BooleanField(_('Khóa học miễn phí'), default=True)
    status = models.CharField(
        _('Trạng thái khóa học'),
        max_length=20,
        choices=CourseStatus.choices,
        default=CourseStatus.DRAFT
    )

    class Meta:
        db_table = 'courses'
        verbose_name = _('Khóa học')
        verbose_name_plural = _('Danh sách khóa học')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_level_display()})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            # Tránh trùng lặp slug
            slug = base_slug
            counter = 1
            while Course.objects.filter(slug=slug).exclude(id=self.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        if self.price == 0:
            self.is_free = True
        else:
            self.is_free = False

        super().save(*args, **kwargs)

    @property
    def total_chapters(self):
        return self.chapters.count()

    @property
    def total_lessons(self):
        return Lesson.objects.filter(chapter__course=self).count()


class Chapter(BaseModel):
    """
    Chương học trong một khóa học, chứa nhiều bài học con.
    """
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='chapters',
        verbose_name=_('Khóa học')
    )
    title = models.CharField(_('Tiêu đề chương'), max_length=255)
    description = models.TextField(_('Mô tả ngắn'), blank=True, null=True)
    order_index = models.PositiveIntegerField(_('Thứ tự sắp xếp'), default=1)

    class Meta:
        db_table = 'chapters'
        verbose_name = _('Chương học')
        verbose_name_plural = _('Danh sách chương học')
        ordering = ['order_index', 'created_at']
        unique_together = ('course', 'order_index')

    def __str__(self):
        return f"{self.course.title} - Chương {self.order_index}: {self.title}"


class Lesson(BaseModel):
    """
    Bài học chi tiết thuộc một chương, chứa nội dung lý thuyết, video và tài liệu.
    """
    chapter = models.ForeignKey(
        Chapter,
        on_delete=models.CASCADE,
        related_name='lessons',
        verbose_name=_('Chương học')
    )
    title = models.CharField(_('Tiêu đề bài học'), max_length=255)
    content = models.TextField(_('Nội dung bài giảng (Markdown/Văn bản)'), blank=True, null=True)
    video_url = models.URLField(_('Đường dẫn video bài giảng'), max_length=500, blank=True, null=True)
    duration_minutes = models.PositiveIntegerField(_('Thời lượng ước tính (phút)'), default=10)
    order_index = models.PositiveIntegerField(_('Thứ tự sắp xếp'), default=1)
    is_preview = models.BooleanField(_('Cho phép học thử'), default=False)

    class Meta:
        db_table = 'lessons'
        verbose_name = _('Bài học')
        verbose_name_plural = _('Danh sách bài học')
        ordering = ['order_index', 'created_at']
        unique_together = ('chapter', 'order_index')

    def __str__(self):
        return f"{self.chapter.title} - Bài {self.order_index}: {self.title}"


class Material(BaseModel):
    """
    Tài liệu đính kèm cho bài học (PDF, Docx, Audio...).
    """
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='materials',
        verbose_name=_('Bài học')
    )
    title = models.CharField(_('Tên tài liệu'), max_length=255)
    file_url = models.URLField(_('Đường dẫn tệp tài liệu'), max_length=500)
    file_type = models.CharField(
        _('Loại tệp'),
        max_length=20,
        choices=MaterialType.choices,
        default=MaterialType.PDF
    )
    file_size_bytes = models.BigIntegerField(_('Dung lượng tệp (bytes)'), default=0)

    class Meta:
        db_table = 'materials'
        verbose_name = _('Tài liệu bài học')
        verbose_name_plural = _('Tài liệu bài học')
        ordering = ['created_at']

    def __str__(self):
        return f"{self.title} ({self.get_file_type_display()})"

from django.db import models
from common.models import BaseModel
from apps.accounts.models import CustomUser
from apps.assessments.models import Quiz


class ImportSourceType(models.TextChoices):
    RAW_TEXT = 'RAW_TEXT', 'Văn bản thô / Dán trực tiếp'
    DOCX = 'DOCX', 'Tệp Microsoft Word (.docx)'
    XLSX = 'XLSX', 'Tệp Microsoft Excel (.xlsx)'
    CSV = 'CSV', 'Tệp bảng tính (.csv)'


class BatchStatus(models.TextChoices):
    PENDING = 'PENDING', 'Chờ phân tích cú pháp'
    PARSED = 'PARSED', 'Đã trích xuất (Chờ giáo viên xác nhận)'
    IMPORTED = 'IMPORTED', 'Đã import thành công vào Đề thi'
    FAILED = 'FAILED', 'Trích xuất thất bại'


class QuizImportBatch(BaseModel):
    """
    Mô hình lưu trữ phiên import câu hỏi đề thi hàng loạt từ tệp hoặc văn bản.
    """
    teacher = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='quiz_import_batches',
        verbose_name="Giáo viên thực hiện"
    )
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='import_batches',
        verbose_name="Đề thi đích"
    )
    title = models.CharField(
        max_length=255,
        default="Phiên nhập đề thi tự động",
        verbose_name="Tên phiên import"
    )
    source_type = models.CharField(
        max_length=20,
        choices=ImportSourceType.choices,
        default=ImportSourceType.RAW_TEXT,
        verbose_name="Nguồn dữ liệu"
    )
    file = models.FileField(
        upload_to='quiz_imports/%Y/%m/',
        null=True,
        blank=True,
        verbose_name="Tệp đính kèm (.docx, .xlsx, .csv)"
    )
    raw_text = models.TextField(
        blank=True,
        default='',
        verbose_name="Nội dung văn bản thô"
    )
    use_ai = models.BooleanField(
        default=False,
        verbose_name="Sử dụng Google Gemini AI trích xuất",
        help_text="Bật tùy chọn này để AI tự động nhận diện và bóc tách câu hỏi phức tạp"
    )
    status = models.CharField(
        max_length=20,
        choices=BatchStatus.choices,
        default=BatchStatus.PENDING,
        verbose_name="Trạng thái phiên import"
    )
    total_parsed = models.PositiveIntegerField(
        default=0,
        verbose_name="Số câu hỏi trích xuất thành công"
    )
    total_imported = models.PositiveIntegerField(
        default=0,
        verbose_name="Số câu hỏi đã lưu vào đề thi"
    )
    parsed_data = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Dữ liệu câu hỏi đã chuẩn hóa (JSON)",
        help_text="Chứa danh sách câu hỏi, dạng câu, các phương án và đáp án đúng"
    )
    error_log = models.TextField(
        blank=True,
        default='',
        verbose_name="Nhật ký lỗi (nếu có)"
    )

    class Meta:
        db_table = 'quiz_import_batches'
        verbose_name = "Phiên import đề thi"
        verbose_name_plural = "Quản lý Phiên import đề thi"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.teacher.email} ({self.get_status_display()})"

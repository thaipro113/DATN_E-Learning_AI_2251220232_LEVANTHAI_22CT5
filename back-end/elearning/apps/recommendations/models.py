from django.db import models
from common.models import BaseModel
from apps.accounts.models import CustomUser, EnglishLevel
from apps.courses.models import Course, Lesson
from apps.assessments.models import Quiz, SkillType


class LearningPathStatus(models.TextChoices):
    IN_PROGRESS = 'IN_PROGRESS', 'Đang thực hiện'
    COMPLETED = 'COMPLETED', 'Đã hoàn thành'
    ARCHIVED = 'ARCHIVED', 'Đã lưu trữ / Thay thế'


class StepType(models.TextChoices):
    COURSE = 'COURSE', 'Học toàn bộ khóa học'
    LESSON = 'LESSON', 'Học bài học trọng tâm'
    QUIZ = 'QUIZ', 'Làm bài kiểm tra đánh giá'
    AI_PRACTICE = 'AI_PRACTICE', 'Luyện tập tương tác với Trợ lý AI'


class LearningPath(BaseModel):
    """
    Mô hình Lộ trình học tập cá nhân hóa do AI thiết kế riêng cho từng học viên (Personalized Learning Path).
    """
    student = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='learning_paths',
        verbose_name="Học viên"
    )
    title = models.CharField(
        max_length=255,
        default="Lộ trình học tập tiếng Anh cá nhân hóa",
        verbose_name="Tiêu đề lộ trình"
    )
    target_level = models.CharField(
        max_length=10,
        choices=EnglishLevel.choices,
        default=EnglishLevel.B2,
        verbose_name="Trình độ mục tiêu"
    )
    current_estimated_level = models.CharField(
        max_length=10,
        choices=EnglishLevel.choices,
        default=EnglishLevel.B1,
        verbose_name="Trình độ hiện tại ước tính"
    )
    goal_description = models.TextField(
        blank=True,
        verbose_name="Mục tiêu & Kỳ vọng học tập"
    )
    status = models.CharField(
        max_length=20,
        choices=LearningPathStatus.choices,
        default=LearningPathStatus.IN_PROGRESS,
        verbose_name="Trạng thái lộ trình"
    )
    total_steps = models.PositiveIntegerField(
        default=0,
        verbose_name="Tổng số chặng/bước"
    )
    completed_steps = models.PositiveIntegerField(
        default=0,
        verbose_name="Số chặng đã hoàn thành"
    )
    progress_percentage = models.FloatField(
        default=0.0,
        verbose_name="Tiến độ hoàn thành (%)"
    )

    class Meta:
        db_table = 'rec_learning_paths'
        verbose_name = "Lộ trình học tập"
        verbose_name_plural = "Quản lý Lộ trình học tập AI"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.email} - {self.title} ({self.get_status_display()})"

    def update_progress(self):
        """
        Cập nhật lại số bước đã hoàn thành và phần trăm tiến độ của lộ trình.
        """
        total = self.steps.count()
        completed = self.steps.filter(is_completed=True).count()
        self.total_steps = total
        self.completed_steps = completed
        self.progress_percentage = round((completed / total * 100.0), 2) if total > 0 else 0.0

        if total > 0 and completed == total:
            self.status = LearningPathStatus.COMPLETED

        self.save(update_fields=['total_steps', 'completed_steps', 'progress_percentage', 'status', 'updated_at'])


class LearningPathStep(BaseModel):
    """
    Từng bước / chặng hành động trong lộ trình học tập thích ứng (Adaptive Learning Step).
    """
    learning_path = models.ForeignKey(
        LearningPath,
        on_delete=models.CASCADE,
        related_name='steps',
        verbose_name="Lộ trình học tập"
    )
    step_index = models.PositiveIntegerField(
        default=1,
        verbose_name="Thứ tự chặng"
    )
    title = models.CharField(
        max_length=255,
        verbose_name="Tiêu đề chặng học"
    )
    description = models.TextField(
        blank=True,
        verbose_name="Hướng dẫn chi tiết từ AI"
    )
    step_type = models.CharField(
        max_length=20,
        choices=StepType.choices,
        default=StepType.COURSE,
        verbose_name="Loại hành động"
    )
    target_course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='path_steps',
        verbose_name="Khóa học mục tiêu"
    )
    target_lesson = models.ForeignKey(
        Lesson,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='path_steps',
        verbose_name="Bài học mục tiêu"
    )
    target_quiz = models.ForeignKey(
        Quiz,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='path_steps',
        verbose_name="Bài kiểm tra mục tiêu"
    )
    target_skill = models.CharField(
        max_length=20,
        choices=SkillType.choices,
        default=SkillType.GRAMMAR,
        verbose_name="Kỹ năng trọng tâm cần rèn luyện"
    )
    estimated_minutes = models.PositiveIntegerField(
        default=30,
        verbose_name="Thời gian ước tính (phút)"
    )
    is_completed = models.BooleanField(
        default=False,
        verbose_name="Đã hoàn thành"
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Thời điểm hoàn thành"
    )

    class Meta:
        db_table = 'rec_learning_path_steps'
        verbose_name = "Chặng học trong lộ trình"
        verbose_name_plural = "Danh sách Chặng học lộ trình"
        ordering = ['step_index', 'created_at']

    def __str__(self):
        return f"Bước {self.step_index}: {self.title} [{'Xong' if self.is_completed else 'Chưa xong'}]"


class SkillGapAnalysis(BaseModel):
    """
    Bảng theo dõi và phân tích lỗ hổng kiến thức / điểm yếu kỹ năng của học viên (Skill Gap Analytics).
    """
    student = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='skill_gaps',
        verbose_name="Học viên"
    )
    skill_type = models.CharField(
        max_length=20,
        choices=SkillType.choices,
        verbose_name="Kỹ năng ngôn ngữ"
    )
    proficiency_score = models.FloatField(
        null=True,
        blank=True,
        default=None,
        verbose_name="Điểm thành thạo năng lực (0 - 100)"
    )
    is_assessed = models.BooleanField(
        default=False,
        verbose_name="Đã được đánh giá qua bài thi"
    )
    weak_topics = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Danh sách các chủ đề/dạng bài còn yếu",
        help_text="Ví dụ: [{'topic': 'Past Perfect', 'sub_topic': 'Past Perfect vs Past Simple'}]"
    )
    recommended_action = models.TextField(
        blank=True,
        verbose_name="Đề xuất cải thiện từ AI"
    )
    last_assessed_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Lần đánh giá gần nhất"
    )

    class Meta:
        db_table = 'rec_skill_gap_analyses'
        verbose_name = "Phân tích Lỗ hổng Kỹ năng"
        verbose_name_plural = "Bảng Phân tích Lỗ hổng Kỹ năng Học viên"
        unique_together = ('student', 'skill_type')
        ordering = ['proficiency_score']

    def __str__(self):
        score_str = f"{self.proficiency_score:.1f}%" if self.is_assessed and self.proficiency_score is not None else "Chưa đánh giá"
        return f"{self.student.email} - {self.get_skill_type_display()}: {score_str}"


class CourseRecommendation(BaseModel):
    """
    Bảng lưu trữ các khóa học được AI gợi ý riêng cho từng học viên (AI Course Recommendation).
    """
    student = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='course_recommendations',
        verbose_name="Học viên"
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='recommendations',
        verbose_name="Khóa học được đề xuất"
    )
    relevance_score = models.FloatField(
        default=90.0,
        verbose_name="Điểm tương thích/phù hợp (0 - 100)"
    )
    reason = models.TextField(
        verbose_name="Lý do AI đề xuất khóa học"
    )
    is_dismissed = models.BooleanField(
        default=False,
        verbose_name="Học viên đã ẩn/bỏ qua gợi ý"
    )

    class Meta:
        db_table = 'rec_course_recommendations'
        verbose_name = "Gợi ý Khóa học AI"
        verbose_name_plural = "Danh sách Gợi ý Khóa học AI"
        unique_together = ('student', 'course')
        ordering = ['-relevance_score', '-created_at']

    def __str__(self):
        return f"Gợi ý {self.course.title} cho {self.student.email} (Độ phù hợp: {self.relevance_score}%)"

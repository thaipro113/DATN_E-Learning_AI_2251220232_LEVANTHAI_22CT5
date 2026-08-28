from rest_framework import serializers
from .models import Enrollment, LessonProgress, Certificate, EnrollmentStatus
from apps.courses.serializers import CourseListSerializer, CourseDetailSerializer
from apps.courses.models import Course, Lesson


class LessonProgressSimpleSerializer(serializers.ModelSerializer):
    """
    Serializer tiến độ hoàn thành của từng bài học.
    """
    lesson_id = serializers.UUIDField(source='lesson.id', read_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    chapter_id = serializers.UUIDField(source='lesson.chapter.id', read_only=True)
    chapter_title = serializers.CharField(source='lesson.chapter.title', read_only=True)
    order_index = serializers.IntegerField(source='lesson.order_index', read_only=True)

    class Meta:
        model = LessonProgress
        fields = [
            'id',
            'lesson_id',
            'lesson_title',
            'chapter_id',
            'chapter_title',
            'order_index',
            'is_completed',
            'completed_at',
            'last_watched_second',
            'updated_at'
        ]


class CertificateSimpleSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị thông tin chứng chỉ rút gọn.
    """
    class Meta:
        model = Certificate
        fields = ['id', 'certificate_code', 'issued_at', 'pdf_url']


class CertificateDetailSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị chi tiết chứng chỉ hoàn thành khóa học phục vụ Tra cứu & Xác thực.
    """
    student_name = serializers.CharField(source='enrollment.student.full_name', read_only=True)
    student_email = serializers.CharField(source='enrollment.student.email', read_only=True)
    student_avatar = serializers.CharField(source='enrollment.student.avatar_url', read_only=True)
    course_title = serializers.CharField(source='enrollment.course.title', read_only=True)
    course_slug = serializers.CharField(source='enrollment.course.slug', read_only=True)
    course_level = serializers.CharField(source='enrollment.course.get_level_display', read_only=True)
    teacher_name = serializers.CharField(source='enrollment.course.teacher.full_name', read_only=True)
    enrolled_at = serializers.DateTimeField(source='enrollment.enrolled_at', read_only=True)
    completed_at = serializers.DateTimeField(source='enrollment.completed_at', read_only=True)

    class Meta:
        model = Certificate
        fields = [
            'id',
            'certificate_code',
            'issued_at',
            'pdf_url',
            'student_name',
            'student_email',
            'student_avatar',
            'course_title',
            'course_slug',
            'course_level',
            'teacher_name',
            'enrolled_at',
            'completed_at'
        ]


class EnrollmentListSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị danh sách các khóa học mà học viên đã ghi danh (My Courses).
    """
    course = CourseListSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id',
            'course',
            'status',
            'status_display',
            'progress_percent',
            'enrolled_at',
            'completed_at',
            'updated_at'
        ]


class EnrollmentDetailSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị chi tiết tiến độ học tập toàn bộ khóa học của học viên.
    """
    course = CourseDetailSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    lesson_progresses = LessonProgressSimpleSerializer(many=True, read_only=True)
    certificate = CertificateSimpleSerializer(read_only=True)
    completed_lessons_count = serializers.SerializerMethodField()
    total_lessons_count = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            'id',
            'status',
            'status_display',
            'progress_percent',
            'completed_lessons_count',
            'total_lessons_count',
            'course',
            'lesson_progresses',
            'certificate',
            'enrolled_at',
            'completed_at',
            'updated_at'
        ]

    def get_completed_lessons_count(self, obj):
        return obj.lesson_progresses.filter(is_completed=True).count()

    def get_total_lessons_count(self, obj):
        return obj.course.total_lessons


class TrackLessonProgressSerializer(serializers.Serializer):
    """
    Serializer tiếp nhận cập nhật thời lượng xem video của bài học.
    """
    last_watched_second = serializers.IntegerField(
        min_value=0,
        required=True,
        help_text="Số giây video bài học mà học viên đã xem đến"
    )


class CompleteLessonResponseSerializer(serializers.Serializer):
    """
    Serializer phản hồi sau khi đánh dấu hoàn thành bài học.
    """
    lesson_progress = LessonProgressSimpleSerializer()
    progress_percent = serializers.DecimalField(max_digits=5, decimal_places=2)
    is_course_completed = serializers.BooleanField()
    certificate = CertificateDetailSerializer(required=False, allow_null=True)

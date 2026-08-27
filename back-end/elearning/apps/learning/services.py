import uuid
from typing import Tuple, Dict, Any
from django.db import transaction
from django.db.models import Q
from apps.accounts.models import CustomUser
from apps.courses.models import Course, Lesson, CourseStatus
from .models import Enrollment, LessonProgress, Certificate, EnrollmentStatus


class EnrollmentService:
    """
    Tầng xử lý nghiệp vụ cho việc Ghi danh Khóa học và Quản lý Lộ trình học của học viên.
    """

    @staticmethod
    def enroll_course(student: CustomUser, course_id: str) -> Tuple[bool, str, Enrollment | None]:
        """
        Ghi danh học viên vào một khóa học:
        - Kiểm tra khóa học đã xuất bản (PUBLISHED) chưa.
        - Khởi tạo tự động toàn bộ bản ghi LessonProgress cho các bài học trong khóa học.
        """
        try:
            course_uuid = uuid.UUID(str(course_id))
            course = Course.objects.filter(id=course_uuid).first()
        except (ValueError, TypeError):
            return False, "Mã khóa học không hợp lệ.", None

        if not course:
            return False, "Không tìm thấy khóa học yêu cầu.", None

        if course.status != CourseStatus.PUBLISHED:
            return False, "Khóa học này hiện chưa mở đăng ký.", None

        # Kiểm tra nếu học viên là chính giáo viên của khóa học
        if course.teacher == student:
            return False, "Giáo viên không cần ghi danh vào khóa học do chính mình giảng dạy.", None

        # Kiểm tra xem học viên đã từng ghi danh khóa này chưa
        existing_enrollment = Enrollment.objects.filter(student=student, course=course).first()
        if existing_enrollment:
            if existing_enrollment.status == EnrollmentStatus.ACTIVE:
                return False, "Bạn đã ghi danh vào khóa học này trước đó rồi.", existing_enrollment
            elif existing_enrollment.status == EnrollmentStatus.COMPLETED:
                return True, "Bạn đã hoàn thành khóa học này trước đó.", existing_enrollment
            elif existing_enrollment.status == EnrollmentStatus.CANCELLED:
                existing_enrollment.status = EnrollmentStatus.ACTIVE
                existing_enrollment.save(update_fields=['status', 'updated_at'])
                return True, "Kích hoạt lại lần ghi danh thành công!", existing_enrollment

        with transaction.atomic():
            enrollment = Enrollment.objects.create(
                student=student,
                course=course,
                status=EnrollmentStatus.ACTIVE,
                progress_percent=0.00
            )

            # Tự động khởi tạo LessonProgress cho tất cả các bài học hiện có của khóa học
            lessons = Lesson.objects.filter(chapter__course=course)
            progress_list = [
                LessonProgress(enrollment=enrollment, lesson=lesson, is_completed=False)
                for lesson in lessons
            ]
            if progress_list:
                LessonProgress.objects.bulk_create(progress_list)

        return True, f"Ghi danh thành công khóa học '{course.title}'!", enrollment

    @staticmethod
    def list_student_enrollments(student: CustomUser, filters: Dict[str, Any] = None):
        """
        Lấy danh sách các khóa học đã ghi danh của học viên kèm bộ lọc.
        """
        filters = filters or {}
        queryset = Enrollment.objects.filter(student=student).select_related(
            'course__category', 'course__teacher'
        )

        status_param = filters.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param.upper())

        search_query = filters.get('search')
        if search_query:
            queryset = queryset.filter(
                Q(course__title__icontains=search_query) |
                Q(course__description__icontains=search_query) |
                Q(course__teacher__full_name__icontains=search_query)
            )

        return queryset.order_by('-updated_at')

    @staticmethod
    def get_student_enrollment_detail(student: CustomUser, course_identifier: str) -> Enrollment | None:
        """
        Lấy chi tiết tiến độ khóa học của học viên theo ID khóa học hoặc Slug.
        """
        queryset = Enrollment.objects.filter(student=student).select_related(
            'course__category', 'course__teacher', 'certificate'
        ).prefetch_related(
            'lesson_progresses__lesson__chapter',
            'course__chapters__lessons__materials'
        )

        try:
            course_uuid = uuid.UUID(str(course_identifier))
            enrollment = queryset.filter(course_id=course_uuid).first()
        except (ValueError, TypeError):
            enrollment = queryset.filter(course__slug=course_identifier).first()

        return enrollment

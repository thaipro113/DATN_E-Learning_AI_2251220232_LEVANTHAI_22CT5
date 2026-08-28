import uuid
from typing import Tuple, Dict, Any, Optional
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from apps.accounts.models import CustomUser
from apps.courses.models import Course, Lesson, CourseStatus
from .models import Enrollment, LessonProgress, Certificate, EnrollmentStatus


class EnrollmentService:
    """
    Tầng xử lý nghiệp vụ cho việc Ghi danh Khóa học và Quản lý Lộ trình học của học viên.
    """

    @staticmethod
    def enroll_course(student: CustomUser, course_id: str) -> Tuple[bool, str, Enrollment | None]:
        try:
            course_uuid = uuid.UUID(str(course_id))
            course = Course.objects.filter(id=course_uuid).first()
        except (ValueError, TypeError):
            return False, "Mã khóa học không hợp lệ.", None

        if not course:
            return False, "Không tìm thấy khóa học yêu cầu.", None

        if course.status != CourseStatus.PUBLISHED:
            return False, "Khóa học này hiện chưa mở đăng ký.", None

        if course.teacher == student:
            return False, "Giáo viên không cần ghi danh vào khóa học do chính mình giảng dạy.", None

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


class ProgressService:
    """
    Tầng xử lý nghiệp vụ cho việc Theo dõi Tiến độ Bài học và Hoàn thành Khóa học.
    """

    @staticmethod
    def _get_or_create_lesson_progress(student: CustomUser, lesson_id: str) -> Tuple[LessonProgress | None, str]:
        try:
            lesson_uuid = uuid.UUID(str(lesson_id))
            lesson = Lesson.objects.select_related('chapter__course').filter(id=lesson_uuid).first()
        except (ValueError, TypeError):
            return None, "Mã bài học không hợp lệ."

        if not lesson:
            return None, "Không tìm thấy bài học yêu cầu."

        course = lesson.chapter.course

        # Tìm lần ghi danh của học viên vào khóa học này
        enrollment = Enrollment.objects.filter(student=student, course=course).first()
        if not enrollment:
            return None, "Bạn chưa ghi danh vào khóa học chứa bài học này."

        progress, _ = LessonProgress.objects.get_or_create(
            enrollment=enrollment,
            lesson=lesson,
            defaults={'is_completed': False, 'last_watched_second': 0}
        )

        return progress, "Thành công"

    @staticmethod
    def track_video_progress(student: CustomUser, lesson_id: str, last_watched_second: int) -> Tuple[bool, str, LessonProgress | None]:
        """
        Lưu vị trí giây dừng video của học viên trong bài học.
        """
        progress, msg = ProgressService._get_or_create_lesson_progress(student, lesson_id)
        if not progress:
            return False, msg, None

        progress.last_watched_second = last_watched_second
        progress.save(update_fields=['last_watched_second', 'updated_at'])
        return True, "Lưu tiến độ xem video thành công!", progress

    @staticmethod
    def complete_lesson(student: CustomUser, lesson_id: str) -> Tuple[bool, str, Optional[LessonProgress], Optional[Enrollment], Optional[Certificate]]:
        """
        Đánh dấu hoàn thành bài học, cập nhật % tiến độ khóa học và tự động cấp chứng chỉ khi đạt 100%.
        """
        progress, msg = ProgressService._get_or_create_lesson_progress(student, lesson_id)
        if not progress:
            return False, msg, None, None, None

        enrollment = progress.enrollment
        course = enrollment.course

        with transaction.atomic():
            progress.mark_as_completed()
            enrollment.refresh_from_db()

            certificate = None
            # Nếu khóa học đã hoàn thành 100% thì tự động cấp Chứng chỉ nếu chưa có
            if enrollment.progress_percent >= 100.0:
                certificate = Certificate.objects.filter(enrollment=enrollment).first()
                if not certificate:
                    cert_code = Certificate.generate_unique_code(course.slug)
                    certificate = Certificate.objects.create(
                        enrollment=enrollment,
                        certificate_code=cert_code
                    )

        return True, "Đánh dấu hoàn thành bài học thành công!", progress, enrollment, certificate


class CertificateService:
    """
    Tầng xử lý nghiệp vụ cho việc Quản lý và Tra cứu Chứng chỉ hoàn thành.
    """

    @staticmethod
    def list_student_certificates(student: CustomUser):
        """
        Lấy danh sách toàn bộ các chứng chỉ đã đạt được của học viên.
        """
        return Certificate.objects.filter(
            enrollment__student=student
        ).select_related('enrollment__course__teacher', 'enrollment__student').order_by('-issued_at')

    @staticmethod
    def get_certificate_by_code(certificate_code: str) -> Certificate | None:
        """
        Tra cứu và xác thực tính hợp lệ của chứng chỉ theo Mã Chứng Chỉ duy nhất.
        """
        return Certificate.objects.filter(
            certificate_code=certificate_code.strip()
        ).select_related('enrollment__student', 'enrollment__course__teacher').first()

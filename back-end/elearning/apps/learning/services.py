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
            # Nếu khóa học đã hoàn thành 100% bài học:
            if enrollment.progress_percent >= 100.0:
                from apps.assessments.models import Quiz, QuizAttempt
                # Kiểm tra khóa học có Đề thi toàn khóa hay không
                has_final_quizzes = Quiz.objects.filter(
                    course=course,
                    chapter__isnull=True,
                    lesson__isnull=True,
                    is_published=True
                ).exists()

                should_issue_cert = True
                if has_final_quizzes:
                    # Học viên phải có lần thi đạt (is_passed=True) đề thi toàn khóa
                    passed_final = QuizAttempt.objects.filter(
                        student=student,
                        quiz__course=course,
                        quiz__chapter__isnull=True,
                        quiz__lesson__isnull=True,
                        is_passed=True
                    ).exists()
                    if not passed_final:
                        should_issue_cert = False

                if should_issue_cert:
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


class StudyStreakService:
    """
    Xử lý nghiệp vụ chuỗi học tập (Daily Study Streak) thực tế:
    - Thu thập tất cả mốc thời gian học thật: QuizAttempt, LessonProgress, Enrollment, ChatSession.
    - Quy đổi về ngày theo múi giờ địa phương.
    - Tính toán chính xác chuỗi ngày học liên tục (Consecutive Days).
    - Phân loại 4 trạng thái: ACTIVE_TODAY, PENDING_TODAY, BROKEN, NEW.
    """

    @staticmethod
    def get_user_streak(student: CustomUser) -> Dict[str, Any]:
        from datetime import timedelta
        from django.utils import timezone
        from apps.assessments.models import QuizAttempt
        from apps.learning.models import LessonProgress, Enrollment
        from apps.ai.models import ChatSession

        activity_timestamps = []

        # 1. Các lần làm bài thi trắc nghiệm
        for a in QuizAttempt.objects.filter(student=student):
            dt = a.completed_at or a.started_at or a.created_at
            if dt:
                activity_timestamps.append(dt)

        # 2. Các tiến độ học bài / xem video
        for p in LessonProgress.objects.filter(enrollment__student=student):
            dt = p.completed_at or p.updated_at
            if dt:
                activity_timestamps.append(dt)

        # 3. Lần ghi danh hoặc hoàn thành khóa học
        for e in Enrollment.objects.filter(student=student):
            dt = e.completed_at or e.updated_at
            if dt:
                activity_timestamps.append(dt)

        # 4. Các phiên tương tác hỏi đáp với Gia sư AI
        for s in ChatSession.objects.filter(student=student):
            dt = s.updated_at or s.created_at
            if dt:
                activity_timestamps.append(dt)

        active_dates_set = set()
        latest_dt = None

        for dt in activity_timestamps:
            local_dt = timezone.localtime(dt)
            active_dates_set.add(local_dt.date())
            if latest_dt is None or dt > latest_dt:
                latest_dt = dt

        sorted_dates = sorted(list(active_dates_set))
        today = timezone.localtime().date()
        yesterday = today - timedelta(days=1)

        has_studied_today = today in active_dates_set

        # Tính toán chuỗi ngày học liên tục thực tế
        streak = 0
        if has_studied_today:
            curr = today
            while curr in active_dates_set:
                streak += 1
                curr -= timedelta(days=1)
            status = 'ACTIVE_TODAY'
        else:
            if yesterday in active_dates_set:
                curr = yesterday
                while curr in active_dates_set:
                    streak += 1
                    curr -= timedelta(days=1)
                status = 'PENDING_TODAY'
            else:
                streak = 0
                status = 'BROKEN' if len(active_dates_set) > 0 else 'NEW'

        days_since_last_study = None
        last_study_date_str = None
        last_study_date_display = None
        last_study_time_display = None

        if latest_dt:
            local_latest = timezone.localtime(latest_dt)
            last_date = local_latest.date()
            days_since_last_study = (today - last_date).days
            last_study_date_str = last_date.isoformat()
            last_study_date_display = local_latest.strftime('%d/%m/%Y')
            last_study_time_display = local_latest.strftime('%H:%M ngày %d/%m/%Y')

        if status == 'ACTIVE_TODAY':
            badge_text = 'ĐÃ DUY TRÌ THÀNH CÔNG'
            headline = f'Xuất sắc! Bạn đã duy trì chuỗi {streak} ngày liên tục!'
            subtext = f'Mục tiêu học tập hôm nay ({today.strftime("%d/%m/%Y")}) đã hoàn thành. Hãy giữ vững phong độ nhé!'
        elif status == 'PENDING_TODAY':
            badge_text = 'CÚ HUÝCH DUY TRÌ THÓI QUEN'
            headline = 'Hôm nay bạn chưa học bài nào đấy nhé!'
            subtext = f'Hôm qua bạn đã học rất chăm chỉ! Chỉ cần dành 5 phút lướt thẻ từ vựng hoặc làm 1 bài kiểm tra mini ngay hôm nay để chuỗi {streak} ngày không bị gián đoạn!'
        elif status == 'BROKEN':
            badge_text = 'CHUỖI ĐÃ BỊ GIÁN ĐOẠN'
            time_ago_str = f'({days_since_last_study} ngày trước)' if days_since_last_study else ''
            headline = 'Chuỗi học tập của bạn hiện đang là 0 ngày!'
            subtext = f'Lần học gần nhất của bạn là {last_study_date_display} {time_ago_str}. Đừng bỏ cuộc nhé! Hãy hoàn thành 1 bài học hoặc 5 phút flashcards ngay hôm nay để khởi động lại chuỗi 1 ngày đầu tiên!'
        else:
            badge_text = 'KHỞI ĐẦU HÀNH TRÌNH'
            headline = 'Bắt đầu chuỗi ngày học đầu tiên của bạn!'
            subtext = 'Hãy học 1 bài học hoặc làm một bài trắc nghiệm hôm nay để bắt đầu chuỗi ngày học liên tục đầu tiên nhé!'

        return {
            'streak': streak,
            'has_studied_today': has_studied_today,
            'status': status,
            'badge_text': badge_text,
            'headline': headline,
            'subtext': subtext,
            'last_study_date': last_study_date_str,
            'last_study_date_display': last_study_date_display,
            'last_study_time_display': last_study_time_display,
            'days_since_last_study': days_since_last_study,
            'total_study_days': len(active_dates_set),
            'recent_study_dates': [d.isoformat() for d in sorted_dates[-7:]]
        }


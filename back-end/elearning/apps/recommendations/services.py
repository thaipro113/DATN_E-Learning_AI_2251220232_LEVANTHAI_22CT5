import uuid
from typing import List, Dict, Any, Tuple, Optional
from django.db import transaction
from django.utils import timezone
from django.db.models import Avg, Count, Q

from apps.accounts.models import CustomUser, EnglishLevel
from apps.courses.models import Course, Lesson
from apps.learning.models import Enrollment
from apps.assessments.models import (
    Quiz,
    QuizAttempt,
    StudentAnswer,
    SkillType,
    QuizType,
    AttemptStatus
)
from .models import (
    LearningPath,
    LearningPathStep,
    SkillGapAnalysis,
    CourseRecommendation,
    LearningPathStatus,
    StepType
)


class SkillGapService:
    """
    Dịch vụ phân tích năng lực và phát hiện lỗ hổng kiến thức của học viên (Skill Gap Analytics).
    """

    @staticmethod
    def analyze_student_skill_gaps(student: CustomUser) -> List[SkillGapAnalysis]:
        """
        Phân tích kết quả các bài thi gần nhất để tính toán điểm thành thạo từng kỹ năng
        và trích xuất danh sách các chủ đề học viên thường làm sai.
        """
        # 1. Lấy tất cả câu trả lời trong các bài thi đã hoàn thành của học viên
        completed_attempts = QuizAttempt.objects.filter(
            student=student,
            status=AttemptStatus.COMPLETED
        ).order_by('-completed_at')[:10]

        skill_stats = {}
        for skill_code, skill_label in SkillType.choices:
            skill_stats[skill_code] = {
                'label': skill_label,
                'total_points_earned': 0.0,
                'total_max_points': 0.0,
                'weak_topics': set(),
                'has_data': False
            }

        student_answers = StudentAnswer.objects.filter(
            attempt__in=completed_attempts
        ).select_related('question')

        for ans in student_answers:
            q = ans.question
            skill = q.skill
            if skill in skill_stats:
                skill_stats[skill]['has_data'] = True
                skill_stats[skill]['total_points_earned'] += float(ans.score_earned)
                skill_stats[skill]['total_max_points'] += float(q.points)

                # Nếu trả lời sai -> Ghi nhận chủ đề yếu
                if not ans.is_correct:
                    topic_label = f"{skill_label}: {q.content[:40]}..."
                    skill_stats[skill]['weak_topics'].add(topic_label)

        # 2. Tạo hoặc cập nhật bảng SkillGapAnalysis
        analyses = []
        with transaction.atomic():
            for skill_code, data in skill_stats.items():
                if data['has_data'] and data['total_max_points'] > 0:
                    score = round((data['total_points_earned'] / data['total_max_points']) * 100.0, 1)
                else:
                    # Nếu chưa làm bài thi kỹ năng này -> Gán điểm mặc định theo level học viên
                    score = 65.0

                weak_list = list(data['weak_topics'])[:5]

                # Sinh đề xuất cải thiện thông minh
                if score < 50.0:
                    action = f"Kỹ năng {data['label']} cần củng cố gấp. Hãy bắt đầu lại từ các bài học ngữ pháp căn bản và thực hiện thêm bài tập trắc nghiệm."
                elif score < 75.0:
                    action = f"Kỹ năng {data['label']} ở mức trung bình khá. Cần tăng cường luyện phản xạ và làm bài tập nâng cao."
                else:
                    action = f"Kỹ năng {data['label']} rất tốt! Tiếp tục duy trì luyện đề và mở rộng vốn từ chuyên sâu."

                analysis, _ = SkillGapAnalysis.objects.update_or_create(
                    student=student,
                    skill_type=skill_code,
                    defaults={
                        'proficiency_score': score,
                        'weak_topics': weak_list,
                        'recommended_action': action
                    }
                )
                analyses.append(analysis)

        return sorted(analyses, key=lambda x: x.proficiency_score)


class CourseRecommendationService:
    """
    Dịch vụ AI gợi ý khóa học phù hợp cho học viên dựa trên thuật toán Content-Based Filtering.
    """

    @staticmethod
    def generate_course_recommendations(student: CustomUser, limit: int = 5) -> List[CourseRecommendation]:
        """
        Đề xuất các khóa học tối ưu nhất cho học viên:
        - Phù hợp với trình độ hiện tại hoặc trình độ mục tiêu.
        - Giải quyết các kỹ năng mà học viên có điểm thành thạo thấp nhất.
        - Loại trừ các khóa học mà học viên đã đăng ký.
        """
        # 1. Lấy danh sách ID các khóa học đã đăng ký
        enrolled_course_ids = Enrollment.objects.filter(student=student).values_list('course_id', flat=True)

        # 2. Lấy danh sách kỹ năng yếu nhất của học viên
        gaps = SkillGapAnalysis.objects.filter(student=student).order_by('proficiency_score')
        weakest_skills = [g.skill_type for g in gaps[:2]] if gaps.exists() else [SkillType.GRAMMAR, SkillType.VOCABULARY]

        # 3. Lọc các khóa học chưa đăng ký và đang phát hành
        candidate_courses = Course.objects.filter(
            is_published=True
        ).exclude(id__in=enrolled_course_ids).select_related('category', 'instructor')

        scored_courses = []
        for course in candidate_courses:
            score = 50.0  # Điểm cơ sở

            # Cộng điểm nếu trình độ khóa học trùng hoặc tiệm cận trình độ học viên
            if course.level == student.level or course.level == 'ALL':
                score += 30.0
            elif course.level in [EnglishLevel.B1, EnglishLevel.B2]:
                score += 15.0

            # Cộng điểm nếu tiêu đề hoặc mô tả chứa từ khóa kỹ năng yếu
            for skill in weakest_skills:
                skill_name = dict(SkillType.choices).get(skill, '').lower()
                if skill_name in course.title.lower() or skill_name in course.description.lower():
                    score += 20.0

            # Đảm bảo điểm trong thang 0 - 100
            final_score = min(score, 99.0)

            reason = (
                f"Khóa học này phù hợp với trình độ {student.get_level_display()} của bạn "
                f"và giúp tăng cường các kỹ năng trọng tâm cần cải thiện."
            )

            scored_courses.append((course, final_score, reason))

        # Sắp xếp theo điểm tương thích giảm dần
        scored_courses.sort(key=lambda x: x[1], reverse=True)

        recommendations = []
        with transaction.atomic():
            for course, score, reason in scored_courses[:limit]:
                rec, _ = CourseRecommendation.objects.update_or_create(
                    student=student,
                    course=course,
                    defaults={
                        'relevance_score': score,
                        'reason': reason,
                        'is_dismissed': False
                    }
                )
                recommendations.append(rec)

        return recommendations

    @staticmethod
    def dismiss_recommendation(student: CustomUser, recommendation_id: str) -> bool:
        """
        Ẩn hoặc bỏ qua một đề xuất khóa học.
        """
        try:
            rec = CourseRecommendation.objects.get(id=recommendation_id, student=student)
            rec.is_dismissed = True
            rec.save(update_fields=['is_dismissed', 'updated_at'])
            return True
        except CourseRecommendation.DoesNotExist:
            return False


class LearningPathService:
    """
    Dịch vụ tạo và quản lý Lộ trình Học tập Thích ứng (Adaptive Learning Path Engine).
    """

    @staticmethod
    def get_active_learning_path(student: CustomUser) -> Optional[LearningPath]:
        """
        Lấy lộ trình học tập đang hoạt động của học viên.
        """
        return LearningPath.objects.filter(
            student=student,
            status=LearningPathStatus.IN_PROGRESS
        ).prefetch_related(
            'steps',
            'steps__target_course',
            'steps__target_lesson',
            'steps__target_quiz'
        ).first()

    @staticmethod
    def generate_adaptive_learning_path(
        student: CustomUser,
        target_level: str = None,
        goal_description: str = ""
    ) -> LearningPath:
        """
        Thuật toán AI phân tích toàn diện và tự động sinh Lộ trình Học tập Thích ứng:
        1. Phân tích lỗ hổng kỹ năng (Skill Gap Analysis).
        2. Lưu trữ các lộ trình cũ sang trạng thái ARCHIVED.
        3. Tự động kiến tạo 5 - 6 chặng học hành động có cấu trúc logic (Khóa học -> Luyện tập AI -> Đánh giá Quiz).
        """
        target_level = target_level or EnglishLevel.B2
        goal_desc = goal_description or f"Nâng cao trình độ từ {student.get_level_display()} lên {dict(EnglishLevel.choices).get(target_level, target_level)}."

        # 1. Phân tích năng lực hiện tại
        skill_gaps = SkillGapService.analyze_student_skill_gaps(student)
        weakest_skill = skill_gaps[0].skill_type if skill_gaps else SkillType.GRAMMAR
        weakest_label = dict(SkillType.choices).get(weakest_skill, 'Ngữ pháp')

        with transaction.atomic():
            # 2. Lưu trữ lộ trình cũ nếu có
            LearningPath.objects.filter(
                student=student,
                status=LearningPathStatus.IN_PROGRESS
            ).update(status=LearningPathStatus.ARCHIVED)

            # 3. Tạo Lộ trình mới
            path = LearningPath.objects.create(
                student=student,
                title=f"Lộ trình Bứt phá Tiếng Anh mục tiêu {target_level}",
                target_level=target_level,
                current_estimated_level=student.level,
                goal_description=goal_desc,
                status=LearningPathStatus.IN_PROGRESS
            )

            # 4. Tìm kiếm nội dung phù hợp trong CSDL để gắn vào lộ trình
            available_courses = list(Course.objects.filter(is_published=True)[:3])
            available_quizzes = list(Quiz.objects.filter(is_published=True)[:3])

            step_course = available_courses[0] if available_courses else None
            step_quiz_1 = available_quizzes[0] if available_quizzes else None
            step_quiz_2 = available_quizzes[1] if len(available_quizzes) > 1 else step_quiz_1

            # 5. Kiến tạo danh sách các chặng học chuẩn sư phạm
            steps_data = [
                {
                    'step_index': 1,
                    'title': f"Củng cố Nền tảng Kỹ năng {weakest_label}",
                    'description': f"Dựa trên bài đánh giá gần nhất, bạn cần củng cố kỹ năng {weakest_label}. Hãy hoàn thành khóa học trọng tâm này.",
                    'step_type': StepType.COURSE,
                    'target_course': step_course,
                    'target_skill': weakest_skill,
                    'estimated_minutes': 60
                },
                {
                    'step_index': 2,
                    'title': f"Luyện tập phản xạ với Trợ lý AI Tutor",
                    'description': f"Trò chuyện trực tiếp 1-1 với AI Tutor để sửa lỗi sai về {weakest_label} và mở rộng vốn từ.",
                    'step_type': StepType.AI_PRACTICE,
                    'target_skill': weakest_skill,
                    'estimated_minutes': 25
                },
                {
                    'step_index': 3,
                    'title': "Bài kiểm tra Đánh giá Tiến độ Giữa kỳ",
                    'description': "Làm bài kiểm tra ngắn để đo lường mức độ cải thiện kiến thức sau khi hoàn thành các chặng đầu.",
                    'step_type': StepType.QUIZ,
                    'target_quiz': step_quiz_1,
                    'target_skill': SkillType.GRAMMAR,
                    'estimated_minutes': 20
                },
                {
                    'step_index': 4,
                    'title': "Nâng cao Kỹ năng Giao tiếp & Ứng dụng Thực tế",
                    'description': "Thực hành các tình huống hội thoại thực tế (Roleplay) cùng Trợ lý AI ở cấp độ nâng cao.",
                    'step_type': StepType.AI_PRACTICE,
                    'target_skill': SkillType.SPEAKING,
                    'estimated_minutes': 30
                },
                {
                    'step_index': 5,
                    'title': f"Bài kiểm tra Cột mốc Đạt chuẩn {target_level}",
                    'description': f"Bài thi tổng hợp cuối lộ trình để xác nhận bạn đã đạt chuẩn đầu ra {target_level}.",
                    'step_type': StepType.QUIZ,
                    'target_quiz': step_quiz_2,
                    'target_skill': SkillType.READING,
                    'estimated_minutes': 45
                }
            ]

            for s_data in steps_data:
                LearningPathStep.objects.create(learning_path=path, **s_data)

            # Cập nhật tổng số bước và tiến độ ban đầu
            path.update_progress()

        return path

    @staticmethod
    def complete_step(user: CustomUser, step_id: str) -> Tuple[bool, str, Optional[LearningPathStep]]:
        """
        Đánh dấu hoàn thành một bước trong lộ trình học tập.
        """
        try:
            step_uuid = uuid.UUID(str(step_id))
            step = LearningPathStep.objects.select_related('learning_path').filter(
                id=step_uuid,
                learning_path__student=user
            ).first()

            if not step:
                return False, "Không tìm thấy chặng học yêu cầu hoặc bạn không có quyền truy cập.", None

            if step.is_completed:
                return True, "Chặng học này đã được hoàn thành trước đó.", step

            step.is_completed = True
            step.completed_at = timezone.now()
            step.save(update_fields=['is_completed', 'completed_at', 'updated_at'])

            # Tự động tính toán lại phần trăm tiến độ của Lộ trình
            step.learning_path.update_progress()

            return True, "Chúc mừng! Bạn đã hoàn thành chặng học thành công.", step

        except (ValueError, TypeError):
            return False, "Mã định danh chặng học không hợp lệ.", None

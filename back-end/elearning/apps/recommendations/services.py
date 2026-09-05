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
    AttemptStatus,
    QuestionAIAnalysis
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
    100% dựa trên dữ liệu thật từ QuizAttempt và StudentAnswer.
    Chủ đề yếu được lấy trực tiếp từ QuestionAIAnalysis của LLM (không cắt chuỗi, không đoán keyword).
    Nếu chưa làm bài, trả về NOT_ASSESSED, tuyệt đối không gán điểm giả 65% hay 70%.
    """

    @staticmethod
    def analyze_student_skill_gaps(student: CustomUser) -> List[SkillGapAnalysis]:
        """
        Phân tích kết quả các bài thi gần nhất để tính toán điểm thành thạo từng kỹ năng
        và trích xuất danh sách các chủ đề học viên thường làm sai qua QuestionAIAnalysis.
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

        # Cache phân tích AI cho các câu hỏi đã gặp
        from apps.ai.services import QuestionAnalysisAIService

        for ans in student_answers:
            q = ans.question
            skill = q.skill
            if skill in skill_stats:
                skill_stats[skill]['has_data'] = True
                skill_stats[skill]['total_points_earned'] += float(ans.score_earned)
                skill_stats[skill]['total_max_points'] += float(q.points)

                # Nếu trả lời sai -> Ghi nhận chủ đề yếu bằng QuestionAIAnalysis từ LLM
                if not ans.is_correct:
                    ai_analysis = QuestionAIAnalysis.objects.filter(question=q).first()
                    if not ai_analysis:
                        try:
                            ai_analysis = QuestionAnalysisAIService.analyze_and_store_question(q)
                        except Exception:
                            ai_analysis = None

                    if ai_analysis and ai_analysis.topic:
                        if ai_analysis.sub_topic:
                            topic_label = f"{ai_analysis.topic} ({ai_analysis.sub_topic})"
                        else:
                            topic_label = ai_analysis.topic
                        skill_stats[skill]['weak_topics'].add(topic_label)

        # 2. Tạo hoặc cập nhật bảng SkillGapAnalysis
        analyses = []
        with transaction.atomic():
            for skill_code, data in skill_stats.items():
                if data['has_data'] and data['total_max_points'] > 0:
                    score = round((data['total_points_earned'] / data['total_max_points']) * 100.0, 1)
                    is_assessed = True
                    weak_list = list(data['weak_topics'])[:5]

                    if score < 50.0:
                        action = f"Kỹ năng {data['label']} cần củng cố gấp ({score}%). Hãy luyện tập các dạng bài còn yếu và làm lại bài kiểm tra."
                    elif score < 75.0:
                        action = f"Kỹ năng {data['label']} ở mức trung bình khá ({score}%). Hãy tiếp tục rèn luyện theo lộ trình AI."
                    else:
                        action = f"Kỹ năng {data['label']} rất tốt ({score}%)! Duy trì luyện đề thường xuyên."
                else:
                    # Tuyệt đối không gán điểm mặc định 65% hay 70%
                    score = None
                    is_assessed = False
                    weak_list = []
                    action = f"Chưa có dữ liệu đánh giá cho kỹ năng {data['label']}. Hãy thực hiện bài kiểm tra để AI chẩn đoán."

                analysis, _ = SkillGapAnalysis.objects.update_or_create(
                    student=student,
                    skill_type=skill_code,
                    defaults={
                        'proficiency_score': score,
                        'is_assessed': is_assessed,
                        'weak_topics': weak_list,
                        'recommended_action': action
                    }
                )
                analyses.append(analysis)

        # Sắp xếp: Kỹ năng đã đánh giá đưa lên trước (từ điểm thấp nhất -> cao nhất), kỹ năng chưa đánh giá xếp sau
        return sorted(analyses, key=lambda x: (0 if x.is_assessed else 1, x.proficiency_score if x.proficiency_score is not None else 999.0))


class CourseRecommendationService:
    """
    Dịch vụ AI gợi ý khóa học phù hợp cho học viên dựa trên LLM thật (Groq/Gemini).
    Truy vấn CSDL PostgreSQL trước, LLM chỉ xếp hạng và giải thích lý do từ danh sách ứng viên thật.
    """

    @staticmethod
    def recommend_courses_with_wizard(
        student: CustomUser,
        goal: str = "Nâng cao toàn diện năng lực tiếng Anh",
        self_level: str = "B1",
        priority_skill: str = "Ngữ pháp & Từ vựng",
        daily_time: str = "30 phút",
        limit: int = 5
    ) -> List[CourseRecommendation]:
        """
        AI Course Recommendation Wizard 4 bước:
        1. Mục tiêu học tập (goal)
        2. Trình độ tự đánh giá (self_level)
        3. Kỹ năng ưu tiên (priority_skill)
        4. Thời gian học mỗi ngày (daily_time)
        Backend truy vấn CSDL PostgreSQL các khóa học THẬT (PUBLISHED, chưa đăng ký).
        LLM xếp hạng và giải thích lý do sư phạm phù hợp cho từng khóa.
        Backend xác thực course_id và lưu vào CSDL.
        """
        enrolled_course_ids = Enrollment.objects.filter(student=student).values_list('course_id', flat=True)

        candidate_courses_qs = Course.objects.filter(
            status='PUBLISHED'
        ).exclude(id__in=enrolled_course_ids).select_related('category', 'teacher')

        candidate_courses = list(candidate_courses_qs)
        if not candidate_courses:
            return []

        # Chuẩn bị context học tập hiện có của học viên (Learning Analytics)
        skill_analyses = SkillGapAnalysis.objects.filter(student=student, is_assessed=True)
        skill_scores = {s.skill_type: s.proficiency_score for s in skill_analyses}
        weak_topics = []
        for s in skill_analyses:
            weak_topics.extend(s.weak_topics)

        completed_courses = list(
            Enrollment.objects.filter(student=student, status='COMPLETED')
            .values_list('course__title', flat=True)
        )

        student_profile = {
            'goal': goal,
            'self_level': self_level,
            'priority_skill': priority_skill,
            'daily_time': daily_time,
            'skill_scores': skill_scores,
            'weak_topics': weak_topics[:10],
            'completed_courses': completed_courses
        }

        candidate_data = []
        course_map = {}
        for c in candidate_courses:
            cid_str = str(c.id)
            course_map[cid_str] = c
            candidate_data.append({
                'id': cid_str,
                'title': c.title,
                'category': c.category.name if c.category else 'Tiếng Anh',
                'level': c.level,
                'is_free': c.is_free,
                'price': float(c.price) if c.price else 0.0,
                'description': (c.description or '')[:300]
            })

        # Gọi LLM thật để xếp hạng
        from apps.ai.llm_client import get_llm_provider
        provider = get_llm_provider()
        llm_response = provider.recommend_courses_with_llm(
            student_profile=student_profile,
            candidate_courses=candidate_data
        )

        recommendations = []
        with transaction.atomic():
            for rec in llm_response.get('recommended_courses', [])[:limit]:
                cid = rec.get('course_id')
                if cid in course_map:
                    matched_course = course_map[cid]
                    score = float(rec.get('match_score', 0.85))
                    if score <= 1.0:
                        score = score * 100.0
                    score = min(max(round(score, 1), 10.0), 99.0)

                    db_rec, _ = CourseRecommendation.objects.update_or_create(
                        student=student,
                        course=matched_course,
                        defaults={
                            'relevance_score': score,
                            'reason': rec.get('reason', f"Được AI đề xuất phù hợp mục tiêu {goal}."),
                            'is_dismissed': False
                        }
                    )
                    recommendations.append(db_rec)

        return recommendations

    @staticmethod
    def generate_course_recommendations(student: CustomUser, limit: int = 5) -> List[CourseRecommendation]:
        """
        Đề xuất khóa học từ LLM thật dựa trên Learning Analytics hiện tại của học viên.
        """
        return CourseRecommendationService.recommend_courses_with_wizard(
            student=student,
            goal="Nâng cao toàn diện năng lực tiếng Anh theo chuẩn CEFR",
            self_level=student.level or "B1",
            priority_skill="Ngữ pháp & Từ vựng trọng tâm",
            daily_time="30 phút",
            limit=limit
        )

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
            available_courses = list(Course.objects.filter(status='PUBLISHED')[:3])
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

from django.test import TestCase
from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.courses.models import Category, Course
from apps.learning.models import Enrollment
from apps.assessments.models import (
    Quiz,
    Question,
    AnswerOption,
    QuizAttempt,
    StudentAnswer,
    SkillType,
    QuizType,
    QuestionType,
    AttemptStatus
)
from apps.recommendations.models import (
    LearningPath,
    LearningPathStep,
    SkillGapAnalysis,
    CourseRecommendation,
    LearningPathStatus,
    StepType
)
from apps.recommendations.services import (
    SkillGapService,
    CourseRecommendationService,
    LearningPathService
)


class RecommendationsServicesTest(TestCase):
    """
    Bộ kiểm thử cho các Services trong apps/recommendations.
    """

    def setUp(self):
        # 1. Tạo Giáo viên & Học viên
        self.teacher = CustomUser.objects.create_user(
            email='teacher.rec.svc@example.com',
            password='Password123!',
            full_name='Teacher Rec Svc',
            role=UserRole.TEACHER
        )
        self.student = CustomUser.objects.create_user(
            email='student.rec.svc@example.com',
            password='Password123!',
            full_name='Student Rec Svc',
            role=UserRole.STUDENT,
            level=EnglishLevel.B1
        )

        # 2. Tạo Khóa học
        self.category = Category.objects.create(name="Grammar Category", slug="grammar-cat")
        self.course = Course.objects.create(
            teacher=self.teacher,
            title="Comprehensive Grammar",
            slug="comprehensive-grammar",
            category=self.category,
            level=EnglishLevel.B1,
            price=0,
            status='PUBLISHED'
        )

        # 3. Tạo Bài thi và Câu hỏi
        self.quiz = Quiz.objects.create(
            title="Grammar Diagnostic Quiz",
            quiz_type=QuizType.PLACEMENT,
            level=EnglishLevel.B1,
            passing_score=70.0,
            is_published=True
        )
        self.question = Question.objects.create(
            quiz=self.quiz,
            question_type=QuestionType.SINGLE_CHOICE,
            skill=SkillType.GRAMMAR,
            content="She ___ to work yesterday.",
            points=10.0,
            order_index=1
        )
        self.option_correct = AnswerOption.objects.create(
            question=self.question,
            content="went",
            is_correct=True,
            order_index=1
        )
        self.option_wrong = AnswerOption.objects.create(
            question=self.question,
            content="go",
            is_correct=False,
            order_index=2
        )

    def test_analyze_student_skill_gaps_service(self):
        """
        Kiểm tra SkillGapService tính toán điểm kỹ năng từ kết quả bài thi.
        """
        # Tạo lượt thi có câu trả lời sai
        attempt = QuizAttempt.objects.create(
            student=self.student,
            quiz=self.quiz,
            status=AttemptStatus.COMPLETED,
            score=0.0,
            max_score=10.0,
            percentage=0.0
        )
        StudentAnswer.objects.create(
            attempt=attempt,
            question=self.question,
            selected_option=self.option_wrong,
            is_correct=False,
            score_earned=0.0
        )

        gaps = SkillGapService.analyze_student_skill_gaps(self.student)
        self.assertEqual(len(gaps), 6)  # 6 kỹ năng

        grammar_gap = next((g for g in gaps if g.skill_type == SkillType.GRAMMAR), None)
        self.assertIsNotNone(grammar_gap)
        self.assertEqual(grammar_gap.proficiency_score, 0.0)
        self.assertTrue(len(grammar_gap.weak_topics) > 0)

    def test_course_recommendation_service(self):
        """
        Kiểm tra CourseRecommendationService gợi ý khóa học và loại trừ khóa học đã đăng ký.
        """
        recs = CourseRecommendationService.generate_course_recommendations(self.student)
        self.assertTrue(len(recs) > 0)
        self.assertEqual(recs[0].course, self.course)

        # Đăng ký khóa học -> Khóa học sẽ không còn xuất hiện trong gợi ý
        Enrollment.objects.create(student=self.student, course=self.course)
        recs_after_enroll = CourseRecommendationService.generate_course_recommendations(self.student)
        self.assertEqual(len(recs_after_enroll), 0)

    def test_generate_adaptive_learning_path_and_complete_step(self):
        """
        Kiểm tra LearningPathService tự động sinh 5 chặng học và hoàn thành từng bước.
        """
        path = LearningPathService.generate_adaptive_learning_path(
            student=self.student,
            target_level=EnglishLevel.B2,
            goal_description="Target 7.0 IELTS in 6 months"
        )

        self.assertEqual(path.status, LearningPathStatus.IN_PROGRESS)
        self.assertEqual(path.target_level, EnglishLevel.B2)
        self.assertEqual(path.steps.count(), 5)
        self.assertEqual(path.total_steps, 5)
        self.assertEqual(path.completed_steps, 0)

        # Hoàn thành bước 1
        first_step = path.steps.first()
        success, msg, updated_step = LearningPathService.complete_step(
            user=self.student,
            step_id=str(first_step.id)
        )
        self.assertTrue(success)
        self.assertTrue(updated_step.is_completed)

        path.refresh_from_db()
        self.assertEqual(path.completed_steps, 1)
        self.assertEqual(path.progress_percentage, 20.0)

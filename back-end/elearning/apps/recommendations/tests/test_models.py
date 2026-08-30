from django.test import TestCase
from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.courses.models import Category, Course
from apps.recommendations.models import (
    LearningPath,
    LearningPathStep,
    SkillGapAnalysis,
    CourseRecommendation,
    LearningPathStatus,
    StepType
)
from apps.assessments.models import SkillType


class RecommendationsModelsTest(TestCase):
    """
    Bộ kiểm thử cho các Models trong apps/recommendations.
    """

    def setUp(self):
        self.teacher = CustomUser.objects.create_user(
            email='teacher.rec.model@example.com',
            password='Password123!',
            full_name='Teacher Rec Model',
            role=UserRole.TEACHER
        )
        self.student = CustomUser.objects.create_user(
            email='student.rec.model@example.com',
            password='Password123!',
            full_name='Student Rec Model',
            role=UserRole.STUDENT,
            level=EnglishLevel.B1
        )
        self.category = Category.objects.create(name="English Models", slug="english-models")
        self.course = Course.objects.create(
            teacher=self.teacher,
            title="Grammar Mastery",
            slug="grammar-mastery-model",
            category=self.category,
            level=EnglishLevel.B1,
            price=0,
            status='PUBLISHED'
        )

    def test_learning_path_creation_and_progress_update(self):
        """
        Kiểm tra tạo LearningPath, thêm LearningPathStep và tự động cập nhật tiến độ.
        """
        path = LearningPath.objects.create(
            student=self.student,
            title="Target B2 Path",
            target_level=EnglishLevel.B2,
            current_estimated_level=EnglishLevel.B1
        )

        step1 = LearningPathStep.objects.create(
            learning_path=path,
            step_index=1,
            title="Step 1",
            step_type=StepType.COURSE,
            target_course=self.course
        )
        step2 = LearningPathStep.objects.create(
            learning_path=path,
            step_index=2,
            title="Step 2",
            step_type=StepType.AI_PRACTICE
        )

        path.update_progress()
        self.assertEqual(path.total_steps, 2)
        self.assertEqual(path.completed_steps, 0)
        self.assertEqual(path.progress_percentage, 0.0)

        # Hoàn thành bước 1
        step1.is_completed = True
        step1.save()
        path.update_progress()
        self.assertEqual(path.completed_steps, 1)
        self.assertEqual(path.progress_percentage, 50.0)
        self.assertEqual(path.status, LearningPathStatus.IN_PROGRESS)

        # Hoàn thành bước 2 -> Tự động chuyển COMPLETED
        step2.is_completed = True
        step2.save()
        path.update_progress()
        self.assertEqual(path.completed_steps, 2)
        self.assertEqual(path.progress_percentage, 100.0)
        self.assertEqual(path.status, LearningPathStatus.COMPLETED)

    def test_skill_gap_analysis_model(self):
        """
        Kiểm tra model SkillGapAnalysis và ràng buộc duy nhất.
        """
        gap = SkillGapAnalysis.objects.create(
            student=self.student,
            skill_type=SkillType.GRAMMAR,
            proficiency_score=45.5,
            weak_topics=["Past Simple", "Tenses"],
            recommended_action="Luyện tập thì quá khứ"
        )
        self.assertEqual(gap.skill_type, SkillType.GRAMMAR)
        self.assertEqual(gap.proficiency_score, 45.5)
        self.assertEqual(len(gap.weak_topics), 2)

    def test_course_recommendation_model(self):
        """
        Kiểm tra model CourseRecommendation và chức năng ẩn đề xuất.
        """
        rec = CourseRecommendation.objects.create(
            student=self.student,
            course=self.course,
            relevance_score=92.5,
            reason="Khóa học phù hợp với bạn"
        )
        self.assertEqual(rec.relevance_score, 92.5)
        self.assertFalse(rec.is_dismissed)

        rec.is_dismissed = True
        rec.save()
        self.assertTrue(rec.is_dismissed)

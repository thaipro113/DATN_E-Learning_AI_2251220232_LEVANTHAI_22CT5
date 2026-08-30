from rest_framework import serializers
from apps.accounts.models import EnglishLevel
from apps.courses.models import Course, Lesson
from apps.assessments.models import Quiz
from .models import (
    LearningPath,
    LearningPathStep,
    SkillGapAnalysis,
    CourseRecommendation,
    StepType
)


# ==================== MINI HELPER SERIALIZERS ====================

class CourseMiniSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    level_display = serializers.CharField(source='get_level_display', read_only=True)

    class Meta:
        model = Course
        fields = [
            'id',
            'title',
            'slug',
            'thumbnail_url',
            'level',
            'level_display',
            'category_name',
            'price',
            'is_free'
        ]


class LessonMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = [
            'id',
            'title',
            'duration_minutes',
            'is_preview'
        ]


class QuizMiniSerializer(serializers.ModelSerializer):
    quiz_type_display = serializers.CharField(source='get_quiz_type_display', read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)

    class Meta:
        model = Quiz
        fields = [
            'id',
            'title',
            'quiz_type',
            'quiz_type_display',
            'level',
            'level_display',
            'time_limit_minutes',
            'passing_score',
            'total_questions'
        ]


# ==================== LEARNING PATH SERIALIZERS ====================

class LearningPathStepSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị chi tiết từng chặng học trong Lộ trình thích ứng.
    """
    step_type_display = serializers.CharField(source='get_step_type_display', read_only=True)
    target_skill_display = serializers.CharField(source='get_target_skill_display', read_only=True)
    target_course = CourseMiniSerializer(read_only=True)
    target_lesson = LessonMiniSerializer(read_only=True)
    target_quiz = QuizMiniSerializer(read_only=True)

    class Meta:
        model = LearningPathStep
        fields = [
            'id',
            'step_index',
            'title',
            'description',
            'step_type',
            'step_type_display',
            'target_skill',
            'target_skill_display',
            'target_course',
            'target_lesson',
            'target_quiz',
            'estimated_minutes',
            'is_completed',
            'completed_at'
        ]


class LearningPathDetailSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị toàn bộ Lộ trình học tập kèm danh sách các chặng và tiến độ.
    """
    target_level_display = serializers.CharField(source='get_target_level_display', read_only=True)
    current_estimated_level_display = serializers.CharField(source='get_current_estimated_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    steps = LearningPathStepSerializer(many=True, read_only=True)

    class Meta:
        model = LearningPath
        fields = [
            'id',
            'title',
            'target_level',
            'target_level_display',
            'current_estimated_level',
            'current_estimated_level_display',
            'goal_description',
            'status',
            'status_display',
            'total_steps',
            'completed_steps',
            'progress_percentage',
            'steps',
            'created_at',
            'updated_at'
        ]


class GenerateLearningPathRequestSerializer(serializers.Serializer):
    """
    Serializer tiếp nhận yêu cầu sinh Lộ trình học tập cá nhân hóa mới.
    """
    target_level = serializers.ChoiceField(
        choices=EnglishLevel.choices,
        required=False,
        default=EnglishLevel.B2,
        help_text="Trình độ mục tiêu mà học viên muốn hướng tới (VD: B2, C1)"
    )
    goal_description = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
        default="",
        help_text="Mục tiêu cụ thể của học viên (VD: Ôn thi IELTS Speaking 6.5 trong 3 tháng)"
    )


# ==================== SKILL GAP & COURSE RECOMMENDATION SERIALIZERS ====================

class SkillGapAnalysisSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị điểm thành thạo và phân tích lỗ hổng kỹ năng của học viên.
    """
    skill_type_display = serializers.CharField(source='get_skill_type_display', read_only=True)

    class Meta:
        model = SkillGapAnalysis
        fields = [
            'id',
            'skill_type',
            'skill_type_display',
            'proficiency_score',
            'weak_topics',
            'recommended_action',
            'last_assessed_at'
        ]


class CourseRecommendationSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị khóa học được AI đề xuất cho học viên.
    """
    course = CourseMiniSerializer(read_only=True)

    class Meta:
        model = CourseRecommendation
        fields = [
            'id',
            'course',
            'relevance_score',
            'reason',
            'is_dismissed',
            'created_at'
        ]

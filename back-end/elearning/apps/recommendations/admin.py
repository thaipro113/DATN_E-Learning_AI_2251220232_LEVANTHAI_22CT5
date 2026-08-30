from django.contrib import admin
from .models import LearningPath, LearningPathStep, SkillGapAnalysis, CourseRecommendation


class LearningPathStepInline(admin.TabularInline):
    model = LearningPathStep
    extra = 0
    fields = ('step_index', 'title', 'step_type', 'target_skill', 'estimated_minutes', 'is_completed')
    ordering = ('step_index',)


@admin.register(LearningPath)
class LearningPathAdmin(admin.ModelAdmin):
    list_display = (
        'student',
        'title',
        'target_level',
        'current_estimated_level',
        'status',
        'total_steps',
        'completed_steps',
        'progress_percentage',
        'created_at'
    )
    list_filter = ('status', 'target_level', 'current_estimated_level', 'created_at')
    search_fields = ('student__email', 'student__full_name', 'title', 'goal_description')
    readonly_fields = ('total_steps', 'completed_steps', 'progress_percentage', 'created_at', 'updated_at')
    inlines = [LearningPathStepInline]


@admin.register(LearningPathStep)
class LearningPathStepAdmin(admin.ModelAdmin):
    list_display = (
        'learning_path',
        'step_index',
        'title',
        'step_type',
        'target_skill',
        'estimated_minutes',
        'is_completed',
        'completed_at'
    )
    list_filter = ('step_type', 'target_skill', 'is_completed')
    search_fields = ('title', 'description', 'learning_path__student__email')


@admin.register(SkillGapAnalysis)
class SkillGapAnalysisAdmin(admin.ModelAdmin):
    list_display = (
        'student',
        'skill_type',
        'proficiency_score',
        'last_assessed_at'
    )
    list_filter = ('skill_type', 'last_assessed_at')
    search_fields = ('student__email', 'student__full_name', 'recommended_action')


@admin.register(CourseRecommendation)
class CourseRecommendationAdmin(admin.ModelAdmin):
    list_display = (
        'student',
        'course',
        'relevance_score',
        'is_dismissed',
        'created_at'
    )
    list_filter = ('is_dismissed', 'created_at')
    search_fields = ('student__email', 'course__title', 'reason')

from django.contrib import admin
from .models import Quiz, Question, AnswerOption, QuizAttempt, StudentAnswer


class AnswerOptionInline(admin.TabularInline):
    model = AnswerOption
    extra = 4
    fields = ('order_index', 'content', 'is_correct')


class QuestionInline(admin.StackedInline):
    model = Question
    extra = 0
    fields = ('order_index', 'content', 'question_type', 'skill', 'level', 'points', 'explanation')


class StudentAnswerInline(admin.TabularInline):
    model = StudentAnswer
    extra = 0
    fields = ('question', 'selected_option', 'text_answer', 'is_correct', 'score_earned')
    readonly_fields = ('question', 'selected_option', 'text_answer', 'is_correct', 'score_earned')


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'quiz_type', 'level', 'time_limit_minutes', 'passing_score', 'is_published', 'get_total_questions', 'created_by')
    list_filter = ('quiz_type', 'level', 'is_published', 'created_at')
    search_fields = ('title', 'description', 'course__title')
    inlines = [QuestionInline]

    @admin.display(description='Tổng số câu hỏi')
    def get_total_questions(self, obj):
        return obj.total_questions


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('get_short_content', 'quiz', 'question_type', 'skill', 'level', 'points', 'order_index')
    list_filter = ('question_type', 'skill', 'level')
    search_fields = ('content', 'quiz__title')
    inlines = [AnswerOptionInline]

    @admin.display(description='Nội dung câu hỏi')
    def get_short_content(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('student', 'quiz', 'score', 'max_score', 'percentage', 'is_passed', 'status', 'started_at', 'completed_at')
    list_filter = ('status', 'is_passed', 'started_at')
    search_fields = ('student__email', 'student__full_name', 'quiz__title')
    readonly_fields = ('started_at', 'completed_at', 'score', 'max_score', 'percentage', 'is_passed')
    inlines = [StudentAnswerInline]


@admin.register(AnswerOption)
class AnswerOptionAdmin(admin.ModelAdmin):
    list_display = ('question', 'content', 'is_correct', 'order_index')
    list_filter = ('is_correct',)
    search_fields = ('content', 'question__content')


@admin.register(StudentAnswer)
class StudentAnswerAdmin(admin.ModelAdmin):
    list_display = ('attempt', 'question', 'selected_option', 'is_correct', 'score_earned')
    list_filter = ('is_correct',)
    search_fields = ('attempt__student__email', 'question__content')

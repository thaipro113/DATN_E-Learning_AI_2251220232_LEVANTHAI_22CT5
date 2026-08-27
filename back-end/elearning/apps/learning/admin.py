from django.contrib import admin
from .models import Enrollment, LessonProgress, Certificate


class LessonProgressInline(admin.TabularInline):
    model = LessonProgress
    extra = 0
    fields = ('lesson', 'is_completed', 'completed_at', 'last_watched_second')
    readonly_fields = ('completed_at',)


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'status', 'progress_percent', 'enrolled_at', 'completed_at')
    list_filter = ('status', 'enrolled_at', 'completed_at')
    search_fields = ('student__email', 'student__full_name', 'course__title')
    readonly_fields = ('progress_percent', 'enrolled_at', 'completed_at')
    inlines = [LessonProgressInline]


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ('enrollment', 'lesson', 'is_completed', 'completed_at', 'last_watched_second')
    list_filter = ('is_completed', 'completed_at')
    search_fields = ('enrollment__student__email', 'lesson__title')


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('certificate_code', 'get_student', 'get_course', 'issued_at')
    search_fields = ('certificate_code', 'enrollment__student__full_name', 'enrollment__course__title')
    readonly_fields = ('certificate_code', 'issued_at')

    @admin.display(description='Học viên')
    def get_student(self, obj):
        return obj.enrollment.student.full_name

    @admin.display(description='Khóa học')
    def get_course(self, obj):
        return obj.enrollment.course.title

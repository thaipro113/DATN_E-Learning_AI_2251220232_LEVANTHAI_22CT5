from django.contrib import admin
from .models import Category, Course, Chapter, Lesson, Material


class MaterialInline(admin.TabularInline):
    model = Material
    extra = 1
    fields = ('title', 'file_url', 'file_type', 'file_size_bytes')


class LessonInline(admin.StackedInline):
    model = Lesson
    extra = 1
    fields = ('title', 'order_index', 'duration_minutes', 'is_preview', 'video_url')
    ordering = ('order_index',)


class ChapterInline(admin.StackedInline):
    model = Chapter
    extra = 1
    fields = ('title', 'order_index')
    ordering = ('order_index',)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'teacher', 'category', 'level', 'price', 'is_free', 'status', 'created_at')
    list_filter = ('status', 'level', 'is_free', 'category', 'created_at')
    search_fields = ('title', 'description', 'teacher__full_name', 'teacher__email')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [ChapterInline]


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order_index', 'created_at')
    list_filter = ('course', 'created_at')
    search_fields = ('title', 'course__title')
    ordering = ('course', 'order_index')
    inlines = [LessonInline]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'chapter', 'order_index', 'duration_minutes', 'is_preview', 'created_at')
    list_filter = ('is_preview', 'chapter__course', 'created_at')
    search_fields = ('title', 'content', 'chapter__title')
    ordering = ('chapter', 'order_index')
    inlines = [MaterialInline]


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('title', 'lesson', 'file_type', 'file_size_bytes', 'created_at')
    list_filter = ('file_type', 'created_at')
    search_fields = ('title', 'lesson__title')
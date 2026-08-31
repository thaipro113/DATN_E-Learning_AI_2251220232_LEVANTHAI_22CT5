from django.contrib import admin
from .models import QuizImportBatch


@admin.register(QuizImportBatch)
class QuizImportBatchAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'teacher',
        'quiz',
        'source_type',
        'use_ai',
        'status',
        'total_parsed',
        'total_imported',
        'created_at'
    )
    list_filter = ('source_type', 'use_ai', 'status', 'created_at')
    search_fields = ('title', 'teacher__email', 'raw_text', 'error_log')
    readonly_fields = ('total_parsed', 'total_imported', 'parsed_data', 'created_at', 'updated_at')

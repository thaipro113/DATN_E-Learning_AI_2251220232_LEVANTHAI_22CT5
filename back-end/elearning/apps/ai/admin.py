from django.contrib import admin
from .models import ChatSession, ChatMessage


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    fields = ('sender_type', 'content', 'model_used', 'token_count', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('title', 'student', 'session_type', 'target_level', 'is_active', 'get_total_messages', 'created_at', 'updated_at')
    list_filter = ('session_type', 'target_level', 'is_active', 'created_at')
    search_fields = ('title', 'student__email', 'student__full_name', 'course__title', 'lesson__title')
    inlines = [ChatMessageInline]

    @admin.display(description='Tổng số tin nhắn')
    def get_total_messages(self, obj):
        return obj.total_messages


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('session', 'sender_type', 'get_short_content', 'model_used', 'token_count', 'created_at')
    list_filter = ('sender_type', 'model_used', 'created_at')
    search_fields = ('content', 'session__title', 'session__student__email')

    @admin.display(description='Nội dung')
    def get_short_content(self, obj):
        return obj.content[:60] + "..." if len(obj.content) > 60 else obj.content

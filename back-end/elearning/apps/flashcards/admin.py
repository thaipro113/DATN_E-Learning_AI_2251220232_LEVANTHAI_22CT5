from django.contrib import admin
from .models import FlashcardDeck, Flashcard, UserCardProgress


class FlashcardInline(admin.TabularInline):
    model = Flashcard
    extra = 1
    fields = ('word', 'ipa', 'part_of_speech', 'meaning', 'example', 'order')


@admin.register(FlashcardDeck)
class FlashcardDeckAdmin(admin.ModelAdmin):
    list_display = ('title', 'code', 'category', 'level', 'status', 'access_scope', 'is_public', 'author_name', 'course_title', 'created_at')
    list_filter = ('category', 'status', 'access_scope', 'is_public', 'level')
    search_fields = ('title', 'code', 'author_name', 'course_title')
    inlines = [FlashcardInline]


@admin.register(Flashcard)
class FlashcardAdmin(admin.ModelAdmin):
    list_display = ('word', 'part_of_speech', 'meaning', 'deck', 'order', 'created_at')
    list_filter = ('part_of_speech', 'deck')
    search_fields = ('word', 'meaning', 'english_def', 'example')


@admin.register(UserCardProgress)
class UserCardProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'card', 'deck', 'is_mastered', 'is_review', 'study_count', 'last_studied_at')
    list_filter = ('is_mastered', 'is_review')
    search_fields = ('user__email', 'user__full_name', 'card__word')

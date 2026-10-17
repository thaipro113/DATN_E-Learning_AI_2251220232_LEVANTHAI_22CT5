from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class FlashcardsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.flashcards'
    verbose_name = _('Quản lý Từ vựng & Flashcards')

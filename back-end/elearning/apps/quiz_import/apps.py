from django.apps import AppConfig


class QuizImportConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.quiz_import'
    verbose_name = 'Quiz File Import'

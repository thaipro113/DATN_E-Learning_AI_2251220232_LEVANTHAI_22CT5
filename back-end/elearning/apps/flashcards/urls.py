from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FlashcardDeckViewSet, FlashcardViewSet, UserCardProgressViewSet

app_name = 'flashcards'

router = DefaultRouter()
router.register(r'decks', FlashcardDeckViewSet, basename='deck')
router.register(r'cards', FlashcardViewSet, basename='card')
router.register(r'progress', UserCardProgressViewSet, basename='progress')

urlpatterns = [
    path('', include(router.urls)),
]

from django.urls import path
from .views import (
    QuizListCreateAPIView,
    QuizDetailAPIView,
    QuestionListCreateAPIView,
    QuestionDetailAPIView
)

app_name = 'assessments'

urlpatterns = [
    # 1. Quản lý Đề thi (Quiz CRUD)
    path('quizzes/', QuizListCreateAPIView.as_view(), name='quiz_list_create'),
    path('quizzes/<uuid:quiz_id>/', QuizDetailAPIView.as_view(), name='quiz_detail'),

    # 2. Quản lý Câu hỏi trong Đề thi (Questions & Answer Options CRUD)
    path('quizzes/<uuid:quiz_id>/questions/', QuestionListCreateAPIView.as_view(), name='question_create'),
    path('questions/<uuid:question_id>/', QuestionDetailAPIView.as_view(), name='question_detail'),
]

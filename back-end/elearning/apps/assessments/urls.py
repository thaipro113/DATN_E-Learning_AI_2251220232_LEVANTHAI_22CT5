from django.urls import path
from .views import (
    QuizListCreateAPIView,
    QuizDetailAPIView,
    QuestionListCreateAPIView,
    QuestionDetailAPIView,
    StartQuizAttemptAPIView,
    SubmitQuizAttemptAPIView,
    QuizAttemptResultAPIView,
    MyQuizAttemptsAPIView
)

app_name = 'assessments'

urlpatterns = [
    # 1. Quản lý Đề thi (Quiz CRUD)
    path('quizzes/', QuizListCreateAPIView.as_view(), name='quiz_list_create'),
    path('quizzes/<uuid:quiz_id>/', QuizDetailAPIView.as_view(), name='quiz_detail'),

    # 2. Quản lý Câu hỏi trong Đề thi (Questions & Answer Options CRUD)
    path('quizzes/<uuid:quiz_id>/questions/', QuestionListCreateAPIView.as_view(), name='question_create'),
    path('questions/<uuid:question_id>/', QuestionDetailAPIView.as_view(), name='question_detail'),

    # 3. Làm bài thi, Nộp bài & Chấm điểm (Quiz Taking & Automated Grading)
    path('quizzes/<uuid:quiz_id>/start/', StartQuizAttemptAPIView.as_view(), name='start_quiz_attempt'),
    path('attempts/<uuid:attempt_id>/submit/', SubmitQuizAttemptAPIView.as_view(), name='submit_quiz_attempt'),
    path('attempts/<uuid:attempt_id>/results/', QuizAttemptResultAPIView.as_view(), name='quiz_attempt_results'),
    path('my-attempts/', MyQuizAttemptsAPIView.as_view(), name='my_quiz_attempts'),
]

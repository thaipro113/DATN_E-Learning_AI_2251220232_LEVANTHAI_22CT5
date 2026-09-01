from django.urls import path
from .views import (
    ChatSessionListCreateAPIView,
    ChatSessionDetailAPIView,
    SendMessageAPIView,
    GrammarCheckAPIView,
    GenerateProgressQuizAPIView,
    GenerateTeacherQuizAPIView
)

app_name = 'ai'

urlpatterns = [
    # 1. Quản lý Phiên trò chuyện AI (Chat Sessions)
    path('sessions/', ChatSessionListCreateAPIView.as_view(), name='session_list_create'),
    path('sessions/<uuid:session_id>/', ChatSessionDetailAPIView.as_view(), name='session_detail'),

    # 2. Tương tác gửi tin nhắn đến AI Tutor (Chat Interaction)
    path('sessions/<uuid:session_id>/send/', SendMessageAPIView.as_view(), name='send_message'),

    # 3. Phân tích & Sửa lỗi ngữ pháp chuyên biệt (Grammar Checker API)
    path('grammar-check/', GrammarCheckAPIView.as_view(), name='grammar_check'),

    # 4. AI Sinh đề thi trắc nghiệm (Quiz Generator)
    path('quizzes/generate/', GenerateTeacherQuizAPIView.as_view(), name='generate_teacher_quiz'),
    path('quizzes/generate-by-progress/', GenerateProgressQuizAPIView.as_view(), name='generate_progress_quiz'),
]


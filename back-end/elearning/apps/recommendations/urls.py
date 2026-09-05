from django.urls import path
from .views import (
    MyLearningPathAPIView,
    CompleteLearningPathStepAPIView,
    SkillGapAnalysisAPIView,
    CourseRecommendationListAPIView,
    DismissCourseRecommendationAPIView,
    WeakTopicQuizGenerateAPIView,
    CourseRecommendationWizardAPIView,
    StudentMistakeAnalysisAPIView
)

app_name = 'recommendations'

urlpatterns = [
    # 1. Lộ trình học tập cá nhân hóa (Personalized Learning Path)
    path('my-learning-path/', MyLearningPathAPIView.as_view(), name='my_learning_path'),
    path('generate-path/', MyLearningPathAPIView.as_view(), name='generate_learning_path'),
    path('steps/<uuid:step_id>/complete/', CompleteLearningPathStepAPIView.as_view(), name='complete_step'),

    # 2. Phân tích Lỗ hổng Kỹ năng & Lỗi sai trắc nghiệm (Mistake & Skill Gap Analysis)
    path('mistakes/', StudentMistakeAnalysisAPIView.as_view(), name='student_mistakes'),
    path('skill-gaps/', SkillGapAnalysisAPIView.as_view(), name='skill_gaps'),
    path('weak-topics/generate-quiz/', WeakTopicQuizGenerateAPIView.as_view(), name='generate_weak_topic_quiz'),

    # 3. Đề xuất Khóa học AI (Course Recommendations)
    path('courses/', CourseRecommendationListAPIView.as_view(), name='course_recommendations'),
    path('courses/wizard-recommend/', CourseRecommendationWizardAPIView.as_view(), name='wizard_course_recommendation'),
    path('courses/<uuid:recommendation_id>/dismiss/', DismissCourseRecommendationAPIView.as_view(), name='dismiss_course_recommendation'),
]

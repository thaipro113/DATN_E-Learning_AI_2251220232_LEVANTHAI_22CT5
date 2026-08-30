from django.urls import path
from .views import (
    MyLearningPathAPIView,
    CompleteLearningPathStepAPIView,
    SkillGapAnalysisAPIView,
    CourseRecommendationListAPIView,
    DismissCourseRecommendationAPIView
)

app_name = 'recommendations'

urlpatterns = [
    # 1. Lộ trình học tập cá nhân hóa (Personalized Learning Path)
    path('my-learning-path/', MyLearningPathAPIView.as_view(), name='my_learning_path'),
    path('generate-path/', MyLearningPathAPIView.as_view(), name='generate_learning_path'),
    path('steps/<uuid:step_id>/complete/', CompleteLearningPathStepAPIView.as_view(), name='complete_step'),

    # 2. Phân tích Lỗ hổng Kỹ năng (Skill Gap Analysis)
    path('skill-gaps/', SkillGapAnalysisAPIView.as_view(), name='skill_gaps'),

    # 3. Đề xuất Khóa học AI (Course Recommendations)
    path('courses/', CourseRecommendationListAPIView.as_view(), name='course_recommendations'),
    path('courses/<uuid:recommendation_id>/dismiss/', DismissCourseRecommendationAPIView.as_view(), name='dismiss_course_recommendation'),
]

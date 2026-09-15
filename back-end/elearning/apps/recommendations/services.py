"""
Các services liên quan đến Lộ trình AI và Đề xuất khóa học đã được tinh giản
để hệ thống tập trung vào 3 chức năng AI chính theo đề cương Đồ án tốt nghiệp:
1. Phân tích lỗi sai trắc nghiệm (apps.assessments)
2. AI Tutor hội thoại (apps.ai)
3. Import đề thi trắc nghiệm (apps.assessments)
"""

class SkillGapService:
    @staticmethod
    def analyze_student_skill_gaps(student):
        return []


class CourseRecommendationService:
    @staticmethod
    def generate_course_recommendations(student, limit=6):
        return []

    @staticmethod
    def recommend_courses_with_wizard(*args, **kwargs):
        return []

    @staticmethod
    def dismiss_recommendation(student, recommendation_id):
        return True


class LearningPathService:
    @staticmethod
    def get_or_create_learning_path(student):
        return None

    @staticmethod
    def generate_adaptive_learning_path(student, target_level=None, goal_description=""):
        return None

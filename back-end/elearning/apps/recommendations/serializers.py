from rest_framework import serializers
from apps.accounts.models import EnglishLevel
from apps.courses.models import Course, Lesson
from apps.assessments.models import Quiz


# ==================== MINI HELPER SERIALIZERS ====================

class CourseMiniSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    level_display = serializers.CharField(source='get_level_display', read_only=True)

    class Meta:
        model = Course
        fields = [
            'id',
            'title',
            'slug',
            'thumbnail_url',
            'level',
            'level_display',
            'category_name',
            'price',
            'is_free'
        ]


class WeakTopicQuizRequestSerializer(serializers.Serializer):
    """
    Serializer yêu cầu sinh đề ôn tập điểm yếu bằng AI LLM.
    """
    topic = serializers.CharField(max_length=500, required=False, allow_blank=True, default="", help_text="Chủ đề ngữ pháp hoặc từ vựng còn yếu")
    sub_topic = serializers.CharField(max_length=500, required=False, allow_blank=True, default="", help_text="Chủ đề phụ cụ thể")
    topics = serializers.ListField(child=serializers.CharField(max_length=255), required=False, default=list, help_text="Danh sách nhiều chủ đề lỗi sai đã chọn")
    level = serializers.ChoiceField(choices=EnglishLevel.choices, required=False, default=EnglishLevel.B1)
    quantity = serializers.IntegerField(required=False, default=5, min_value=1, max_value=20)


class CourseRecommendationWizardRequestSerializer(serializers.Serializer):
    """
    Serializer tiếp nhận 4 bước lựa chọn từ AI Course Recommendation Wizard.
    """
    goal = serializers.CharField(max_length=255, required=False, default="Nâng cao toàn diện năng lực tiếng Anh")
    self_level = serializers.ChoiceField(choices=EnglishLevel.choices, required=False, default=EnglishLevel.B1)
    priority_skill = serializers.CharField(max_length=255, required=False, default="Ngữ pháp & Từ vựng")
    daily_time = serializers.CharField(max_length=100, required=False, default="30 phút")

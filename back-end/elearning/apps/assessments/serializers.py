from rest_framework import serializers
from .models import Quiz, Question, AnswerOption, QuizType, QuestionType, SkillType
from apps.courses.models import Course, Lesson
from apps.accounts.models import EnglishLevel


# ==================== ANSWER OPTION SERIALIZERS ====================

class AnswerOptionSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị đầy đủ đáp án bao gồm cờ is_correct (dành cho Giáo viên/Admin).
    """
    class Meta:
        model = AnswerOption
        fields = ['id', 'content', 'is_correct', 'order_index']


class AnswerOptionStudentSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị đáp án cho Học viên làm bài (Ẩn hoàn toàn cờ is_correct để chống gian lận).
    """
    class Meta:
        model = AnswerOption
        fields = ['id', 'content', 'order_index']


class AnswerOptionCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer tiếp nhận dữ liệu đáp án khi tạo/cập nhật câu hỏi.
    """
    id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = AnswerOption
        fields = ['id', 'content', 'is_correct', 'order_index']
        extra_kwargs = {
            'is_correct': {'required': False, 'default': False},
            'order_index': {'required': False, 'default': 1}
        }


# ==================== QUESTION SERIALIZERS ====================

class QuestionDetailSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị đầy đủ câu hỏi, giải thích và đáp án (dành cho Giáo viên/Admin).
    """
    options = AnswerOptionSerializer(many=True, read_only=True)
    question_type_display = serializers.CharField(source='get_question_type_display', read_only=True)
    skill_display = serializers.CharField(source='get_skill_display', read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)

    class Meta:
        model = Question
        fields = [
            'id',
            'content',
            'question_type',
            'question_type_display',
            'skill',
            'skill_display',
            'level',
            'level_display',
            'audio_url',
            'image_url',
            'explanation',
            'points',
            'order_index',
            'options'
        ]


class QuestionStudentSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị câu hỏi cho Học viên trong lúc làm bài (Ẩn đáp án đúng và lời giải thích).
    """
    options = AnswerOptionStudentSerializer(many=True, read_only=True)
    question_type_display = serializers.CharField(source='get_question_type_display', read_only=True)
    skill_display = serializers.CharField(source='get_skill_display', read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)

    class Meta:
        model = Question
        fields = [
            'id',
            'content',
            'question_type',
            'question_type_display',
            'skill',
            'skill_display',
            'level',
            'level_display',
            'audio_url',
            'image_url',
            'points',
            'order_index',
            'options'
        ]


class QuestionCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer tiếp nhận dữ liệu khi Giáo viên/Admin tạo hoặc cập nhật Câu hỏi kèm danh sách Đáp án.
    """
    options = AnswerOptionCreateUpdateSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = [
            'content',
            'question_type',
            'skill',
            'level',
            'audio_url',
            'image_url',
            'explanation',
            'points',
            'order_index',
            'options'
        ]
        extra_kwargs = {
            'audio_url': {'required': False, 'allow_blank': True, 'allow_null': True},
            'image_url': {'required': False, 'allow_blank': True, 'allow_null': True},
            'explanation': {'required': False, 'allow_blank': True},
            'points': {'required': False, 'default': 1.00},
            'order_index': {'required': False, 'allow_null': True}
        }

    def validate(self, attrs):
        question_type = attrs.get('question_type', getattr(self.instance, 'question_type', None))
        options = attrs.get('options', [])

        # Kiểm tra tính hợp lệ của đáp án trắc nghiệm
        if question_type in [QuestionType.SINGLE_CHOICE, QuestionType.TRUE_FALSE] and options:
            correct_count = sum(1 for opt in options if opt.get('is_correct', False))
            if correct_count != 1:
                raise serializers.ValidationError({
                    'options': "Câu hỏi trắc nghiệm một đáp án / Đúng Sai phải có chính xác 1 đáp án đúng."
                })

        elif question_type == QuestionType.MULTIPLE_CHOICE and options:
            correct_count = sum(1 for opt in options if opt.get('is_correct', False))
            if correct_count < 1:
                raise serializers.ValidationError({
                    'options': "Câu hỏi trắc nghiệm nhiều đáp án phải có ít nhất 1 đáp án đúng."
                })

        return attrs


# ==================== QUIZ SERIALIZERS ====================

class QuizListSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị danh sách đề thi (Trang chủ / Danh sách bài kiểm tra).
    """
    quiz_type_display = serializers.CharField(source='get_quiz_type_display', read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True, default=None)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True, default=None)
    creator_name = serializers.CharField(source='created_by.full_name', read_only=True, default=None)
    total_questions = serializers.IntegerField(read_only=True)
    total_points = serializers.FloatField(read_only=True)

    class Meta:
        model = Quiz
        fields = [
            'id',
            'title',
            'description',
            'quiz_type',
            'quiz_type_display',
            'level',
            'level_display',
            'time_limit_minutes',
            'passing_score',
            'total_questions',
            'total_points',
            'is_published',
            'course',
            'course_title',
            'lesson',
            'lesson_title',
            'creator_name',
            'created_at',
            'updated_at'
        ]


class QuizDetailTeacherSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị chi tiết đề thi cho Giáo viên/Admin (Gồm toàn bộ câu hỏi, đáp án đúng & giải thích).
    """
    questions = QuestionDetailSerializer(many=True, read_only=True)
    quiz_type_display = serializers.CharField(source='get_quiz_type_display', read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True, default=None)
    total_questions = serializers.IntegerField(read_only=True)
    total_points = serializers.FloatField(read_only=True)

    class Meta:
        model = Quiz
        fields = [
            'id',
            'title',
            'description',
            'quiz_type',
            'quiz_type_display',
            'level',
            'level_display',
            'time_limit_minutes',
            'passing_score',
            'total_questions',
            'total_points',
            'is_published',
            'course',
            'course_title',
            'lesson',
            'questions',
            'created_at',
            'updated_at'
        ]


class QuizDetailStudentSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị chi tiết đề thi cho Học viên làm bài (Ẩn đáp án đúng để bảo mật).
    """
    questions = QuestionStudentSerializer(many=True, read_only=True)
    quiz_type_display = serializers.CharField(source='get_quiz_type_display', read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    total_questions = serializers.IntegerField(read_only=True)
    total_points = serializers.FloatField(read_only=True)

    class Meta:
        model = Quiz
        fields = [
            'id',
            'title',
            'description',
            'quiz_type',
            'quiz_type_display',
            'level',
            'level_display',
            'time_limit_minutes',
            'passing_score',
            'total_questions',
            'total_points',
            'course',
            'lesson',
            'questions'
        ]


class QuizCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer tiếp nhận dữ liệu khi Giáo viên/Admin tạo hoặc cập nhật Đề thi.
    """
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        source='course',
        required=False,
        allow_null=True
    )
    lesson_id = serializers.PrimaryKeyRelatedField(
        queryset=Lesson.objects.all(),
        source='lesson',
        required=False,
        allow_null=True
    )

    class Meta:
        model = Quiz
        fields = [
            'title',
            'description',
            'quiz_type',
            'level',
            'time_limit_minutes',
            'passing_score',
            'is_published',
            'course_id',
            'lesson_id'
        ]
        extra_kwargs = {
            'description': {'required': False, 'allow_blank': True},
            'quiz_type': {'required': False, 'default': QuizType.PRACTICE},
            'level': {'required': False, 'default': 'ALL'},
            'time_limit_minutes': {'required': False, 'default': 30},
            'passing_score': {'required': False, 'default': 50.00},
            'is_published': {'required': False, 'default': True}
        }

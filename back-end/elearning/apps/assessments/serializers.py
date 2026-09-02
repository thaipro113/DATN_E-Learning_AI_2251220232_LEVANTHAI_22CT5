from rest_framework import serializers
from .models import (
    Quiz,
    Question,
    AnswerOption,
    QuizAttempt,
    StudentAnswer,
    QuizType,
    QuestionType,
    SkillType,
    AttemptStatus
)
from apps.courses.models import Course, Chapter, Lesson
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
    chapter_title = serializers.CharField(source='chapter.title', read_only=True, default=None)
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
            'chapter',
            'chapter_title',
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
    chapter_title = serializers.CharField(source='chapter.title', read_only=True, default=None)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True, default=None)
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
            'chapter',
            'chapter_title',
            'lesson',
            'lesson_title',
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
            'chapter',
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
    chapter_id = serializers.PrimaryKeyRelatedField(
        queryset=Chapter.objects.all(),
        source='chapter',
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
            'chapter_id',
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


# ==================== QUIZ ATTEMPT & SUBMISSION SERIALIZERS ====================

class StartQuizAttemptResponseSerializer(serializers.Serializer):
    """
    Serializer phản hồi khi học viên bấm Bắt đầu làm bài thi.
    """
    attempt_id = serializers.UUIDField()
    quiz = QuizDetailStudentSerializer()
    started_at = serializers.DateTimeField()
    time_limit_minutes = serializers.IntegerField()


class StudentAnswerSubmissionItemSerializer(serializers.Serializer):
    """
    Serializer từng câu trả lời trong payload nộp bài của học viên.
    """
    question_id = serializers.UUIDField(required=True)
    selected_option_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    text_answer = serializers.CharField(required=False, allow_blank=True, default='')


class QuizSubmissionRequestSerializer(serializers.Serializer):
    """
    Serializer tiếp nhận danh sách toàn bộ câu trả lời khi nộp bài thi.
    """
    answers = serializers.ListField(
        child=StudentAnswerSubmissionItemSerializer(),
        required=True,
        allow_empty=True
    )


class StudentAnswerDetailSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị chi tiết từng câu trả lời của học viên trong bảng kết quả.
    """
    question_id = serializers.UUIDField(source='question.id', read_only=True)
    question_content = serializers.CharField(source='question.content', read_only=True)
    question_type = serializers.CharField(source='question.question_type', read_only=True)
    skill = serializers.CharField(source='question.skill', read_only=True)
    skill_display = serializers.CharField(source='question.get_skill_display', read_only=True)
    explanation = serializers.CharField(source='question.explanation', read_only=True)
    max_points = serializers.DecimalField(source='question.points', max_digits=4, decimal_places=2, read_only=True)
    selected_option_content = serializers.CharField(source='selected_option.content', read_only=True, default=None)
    all_options = AnswerOptionSerializer(source='question.options', many=True, read_only=True)

    class Meta:
        model = StudentAnswer
        fields = [
            'id',
            'question_id',
            'question_content',
            'question_type',
            'skill',
            'skill_display',
            'selected_option',
            'selected_option_content',
            'text_answer',
            'is_correct',
            'score_earned',
            'max_points',
            'explanation',
            'all_options'
        ]


class SkillPerformanceSerializer(serializers.Serializer):
    """
    Serializer phân tích năng lực chi tiết theo từng Kỹ năng (Listening, Reading, Grammar,...).
    """
    skill = serializers.CharField()
    skill_display = serializers.CharField()
    score_earned = serializers.FloatField()
    max_score = serializers.FloatField()
    percentage = serializers.FloatField()
    total_questions = serializers.IntegerField()
    correct_questions = serializers.IntegerField()


class QuizAttemptResultSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị toàn bộ Báo cáo kết quả bài thi sau khi nộp bài (Điểm, %, Đỗ/Trượt, Kỹ năng, Chi tiết câu hỏi).
    """
    quiz_id = serializers.UUIDField(source='quiz.id', read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    quiz_type = serializers.CharField(source='quiz.quiz_type', read_only=True)
    quiz_type_display = serializers.CharField(source='quiz.get_quiz_type_display', read_only=True)
    passing_score = serializers.DecimalField(source='quiz.passing_score', max_digits=5, decimal_places=2, read_only=True)
    time_spent_seconds = serializers.SerializerMethodField()
    skill_breakdown = serializers.SerializerMethodField()
    answers = StudentAnswerDetailSerializer(source='student_answers', many=True, read_only=True)

    class Meta:
        model = QuizAttempt
        fields = [
            'id',
            'quiz_id',
            'quiz_title',
            'quiz_type',
            'quiz_type_display',
            'started_at',
            'completed_at',
            'time_spent_seconds',
            'score',
            'max_score',
            'percentage',
            'passing_score',
            'is_passed',
            'status',
            'skill_breakdown',
            'answers'
        ]

    def get_time_spent_seconds(self, obj) -> int:
        if obj.completed_at and obj.started_at:
            return int((obj.completed_at - obj.started_at).total_seconds())
        return 0

    def get_skill_breakdown(self, obj):
        # Tính toán tỷ lệ phần trăm theo từng kỹ năng
        skill_stats = {}
        for ans in obj.student_answers.select_related('question'):
            q = ans.question
            skill_code = q.skill
            skill_label = q.get_skill_display()

            if skill_code not in skill_stats:
                skill_stats[skill_code] = {
                    'skill': skill_code,
                    'skill_display': skill_label,
                    'score_earned': 0.0,
                    'max_score': 0.0,
                    'total_questions': 0,
                    'correct_questions': 0
                }

            skill_stats[skill_code]['score_earned'] += float(ans.score_earned)
            skill_stats[skill_code]['max_score'] += float(q.points)
            skill_stats[skill_code]['total_questions'] += 1
            if ans.is_correct:
                skill_stats[skill_code]['correct_questions'] += 1

        breakdown = []
        for s in skill_stats.values():
            pct = (s['score_earned'] / s['max_score'] * 100.0) if s['max_score'] > 0 else 0.0
            s['percentage'] = round(pct, 2)
            s['score_earned'] = round(s['score_earned'], 2)
            s['max_score'] = round(s['max_score'], 2)
            breakdown.append(s)

        return breakdown


class QuizAttemptListSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị danh sách lịch sử các lần thi của học viên (My Attempts).
    """
    quiz_id = serializers.UUIDField(source='quiz.id', read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    quiz_type = serializers.CharField(source='quiz.quiz_type', read_only=True)
    quiz_type_display = serializers.CharField(source='quiz.get_quiz_type_display', read_only=True)

    class Meta:
        model = QuizAttempt
        fields = [
            'id',
            'quiz_id',
            'quiz_title',
            'quiz_type',
            'quiz_type_display',
            'started_at',
            'completed_at',
            'score',
            'max_score',
            'percentage',
            'is_passed',
            'status'
        ]

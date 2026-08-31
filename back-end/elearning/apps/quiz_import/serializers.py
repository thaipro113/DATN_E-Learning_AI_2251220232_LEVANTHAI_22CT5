from rest_framework import serializers
from apps.assessments.models import QuestionType, SkillType
from .models import QuizImportBatch, ImportSourceType, BatchStatus


class ParsedOptionSerializer(serializers.Serializer):
    """
    Serializer cho từng phương án trả lời đã bóc tách.
    """
    content = serializers.CharField(max_length=500)
    is_correct = serializers.BooleanField(default=False)


class ParsedQuestionSerializer(serializers.Serializer):
    """
    Serializer cho câu hỏi đã bóc tách (được sử dụng trong bảng Preview & Confirm).
    """
    content = serializers.CharField()
    question_type = serializers.ChoiceField(
        choices=QuestionType.choices,
        default=QuestionType.SINGLE_CHOICE
    )
    skill = serializers.ChoiceField(
        choices=SkillType.choices,
        default=SkillType.GRAMMAR
    )
    points = serializers.FloatField(default=10.0)
    explanation = serializers.CharField(allow_blank=True, default='')
    options = ParsedOptionSerializer(many=True, default=list)


class CreateQuizImportBatchSerializer(serializers.Serializer):
    """
    Serializer tiếp nhận yêu cầu tải lên file hoặc dán văn bản thô đề thi.
    """
    title = serializers.CharField(
        max_length=255,
        required=False,
        default="Phiên nhập đề thi"
    )
    source_type = serializers.ChoiceField(
        choices=ImportSourceType.choices,
        default=ImportSourceType.RAW_TEXT
    )
    file = serializers.FileField(
        required=False,
        allow_null=True
    )
    raw_text = serializers.CharField(
        required=False,
        allow_blank=True,
        default=''
    )
    use_ai = serializers.BooleanField(
        required=False,
        default=False
    )
    quiz_id = serializers.UUIDField(
        required=False,
        allow_null=True
    )

    def validate(self, attrs):
        source_type = attrs.get('source_type', ImportSourceType.RAW_TEXT)
        file = attrs.get('file')
        raw_text = attrs.get('raw_text', '').strip()

        if source_type in [ImportSourceType.DOCX, ImportSourceType.CSV, ImportSourceType.XLSX]:
            if not file and not raw_text:
                raise serializers.ValidationError("Vui lòng tải lên tệp đính kèm hoặc dán nội dung văn bản.")
        elif source_type == ImportSourceType.RAW_TEXT:
            if not raw_text and not file:
                raise serializers.ValidationError("Vui lòng nhập hoặc dán nội dung đề thi dạng văn bản.")

        return attrs


class QuizImportBatchDetailSerializer(serializers.ModelSerializer):
    """
    Serializer chi tiết phiên Import kèm dữ liệu câu hỏi xem trước (Preview Data).
    """
    source_type_display = serializers.CharField(source='get_source_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    teacher_email = serializers.CharField(source='teacher.email', read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True, default=None)

    class Meta:
        model = QuizImportBatch
        fields = [
            'id',
            'title',
            'teacher_email',
            'quiz',
            'quiz_title',
            'source_type',
            'source_type_display',
            'file',
            'raw_text',
            'use_ai',
            'status',
            'status_display',
            'total_parsed',
            'total_imported',
            'parsed_data',
            'error_log',
            'created_at',
            'updated_at'
        ]
        read_only_fields = fields


class ConfirmImportRequestSerializer(serializers.Serializer):
    """
    Serializer cho request xác nhận lưu câu hỏi vào đề thi.
    Giáo viên có thể gửi đè danh sách `questions` đã chỉnh sửa trên UI.
    """
    quiz_id = serializers.UUIDField(
        required=True,
        help_text="ID của đề thi cần import câu hỏi vào"
    )
    questions = ParsedQuestionSerializer(
        many=True,
        required=False,
        allow_null=True,
        help_text="Danh sách câu hỏi tùy chỉnh sau khi xem trước (nếu để trống sẽ dùng parsed_data)"
    )

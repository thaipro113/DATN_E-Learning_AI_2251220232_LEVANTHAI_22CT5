import uuid
from typing import Tuple, Dict, Any, List
from django.db import transaction
from django.db.models import Q
from apps.accounts.models import CustomUser
from .models import Quiz, Question, AnswerOption, QuizType


class QuizService:
    """
    Tầng xử lý nghiệp vụ cho việc Quản lý Đề thi / Bài kiểm tra.
    """

    @staticmethod
    def list_quizzes(user=None, filters: Dict[str, Any] = None):
        """
        Lấy danh sách đề thi kèm bộ lọc đa tiêu chí (Loại đề thi, Trình độ, Khóa học, Tìm kiếm).
        - Học viên/Khách: Chỉ xem được các đề thi đã phát hành (is_published=True).
        - Giáo viên/Admin: Xem được tất cả.
        """
        filters = filters or {}
        queryset = Quiz.objects.select_related('course', 'lesson', 'created_by').prefetch_related('questions')

        is_admin_or_teacher = user and user.is_authenticated and user.role in ['TEACHER', 'ADMIN']
        if not is_admin_or_teacher:
            queryset = queryset.filter(is_published=True)

        quiz_type = filters.get('quiz_type')
        if quiz_type:
            queryset = queryset.filter(quiz_type=quiz_type.upper())

        level = filters.get('level')
        if level:
            queryset = queryset.filter(Q(level=level.upper()) | Q(level='ALL'))

        course_id = filters.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)

        search_query = filters.get('search')
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query)
            )

        return queryset.order_by('-created_at')

    @staticmethod
    def get_quiz_detail(quiz_id: str, user=None) -> Quiz | None:
        """
        Lấy chi tiết đề thi kèm toàn bộ câu hỏi và đáp án.
        """
        try:
            quiz_uuid = uuid.UUID(str(quiz_id))
            quiz = Quiz.objects.select_related('course', 'lesson', 'created_by').prefetch_related(
                'questions__options'
            ).filter(id=quiz_uuid).first()
        except (ValueError, TypeError):
            return None

        if not quiz:
            return None

        is_admin_or_teacher = user and user.is_authenticated and (user.role == 'ADMIN' or quiz.created_by == user)
        if not quiz.is_published and not is_admin_or_teacher:
            return None

        return quiz

    @staticmethod
    def create_quiz(creator: CustomUser, validated_data: dict) -> Quiz:
        """
        Tạo đề thi mới bởi Giáo viên / Admin.
        """
        return Quiz.objects.create(created_by=creator, **validated_data)

    @staticmethod
    def update_quiz(quiz: Quiz, validated_data: dict) -> Quiz:
        """
        Cập nhật thông tin đề thi.
        """
        for attr, value in validated_data.items():
            setattr(quiz, attr, value)
        quiz.save()
        return quiz

    @staticmethod
    def delete_quiz(quiz: Quiz) -> bool:
        """
        Xóa đề thi.
        """
        quiz.delete()
        return True


class QuestionService:
    """
    Tầng xử lý nghiệp vụ cho Ngân hàng Câu hỏi và Lựa chọn Đáp án.
    """

    @staticmethod
    def get_question_by_id(question_id: str) -> Question | None:
        try:
            q_uuid = uuid.UUID(str(question_id))
            return Question.objects.select_related('quiz__created_by').prefetch_related('options').filter(id=q_uuid).first()
        except (ValueError, TypeError):
            return None

    @staticmethod
    def create_question(quiz: Quiz, validated_data: dict) -> Question:
        """
        Tạo câu hỏi mới trong đề thi kèm danh sách các lựa chọn đáp án.
        """
        options_data = validated_data.pop('options', [])

        if not validated_data.get('order_index'):
            last_order = quiz.questions.count()
            validated_data['order_index'] = last_order + 1

        with transaction.atomic():
            question = Question.objects.create(quiz=quiz, **validated_data)

            if options_data:
                options_to_create = []
                for idx, opt in enumerate(options_data, start=1):
                    opt_order = opt.get('order_index') or idx
                    options_to_create.append(
                        AnswerOption(
                            question=question,
                            content=opt['content'],
                            is_correct=opt.get('is_correct', False),
                            order_index=opt_order
                        )
                    )
                AnswerOption.objects.bulk_create(options_to_create)

        return question

    @staticmethod
    def update_question(question: Question, validated_data: dict) -> Question:
        """
        Cập nhật nội dung câu hỏi và danh sách đáp án.
        """
        options_data = validated_data.pop('options', None)

        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(question, attr, value)
            question.save()

            if options_data is not None:
                # Xóa các đáp án cũ và cập nhật lại bộ đáp án mới
                question.options.all().delete()
                options_to_create = [
                    AnswerOption(
                        question=question,
                        content=opt['content'],
                        is_correct=opt.get('is_correct', False),
                        order_index=opt.get('order_index') or idx
                    )
                    for idx, opt in enumerate(options_data, start=1)
                ]
                AnswerOption.objects.bulk_create(options_to_create)

        return question

    @staticmethod
    def delete_question(question: Question) -> bool:
        """
        Xóa câu hỏi và toàn bộ đáp án con liên kết.
        """
        question.delete()
        return True

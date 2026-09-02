import uuid
from typing import Tuple, Dict, Any, List, Optional
from decimal import Decimal
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from apps.accounts.models import CustomUser
from .models import (
    Quiz,
    Question,
    AnswerOption,
    QuizAttempt,
    StudentAnswer,
    QuizType,
    QuestionType,
    AttemptStatus
)


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


class GradingService:
    """
    Tầng xử lý nghiệp vụ cho việc Làm bài thi, Nộp bài và Thuật toán Chấm điểm tự động.
    """

    @staticmethod
    def start_quiz_attempt(student: CustomUser, quiz_id: str) -> Tuple[bool, str, Optional[QuizAttempt], Optional[Quiz]]:
        """
        Học viên bắt đầu làm bài thi:
        - Kiểm tra đề thi có tồn tại và đã phát hành hay chưa.
        - Khởi tạo bản ghi QuizAttempt mới ở trạng thái IN_PROGRESS.
        """
        quiz = QuizService.get_quiz_detail(quiz_id=quiz_id, user=student)
        if not quiz:
            return False, "Không tìm thấy đề thi yêu cầu hoặc đề thi chưa mở.", None, None

        if quiz.total_questions == 0:
            return False, "Đề thi này hiện chưa có câu hỏi nào để làm bài.", None, None

        # Kiểm tra xem học viên có lần thi đang làm dở (IN_PROGRESS) hay không
        active_attempt = QuizAttempt.objects.filter(
            student=student,
            quiz=quiz,
            status=AttemptStatus.IN_PROGRESS
        ).first()

        if active_attempt:
            # Cho phép tiếp tục bài thi đang dở
            return True, "Tiếp tục bài thi đang làm dở.", active_attempt, quiz

        # Tạo lần thi mới
        attempt = QuizAttempt.objects.create(
            student=student,
            quiz=quiz,
            status=AttemptStatus.IN_PROGRESS,
            max_score=Decimal(str(quiz.total_points))
        )

        return True, "Bắt đầu làm bài thi thành công!", attempt, quiz

    @staticmethod
    def submit_quiz_attempt(student: CustomUser, attempt_id: str, answers_data: List[Dict[str, Any]]) -> Tuple[bool, str, Optional[QuizAttempt]]:
        """
        Thuật toán chấm điểm tự động (Automated Grading Algorithm):
        1. Đối chiếu từng câu trả lời của học viên với đáp án chính xác trong CSDL.
        2. Tính điểm theo từng câu và tính tổng điểm toàn bài.
        3. Tính tỷ lệ % đúng và cập nhật trạng thái đỗ/trượt (is_passed).
        """
        try:
            attempt_uuid = uuid.UUID(str(attempt_id))
            attempt = QuizAttempt.objects.select_related('quiz').filter(
                id=attempt_uuid,
                student=student
            ).first()
        except (ValueError, TypeError):
            return False, "Mã lần thi không hợp lệ.", None

        if not attempt:
            return False, "Không tìm thấy lần thi yêu cầu của bạn.", None

        if attempt.status == AttemptStatus.COMPLETED:
            return False, "Lần thi này đã được nộp bài và chấm điểm trước đó.", attempt

        quiz = attempt.quiz
        questions = quiz.questions.prefetch_related('options').all()

        # Tạo dictionary tra cứu câu trả lời của học viên: {str(question_id): answer_item}
        submission_dict = {}
        for item in answers_data:
            q_id_str = str(item.get('question_id'))
            submission_dict[q_id_str] = item

        total_score_earned = Decimal('0.00')
        max_possible_score = Decimal('0.00')
        student_answers_to_create = []

        with transaction.atomic():
            for question in questions:
                max_possible_score += question.points
                q_id_str = str(question.id)
                student_sub = submission_dict.get(q_id_str)

                is_correct = False
                score_earned = Decimal('0.00')
                selected_option = None
                text_answer = ''

                if student_sub:
                    opt_id = student_sub.get('selected_option_id')
                    text_answer = student_sub.get('text_answer', '').strip()

                    # 1. Chấm câu hỏi trắc nghiệm (Single choice / True False)
                    if question.question_type in [QuestionType.SINGLE_CHOICE, QuestionType.TRUE_FALSE] and opt_id:
                        opt_str = str(opt_id).strip().lower()
                        selected_option = next((opt for opt in question.options.all() if str(opt.id).lower() == opt_str or opt.content.strip().lower() == opt_str), None)
                        if selected_option and selected_option.is_correct:
                            is_correct = True
                            score_earned = question.points

                    # 2. Chấm câu hỏi điền từ (Fill in the blank)
                    elif question.question_type == QuestionType.FILL_IN_THE_BLANK and text_answer:
                        correct_options = [opt.content.strip().lower() for opt in question.options.all() if opt.is_correct]
                        if text_answer.lower() in correct_options:
                            is_correct = True
                            score_earned = question.points

                    # 3. Chấm câu hỏi trắc nghiệm nhiều đáp án (Multiple Choice)
                    elif question.question_type == QuestionType.MULTIPLE_CHOICE and opt_id:
                        opt_str = str(opt_id).strip().lower()
                        selected_option = next((opt for opt in question.options.all() if str(opt.id).lower() == opt_str or opt.content.strip().lower() == opt_str), None)
                        if selected_option and selected_option.is_correct:
                            is_correct = True
                            score_earned = question.points

                total_score_earned += score_earned

                student_answers_to_create.append(
                    StudentAnswer(
                        attempt=attempt,
                        question=question,
                        selected_option=selected_option,
                        text_answer=text_answer,
                        is_correct=is_correct,
                        score_earned=score_earned
                    )
                )

            # Xóa các câu trả lời cũ nếu có và lưu toàn bộ câu trả lời mới
            attempt.student_answers.all().delete()
            StudentAnswer.objects.bulk_create(student_answers_to_create)

            # Cập nhật kết quả lần thi
            percentage = Decimal('0.00')
            if max_possible_score > 0:
                percentage = Decimal(str(round((total_score_earned / max_possible_score) * 100, 2)))

            is_passed = bool(percentage >= quiz.passing_score)

            attempt.score = total_score_earned
            attempt.max_score = max_possible_score
            attempt.percentage = percentage
            attempt.is_passed = is_passed
            attempt.status = AttemptStatus.COMPLETED
            attempt.completed_at = timezone.now()
            attempt.save()

        return True, "Nộp bài và chấm điểm thành công!", attempt

    @staticmethod
    def get_attempt_results(user: CustomUser, attempt_id: str) -> Optional[QuizAttempt]:
        """
        Lấy chi tiết bảng điểm và lời giải thích của lần thi.
        - Học viên: Chỉ xem được lần thi của chính mình.
        - Giáo viên/Admin: Xem được của tất cả học viên.
        """
        try:
            attempt_uuid = uuid.UUID(str(attempt_id))
            queryset = QuizAttempt.objects.select_related('quiz', 'student').prefetch_related(
                'student_answers__question__options',
                'student_answers__selected_option'
            )

            if user.role != 'ADMIN' and user.role != 'TEACHER':
                queryset = queryset.filter(student=user)

            return queryset.filter(id=attempt_uuid).first()
        except (ValueError, TypeError):
            return None

    @staticmethod
    def list_student_attempts(student: CustomUser, filters: Dict[str, Any] = None):
        """
        Lấy danh sách lịch sử thi của học viên.
        """
        filters = filters or {}
        queryset = QuizAttempt.objects.filter(student=student).select_related('quiz')

        quiz_id = filters.get('quiz_id')
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)

        is_passed = filters.get('is_passed')
        if is_passed is not None:
            queryset = queryset.filter(is_passed=(is_passed.lower() == 'true'))

        return queryset.order_by('-started_at')

from decimal import Decimal
from django.test import TestCase
from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.assessments.models import (
    Quiz,
    Question,
    AnswerOption,
    QuizAttempt,
    QuizType,
    QuestionType,
    SkillType,
    AttemptStatus
)
from apps.assessments.services import QuizService, QuestionService, GradingService


class AssessmentServicesTest(TestCase):
    """
    Bộ kiểm thử nghiệp vụ cho QuizService, QuestionService và GradingService.
    """

    def setUp(self):
        self.teacher = CustomUser.objects.create_user(
            email='teacher.svc@example.com',
            password='Password123!',
            full_name='Teacher Svc',
            role=UserRole.TEACHER
        )
        self.student = CustomUser.objects.create_user(
            email='student.svc@example.com',
            password='Password123!',
            full_name='Student Svc',
            role=UserRole.STUDENT
        )

        # Tạo đề thi mẫu
        self.quiz = Quiz.objects.create(
            title="Grammar Assessment Test",
            quiz_type=QuizType.PLACEMENT,
            level=EnglishLevel.B1,
            time_limit_minutes=30,
            passing_score=Decimal('50.00'),
            is_published=True,
            created_by=self.teacher
        )

        # Câu 1: Single Choice (2.0 điểm)
        self.q1 = Question.objects.create(
            quiz=self.quiz,
            content="Choose the correct verb: He ___ football yesterday.",
            question_type=QuestionType.SINGLE_CHOICE,
            skill=SkillType.GRAMMAR,
            points=Decimal('2.00'),
            order_index=1
        )
        self.q1_opt_correct = AnswerOption.objects.create(
            question=self.q1,
            content="played",
            is_correct=True,
            order_index=1
        )
        self.q1_opt_wrong = AnswerOption.objects.create(
            question=self.q1,
            content="plays",
            is_correct=False,
            order_index=2
        )

        # Câu 2: Fill in the blank (3.0 điểm)
        self.q2 = Question.objects.create(
            quiz=self.quiz,
            content="Complete the word: The sun rises in the ___.",
            question_type=QuestionType.FILL_IN_THE_BLANK,
            skill=SkillType.VOCABULARY,
            points=Decimal('3.00'),
            order_index=2
        )
        self.q2_opt_correct = AnswerOption.objects.create(
            question=self.q2,
            content="east",
            is_correct=True,
            order_index=1
        )

    def test_quiz_service_list_and_filters(self):
        """
        Kiểm tra lấy danh sách đề thi kèm bộ lọc và ẩn đề chưa phát hành.
        """
        Quiz.objects.create(
            title="Unpublished Practice Quiz",
            is_published=False,
            created_by=self.teacher
        )

        # Học viên chỉ thấy 1 đề đã phát hành
        student_quizzes = QuizService.list_quizzes(user=self.student)
        self.assertEqual(student_quizzes.count(), 1)

        # Giáo viên thấy cả 2 đề
        teacher_quizzes = QuizService.list_quizzes(user=self.teacher)
        self.assertEqual(teacher_quizzes.count(), 2)

        # Lọc theo quiz_type
        placement_quizzes = QuizService.list_quizzes(user=self.student, filters={'quiz_type': 'PLACEMENT'})
        self.assertEqual(placement_quizzes.count(), 1)

    def test_question_service_create_with_options(self):
        """
        Kiểm tra QuestionService tự động tạo câu hỏi và các lựa chọn đáp án liên quan.
        """
        data = {
            'content': "Water boils at 100 degrees Celsius.",
            'question_type': QuestionType.TRUE_FALSE,
            'skill': SkillType.READING,
            'points': Decimal('1.50'),
            'options': [
                {'content': 'True', 'is_correct': True, 'order_index': 1},
                {'content': 'False', 'is_correct': False, 'order_index': 2}
            ]
        }

        question = QuestionService.create_question(quiz=self.quiz, validated_data=data)
        self.assertEqual(question.order_index, 3)  # Tự tăng lên 3
        self.assertEqual(question.options.count(), 2)
        self.assertTrue(question.options.filter(content='True', is_correct=True).exists())

    def test_grading_service_start_and_resume_attempt(self):
        """
        Kiểm tra bắt đầu lần thi mới và khôi phục lần thi đang làm dở (Resume).
        """
        success, msg, attempt1, _ = GradingService.start_quiz_attempt(
            student=self.student,
            quiz_id=str(self.quiz.id)
        )
        self.assertTrue(success)
        self.assertEqual(attempt1.status, AttemptStatus.IN_PROGRESS)

        # Gọi start lại khi lần 1 đang dở -> trả về đúng attempt1
        success, msg, attempt2, _ = GradingService.start_quiz_attempt(
            student=self.student,
            quiz_id=str(self.quiz.id)
        )
        self.assertTrue(success)
        self.assertEqual(attempt1.id, attempt2.id)

    def test_grading_service_submit_and_automated_grading(self):
        """
        Kiểm tra nộp bài, thuật toán chấm điểm tự động, tính % và đánh giá đỗ/trượt.
        Tổng điểm đề thi: 2.0 (câu 1) + 3.0 (câu 2) = 5.0 điểm.
        Điểm đạt yêu cầu: 50.00%.
        """
        # 1. Bắt đầu lần thi
        _, _, attempt, _ = GradingService.start_quiz_attempt(
            student=self.student,
            quiz_id=str(self.quiz.id)
        )

        # 2. Học viên trả lời đúng câu 1 (2.0đ), đúng câu 2 (3.0đ) -> 5.0/5.0đ = 100%
        answers_payload = [
            {
                'question_id': str(self.q1.id),
                'selected_option_id': str(self.q1_opt_correct.id)
            },
            {
                'question_id': str(self.q2.id),
                'text_answer': "East"  # Viết hoa chữ cái đầu -> thuật toán so sánh case-insensitive
            }
        ]

        success, msg, graded_attempt = GradingService.submit_quiz_attempt(
            student=self.student,
            attempt_id=str(attempt.id),
            answers_data=answers_payload
        )

        self.assertTrue(success)
        self.assertEqual(graded_attempt.status, AttemptStatus.COMPLETED)
        self.assertEqual(graded_attempt.score, Decimal('5.00'))
        self.assertEqual(graded_attempt.max_score, Decimal('5.00'))
        self.assertEqual(graded_attempt.percentage, Decimal('100.00'))
        self.assertTrue(graded_attempt.is_passed)
        self.assertEqual(graded_attempt.student_answers.count(), 2)

    def test_grading_service_partial_score_and_failed_attempt(self):
        """
        Kiểm tra trường hợp học viên làm sai 1 câu dẫn đến không đủ điểm qua môn.
        """
        _, _, attempt, _ = GradingService.start_quiz_attempt(
            student=self.student,
            quiz_id=str(self.quiz.id)
        )

        # Trả lời sai câu 1, đúng câu 2 -> Được 3.0/5.0đ = 60.0% -> Đỗ (vì passing_score là 50%)
        answers_payload = [
            {
                'question_id': str(self.q1.id),
                'selected_option_id': str(self.q1_opt_wrong.id)
            },
            {
                'question_id': str(self.q2.id),
                'text_answer': "Wrong Answer"
            }
        ]

        success, msg, graded_attempt = GradingService.submit_quiz_attempt(
            student=self.student,
            attempt_id=str(attempt.id),
            answers_data=answers_payload
        )

        self.assertTrue(success)
        self.assertEqual(graded_attempt.score, Decimal('0.00'))
        self.assertEqual(graded_attempt.percentage, Decimal('0.00'))
        self.assertFalse(graded_attempt.is_passed)

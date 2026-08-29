from decimal import Decimal
from django.test import TestCase
from django.db.utils import IntegrityError
from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.assessments.models import (
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


class AssessmentModelsTest(TestCase):
    """
    Bộ kiểm thử cho các Models trong apps/assessments.
    """

    def setUp(self):
        self.teacher = CustomUser.objects.create_user(
            email='teacher.assessments@example.com',
            password='SecurePassword123!',
            full_name='Teacher Test',
            role=UserRole.TEACHER
        )
        self.student = CustomUser.objects.create_user(
            email='student.assessments@example.com',
            password='SecurePassword123!',
            full_name='Student Test',
            role=UserRole.STUDENT
        )

    def test_quiz_creation_and_properties(self):
        """
        Kiểm tra khởi tạo Quiz, các giá trị mặc định và thuộc tính động total_questions, total_points.
        """
        quiz = Quiz.objects.create(
            title="IELTS Placement Test A1-B1",
            quiz_type=QuizType.PLACEMENT,
            level=EnglishLevel.B1,
            time_limit_minutes=45,
            passing_score=Decimal('60.00'),
            created_by=self.teacher
        )

        self.assertEqual(quiz.title, "IELTS Placement Test A1-B1")
        self.assertEqual(quiz.quiz_type, QuizType.PLACEMENT)
        self.assertTrue(quiz.is_published)
        self.assertEqual(quiz.total_questions, 0)
        self.assertEqual(quiz.total_points, 0.0)

        # Thêm 2 câu hỏi
        q1 = Question.objects.create(
            quiz=quiz,
            content="She ___ to school every day.",
            question_type=QuestionType.SINGLE_CHOICE,
            skill=SkillType.GRAMMAR,
            points=Decimal('2.00'),
            order_index=1
        )
        q2 = Question.objects.create(
            quiz=quiz,
            content="Listen to the audio and choose the correct answer.",
            question_type=QuestionType.SINGLE_CHOICE,
            skill=SkillType.LISTENING,
            points=Decimal('3.00'),
            order_index=2
        )

        self.assertEqual(quiz.total_questions, 2)
        self.assertEqual(quiz.total_points, 5.0)

    def test_question_unique_together_constraint(self):
        """
        Kiểm tra ràng buộc unique_together = ('quiz', 'order_index') để không bị trùng số thứ tự.
        """
        quiz = Quiz.objects.create(
            title="Grammar Practice 1",
            created_by=self.teacher
        )

        Question.objects.create(
            quiz=quiz,
            content="Question 1",
            order_index=1
        )

        with self.assertRaises(IntegrityError):
            Question.objects.create(
                quiz=quiz,
                content="Question 1 Duplicate Order",
                order_index=1
            )

    def test_answer_options_and_quiz_attempt_flow(self):
        """
        Kiểm tra AnswerOption và bản ghi QuizAttempt cùng StudentAnswer.
        """
        quiz = Quiz.objects.create(
            title="Quick Vocabulary Quiz",
            created_by=self.teacher
        )
        question = Question.objects.create(
            quiz=quiz,
            content="What is the synonym of 'Enormous'?",
            points=Decimal('1.00'),
            order_index=1
        )

        opt_correct = AnswerOption.objects.create(
            question=question,
            content="Huge",
            is_correct=True,
            order_index=1
        )
        opt_wrong = AnswerOption.objects.create(
            question=question,
            content="Tiny",
            is_correct=False,
            order_index=2
        )

        self.assertTrue(opt_correct.is_correct)
        self.assertFalse(opt_wrong.is_correct)

        # Tạo lần thi
        attempt = QuizAttempt.objects.create(
            student=self.student,
            quiz=quiz,
            status=AttemptStatus.COMPLETED,
            score=Decimal('1.00'),
            max_score=Decimal('1.00'),
            percentage=Decimal('100.00'),
            is_passed=True
        )

        student_ans = StudentAnswer.objects.create(
            attempt=attempt,
            question=question,
            selected_option=opt_correct,
            is_correct=True,
            score_earned=Decimal('1.00')
        )

        self.assertEqual(attempt.student_answers.count(), 1)
        self.assertTrue(student_ans.is_correct)
        self.assertEqual(student_ans.score_earned, Decimal('1.00'))

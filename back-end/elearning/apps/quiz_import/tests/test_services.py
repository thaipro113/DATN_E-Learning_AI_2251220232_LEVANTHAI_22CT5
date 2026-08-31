from django.test import TestCase
from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.assessments.models import (
    Quiz,
    Question,
    AnswerOption,
    QuizType,
    QuestionType,
    SkillType
)
from apps.quiz_import.models import QuizImportBatch, ImportSourceType, BatchStatus
from apps.quiz_import.services import QuizImportService


class QuizImportServiceTest(TestCase):
    """
    Bộ kiểm thử cho QuizImportService.
    """

    def setUp(self):
        self.teacher = CustomUser.objects.create_user(
            email='teacher.import.svc@example.com',
            password='Password123!',
            full_name='Teacher Import Svc',
            role=UserRole.TEACHER
        )
        self.other_user = CustomUser.objects.create_user(
            email='student.import.svc@example.com',
            password='Password123!',
            full_name='Student Import Svc',
            role=UserRole.STUDENT
        )
        self.quiz = Quiz.objects.create(
            title="Grammar Final Test",
            quiz_type=QuizType.PRACTICE,
            level=EnglishLevel.B1,
            passing_score=70.0,
            is_published=True
        )

    def test_create_and_parse_batch_from_raw_text(self):
        """
        Kiểm tra QuizImportService tạo batch và bóc tách câu hỏi từ văn bản thô.
        """
        raw_text = """
        1. She is fond of ___ books.
        A. read
        *B. reading
        C. reads
        D. to read
        Answer: B
        Skill: GRAMMAR
        """
        batch = QuizImportService.create_and_parse_batch(
            teacher=self.teacher,
            title="Batch Raw Text Test",
            source_type=ImportSourceType.RAW_TEXT,
            raw_text=raw_text
        )

        self.assertEqual(batch.status, BatchStatus.PARSED)
        self.assertEqual(batch.total_parsed, 1)
        self.assertEqual(len(batch.parsed_data), 1)
        self.assertEqual(batch.parsed_data[0]['options'][1]['content'], "reading")
        self.assertTrue(batch.parsed_data[0]['options'][1]['is_correct'])

    def test_confirm_and_import_to_quiz_atomic(self):
        """
        Kiểm tra confirm_and_import_to_quiz chèn Question và AnswerOption vào CSDL.
        """
        raw_text = """
        1. Question One?
        *A. Answer A
        B. Answer B
        Answer: A

        2. Question Two?
        A. Answer A
        *B. Answer B
        Answer: B
        """
        batch = QuizImportService.create_and_parse_batch(
            teacher=self.teacher,
            title="Batch Confirm Test",
            source_type=ImportSourceType.RAW_TEXT,
            raw_text=raw_text
        )

        self.assertEqual(self.quiz.questions.count(), 0)

        success, msg, count = QuizImportService.confirm_and_import_to_quiz(
            user=self.teacher,
            batch_id=str(batch.id),
            quiz_id=str(self.quiz.id)
        )

        self.assertTrue(success)
        self.assertEqual(count, 2)
        self.assertEqual(self.quiz.questions.count(), 2)

        # Kiểm tra chi tiết Question và AnswerOption
        q1 = self.quiz.questions.first()
        self.assertEqual(q1.options.count(), 2)
        self.assertEqual(q1.order_index, 1)

        batch.refresh_from_db()
        self.assertEqual(batch.status, BatchStatus.IMPORTED)
        self.assertEqual(batch.total_imported, 2)

    def test_confirm_import_permission_check(self):
        """
        Kiểm tra người dùng không phải chủ batch bị từ chối xác nhận import.
        """
        batch = QuizImportBatch.objects.create(
            teacher=self.teacher,
            title="Private Batch",
            source_type=ImportSourceType.RAW_TEXT,
            status=BatchStatus.PARSED,
            parsed_data=[{'content': 'Test?', 'options': [{'content': 'A', 'is_correct': True}]}]
        )

        success, msg, count = QuizImportService.confirm_and_import_to_quiz(
            user=self.other_user,
            batch_id=str(batch.id),
            quiz_id=str(self.quiz.id)
        )
        self.assertFalse(success)
        self.assertEqual(count, 0)
        self.assertIn("không có quyền", msg)

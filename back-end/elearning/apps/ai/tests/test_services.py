from django.test import TestCase
from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.courses.models import Category, Course, Chapter, Lesson
from apps.learning.models import Enrollment, LessonProgress
from apps.assessments.models import Quiz, QuizType
from apps.ai.models import ChatSession, ChatMessage, SessionType, MessageSenderType
from apps.ai.services import AIService, AIQuizService


class AIServicesTest(TestCase):
    """
    Bộ kiểm thử cho AIService, AIQuizService và AI LLM Engine.
    """

    def setUp(self):
        self.student = CustomUser.objects.create_user(
            email='student.ai.svc@example.com',
            password='Password123!',
            full_name='Student AI Svc',
            role=UserRole.STUDENT,
            level=EnglishLevel.B1
        )
        self.teacher = CustomUser.objects.create_user(
            email='teacher.ai.svc@example.com',
            password='Password123!',
            full_name='Teacher AI Svc',
            role=UserRole.TEACHER,
            level=EnglishLevel.C1
        )

        self.session = AIService.create_session(
            student=self.student,
            validated_data={
                'title': "Daily English Conversation",
                'session_type': SessionType.GENERAL,
                'target_level': EnglishLevel.B1
            }
        )

        # Tạo cấu trúc khóa học & chương học & bài học
        self.category = Category.objects.create(name='Grammar Category')
        self.course = Course.objects.create(
            category=self.category,
            teacher=self.teacher,
            title='English Mastery B1',
            level=EnglishLevel.B1,
            status='PUBLISHED'
        )
        self.chapter = Chapter.objects.create(course=self.course, title='Chapter 1: Past Tenses', order_index=1)
        self.lesson1 = Lesson.objects.create(chapter=self.chapter, title='Lesson 1: Past Simple', order_index=1)
        self.lesson2 = Lesson.objects.create(chapter=self.chapter, title='Lesson 2: Past Continuous', order_index=2)

    def test_session_lifecycle(self):
        """
        Kiểm tra khởi tạo, lấy danh sách, chi tiết và xóa phiên trò chuyện.
        """
        # Danh sách
        sessions = AIService.list_student_sessions(student=self.student)
        self.assertEqual(sessions.count(), 1)

        # Chi tiết
        detail = AIService.get_session_detail(user=self.student, session_id=str(self.session.id))
        self.assertIsNotNone(detail)
        self.assertEqual(detail.title, "Daily English Conversation")

        # Xóa
        deleted = AIService.delete_session(user=self.student, session_id=str(self.session.id))
        self.assertTrue(deleted)
        self.assertEqual(AIService.list_student_sessions(student=self.student).count(), 0)

    def test_send_message_and_ai_reply_interaction(self):
        """
        Kiểm tra luồng gửi tin nhắn đến AI Tutor và nhận phản hồi có phân tích lỗi ngữ pháp.
        """
        user_text = "I go to school yesterday and I study hard."

        success, msg, user_msg, ai_msg = AIService.send_message_and_get_ai_reply(
            student=self.student,
            session_id=str(self.session.id),
            content=user_text
        )

        self.assertTrue(success)
        self.assertIsNotNone(user_msg)
        self.assertIsNotNone(ai_msg)

        # Kiểm tra tin nhắn người dùng
        self.assertEqual(user_msg.sender_type, MessageSenderType.USER)
        self.assertEqual(user_msg.content, user_text)

        # Kiểm tra tin nhắn AI
        self.assertEqual(ai_msg.sender_type, MessageSenderType.AI)
        self.assertTrue(len(ai_msg.content) > 0)
        self.assertTrue(ai_msg.token_count > 0)

        # Kiểm tra session cập nhật
        self.assertEqual(self.session.messages.count(), 2)

    def test_check_grammar_text_service(self):
        """
        Kiểm tra API phân tích ngữ pháp với câu có lỗi sai và câu đúng hoàn toàn.
        """
        # 1. Câu có lỗi thì quá khứ (go vs went)
        result_with_error = AIService.check_grammar_text(
            text="I go to school yesterday.",
            target_level='B1'
        )
        self.assertTrue(result_with_error['has_errors'])
        self.assertTrue(result_with_error['errors_count'] > 0)
        self.assertEqual(result_with_error['errors'][0]['correction'], 'went')
        self.assertIn('went', result_with_error['corrected_text'])

        # 2. Câu đúng ngữ pháp
        result_clean = AIService.check_grammar_text(
            text="I went to the library this morning.",
            target_level='B1'
        )
        self.assertFalse(result_clean['has_errors'])
        self.assertEqual(result_clean['errors_count'], 0)

    def test_generate_quiz_for_teacher(self):
        """
        Kiểm tra Giáo viên sinh câu hỏi trắc nghiệm theo chủ đề bằng AI.
        """
        success, msg, questions = AIQuizService.generate_quiz_for_teacher(
            teacher=self.teacher,
            topic='Past Tenses and Irregular Verbs',
            level='B1',
            count=5,
            skill='GRAMMAR'
        )
        self.assertTrue(success)
        self.assertEqual(len(questions), 5)
        for q in questions:
            self.assertIn('content', q)
            self.assertIn('options', q)
            self.assertEqual(len(q['options']), 4)
            # Phải có ít nhất 1 đáp án đúng
            has_correct = any(opt['is_correct'] for opt in q['options'])
            self.assertTrue(has_correct)

    def test_generate_practice_quiz_by_progress(self):
        """
        Kiểm tra Học viên sinh đề ôn tập AI dựa trên các bài học đã hoàn thành.
        """
        # 1. Chưa ghi danh -> Báo lỗi
        success, msg, quiz = AIQuizService.generate_practice_quiz_by_progress(
            student=self.student,
            chapter_id=str(self.chapter.id)
        )
        self.assertFalse(success)
        self.assertIn("chưa ghi danh", msg)

        # 2. Đã ghi danh nhưng chưa học xong bài nào -> Báo lỗi
        enrollment = Enrollment.objects.create(student=self.student, course=self.course)
        success, msg, quiz = AIQuizService.generate_practice_quiz_by_progress(
            student=self.student,
            chapter_id=str(self.chapter.id)
        )
        self.assertFalse(success)
        self.assertIn("chưa hoàn thành bài học nào", msg)

        # 3. Đã học xong Lesson 1 -> Sinh đề thành công
        LessonProgress.objects.create(
            enrollment=enrollment,
            lesson=self.lesson1,
            is_completed=True
        )

        success, msg, quiz = AIQuizService.generate_practice_quiz_by_progress(
            student=self.student,
            chapter_id=str(self.chapter.id),
            num_questions=5
        )
        self.assertTrue(success)
        self.assertIsNotNone(quiz)
        self.assertEqual(quiz.quiz_type, QuizType.PRACTICE)
        self.assertEqual(quiz.course, self.course)
        self.assertEqual(quiz.created_by, self.student)
        self.assertTrue(quiz.total_questions >= 3)
        self.assertTrue(quiz.is_published)


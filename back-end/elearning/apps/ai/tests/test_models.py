from django.test import TestCase
from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.ai.models import ChatSession, ChatMessage, SessionType, MessageSenderType


class AIModelsTest(TestCase):
    """
    Bộ kiểm thử cho các Models trong apps/ai.
    """

    def setUp(self):
        self.student = CustomUser.objects.create_user(
            email='student.ai.model@example.com',
            password='Password123!',
            full_name='Student AI Model',
            role=UserRole.STUDENT
        )

    def test_chat_session_creation_and_properties(self):
        """
        Kiểm tra khởi tạo ChatSession, các giá trị mặc định và thuộc tính động total_messages.
        """
        session = ChatSession.objects.create(
            student=self.student,
            title="IELTS Speaking Part 2 Practice",
            session_type=SessionType.ROLEPLAY,
            target_level=EnglishLevel.B2
        )

        self.assertEqual(session.title, "IELTS Speaking Part 2 Practice")
        self.assertEqual(session.session_type, SessionType.ROLEPLAY)
        self.assertEqual(session.target_level, EnglishLevel.B2)
        self.assertTrue(session.is_active)
        self.assertEqual(session.total_messages, 0)

        # Tạo tin nhắn cho session
        msg1 = ChatMessage.objects.create(
            session=session,
            sender_type=MessageSenderType.USER,
            content="Hello AI Tutor, let's practice speaking about technology."
        )
        msg2 = ChatMessage.objects.create(
            session=session,
            sender_type=MessageSenderType.AI,
            content="Sure! Describe a piece of technology you find useful.",
            token_count=45,
            model_used='gemini-1.5-flash'
        )

        self.assertEqual(session.total_messages, 2)
        self.assertEqual(msg1.sender_type, MessageSenderType.USER)
        self.assertEqual(msg2.sender_type, MessageSenderType.AI)

    def test_chat_message_grammar_corrections_json(self):
        """
        Kiểm tra ChatMessage lưu trữ JSON phân tích lỗi ngữ pháp.
        """
        session = ChatSession.objects.create(
            student=self.student,
            title="Grammar Check Test",
            session_type=SessionType.GRAMMAR_CHECK
        )

        grammar_data = {
            'has_errors': True,
            'original_text': 'I go to school yesterday',
            'corrected_text': 'I went to school yesterday',
            'errors': [
                {
                    'error_segment': 'go',
                    'correction': 'went',
                    'error_type': 'Verb Tense',
                    'explanation_vi': 'Quá khứ đơn'
                }
            ]
        }

        ai_msg = ChatMessage.objects.create(
            session=session,
            sender_type=MessageSenderType.AI,
            content="Here is your grammar correction.",
            grammar_corrections=grammar_data
        )

        self.assertTrue(ai_msg.grammar_corrections['has_errors'])
        self.assertEqual(ai_msg.grammar_corrections['errors'][0]['correction'], 'went')

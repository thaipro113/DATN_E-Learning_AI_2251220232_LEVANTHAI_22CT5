from django.test import TestCase
from apps.assessments.models import SkillType, QuestionType
from apps.quiz_import.parsers import (
    RawTextQuizParser,
    CSVQuizParser,
    DocxQuizParser,
    AIQuizExtractionParser
)


class QuizParsersTest(TestCase):
    """
    Bộ kiểm thử cho các Parser Engine trong apps/quiz_import.
    """

    def test_raw_text_parser_standard_format(self):
        """
        Kiểm tra RawTextQuizParser bóc tách văn bản chuẩn có Answer và Explanation.
        """
        raw_text = """
        1. What is the capital of the United Kingdom?
        A. Paris
        B. Berlin
        *C. London
        D. Madrid
        Answer: C
        Explanation: London is the capital city of the UK.
        Skill: VOCABULARY

        2. Which word is an adjective?
        A. Quickly
        B. Beautiful
        C. Run
        D. Happiness
        Answer: B
        Skill: GRAMMAR
        """
        parser = RawTextQuizParser()
        questions = parser.parse(raw_text)

        self.assertEqual(len(questions), 2)

        # Câu 1
        q1 = questions[0]
        self.assertIn("capital of the United Kingdom", q1['content'])
        self.assertEqual(q1['skill'], SkillType.VOCABULARY)
        self.assertEqual(q1['explanation'], "London is the capital city of the UK.")
        self.assertEqual(len(q1['options']), 4)
        correct_opts_1 = [o for o in q1['options'] if o['is_correct']]
        self.assertEqual(len(correct_opts_1), 1)
        self.assertEqual(correct_opts_1[0]['content'], "London")

        # Câu 2
        q2 = questions[1]
        self.assertIn("Which word is an adjective", q2['content'])
        self.assertEqual(q2['skill'], SkillType.GRAMMAR)
        correct_opts_2 = [o for o in q2['options'] if o['is_correct']]
        self.assertEqual(len(correct_opts_2), 1)
        self.assertEqual(correct_opts_2[0]['content'], "Beautiful")

    def test_csv_parser(self):
        """
        Kiểm tra CSVQuizParser bóc tách dữ liệu từ chuỗi CSV.
        """
        csv_text = """Question,Option A,Option B,Option C,Option D,Correct Answer,Explanation,Skill,Points
"He ___ to school yesterday.","goes","went","gone","going","B","Past simple tense","GRAMMAR",10.0
"Choose the synonym for 'smart':","clever","slow","lazy","clumsy","A","Clever means intelligent","VOCABULARY",10.0"""

        parser = CSVQuizParser()
        questions = parser.parse(csv_text)

        self.assertEqual(len(questions), 2)
        self.assertEqual(questions[0]['content'], "He ___ to school yesterday.")
        self.assertEqual(questions[0]['options'][1]['content'], "went")
        self.assertTrue(questions[0]['options'][1]['is_correct'])
        self.assertEqual(questions[1]['skill'], SkillType.VOCABULARY)

    def test_ai_extraction_parser_fallback(self):
        """
        Kiểm tra AIQuizExtractionParser hoạt động và bóc tách định dạng tự do.
        """
        text = """
        Question 1: The weather is very nice today.
        A. True
        B. False
        Answer: A
        """
        parser = AIQuizExtractionParser()
        questions = parser.parse(text)
        self.assertTrue(len(questions) > 0)
        self.assertIn("weather", questions[0]['content'])

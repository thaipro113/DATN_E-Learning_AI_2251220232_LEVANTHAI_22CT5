import re
import csv
import io
import json
import zipfile
import xml.etree.ElementTree as ET
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

from apps.assessments.models import QuestionType, SkillType
from apps.ai.llm_client import get_llm_provider

logger = logging.getLogger(__name__)


AI_QUIZ_EXTRACTOR_SYSTEM_PROMPT = """
Bạn là Chuyên gia Số hóa Đề thi Tiếng Anh (English Quiz Digitizer & Parser Expert).
Nhiệm vụ của bạn là đọc và phân tích văn bản đề thi tiếng Anh (có thể ở dạng thô, không theo quy chuẩn cố định), bóc tách tất cả các câu hỏi và các phương án trả lời thành một mảng JSON chuẩn.

Các giá trị hợp lệ:
- question_type: "SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_THE_BLANK"
- skill: "LISTENING", "READING", "WRITING", "SPEAKING", "GRAMMAR", "VOCABULARY"

Định dạng JSON bắt buộc:
[
  {
    "content": "Nội dung câu hỏi đầy đủ",
    "question_type": "SINGLE_CHOICE",
    "skill": "GRAMMAR",
    "points": 10.0,
    "explanation": "Giải thích chi tiết đáp án đúng (nếu có)",
    "options": [
      {"content": "Nội dung đáp án A", "is_correct": false},
      {"content": "Nội dung đáp án B (đúng)", "is_correct": true},
      {"content": "Nội dung đáp án C", "is_correct": false},
      {"content": "Nội dung đáp án D", "is_correct": false}
    ]
  }
]

LƯU Ý: Chỉ trả về mảng JSON hợp lệ, không có bất kỳ văn bản giải thích nào ngoài khối JSON.
"""


class BaseQuizParser(ABC):
    """
    Interface cơ sở cho các bộ phân tích đề thi.
    """

    @abstractmethod
    def parse(self, raw_input: Any) -> List[Dict[str, Any]]:
        """
        Phân tích đầu vào và trả về danh sách câu hỏi chuẩn hóa (List of Question dicts).
        """
        pass


class RawTextQuizParser(BaseQuizParser):
    """
    Bộ phân tích cú pháp biểu thức chính quy (Regex Rule-based Parser) cho văn bản đề thi.
    Hỗ trợ nhận diện các định dạng:
    1. Câu hỏi...?
    A. Đáp án 1
    B. Đáp án 2
    *C. Đáp án đúng
    D. Đáp án 4
    Answer / Đáp án: C
    Explanation / Giải thích: Lý do đúng
    """

    def parse(self, text: str) -> List[Dict[str, Any]]:
        if not text or not text.strip():
            return []

        questions = []
        # Tách các khối câu hỏi dựa trên số thứ tự câu (VD: "1.", "Câu 1:", "Question 1:")
        raw_blocks = re.split(r'\n(?=(?:Câu\s*\d+[:.]|\d+[:.]|Question\s*\d+[:.]))\s*', text.strip())

        for block in raw_blocks:
            if not block.strip():
                continue

            parsed_q = self._parse_single_block(block.strip())
            if parsed_q:
                questions.append(parsed_q)

        return questions

    def _parse_single_block(self, block: str) -> Optional[Dict[str, Any]]:
        lines = [line.strip() for line in block.split('\n') if line.strip()]
        if not lines:
            return None

        # 1. Trích xuất dòng câu hỏi đầu tiên
        first_line = lines[0]
        # Loại bỏ tiền tố "1.", "Câu 1:", "Question 1."
        q_content = re.sub(r'^(?:Câu\s*\d+[:.]|\d+[:.]|Question\s*\d+[:.])\s*', '', first_line).strip()

        options = []
        explanation = ""
        skill = SkillType.GRAMMAR
        q_type = QuestionType.SINGLE_CHOICE
        points = 10.0
        specified_answer_char = None

        # 2. Quét qua các dòng tiếp theo
        for line in lines[1:]:
            # Nhận diện dòng Đáp án đúng: "Answer: A" hoặc "Đáp án: B"
            ans_match = re.match(r'^(?:Answer|Đáp án|Key)\s*[:=]\s*([A-Za-z0-9,\s]+)', line, re.IGNORECASE)
            if ans_match:
                specified_answer_char = ans_match.group(1).strip().upper()
                continue

            # Nhận diện dòng Giải thích: "Explanation: ..." hoặc "Giải thích: ..."
            exp_match = re.match(r'^(?:Explanation|Giải thích|Note)\s*[:=]\s*(.+)', line, re.IGNORECASE)
            if exp_match:
                explanation = exp_match.group(1).strip()
                continue

            # Nhận diện dòng Kỹ năng: "Skill: LISTENING"
            skill_match = re.match(r'^Skill\s*[:=]\s*(\w+)', line, re.IGNORECASE)
            if skill_match:
                found_skill = skill_match.group(1).upper()
                if found_skill in SkillType.values:
                    skill = found_skill
                continue

            # Nhận diện phương án A, B, C, D (hoặc có dấu sao * trước phương án đúng)
            opt_match = re.match(r'^(\*?)\s*([A-Da-d])\s*[\.\:\)]\s*(.+)', line)
            if opt_match:
                is_starred = bool(opt_match.group(1))
                opt_char = opt_match.group(2).upper()
                opt_text = opt_match.group(3).strip()

                options.append({
                    'char': opt_char,
                    'content': opt_text,
                    'is_correct': is_starred
                })

        # Nếu có chỉ định "Answer: C", cập nhật is_correct tương ứng
        if specified_answer_char:
            for opt in options:
                if opt.get('char') in specified_answer_char:
                    opt['is_correct'] = True

        # Đảm bảo có ít nhất 1 đáp án đúng nếu có options
        if options and not any(opt['is_correct'] for opt in options):
            options[0]['is_correct'] = True

        # Làm sạch cấu trúc trả về
        clean_options = [
            {'content': opt['content'], 'is_correct': opt['is_correct']}
            for opt in options
        ]

        if not clean_options:
            q_type = QuestionType.FILL_IN_THE_BLANK
            clean_options = [{'content': 'answer', 'is_correct': True}]

        return {
            'content': q_content or block[:100],
            'question_type': q_type,
            'skill': skill,
            'points': points,
            'explanation': explanation,
            'options': clean_options
        }


class CSVQuizParser(BaseQuizParser):
    """
    Bộ phân tích bảng câu hỏi từ tệp CSV.
    Cột chuẩn: Question, Option A, Option B, Option C, Option D, Correct Answer, Explanation, Skill, Points
    """

    def parse(self, csv_content: str) -> List[Dict[str, Any]]:
        questions = []
        reader = csv.DictReader(io.StringIO(csv_content))

        for row in reader:
            # Chuẩn hóa tên cột không phân biệt hoa thường
            row_normalized = {k.strip().lower(): v.strip() for k, v in row.items() if k}

            content = row_normalized.get('question') or row_normalized.get('câu hỏi') or row_normalized.get('content')
            if not content:
                continue

            opt_a = row_normalized.get('option a') or row_normalized.get('a') or ''
            opt_b = row_normalized.get('option b') or row_normalized.get('b') or ''
            opt_c = row_normalized.get('option c') or row_normalized.get('c') or ''
            opt_d = row_normalized.get('option d') or row_normalized.get('d') or ''
            correct = (row_normalized.get('correct answer') or row_normalized.get('đáp án') or 'A').upper()
            explanation = row_normalized.get('explanation') or row_normalized.get('giải thích') or ''
            skill = row_normalized.get('skill', 'GRAMMAR').upper()
            points_val = float(row_normalized.get('points') or 10.0)

            options = []
            if opt_a:
                options.append({'content': opt_a, 'is_correct': 'A' in correct or opt_a == correct})
            if opt_b:
                options.append({'content': opt_b, 'is_correct': 'B' in correct or opt_b == correct})
            if opt_c:
                options.append({'content': opt_c, 'is_correct': 'C' in correct or opt_c == correct})
            if opt_d:
                options.append({'content': opt_d, 'is_correct': 'D' in correct or opt_d == correct})

            if not any(o['is_correct'] for o in options) and options:
                options[0]['is_correct'] = True

            questions.append({
                'content': content,
                'question_type': QuestionType.SINGLE_CHOICE,
                'skill': skill if skill in SkillType.values else SkillType.GRAMMAR,
                'points': points_val,
                'explanation': explanation,
                'options': options
            })

        return questions


class DocxQuizParser(BaseQuizParser):
    """
    Bộ bóc tách văn bản từ tệp Word (.docx) thông qua cấu trúc XML gốc.
    """

    def parse(self, file_bytes: bytes) -> List[Dict[str, Any]]:
        text_content = self.extract_text_from_docx(file_bytes)
        return RawTextQuizParser().parse(text_content)

    @staticmethod
    def extract_text_from_docx(file_bytes: bytes) -> str:
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as docx_zip:
                xml_content = docx_zip.read('word/document.xml')
                tree = ET.fromstring(xml_content)
                namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

                paragraphs = []
                for p in tree.iterfind('.//w:p', namespaces):
                    texts = [t.text for t in p.iterfind('.//w:t', namespaces) if t.text]
                    if texts:
                        paragraphs.append(''.join(texts))

                return '\n'.join(paragraphs)
        except Exception as e:
            logger.error(f"Failed to extract DOCX XML: {e}")
            return ""


class AIQuizExtractionParser(BaseQuizParser):
    """
    Bộ trích xuất đề thi thông minh sử dụng Google Gemini LLM Engine.
    Có thể bóc tách mọi dạng văn bản đề thi tự do, không theo khuôn mẫu.
    """

    def parse(self, text: str) -> List[Dict[str, Any]]:
        if not text or not text.strip():
            return []

        provider = get_llm_provider()

        # Nếu là Fallback Mock -> Sử dụng RawTextQuizParser
        if provider.__class__.__name__ == 'FallbackMockLLMProvider':
            return RawTextQuizParser().parse(text)

        try:
            # Gọi LLM Provider để sinh JSON
            prompt = (
                f"{AI_QUIZ_EXTRACTOR_SYSTEM_PROMPT}\n\n"
                f"Văn bản đề thi cần trích xuất:\n\n{text}"
            )

            # Sử dụng Gemini Client
            if hasattr(provider, 'client') and provider.client:
                from google.genai import types
                config = types.GenerateContentConfig(
                    temperature=0.1,
                    response_mime_type="application/json"
                )
                response = provider.client.models.generate_content(
                    model=provider.model,
                    contents=prompt,
                    config=config
                )
                raw_text = response.text.strip()
                return json.loads(raw_text)

        except Exception as e:
            logger.warning(f"Gemini Quiz Extraction failed: {e}. Trying Groq fallback...")

        # Thử với Groq nếu có key
        import os
        import urllib.request
        from django.conf import settings
        groq_key = os.getenv('GROQ_API_KEY') or getattr(settings, 'GROQ_API_KEY', '')
        if groq_key:
            try:
                payload = {
                    'model': 'qwen/qwen3.8-27b',
                    'messages': [
                        {'role': 'system', 'content': AI_QUIZ_EXTRACTOR_SYSTEM_PROMPT},
                        {'role': 'user', 'content': f"Văn bản đề thi cần trích xuất:\n\n{text}"}
                    ],
                    'temperature': 0.1,
                    'response_format': {'type': 'json_object'}
                }
                req = urllib.request.Request(
                    "https://api.groq.com/openai/v1/chat/completions",
                    data=json.dumps(payload).encode('utf-8'),
                    headers={
                        'Content-Type': 'application/json',
                        'Authorization': f"Bearer {groq_key}",
                        'User-Agent': 'Mozilla/5.0'
                    }
                )
                with urllib.request.urlopen(req, timeout=20) as response:
                    result = json.loads(response.read().decode('utf-8'))
                    raw_json = result['choices'][0]['message']['content']
                    data = json.loads(raw_json)
                    if isinstance(data, list):
                        return data
                    if isinstance(data, dict) and 'questions' in data:
                        return data['questions']
            except Exception as e:
                logger.warning(f"Groq Quiz Extraction failed: {e}. Falling back to Rule-based Parser.")

        return RawTextQuizParser().parse(text)

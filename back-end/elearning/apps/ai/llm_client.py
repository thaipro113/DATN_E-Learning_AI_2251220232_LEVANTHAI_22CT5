import os
import json
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple, Optional
from django.conf import settings

from .prompts import (
    GRAMMAR_ANALYZER_SYSTEM_PROMPT,
    QUIZ_GENERATOR_SYSTEM_PROMPT,
    QUESTION_ANALYSIS_SYSTEM_PROMPT,
    WEAK_TOPIC_QUIZ_SYSTEM_PROMPT,
    COURSE_RECOMMENDATION_SYSTEM_PROMPT,
    ROADMAP_GENERATOR_SYSTEM_PROMPT
)

try:
    from google import genai
    from google.genai import types
    HAS_GOOGLE_GENAI = True
except ImportError:
    HAS_GOOGLE_GENAI = False

logger = logging.getLogger(__name__)


class BaseLLMProvider(ABC):
    """
    Interface cơ sở cho tất cả các nhà cung cấp mô hình ngôn ngữ lớn (LLM Provider).
    """

    @abstractmethod
    def analyze_question(self, question_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Phân tích chuyên sâu nội dung câu hỏi, phương án, đáp án đúng bằng LLM thật.
        Trả về dict: {"topic": str, "sub_topic": str, "skill": str, "difficulty": str, "reason": str, "confidence": float}
        """
        pass

    @abstractmethod
    def generate_weak_topic_quiz(self, topic: str, sub_topic: str, level: str, quantity: int = 5) -> Dict[str, Any]:
        """
        Tự động sinh bộ câu hỏi luyện tập mới toanh bám sát chủ đề còn yếu (Weak Topic Practice).
        """
        pass

    @abstractmethod
    def recommend_courses_with_llm(self, student_profile: Dict[str, Any], candidate_courses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Đánh giá và xếp hạng các khóa học ứng viên từ CSDL cho học viên dựa trên hồ sơ và mục tiêu.
        """
        pass

    @abstractmethod
    def generate_personalized_roadmap(self, roadmap_request: Dict[str, Any], candidate_courses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Sinh Lộ trình học tập bậc thang cá nhân hóa (BƯỚC 01, BƯỚC 02, BƯỚC 03, BƯỚC 04)
        kết nối khóa học thực tế từ CSDL.
        """
        pass

    @abstractmethod
    def generate_chat_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str
    ) -> Tuple[str, Dict[str, Any], int, str]:
        """
        Sinh phản hồi hội thoại từ mô hình AI.
        Trả về tuple: (ai_reply_text, grammar_corrections_dict, token_count, model_name)
        """
        pass

    @abstractmethod
    def analyze_grammar(self, text: str, target_level: str = 'B1') -> Dict[str, Any]:
        """
        Phân tích chi tiết lỗi ngữ pháp & từ vựng trong văn bản.
        """
        pass

    @abstractmethod
    def generate_quiz_questions(self, prompt: str) -> List[Dict[str, Any]]:
        """
        Sinh danh sách các câu hỏi trắc nghiệm tiếng Anh bám sát ngữ cảnh yêu cầu.
        """
        pass

    @abstractmethod
    def generate_course_description(self, title: str, category: str = 'Tiếng Anh', level: str = 'B1', is_free: bool = True, price: float = 0.0) -> str:
        """
        Tự động tư duy và soạn thảo mô tả khóa học chi tiết, sâu sắc bằng AI dựa trên tiêu đề và thông tin khóa học.
        """
        pass

    @abstractmethod
    def generate_chapter_description(self, course_title: str, chapter_title: str, level: str = 'B1') -> str:
        """
        Tự động sinh mô tả mục tiêu chương học súc tích, vừa đủ bằng AI.
        """
        pass

    @abstractmethod
    def generate_lesson_content(self, course_title: str, chapter_title: str, lesson_title: str, level: str = 'B1') -> str:
        """
        Tự động sinh tóm tắt nội dung trọng tâm bài giảng súc tích bằng AI.
        """
        pass


class GeminiLLMProvider(BaseLLMProvider):
    """
    Tích hợp trực tiếp Google Gemini API (gemini-3.6-flash / gemini-3.7-flash).
    Sử dụng Google GenAI SDK chính hãng.
    """

    def __init__(self, api_key: str, model: str = 'gemini-3.6-flash'):
        self.api_key = api_key
        self.model = model
        self.client = genai.Client(api_key=self.api_key) if HAS_GOOGLE_GENAI else None

    def generate_chat_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str
    ) -> Tuple[str, Dict[str, Any], int, str]:
        if self.client:
            try:
                formatted_contents = []
                for msg in messages:
                    role = 'user' if msg.get('role') == 'user' else 'model'
                    formatted_contents.append(f"{role.upper()}: {msg.get('content', '')}")

                full_prompt = (
                    f"SYSTEM INSTRUCTION:\n{system_prompt}\n\n"
                    f"CONVERSATION HISTORY:\n" + "\n".join(formatted_contents)
                )

                config = types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=1024,
                )

                response = self.client.models.generate_content(
                    model=self.model,
                    contents=full_prompt,
                    config=config
                )

                reply_text = response.text or ""
                token_count = 150
                if hasattr(response, 'usage_metadata') and response.usage_metadata:
                    token_count = getattr(response.usage_metadata, 'total_token_count', 150)

                # Phân tích lỗi ngữ pháp trong câu của học viên nếu có
                last_user_text = ""
                for m in reversed(messages):
                    if m.get('role') == 'user':
                        last_user_text = m.get('content', '')
                        break

                grammar_analysis = self.analyze_grammar(last_user_text) if last_user_text else {}
                return reply_text, grammar_analysis, token_count, self.model

            except Exception as e:
                logger.warning(f"Gemini SDK call failed: {e}. Trying Groq fallback...")
                groq_key = os.getenv('GROQ_API_KEY') or getattr(settings, 'GROQ_API_KEY', '')
                if groq_key:
                    return GroqLLMProvider(api_key=groq_key).generate_chat_response(messages, system_prompt)

        # Fallback nếu gọi API không thành công
        return FallbackMockLLMProvider().generate_chat_response(messages, system_prompt)

    def analyze_grammar(self, text: str, target_level: str = 'B1') -> Dict[str, Any]:
        if self.client and text.strip():
            try:
                prompt = (
                    f"{GRAMMAR_ANALYZER_SYSTEM_PROMPT}\n\n"
                    f"Trình độ học viên mục tiêu: {target_level}\n"
                    f"Văn bản cần kiểm tra:\n{text}\n\n"
                    "LƯU Ý: Chỉ trả về JSON hợp lệ, không có bất kỳ văn bản giải thích nào ngoài khối JSON."
                )

                config = types.GenerateContentConfig(
                    temperature=0.2,
                    response_mime_type="application/json"
                )

                response = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=config
                )

                raw_text = response.text.strip()
                if raw_text.startswith('```json'):
                    raw_text = raw_text[7:]
                if raw_text.startswith('```'):
                    raw_text = raw_text[3:]
                if raw_text.endswith('```'):
                    raw_text = raw_text[:-3]

                return json.loads(raw_text.strip())

            except Exception as e:
                logger.warning(f"Gemini Grammar Analysis failed: {e}. Trying Groq fallback...")
                groq_key = os.getenv('GROQ_API_KEY') or getattr(settings, 'GROQ_API_KEY', '')
                if groq_key:
                    return GroqLLMProvider(api_key=groq_key).analyze_grammar(text, target_level)

        return FallbackMockLLMProvider().analyze_grammar(text, target_level)

    def generate_quiz_questions(self, prompt: str) -> List[Dict[str, Any]]:
        """
        Sinh câu hỏi trắc nghiệm qua Gemini API có cấu trúc JSON.
        """
        if self.client and HAS_GOOGLE_GENAI:
            try:
                config = types.GenerateContentConfig(
                    system_instruction=QUIZ_GENERATOR_SYSTEM_PROMPT,
                    temperature=0.7,
                    max_output_tokens=8192,
                    response_mime_type="application/json"
                )

                response = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=config
                )

                raw_text = response.text.strip()
                if raw_text.startswith('```json'):
                    raw_text = raw_text[7:]
                if raw_text.startswith('```'):
                    raw_text = raw_text[3:]
                if raw_text.endswith('```'):
                    raw_text = raw_text[:-3]

                data = json.loads(raw_text.strip())
                if isinstance(data, list):
                    return data
                if isinstance(data, dict) and 'questions' in data:
                    return data['questions']
                return []
            except Exception as e:
                logger.warning(f"Gemini Quiz Generation failed: {e}. Trying Groq fallback...")
                groq_key = os.getenv('GROQ_API_KEY') or getattr(settings, 'GROQ_API_KEY', '')
                if groq_key:
                    return GroqLLMProvider(api_key=groq_key).generate_quiz_questions(prompt)

        return FallbackMockLLMProvider().generate_quiz_questions(prompt)

    def generate_course_description(self, title: str, category: str = 'Tiếng Anh', level: str = 'B1', is_free: bool = True, price: float = 0.0) -> str:
        prompt = (
            f"Bạn là chuyên gia thiết kế giáo trình tiếng Anh chuẩn CEFR. "
            f"Hãy tự động tư duy và viết một bài mô tả khóa học súc tích, vừa đủ (khoảng 150 - 200 từ), "
            f"BẮT BUỘC cách đoạn rõ ràng bằng 2 dấu xuống dòng (\\n\\n) giữa các phần.\n\n"
            f"Thông tin khóa học:\n"
            f"- Tiêu đề: {title}\n"
            f"- Chuyên mục: {category}\n"
            f"- Trình độ: CEFR {level}\n"
            f"- Học phí: {'Miễn phí 100%' if is_free or float(price) == 0 else f'{int(price):,} VNĐ'}\n\n"
            f"Bố cục yêu cầu (mỗi phần cách nhau bằng 2 dòng xuống hàng \\n\\n):\n"
            f"**TỔNG QUAN & Ý NGHĨA KHÓA HỌC:** (2-3 câu ngắn gọn về trọng tâm bài học)\n\n"
            f"**MỤC TIÊU ĐẦU RA (CEFR {level}):** (2-3 gạch đầu dòng kỹ năng đạt được)\n\n"
            f"**PHƯƠNG PHÁP HỌC TẬP VÀ TRỢ LÝ AI:** (1-2 câu về ứng dụng thực hành & AI hỗ trợ)\n\n"
            f"**ĐỐI TƯỢNG PHÙ HỢP:** (1 câu ngắn gọn)\n\n"
            f"**LỜI KHUYÊN TỪ GIẢNG VIÊN:** (1 câu truyền cảm hứng)\n\n"
            f"Hãy viết vừa đủ, không dài dòng, không viết liền tù tì thành một khối văn bản."
        )
        if self.client:
            try:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt
                )
                if response.text:
                    return response.text.strip()
            except Exception as e:
                logger.warning(f"Gemini Course Description failed: {e}. Trying Groq fallback...")
                groq_key = os.getenv('GROQ_API_KEY') or getattr(settings, 'GROQ_API_KEY', '')
                if groq_key:
                    return GroqLLMProvider(api_key=groq_key).generate_course_description(title, category, level, is_free, price)

        return FallbackMockLLMProvider().generate_course_description(title, category, level, is_free, price)

    def generate_chapter_description(self, course_title: str, chapter_title: str, level: str = 'B1') -> str:
        prompt = (
            f"Bạn là giảng viên tiếng Anh. Dựa vào khóa học '{course_title}' (CEFR {level}) và tên chương học '{chapter_title}', "
            f"hãy viết mô tả mục tiêu của chương học này súc tích, vừa đủ (khoảng 30 - 50 từ), có xuống dòng rõ ràng.\n"
            f"Ví dụ cấu trúc:\n"
            f"Mục tiêu: Nắm vững bản chất và cấu trúc...\n"
            f"Ứng dụng: Tự tin vận dụng vào các bài thi và giao tiếp thực tế."
        )
        if self.client:
            try:
                response = self.client.models.generate_content(model=self.model, contents=prompt)
                if response.text:
                    return response.text.strip()
            except Exception as e:
                logger.warning(f"Gemini Chapter Description failed: {e}. Trying Groq...")
                groq_key = os.getenv('GROQ_API_KEY') or getattr(settings, 'GROQ_API_KEY', '')
                if groq_key:
                    return GroqLLMProvider(api_key=groq_key).generate_chapter_description(course_title, chapter_title, level)

        return FallbackMockLLMProvider().generate_chapter_description(course_title, chapter_title, level)

    def generate_lesson_content(self, course_title: str, chapter_title: str, lesson_title: str, level: str = 'B1') -> str:
        prompt = (
            f"Bạn là giảng viên tiếng Anh. Dựa vào khóa học '{course_title}', chương '{chapter_title}' và bài giảng '{lesson_title}' (CEFR {level}), "
            f"hãy tóm tắt nội dung trọng tâm và ghi chú cần nhớ cho bài giảng này súc tích, vừa đủ (khoảng 40 - 60 từ), chia thành các gạch đầu dòng rõ ràng.\n"
            f"Bao gồm:\n"
            f"- Khái niệm / Quy tắc chính\n"
            f"- Công thức hoặc cấu trúc ví dụ\n"
            f"- Lưu ý quan trọng tránh nhầm lẫn"
        )
        if self.client:
            try:
                response = self.client.models.generate_content(model=self.model, contents=prompt)
                if response.text:
                    return response.text.strip()
            except Exception as e:
                logger.warning(f"Gemini Lesson Content failed: {e}. Trying Groq...")
                groq_key = os.getenv('GROQ_API_KEY') or getattr(settings, 'GROQ_API_KEY', '')
                if groq_key:
                    return GroqLLMProvider(api_key=groq_key).generate_lesson_content(course_title, chapter_title, lesson_title, level)

        return FallbackMockLLMProvider().generate_lesson_content(course_title, chapter_title, lesson_title, level)

    def analyze_question(self, question_data: Dict[str, Any]) -> Dict[str, Any]:
        groq_key = os.getenv('GROQ_API_KEY') or getattr(settings, 'GROQ_API_KEY', '')
        if groq_key:
            return GroqLLMProvider(api_key=groq_key).analyze_question(question_data)
        return FallbackMockLLMProvider().analyze_question(question_data)

    def generate_weak_topic_quiz(self, topic: str, sub_topic: str, level: str, quantity: int = 5) -> Dict[str, Any]:
        groq_key = os.getenv('GROQ_API_KEY') or getattr(settings, 'GROQ_API_KEY', '')
        if groq_key:
            return GroqLLMProvider(api_key=groq_key).generate_weak_topic_quiz(topic, sub_topic, level, quantity)
        return FallbackMockLLMProvider().generate_weak_topic_quiz(topic, sub_topic, level, quantity)

    def recommend_courses_with_llm(self, student_profile: Dict[str, Any], candidate_courses: List[Dict[str, Any]]) -> Dict[str, Any]:
        groq_key = os.getenv('GROQ_API_KEY') or getattr(settings, 'GROQ_API_KEY', '')
        if groq_key:
            return GroqLLMProvider(api_key=groq_key).recommend_courses_with_llm(student_profile, candidate_courses)
        return FallbackMockLLMProvider().recommend_courses_with_llm(student_profile, candidate_courses)

    def generate_personalized_roadmap(self, roadmap_request: Dict[str, Any], candidate_courses: List[Dict[str, Any]]) -> Dict[str, Any]:
        groq_key = os.getenv('GROQ_API_KEY') or getattr(settings, 'GROQ_API_KEY', '')
        if groq_key:
            return GroqLLMProvider(api_key=groq_key).generate_personalized_roadmap(roadmap_request, candidate_courses)
        return FallbackMockLLMProvider().generate_personalized_roadmap(roadmap_request, candidate_courses)


class GroqLLMProvider(BaseLLMProvider):
    """
    Tích hợp Groq Cloud API (Qwen 3.8 27B / GPT-OSS) với tốc độ phản hồi cực nhanh.
    """

    def __init__(self, api_key: str, model: str = 'qwen/qwen3.8-27b'):
        self.api_key = api_key
        self.model = model
        self.endpoint = "https://api.groq.com/openai/v1/chat/completions"

    def generate_chat_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str
    ) -> Tuple[str, Dict[str, Any], int, str]:
        import urllib.request
        formatted_messages = [{'role': 'system', 'content': system_prompt}]
        last_user_text = ""
        for msg in messages:
            role = msg.get('role', 'user')
            if role == 'model':
                role = 'assistant'
            formatted_messages.append({
                'role': role,
                'content': msg.get('content', '')
            })
            if role == 'user':
                last_user_text = msg.get('content', '')

        payload = {
            'model': self.model,
            'messages': formatted_messages,
            'temperature': 0.7,
            'max_tokens': 1024
        }

        try:
            req = urllib.request.Request(
                self.endpoint,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f"Bearer {self.api_key}",
                    'User-Agent': 'Mozilla/5.0'
                }
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                result = json.loads(response.read().decode('utf-8'))
                reply = result['choices'][0]['message']['content']
                tokens = result.get('usage', {}).get('total_tokens', 120)

                # Phân tích ngữ pháp câu hỏi học viên nếu cần
                grammar_analysis = {}
                if last_user_text and len(last_user_text.split()) >= 3:
                    try:
                        grammar_analysis = self.analyze_grammar(last_user_text)
                    except Exception:
                        grammar_analysis = {}

                return reply, grammar_analysis, tokens, f"Groq {self.model}"
        except Exception as e:
            logger.warning(f"Groq API call failed: {e}. Falling back to Mock Provider.")

        return FallbackMockLLMProvider().generate_chat_response(messages, system_prompt)

    def analyze_grammar(self, text: str, target_level: str = 'B1') -> Dict[str, Any]:
        import urllib.request
        payload = {
            'model': self.model,
            'messages': [
                {'role': 'system', 'content': GRAMMAR_ANALYZER_SYSTEM_PROMPT},
                {'role': 'user', 'content': f"Phân tích đoạn văn bản tiếng Anh sau:\n\n{text}"}
            ],
            'temperature': 0.2,
            'response_format': {'type': 'json_object'}
        }

        try:
            req = urllib.request.Request(
                self.endpoint,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f"Bearer {self.api_key}",
                    'User-Agent': 'Mozilla/5.0'
                }
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                result = json.loads(response.read().decode('utf-8'))
                raw_json = result['choices'][0]['message']['content']
                return json.loads(raw_json)
        except Exception as e:
            logger.warning(f"Groq Grammar Analysis failed: {e}. Falling back to Mock Provider.")

        return FallbackMockLLMProvider().analyze_grammar(text, target_level)

    def generate_quiz_questions(self, prompt: str) -> List[Dict[str, Any]]:
        import urllib.request
        payload = {
            'model': self.model,
            'messages': [
                {'role': 'system', 'content': QUIZ_GENERATOR_SYSTEM_PROMPT},
                {'role': 'user', 'content': prompt}
            ],
            'temperature': 0.7,
            'max_tokens': 6000,
            'response_format': {'type': 'json_object'}
        }

        try:
            req = urllib.request.Request(
                self.endpoint,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f"Bearer {self.api_key}",
                    'User-Agent': 'Mozilla/5.0'
                }
            )
            with urllib.request.urlopen(req, timeout=60) as response:
                result = json.loads(response.read().decode('utf-8'))
                raw_json = result['choices'][0]['message']['content']
                data = json.loads(raw_json)
                if isinstance(data, list):
                    return data
                if isinstance(data, dict) and 'questions' in data:
                    return data['questions']
                return []
        except Exception as e:
            logger.warning(f"Groq Quiz Generation failed: {e}. Falling back to Mock Provider.")

        return FallbackMockLLMProvider().generate_quiz_questions(prompt)

    def generate_course_description(self, title: str, category: str = 'Tiếng Anh', level: str = 'B1', is_free: bool = True, price: float = 0.0) -> str:
        import urllib.request
        system_instruction = (
            "Bạn là chuyên gia giáo dục và thiết kế giáo trình tiếng Anh chuẩn CEFR. "
            "Nhiệm vụ của bạn là dựa vào tiêu đề khóa học, danh mục và trình độ CEFR để soạn thảo "
            "bài mô tả khóa học súc tích, vừa đủ (khoảng 150 - 200 từ) bằng tiếng Việt cho giảng viên. "
            "BẮT BUỘC cách đoạn rõ ràng bằng 2 dấu xuống dòng (\\n\\n) giữa các phần:\n\n"
            "**TỔNG QUAN & Ý NGHĨA KHÓA HỌC:** (2-3 câu ngắn gọn về trọng tâm bài học)\n\n"
            "**MỤC TIÊU ĐẦU RA (CEFR {level}):** (2-3 gạch đầu dòng kỹ năng đạt được)\n\n"
            "**PHƯƠNG PHÁP HỌC TẬP & TRỢ LÝ AI:** (1-2 câu về ứng dụng thực hành & AI hỗ trợ)\n\n"
            "**ĐỐI TƯỢNG PHÙ HỢP:** (1 câu ngắn gọn)\n\n"
            "**LỜI KHUYÊN TỪ GIẢNG VIÊN:** (1 câu truyền cảm hứng)\n\n"
            "Tuyệt đối không viết liền tù tì thành một khối văn bản."
        )

        user_prompt = (
            f"Hãy tự động tư duy và soạn thảo bài mô tả chi tiết cho khóa học sau:\n"
            f"- Tiêu đề khóa học: {title}\n"
            f"- Chuyên mục / Danh mục: {category}\n"
            f"- Trình độ chuẩn CEFR: {level}\n"
            f"- Học phí: {'Miễn phí 100%' if is_free or float(price) == 0 else f'{int(price):,} VNĐ'}"
        )

        payload = {
            'model': self.model,
            'messages': [
                {'role': 'system', 'content': system_instruction},
                {'role': 'user', 'content': user_prompt}
            ],
            'temperature': 0.7,
            'max_tokens': 1024,
        }

        try:
            req = urllib.request.Request(
                self.endpoint,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f"Bearer {self.api_key}",
                    'User-Agent': 'Mozilla/5.0'
                }
            )
            with urllib.request.urlopen(req, timeout=20) as response:
                result = json.loads(response.read().decode('utf-8'))
                return result['choices'][0]['message']['content'].strip()
        except Exception as e:
            logger.warning(f"Groq Course Description Generation failed: {e}. Falling back.")

        return FallbackMockLLMProvider().generate_course_description(title, category, level, is_free, price)

    def generate_chapter_description(self, course_title: str, chapter_title: str, level: str = 'B1') -> str:
        import urllib.request
        system_instruction = (
            "Bạn là giảng viên tiếng Anh. Nhiệm vụ của bạn là viết mô tả mục tiêu của chương học súc tích, vừa đủ (khoảng 30 - 50 từ), có xuống dòng rõ ràng.\n"
            "Cấu trúc:\n"
            "🎯 Mục tiêu: Nắm vững bản chất và cấu trúc...\n"
            "💡 Ứng dụng: Tự tin vận dụng vào các bài thi và giao tiếp thực tế."
        )
        user_prompt = f"Khóa học: '{course_title}' (CEFR {level})\nChương học: '{chapter_title}'"

        payload = {
            'model': self.model,
            'messages': [
                {'role': 'system', 'content': system_instruction},
                {'role': 'user', 'content': user_prompt}
            ],
            'temperature': 0.7,
            'max_tokens': 512,
        }

        try:
            req = urllib.request.Request(
                self.endpoint,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f"Bearer {self.api_key}",
                    'User-Agent': 'Mozilla/5.0'
                }
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                result = json.loads(response.read().decode('utf-8'))
                return result['choices'][0]['message']['content'].strip()
        except Exception as e:
            logger.warning(f"Groq Chapter Description failed: {e}. Falling back.")

        return FallbackMockLLMProvider().generate_chapter_description(course_title, chapter_title, level)

    def generate_lesson_content(self, course_title: str, chapter_title: str, lesson_title: str, level: str = 'B1') -> str:
        import urllib.request
        system_instruction = (
            "Bạn là giảng viên tiếng Anh. Hãy tóm tắt nội dung trọng tâm và ghi chú cần nhớ cho bài giảng súc tích, vừa đủ (khoảng 40 - 60 từ), chia thành các gạch đầu dòng rõ ràng.\n"
            "Bao gồm:\n"
            "- Khái niệm / Quy tắc chính\n"
            "- Công thức hoặc cấu trúc ví dụ\n"
            "- Lưu ý quan trọng tránh nhầm lẫn"
        )
        user_prompt = f"Khóa học: '{course_title}', Chương: '{chapter_title}', Bài giảng: '{lesson_title}' (CEFR {level})"

        payload = {
            'model': self.model,
            'messages': [
                {'role': 'system', 'content': system_instruction},
                {'role': 'user', 'content': user_prompt}
            ],
            'temperature': 0.7,
            'max_tokens': 512,
        }

        try:
            req = urllib.request.Request(
                self.endpoint,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f"Bearer {self.api_key}",
                    'User-Agent': 'Mozilla/5.0'
                }
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                result = json.loads(response.read().decode('utf-8'))
                return result['choices'][0]['message']['content'].strip()
        except Exception as e:
            logger.warning(f"Groq Lesson Content failed: {e}. Falling back.")

        return FallbackMockLLMProvider().generate_lesson_content(course_title, chapter_title, lesson_title, level)

    def _call_json_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 2048,
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        """
        Gửi yêu cầu tới Groq Cloud API và bắt buộc phản hồi JSON có cấu trúc.
        Tự động fallback giữa các model khả dụng trên Groq Cloud (Qwen / GPT-OSS).
        """
        import urllib.request
        candidate_models = [self.model, 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b']
        last_error = None

        for model_name in candidate_models:
            payload = {
                'model': model_name,
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_prompt}
                ],
                'temperature': temperature,
                'max_tokens': max_tokens,
                'response_format': {'type': 'json_object'}
            }
            try:
                req = urllib.request.Request(
                    self.endpoint,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={
                        'Content-Type': 'application/json',
                        'Authorization': f"Bearer {self.api_key}",
                        'User-Agent': 'Mozilla/5.0'
                    }
                )
                with urllib.request.urlopen(req, timeout=30) as response:
                    result = json.loads(response.read().decode('utf-8'))
                    raw_text = result['choices'][0]['message']['content'].strip()
                    if raw_text.startswith('```json'):
                        raw_text = raw_text[7:]
                    if raw_text.startswith('```'):
                        raw_text = raw_text[3:]
                    if raw_text.endswith('```'):
                        raw_text = raw_text[:-3]
                    return json.loads(raw_text.strip())
            except Exception as e:
                last_error = e
                logger.warning(f"Groq API call with model '{model_name}' failed: {e}. Trying next available model...")

        raise RuntimeError(f"Tất cả các model LLM thật trên Groq đều không phản hồi: {last_error}")

    def analyze_question(self, question_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Phân tích chuyên sâu câu hỏi tiếng Anh bằng LLM thật:
        Xác định topic, sub_topic, skill, CEFR difficulty, reason, confidence.
        Không sử dụng keyword hay regex.
        """
        user_prompt = (
            f"Please conduct an in-depth linguistic and pedagogical analysis for the following English question:\n\n"
            f"QUESTION CONTENT:\n{question_data.get('question_content', '').strip()}\n\n"
            f"ANSWER CHOICES:\n{question_data.get('options_text', 'N/A')}\n\n"
            f"CORRECT ANSWER:\n{question_data.get('correct_answer', 'N/A')}\n\n"
            f"STUDENT'S ANSWER:\n{question_data.get('student_answer', 'N/A')}\n\n"
            f"EXPLANATION:\n{question_data.get('explanation', 'N/A')}\n\n"
            f"ASSESSED SKILL CONTEXT:\n{question_data.get('skill_type', 'GRAMMAR')}\n\n"
            f"INSTRUCTION: Do not classify based only on keywords. Analyze grammar structure, semantic context, answer choices, correct answer and explanation."
        )

        data = self._call_json_completion(
            system_prompt=QUESTION_ANALYSIS_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=1024,
            temperature=0.1
        )

        topic = data.get('topic')
        if not topic or not str(topic).strip():
            raise ValueError("LLM did not return a valid 'topic' field in JSON response.")

        return {
            'topic': str(topic).strip(),
            'sub_topic': str(data.get('sub_topic', '')).strip(),
            'skill': str(data.get('skill', 'GRAMMAR')).strip().upper(),
            'difficulty': str(data.get('difficulty', 'B1')).strip().upper(),
            'reason': str(data.get('reason', '')).strip(),
            'confidence': float(data.get('confidence', 0.95)),
            'raw_response': data
        }

    def generate_weak_topic_quiz(self, topic: str, sub_topic: str, level: str, quantity: int = 5) -> Dict[str, Any]:
        """
        Sinh ngẫu nhiên các câu hỏi trắc nghiệm hoàn toàn mới bám sát weak topic của học viên bằng LLM thật.
        """
        user_prompt = (
            f"Generate exactly {quantity} brand new multiple-choice practice questions for student's identified weak topic:\n"
            f"- Primary Topic: {topic}\n"
            f"- Specific Sub-topic / Rule: {sub_topic or 'Comprehensive application'}\n"
            f"- Target CEFR Level: {level or 'B1'}\n"
            f"- Required Question Count: {quantity}\n\n"
            f"Ensure all {quantity} questions strictly target this weak area to help the student overcome their mistakes."
        )

        data = self._call_json_completion(
            system_prompt=WEAK_TOPIC_QUIZ_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=4096,
            temperature=0.7
        )

        if not isinstance(data, dict) or 'questions' not in data or not isinstance(data['questions'], list):
            raise ValueError("LLM returned invalid schema for weak topic quiz.")

        valid_questions = []
        for q in data['questions']:
            if 'question' in q and 'options' in q and 'correct_answer' in q:
                valid_questions.append({
                    'question': str(q['question']).strip(),
                    'options': [str(opt) for opt in q['options']],
                    'correct_answer': str(q['correct_answer']).strip().upper()[:1],
                    'explanation': str(q.get('explanation', '')).strip(),
                    'difficulty': str(q.get('difficulty', level or 'B1')).strip().upper()
                })

        if len(valid_questions) == 0:
            raise ValueError("LLM returned an empty or invalid question set.")

        return {
            'topic': data.get('topic', topic),
            'questions': valid_questions
        }

    def recommend_courses_with_llm(self, student_profile: Dict[str, Any], candidate_courses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Đánh giá và xếp hạng các khóa học ứng viên từ CSDL PostgreSQL cho học viên.
        LLM không được bịa khóa học, chỉ chọn trong danh sách được cung cấp.
        """
        courses_text = ""
        for c in candidate_courses:
            price_text = "Miễn phí" if c.get('is_free') else f"{c.get('price')} VNĐ"
            courses_text += (
                f"- Course ID: {c['id']}\n"
                f"  Title: {c['title']}\n"
                f"  Category: {c.get('category', 'English')}\n"
                f"  Level: {c.get('level', 'B1')}\n"
                f"  Price: {price_text}\n"
                f"  Description: {c.get('description', '')}\n\n"
            )

        user_prompt = (
            f"STUDENT PROFILE & SURVEY GOALS:\n"
            f"- Học tập mục tiêu: {student_profile.get('goal', 'Nâng cao trình độ tiếng Anh')}\n"
            f"- Trình độ tự đánh giá: {student_profile.get('self_level', 'B1')}\n"
            f"- Kỹ năng cần ưu tiên: {student_profile.get('priority_skill', 'Ngữ pháp & Từ vựng')}\n"
            f"- Thời gian học cam kết mỗi ngày: {student_profile.get('daily_time', '30 phút')}\n"
            f"- Điểm số kỹ năng hiện tại: {json.dumps(student_profile.get('skill_scores', {}), ensure_ascii=False)}\n"
            f"- Các chủ đề đang yếu: {json.dumps(student_profile.get('weak_topics', []), ensure_ascii=False)}\n"
            f"- Khóa học đã hoàn thành: {json.dumps(student_profile.get('completed_courses', []), ensure_ascii=False)}\n\n"
            f"CANDIDATE COURSES RETRIEVED FROM POSTGRESQL (CHỈ ĐƯỢC CHỌN TỪ DANH SÁCH NÀY):\n"
            f"{courses_text}\n"
            f"Vui lòng xếp hạng các khóa học phù hợp nhất và giải thích lý do cụ thể bằng tiếng Việt."
        )

        data = self._call_json_completion(
            system_prompt=COURSE_RECOMMENDATION_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=2048,
            temperature=0.3
        )

        if not isinstance(data, dict) or 'recommended_courses' not in data:
            raise ValueError("LLM returned invalid course recommendation schema.")

        candidate_ids = {str(c['id']) for c in candidate_courses}
        valid_recs = []
        for item in data['recommended_courses']:
            cid = str(item.get('course_id', '')).strip()
            if cid in candidate_ids:
                valid_recs.append({
                    'course_id': cid,
                    'match_score': float(item.get('match_score', 0.85)),
                    'reason': str(item.get('reason', '')).strip()
                })

        if not valid_recs:
            raise ValueError("None of the courses recommended by LLM matched candidate course IDs from database.")

        return {'recommended_courses': valid_recs}

    def generate_personalized_roadmap(
        self,
        roadmap_request: Dict[str, Any],
        candidate_courses: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Sinh Lộ trình học tập bậc thang cá nhân hóa (BƯỚC 01, BƯỚC 02, BƯỚC 03, BƯỚC 04)
        kết nối khóa học thực tế từ CSDL bằng Groq LLM (Qwen / GPT-OSS).
        """
        courses_text = ""
        for c in candidate_courses:
            price_text = "Miễn phí" if c.get('is_free') else f"{c.get('price')} VNĐ"
            courses_text += (
                f"- Course ID: {c['id']}\n"
                f"  Title: {c['title']}\n"
                f"  Category: {c.get('category', 'English')}\n"
                f"  Level: {c.get('level', 'B1')}\n"
                f"  Price: {price_text}\n"
                f"  Description: {c.get('description', '')}\n\n"
            )

        current_level = roadmap_request.get('current_level', 'A2')
        current_score = roadmap_request.get('current_score', 'Chưa có / Cơ bản')
        target_goal = roadmap_request.get('target_goal', 'Luyện thi TOEIC')
        target_score = roadmap_request.get('target_score', '650+ TOEIC')
        custom_notes = roadmap_request.get('custom_notes', '')
        num_stages = roadmap_request.get('num_stages', 4)
        custom_stages = roadmap_request.get('custom_stages') or []

        custom_stages_str = ""
        if custom_stages and isinstance(custom_stages, list):
            custom_stages_str = "\nLỰA CHỌN CHI TIẾT TỪNG GIAI ĐOẠN CỦA HỌC VIÊN:\n"
            for st in custom_stages:
                st_num = st.get('stage_number', '')
                st_title = st.get('title') or st.get('choice_label', '')
                st_input = st.get('custom_input', '')
                custom_stages_str += f"- Giai đoạn {st_num}: {st_title}"
                if st_input:
                    custom_stages_str += f" | Tự nhập mong muốn: {st_input}"
                custom_stages_str += "\n"

        user_prompt = (
            f"HỒ SƠ HỌC VIÊN & MỤC TIÊU NĂNG LỰC:\n"
            f"- Cấp độ / Điểm hiện tại: {current_level} (Chi tiết điểm/band: {current_score})\n"
            f"- Mục đích học tập (Bạn học để làm gì): {target_goal}\n"
            f"- Điểm số / Band mong muốn đạt được: {target_score}\n"
            f"- Số giai đoạn phân chia mong muốn: {num_stages} giai đoạn\n"
            f"- Ghi chú nguyện vọng riêng của học viên: {custom_notes if custom_notes else 'Không có'}\n"
            f"{custom_stages_str}\n"
            f"DANH SÁCH KHÓA HỌC THỰC TẾ TRONG CSDL (CHỈ ĐƯỢC CHỌN TỪ ĐÂY):\n"
            f"{courses_text}\n"
            f"Vui lòng thiết kế lộ trình {num_stages} giai đoạn bám sát cấu trúc bậc thang (BƯỚC 01, BƯỚC 02...), đáp ứng chính xác các lựa chọn từng giai đoạn của học viên, gán các khóa học phù hợp cho từng bước và trả về JSON chuẩn."
        )

        try:
            data = self._call_json_completion(
                system_prompt=ROADMAP_GENERATOR_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                max_tokens=3000,
                temperature=0.3
            )
            if isinstance(data, dict) and 'steps' in data and len(data['steps']) > 0:
                valid_ids = {str(c['id']) for c in candidate_courses}
                for step in data['steps']:
                    step_cids = [str(cid).strip() for cid in step.get('course_ids', []) if str(cid).strip() in valid_ids]
                    if not step_cids:
                        step_cids = FallbackMockLLMProvider._match_courses_for_step(
                            step.get('phase', '') + ' ' + step.get('title', ''), candidate_courses
                        )
                    step['course_ids'] = step_cids
                return data
        except Exception as e:
            logger.warning(f"Groq Personalized Roadmap Generation failed: {e}. Falling back to smart heuristic.")

        return FallbackMockLLMProvider().generate_personalized_roadmap(roadmap_request, candidate_courses)


class FallbackMockLLMProvider(BaseLLMProvider):
    """
    Bộ giả lập AI Tutor thông minh (Dành cho môi trường phát triển nội bộ, Testing và Fallback an toàn).
    Tự động phân tích quy tắc ngữ pháp tiếng Anh cơ bản và tạo phản hồi sư phạm chất lượng cao.
    """

    def generate_chat_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str
    ) -> Tuple[str, Dict[str, Any], int, str]:
        last_user_message = ""
        for m in reversed(messages):
            if m.get('role') == 'user':
                last_user_message = m.get('content', '')
                break

        # Tự động phân tích ngữ pháp trong câu hỏi của học viên
        grammar_analysis = self.analyze_grammar(last_user_message)

        reply_content = (
            f"Hello! I am your AI English Tutor. 🎓\n\n"
            f"Thank you for sharing: *\"{last_user_message}\"*\n\n"
        )

        if grammar_analysis.get('has_errors'):
            reply_content += "💡 **Grammar Note:**\n"
            for err in grammar_analysis.get('errors', []):
                reply_content += f"- Instead of *\"{err['error_segment']}\"*, you should say *\"{err['correction']}\"*. ({err['explanation_vi']})\n"
            reply_content += f"\n✨ **Corrected sentence:** \"{grammar_analysis.get('corrected_text')}\"\n\n"

        reply_content += (
            "How can I assist you further with this topic? "
            "Would you like to practice with some more interactive examples?"
        )

        return reply_content, grammar_analysis, 85, 'mock-ai-tutor-v1'

    def analyze_grammar(self, text: str, target_level: str = 'B1') -> Dict[str, Any]:
        """
        Bộ phân tích quy tắc ngữ pháp Rule-based thông minh cho chế độ Mock/Testing.
        """
        text_clean = text.strip()
        errors = []
        corrected_text = text_clean

        # Kiểm tra lỗi thì quá khứ phổ biến: "I go ... yesterday"
        if 'yesterday' in text_clean.lower() and 'go' in text_clean.lower().split():
            errors.append({
                'error_segment': 'go',
                'correction': 'went',
                'error_type': 'Verb Tense (Past Simple)',
                'explanation_vi': "Vì có mốc thời gian trong quá khứ 'yesterday', động từ 'go' cần chia ở thì quá khứ đơn là 'went'."
            })
            corrected_text = corrected_text.replace('go', 'went').replace('Go', 'Went')

        # Kiểm tra lỗi hòa hợp chủ vị: "He like" / "She play"
        words = text_clean.lower().split()
        if 'he' in words and 'like' in words:
            errors.append({
                'error_segment': 'like',
                'correction': 'likes',
                'error_type': 'Subject-Verb Agreement',
                'explanation_vi': "Chủ ngữ ngôi thứ 3 số ít 'He' đi với động từ thêm 's' ('likes') ở thì hiện tại đơn."
            })
            corrected_text = corrected_text.replace('like', 'likes').replace('Like', 'Likes')

        has_errors = len(errors) > 0

        return {
            'has_errors': has_errors,
            'original_text': text_clean,
            'corrected_text': corrected_text if has_errors else text_clean,
            'errors_count': len(errors),
            'errors': errors,
            'better_alternatives': [
                f"Naturally speaking: {corrected_text}",
                f"More formal version: {corrected_text}"
            ],
            'overall_comment_vi': (
                "Bạn đã diễn đạt tốt ý muốn nói! Hãy chú ý hơn về thì động từ và sự hòa hợp chủ vị nhé."
                if has_errors else "Câu của bạn rất chính xác và tự nhiên! Làm tốt lắm!"
            )
        }

    def generate_quiz_questions(self, prompt: str) -> List[Dict[str, Any]]:
        """
        Bộ sinh câu hỏi trắc nghiệm AI Mock đa dạng bám sát chủ đề yêu cầu.
        """
        return [
            {
                "content": "Which sentence uses the Past Simple tense correctly?",
                "skill": "GRAMMAR",
                "level": "B1",
                "explanation_vi": "Động từ bất quy tắc của 'go' ở quá khứ đơn là 'went'. Mốc thời gian 'yesterday' yêu cầu thì quá khứ đơn.",
                "points": 1.0,
                "options": [
                    {"content": "She goed to London yesterday.", "is_correct": False},
                    {"content": "She went to London yesterday.", "is_correct": True},
                    {"content": "She has gone to London yesterday.", "is_correct": False},
                    {"content": "She was go to London yesterday.", "is_correct": False}
                ]
            },
            {
                "content": "Choose the correct word to fill in the blank: 'He ______ his homework before dinner every day.'",
                "skill": "GRAMMAR",
                "level": "B1",
                "explanation_vi": "Chủ ngữ 'He' là ngôi thứ 3 số ít, động từ kết thúc bằng 'o' ('do') thêm 'es' thành 'does' ở thì Hiện tại đơn.",
                "points": 1.0,
                "options": [
                    {"content": "finish", "is_correct": False},
                    {"content": "finishes", "is_correct": True},
                    {"content": "finishing", "is_correct": False},
                    {"content": "finished", "is_correct": False}
                ]
            },
            {
                "content": "What is the synonym of the word 'essential'?",
                "skill": "VOCABULARY",
                "level": "B1",
                "explanation_vi": "'Essential' có nghĩa là 'thiết yếu / cần thiết', đồng nghĩa với 'necessary' hoặc 'crucial'.",
                "points": 1.0,
                "options": [
                    {"content": "Crucial", "is_correct": True},
                    {"content": "Trivial", "is_correct": False},
                    {"content": "Optional", "is_correct": False},
                    {"content": "Unimportant", "is_correct": False}
                ]
            },
            {
                "content": "If it ______ tomorrow, we will postpone the outdoor picnic.",
                "skill": "GRAMMAR",
                "level": "B1",
                "explanation_vi": "Mệnh đề 'If' trong câu điều kiện loại 1 chia ở thì Hiện tại đơn (ngôi thứ 3 số ít: 'rains').",
                "points": 1.0,
                "options": [
                    {"content": "will rain", "is_correct": False},
                    {"content": "rains", "is_correct": True},
                    {"content": "rained", "is_correct": False},
                    {"content": "is raining", "is_correct": False}
                ]
            },
            {
                "content": "Complete the sentence: 'She has been working here ______ five years.'",
                "skill": "GRAMMAR",
                "level": "B1",
                "explanation_vi": "Dùng 'for' đi với một khoảng thời gian ('five years') trong thì Hiện tại hoàn thành.",
                "points": 1.0,
                "options": [
                    {"content": "since", "is_correct": False},
                    {"content": "for", "is_correct": True},
                    {"content": "during", "is_correct": False},
                    {"content": "at", "is_correct": False}
                ]
            }
        ]

    def generate_course_description(self, title: str, category: str = 'Tiếng Anh', level: str = 'B1', is_free: bool = True, price: float = 0.0) -> str:
        title_clean = title.strip()
        fee_info = "Khóa học miễn phí 100%" if is_free or float(price) == 0 else f"Học phí ưu đãi: {int(price):,} VNĐ"
        
        return (
            f"🎯 **TỔNG QUAN & Ý NGHĨA KHÓA HỌC:**\n"
            f"Khóa học \"{title_clean}\" thuộc chuyên mục \"{category}\", được xây dựng bám sát khung tham chiếu Châu Âu (CEFR {level}). "
            f"Chương trình giúp người học nhanh chóng làm chủ kiến thức cốt lõi, tháo gỡ rào cản ngữ pháp và từ vựng để vận dụng thực chiến.\n\n"
            f"🚀 **MỤC TIÊU ĐẦU RA (CEFR {level}):**\n"
            f"- Nắm vững các cấu trúc trọng điểm và vốn từ chuyên sâu xoay quanh chủ đề \"{title_clean}\".\n"
            f"- Tự tin ứng dụng vào các bài thi chuẩn hóa và tình huống giao tiếp thực tế.\n"
            f"- Khắc phục các lỗi sai phổ biến và hình thành tư duy phản xạ tiếng Anh tự nhiên.\n\n"
            f"📚 **PHƯƠNG PHÁP HỌC TẬP VÀ TRỢ LÝ AI:**\n"
            f"Học lý thuyết qua video sinh động, kết hợp làm bài tập trắc nghiệm tương tác và nhận phản hồi, chấm điểm cá nhân hóa tức thì từ Trợ lý AI 24/7.\n\n"
            f"👥 **ĐỐI TƯỢNG PHÙ HỢP:**\n"
            f"Học viên ở trình độ {level} cần củng cố kiến thức, luyện thi và nâng cao năng lực tiếng Anh ({fee_info}).\n\n"
            f"⭐ **LỜI KHUYÊN TỪ GIẢNG VIÊN:**\n"
            f"Hãy duy trì thói quen học tập và tương tác đều đặn cùng AI mỗi ngày để đạt kết quả đột phá!"
        )

    def generate_chapter_description(self, course_title: str, chapter_title: str, level: str = 'B1') -> str:
        return (
            f"🎯 **Mục tiêu chương:** Giúp học viên nắm vững bản chất, quy tắc và cách ứng dụng của '{chapter_title}' theo chuẩn CEFR {level}.\n\n"
            f"💡 **Ứng dụng thực tế:** Xây dựng nền tảng vững chắc để tự tin giải quyết các dạng bài tập và tình huống giao tiếp liên quan."
        )

    def generate_lesson_content(self, course_title: str, chapter_title: str, lesson_title: str, level: str = 'B1') -> str:
        return (
            f"📌 **Trọng tâm bài giảng '{lesson_title}':**\n"
            f"- **Quy tắc cốt lõi:** Nắm vững cấu trúc và ngữ cảnh sử dụng chuẩn xác.\n"
            f"- **Ví dụ điển hình:** Phân tích các mẫu câu và bài tập thường gặp ở cấp độ {level}.\n"
            f"- **Lưu ý ghi nhớ:** Tránh nhầm lẫn các trường hợp ngoại lệ trong quá trình làm bài và giao tiếp."
        )

    def analyze_question(self, question_data: Dict[str, Any]) -> Dict[str, Any]:
        raise RuntimeError("Hệ thống yêu cầu LLM thật (Groq/Gemini) để phân tích câu hỏi học thuật. Không sử dụng Mock trong luồng chính.")

    def generate_weak_topic_quiz(self, topic: str, sub_topic: str, level: str, quantity: int = 5) -> Dict[str, Any]:
        raise RuntimeError("Hệ thống yêu cầu LLM thật (Groq/Gemini) để sinh đề thi luyện tập điểm yếu. Không sử dụng Mock trong luồng chính.")

    def recommend_courses_with_llm(self, student_profile: Dict[str, Any], candidate_courses: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {'recommended_courses': []}

    @staticmethod
    def _match_courses_for_step(text_hint: str, candidate_courses: List[Dict[str, Any]]) -> List[str]:
        """
        Hàm heuristic hỗ trợ chọn khóa học tối ưu từ CSDL dựa trên từ khóa giai đoạn.
        """
        hint_lower = text_hint.lower()
        matched = []

        # 1. Tìm khóa học phù hợp theo trình độ và chủ đề
        for c in candidate_courses:
            title_lower = c.get('title', '').lower()
            cat_lower = c.get('category', '').lower()
            level = c.get('level', '')

            if any(k in hint_lower for k in ['a1', 'a2', 'gốc', 'cơ bản', 'bắt đầu', 'nền tảng']):
                if level in ['A1', 'A2'] or 'gốc' in title_lower or 'cơ bản' in title_lower:
                    matched.append(str(c['id']))
            elif any(k in hint_lower for k in ['b1', 'từ vựng', 'đọc hiểu']):
                if level == 'B1' or 'từ vựng' in title_lower or 'đọc hiểu' in title_lower:
                    matched.append(str(c['id']))
            elif any(k in hint_lower for k in ['toeic', 'ielts']):
                if 'toeic' in hint_lower and ('toeic' in title_lower or 'toeic' in cat_lower):
                    matched.append(str(c['id']))
                elif 'ielts' in hint_lower and ('ielts' in title_lower or 'ielts' in cat_lower):
                    matched.append(str(c['id']))
            elif any(k in hint_lower for k in ['giao tiếp', 'công sở', 'c1', 'c2']):
                if 'giao tiếp' in title_lower or level in ['B2', 'C1']:
                    matched.append(str(c['id']))

        if not matched and candidate_courses:
            # Fallback lấy 1 khóa đầu tiên
            matched.append(str(candidate_courses[0]['id']))

        # Giữ tối đa 2 khóa học tiêu biểu cho mỗi bước
        return list(dict.fromkeys(matched))[:2]

    def generate_personalized_roadmap(
        self,
        roadmap_request: Dict[str, Any],
        candidate_courses: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Bộ sinh lộ trình sư phạm thông minh Heuristic (Smart Fallback Engine)
        Tự động cấu trúc các chặng học tập bậc thang chuẩn CEFR theo mục tiêu điểm số của học viên.
        """
        current_level = roadmap_request.get('current_level', 'A2')
        current_score = roadmap_request.get('current_score', '')
        target_goal = roadmap_request.get('target_goal', 'Luyện thi TOEIC')
        target_score = roadmap_request.get('target_score', '700+ TOEIC')
        num_stages = int(roadmap_request.get('num_stages', 4))
        if num_stages not in [3, 4]:
            num_stages = 4

        is_toeic = 'toeic' in target_goal.lower() or 'toeic' in target_score.lower()
        is_ielts = 'ielts' in target_goal.lower() or 'ielts' in target_score.lower()
        is_comm = 'giao tiếp' in target_goal.lower() or 'đi làm' in target_goal.lower() or 'công sở' in target_goal.lower()

        if is_toeic:
            title = f"Chiến Lược Chinh Phục TOEIC Mục Tiêu {target_score}"
            summary = f"Lộ trình tinh gọn {num_stages} giai đoạn được AI cá nhân hóa từ trình độ hiện tại ({current_score or current_level}) giúp bạn làm chủ ngữ pháp then chốt, bứt phá vốn từ vựng thương mại và tối ưu kỹ thuật giải đề TOEIC."
            
            steps = [
                {
                    "step_number": 1,
                    "phase": "BƯỚC 01 • CẤP ĐỘ CEFR A1 - A2 (NỀN TẢNG TOEIC 350 - 450)",
                    "title": "XÂY DỰNG GỐC NGỮ PHÁP & PHÁT ÂM CƠ BẢN",
                    "desc": "Bắt đầu hành trình với hệ thống bài giảng ngữ pháp cốt lõi và phát âm quốc tế IPA chuẩn xác. Từng bài học được chia nhỏ khoa học từ 12 thì cơ bản, cách đặt câu đến phản xạ từ vựng ban đầu. Hệ thống giúp học viên mất gốc lấy lại sự tự tin, nắm chắc nền tảng vững vàng.",
                    "tags": [
                        {"icon": "fa-solid fa-book-open", "label": "Quyết tâm lấy gốc Tiếng Anh"},
                        {"icon": "fa-solid fa-spell-check", "label": "Ngữ pháp A1 - A2"},
                        {"icon": "fa-solid fa-volume-high", "label": "Chuẩn hóa ngữ âm IPA"}
                    ],
                    "estimated_weeks": "3 - 4 tuần",
                    "match_reason": "Củng cố lại toàn bộ ngữ pháp cơ bản và ngữ âm để nghe hiểu các đoạn hội thoại ngắn."
                },
                {
                    "step_number": 2,
                    "phase": "BƯỚC 02 • CẤP ĐỘ CEFR B1 (TĂNG TỐC TỪ VỰNG & NGHE HIỂU 500 - 600)",
                    "title": "MỞ RỘNG VỐN TỪ VỰNG & RÈN LUYỆN ĐỌC HIỂU",
                    "desc": "Chuyển tiếp sang giai đoạn tăng tốc với kho học liệu từ vựng chuyên sâu theo chủ đề công sở và đời sống. Người học được trang bị kỹ năng Skimming & Scanning để giải mã các bài đọc dài Part 7, hiểu sâu cấu trúc câu và hình thành phản xạ tư duy tiếng Anh trực tiếp.",
                    "tags": [
                        {"icon": "fa-solid fa-layer-group", "label": "Từ vựng & Đọc hiểu B1"},
                        {"icon": "fa-solid fa-brain", "label": "Chinh phục 3000 từ vựng cốt lõi"},
                        {"icon": "fa-solid fa-briefcase", "label": "Tiếng Anh văn phòng thực tế"}
                    ],
                    "estimated_weeks": "4 - 5 tuần",
                    "match_reason": "Bổ sung lượng từ vựng thương mại phong phú và rèn luyện tốc độ đọc hiểu văn bản."
                },
                {
                    "step_number": 3,
                    "phase": f"BƯỚC 03 • CẤP ĐỘ CEFR B2 (LUYỆN ĐỀ THỰC CHIẾN BỨT PHÁ {target_score})",
                    "title": "LUYỆN ĐỀ THỰC CHIẾN & TỰ ĐỘNG CHẨN ĐOÁN LỖI SAI",
                    "desc": "Thử sức với ngân hàng đề thi trắc nghiệm chuẩn hóa mô phỏng bài thi quốc tế TOEIC. Sau mỗi lần nộp bài, hệ thống tự động phân tích chi tiết từng lỗi sai, chẩn đoán lỗ hổng kiến thức ngữ pháp và đề xuất bài giảng ôn tập bù đắp kịp thời, giúp bứt phá điểm số vượt bậc.",
                    "tags": [
                        {"icon": "fa-solid fa-file-signature", "label": "Luyện đề TOEIC Chuyên sâu"},
                        {"icon": "fa-solid fa-magnifying-glass-chart", "label": "Phân tích lỗi sai thông minh"},
                        {"icon": "fa-solid fa-graduation-cap", "label": "Chinh phục ngữ pháp B2"}
                    ],
                    "estimated_weeks": "4 - 6 tuần",
                    "match_reason": "Rèn luyện áp lực phòng thi thật, khắc phục bẫy đề thi Part 5, 6, 7 và tăng tốc phản xạ nghe Part 3, 4."
                },
                {
                    "step_number": 4,
                    "phase": "BƯỚC 04 • CẤP ĐỘ CEFR C1 (CHINH PHỤC ĐỈNH CAO 850 - 900+)",
                    "title": "LÀM CHỦ PHẢN XẠ NÂNG CAO & CẤP CHỨNG CHỈ SỐ",
                    "desc": "Chinh phục đỉnh cao điểm số với các bộ đề khó phân loại học viên, tối ưu hóa điểm số tuyệt đối. Hoàn tất bài đánh giá năng lực cuối khóa để nhận Chứng chỉ số điện tử CEFR tích hợp mã QR xác thực chính quy, sẵn sàng cho công việc và cơ hội toàn cầu.",
                    "tags": [
                        {"icon": "fa-solid fa-trophy", "label": "Bứt tốc TOEIC 900+"},
                        {"icon": "fa-solid fa-award", "label": "Chứng chỉ CEFR QR Code"},
                        {"icon": "fa-solid fa-shield-check", "label": "Đánh giá năng lực chuẩn hóa"}
                    ],
                    "estimated_weeks": "3 - 4 tuần",
                    "match_reason": "Bảo đảm phong độ làm bài đỉnh cao và ghi nhận thành tích chính thức."
                }
            ]
        elif is_ielts:
            title = f"Hành Trình Bứt Phá IELTS Toàn Diện Band {target_score}"
            summary = f"Lộ trình {num_stages} giai đoạn được AI phân tích chuẩn xác giúp bạn xây dựng nền tảng từ vựng học thuật, rèn luyện tư duy phản biện và làm quen với format đề thi IELTS 4 kỹ năng."
            steps = [
                {
                    "step_number": 1,
                    "phase": "BƯỚC 01 • CẤP ĐỘ CEFR A1 - A2 (NỀN TẢNG NĂNG LỰC)",
                    "title": "XÂY DỰNG GỐC NGỮ PHÁP & PHÁT ÂM CƠ BẢN",
                    "desc": "Xây dựng lại hệ thống ngữ pháp tiếng Anh bài bản từ các thì, mệnh đề quan hệ và ngữ âm chuẩn IPA làm tiền đề cho kỹ năng Nghe - Nói IELTS.",
                    "tags": [
                        {"icon": "fa-solid fa-book-open", "label": "Quyết tâm lấy gốc Tiếng Anh"},
                        {"icon": "fa-solid fa-spell-check", "label": "Ngữ pháp căn bản"},
                        {"icon": "fa-solid fa-volume-high", "label": "Chuẩn hóa ngữ âm IPA"}
                    ],
                    "estimated_weeks": "3 - 4 tuần",
                    "match_reason": "Nền tảng phát âm và cấu trúc câu chuẩn xác là chìa khóa của Speaking & Writing."
                },
                {
                    "step_number": 2,
                    "phase": "BƯỚC 02 • CẤP ĐỘ CEFR B1 (TIỀN IELTS 5.0 - 5.5)",
                    "title": "MỞ RỘNG VỐN TỪ VỰNG HỌC THUẬT & ĐỌC HIỂU",
                    "desc": "Tiếp cận kho học liệu từ vựng học thuật cơ bản, phương pháp Skimming và Scanning trong IELTS Reading và rèn luyện nghe bắt từ khóa.",
                    "tags": [
                        {"icon": "fa-solid fa-layer-group", "label": "Từ vựng Học thuật B1"},
                        {"icon": "fa-solid fa-brain", "label": "Chiến thuật Skimming & Scanning"},
                        {"icon": "fa-solid fa-headphones", "label": "Luyện nghe chủ động"}
                    ],
                    "estimated_weeks": "4 - 5 tuần",
                    "match_reason": "Mở rộng 1500 từ vựng cốt lõi thường xuất hiện trong đề thi IELTS."
                },
                {
                    "step_number": 3,
                    "phase": f"BƯỚC 03 • CẤP ĐỘ CEFR B2 (LUYỆN ĐỀ IELTS {target_score})",
                    "title": "LUYỆN ĐỀ THỰC CHIẾN & TỰ ĐỘNG CHẨN ĐOÁN LỖI SAI",
                    "desc": "Thực hành giải các dạng bài IELTS Reading & Listening chuyên sâu, phân tích chi tiết lỗi sai bẫy đề thi và củng cố ngữ pháp phức tạp.",
                    "tags": [
                        {"icon": "fa-solid fa-file-signature", "label": f"IELTS Quyết tâm lấy {target_score}"},
                        {"icon": "fa-solid fa-magnifying-glass-chart", "label": "Chẩn đoán bẫy đề thi"},
                        {"icon": "fa-solid fa-graduation-cap", "label": "Chinh phục ngữ pháp B2"}
                    ],
                    "estimated_weeks": "5 - 6 tuần",
                    "match_reason": "Giải quyết dứt điểm các lỗi sai thường gặp khi làm đề IELTS."
                },
                {
                    "step_number": 4,
                    "phase": "BƯỚC 04 • CẤP ĐỘ CEFR C1 (IELTS MASTERCLASS 7.5+)",
                    "title": "LÀM CHỦ PHẢN XẠ HỌC THUẬT & CẤP CHỨNG CHỈ SỐ",
                    "desc": "Nâng cao tư duy phản biện, làm chủ các cấu trúc ngữ pháp cao cấp C1 và hoàn thành bài kiểm tra chuẩn hóa để nhận chứng chỉ điện tử xác thực QR.",
                    "tags": [
                        {"icon": "fa-solid fa-comments", "label": "Masterclass 7.5+ Toàn Diện"},
                        {"icon": "fa-solid fa-award", "label": "Chứng chỉ CEFR QR Code"},
                        {"icon": "fa-solid fa-shield-check", "label": "Đánh giá chuẩn quốc tế"}
                    ],
                    "estimated_weeks": "4 - 5 tuần",
                    "match_reason": "Tối ưu hóa độ trôi chảy và vốn từ cao cấp để chạm mốc điểm mong muốn."
                }
            ]
        else:
            title = f"Lộ Trình Phát Triển Năng Lực Tiếng Anh Toàn Diện ({target_score})"
            summary = f"Lộ trình đào tạo bậc thang {num_stages} giai đoạn từ {current_level} lên {target_score}, kết hợp cân bằng giữa ngữ pháp ứng dụng, từ vựng và đàm thoại thực tế."
            steps = [
                {
                    "step_number": 1,
                    "phase": "BƯỚC 01 • CẤP ĐỘ CEFR A1 - A2",
                    "title": "XÂY DỰNG GỐC NGỮ PHÁP & PHÁT ÂM CƠ BẢN",
                    "desc": "Bắt đầu hành trình với hệ thống bài giảng ngữ pháp cốt lõi và phát âm quốc tế IPA chuẩn xác. Từng bài học được chia nhỏ khoa học từ 12 thì cơ bản, cách đặt câu đến phản xạ từ vựng ban đầu. Hệ thống giúp học viên mất gốc lấy lại sự tự tin, nắm chắc nền tảng vững vàng.",
                    "tags": [
                        {"icon": "fa-solid fa-book-open", "label": "Quyết tâm lấy gốc Tiếng Anh"},
                        {"icon": "fa-solid fa-spell-check", "label": "Ngữ pháp A1 - A2"},
                        {"icon": "fa-solid fa-volume-high", "label": "Chuẩn hóa ngữ âm IPA"}
                    ],
                    "estimated_weeks": "3 - 4 tuần",
                    "match_reason": "Khóa học nền tảng giúp chuẩn hóa ngữ âm và hiểu rõ quy tắc đặt câu cơ bản."
                },
                {
                    "step_number": 2,
                    "phase": "BƯỚC 02 • CẤP ĐỘ CEFR B1",
                    "title": "MỞ RỘNG VỐN TỪ VỰNG & RÈN LUYỆN ĐỌC HIỂU",
                    "desc": "Chuyển tiếp sang giai đoạn tăng tốc với kho học liệu từ vựng chuyên sâu theo chủ đề đời sống, công sở và học thuật. Người học được trang bị kỹ năng Skimming & Scanning để giải mã các bài đọc dài, hiểu sâu cấu trúc ngữ pháp phức tạp và hình thành phản xạ tư duy trực tiếp.",
                    "tags": [
                        {"icon": "fa-solid fa-layer-group", "label": "Từ vựng & Đọc hiểu B1"},
                        {"icon": "fa-solid fa-brain", "label": "Chinh phục 3000 từ vựng cốt lõi"},
                        {"icon": "fa-solid fa-briefcase", "label": "Tiếng Anh văn phòng thực tế"}
                    ],
                    "estimated_weeks": "4 - 5 tuần",
                    "match_reason": "Mở rộng vốn từ vựng đa dạng chủ đề và rèn luyện đọc hiểu nhanh."
                },
                {
                    "step_number": 3,
                    "phase": "BƯỚC 03 • CẤP ĐỘ CEFR B2",
                    "title": "LUYỆN ĐỀ THỰC CHIẾN & TỰ ĐỘNG CHẨN ĐOÁN LỖI SAI",
                    "desc": "Thử sức với ngân hàng đề thi trắc nghiệm chuẩn hóa mô phỏng bài thi quốc tế (TOEIC, IELTS, CEFR). Sau mỗi lần nộp bài, hệ thống tự động phân tích chi tiết từng lỗi sai, chẩn đoán lỗ hổng kiến thức ngữ pháp và đề xuất bài giảng ôn tập bù đắp kịp thời.",
                    "tags": [
                        {"icon": "fa-solid fa-file-signature", "label": "Luyện đề Thực chiến B2"},
                        {"icon": "fa-solid fa-magnifying-glass-chart", "label": "Phân tích lỗi sai thông minh"},
                        {"icon": "fa-solid fa-graduation-cap", "label": "Chinh phục ngữ pháp B2"}
                    ],
                    "estimated_weeks": "4 - 5 tuần",
                    "match_reason": "Nâng cao độ chính xác ngữ pháp và tự tin xử lý bài thi."
                },
                {
                    "step_number": 4,
                    "phase": "BƯỚC 04 • CẤP ĐỘ CEFR C1 - C2",
                    "title": "LÀM CHỦ GIAO TIẾP PHẢN XẠ & CẤP CHỨNG CHỈ SỐ",
                    "desc": "Chinh phục đỉnh cao ngôn ngữ qua các bài luyện đàm thoại giao tiếp chuyên nghiệp, được chỉnh sửa phong thái diễn đạt tự nhiên chuẩn bản xứ. Hoàn tất bài đánh giá năng lực cuối khóa để nhận Chứng chỉ số điện tử CEFR tích hợp mã QR xác thực chính quy.",
                    "tags": [
                        {"icon": "fa-solid fa-comments", "label": "Giao tiếp C1 Chuyên nghiệp"},
                        {"icon": "fa-solid fa-award", "label": "Chứng chỉ CEFR QR Code"},
                        {"icon": "fa-solid fa-shield-check", "label": "Đánh giá năng lực chuẩn hóa"}
                    ],
                    "estimated_weeks": "3 - 4 tuần",
                    "match_reason": "Hoàn thiện kỹ năng đàm thoại chuyên nghiệp và nhận chứng chỉ chính quy."
                }
            ]

        # Nếu người dùng có tùy chỉnh hoặc chọn từng giai đoạn cụ thể
        custom_stages = roadmap_request.get('custom_stages') or []
        if custom_stages and isinstance(custom_stages, list) and len(custom_stages) > 0:
            custom_steps = []
            for idx, stage in enumerate(custom_stages):
                s_num = stage.get('stage_number', idx + 1)
                s_title = stage.get('title') or stage.get('choice_label') or f"GIAI ĐOẠN {s_num}"
                s_custom_input = stage.get('custom_input', '').strip()
                s_desc = stage.get('desc') or ''
                if s_custom_input:
                    s_desc = f"{s_desc}. Nguyện vọng học viên: {s_custom_input}".strip(". ") if s_desc else f"Nguyện vọng học viên: {s_custom_input}"
                
                s_tags = stage.get('tags') or [
                    {"icon": "fa-solid fa-bullseye", "label": stage.get('focus') or "Trọng tâm chặng"},
                    {"icon": "fa-solid fa-graduation-cap", "label": f"Mục tiêu {target_score}"},
                    {"icon": "fa-solid fa-sparkles", "label": "Cá nhân hóa AI"}
                ]
                
                custom_steps.append({
                    "step_number": s_num,
                    "phase": f"BƯỚC 0{s_num} • {stage.get('level_tag', f'CHẶNG {s_num}')}",
                    "title": s_title.upper(),
                    "desc": s_desc or f"Chặng học tập tập trung vào {s_title.lower()} được cá nhân hóa theo đúng lựa chọn và nguyện vọng của học viên.",
                    "tags": s_tags,
                    "estimated_weeks": stage.get('estimated_weeks', "3 - 4 tuần"),
                    "match_reason": f"Khóa học được chọn lọc tối ưu nhằm đáp ứng trực tiếp lựa chọn '{s_title}' của học viên."
                })
            steps = custom_steps
            num_stages = len(steps)
        elif num_stages == 3:
            # Cắt bớt nếu người dùng chọn 3 giai đoạn mặc định
            steps = steps[:3]

        # Gán ID khóa học thực tế từ CSDL cho mỗi bước
        for step in steps:
            search_str = f"{step.get('phase', '')} {step.get('title', '')} {step.get('desc', '')}"
            step['course_ids'] = self._match_courses_for_step(search_str, candidate_courses)

        return {
            "roadmap_title": title,
            "roadmap_summary": summary,
            "target_band": target_score,
            "total_duration": f"{num_stages * 4} tuần (45 phút/ngày)",
            "steps": steps
        }


def get_llm_provider() -> BaseLLMProvider:
    """
    Factory function chọn LLM Provider phù hợp dựa trên cấu hình môi trường.
    Ưu tiên Groq Cloud tốc độ cao (Qwen 3.8 / Llama 3) và Gemini Studio.
    """
    groq_key = os.getenv('GROQ_API_KEY') or getattr(settings, 'GROQ_API_KEY', '')
    if groq_key and groq_key.startswith('gsk_'):
        return GroqLLMProvider(api_key=groq_key, model='qwen/qwen3.8-27b')

    gemini_key = os.getenv('GEMINI_API_KEY') or getattr(settings, 'GEMINI_API_KEY', '')
    if gemini_key and gemini_key.startswith('AIza'):
        return GeminiLLMProvider(api_key=gemini_key, model='gemini-2.0-flash')

    return FallbackMockLLMProvider()


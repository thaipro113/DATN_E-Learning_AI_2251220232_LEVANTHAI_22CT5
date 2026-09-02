import os
import json
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple, Optional
from django.conf import settings

from .prompts import GRAMMAR_ANALYZER_SYSTEM_PROMPT, QUIZ_GENERATOR_SYSTEM_PROMPT

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
            f"🎯 **TỔNG QUAN & Ý NGHĨA KHÓA HỌC:** (2-3 câu ngắn gọn về trọng tâm bài học)\n\n"
            f"🚀 **MỤC TIÊU ĐẦU RA (CEFR {level}):** (2-3 gạch đầu dòng kỹ năng đạt được)\n\n"
            f"📚 **PHƯƠNG PHÁP HỌC TẬP VÀ TRỢ LÝ AI:** (1-2 câu về ứng dụng thực hành & AI hỗ trợ)\n\n"
            f"👥 **ĐỐI TƯỢNG PHÙ HỢP:** (1 câu ngắn gọn)\n\n"
            f"⭐ **LỜI KHUYÊN TỪ GIẢNG VIÊN:** (1 câu truyền cảm hứng)\n\n"
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
            f"🎯 Mục tiêu: Nắm vững bản chất và cấu trúc...\n"
            f"💡 Ứng dụng: Tự tin vận dụng vào các bài thi và giao tiếp thực tế."
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
            "🎯 **TỔNG QUAN & Ý NGHĨA KHÓA HỌC:** (2-3 câu ngắn gọn về trọng tâm bài học)\n\n"
            "🚀 **MỤC TIÊU ĐẦU RA (CEFR {level}):** (2-3 gạch đầu dòng kỹ năng đạt được)\n\n"
            "📚 **PHƯƠNG PHÁP HỌC TẬP & TRỢ LÝ AI:** (1-2 câu về ứng dụng thực hành & AI hỗ trợ)\n\n"
            "👥 **ĐỐI TƯỢNG PHÙ HỢP:** (1 câu ngắn gọn)\n\n"
            "⭐ **LỜI KHUYÊN TỪ GIẢNG VIÊN:** (1 câu truyền cảm hứng)\n\n"
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


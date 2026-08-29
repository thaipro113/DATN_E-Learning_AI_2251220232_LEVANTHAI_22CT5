import os
import json
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple, Optional
from django.conf import settings
import urllib.request
import urllib.error

from .prompts import GRAMMAR_ANALYZER_SYSTEM_PROMPT

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


class GeminiLLMProvider(BaseLLMProvider):
    """
    Tích hợp trực tiếp Google Gemini API (gemini-1.5-flash / gemini-1.5-pro).
    """

    def __init__(self, api_key: str, model: str = 'gemini-1.5-flash'):
        self.api_key = api_key
        self.model = model
        self.endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

    def generate_chat_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str
    ) -> Tuple[str, Dict[str, Any], int, str]:
        contents = []
        # Chuyển đổi lịch sử hội thoại sang format của Gemini API
        for msg in messages:
            role = 'user' if msg.get('role') == 'user' else 'model'
            contents.append({
                'role': role,
                'parts': [{'text': msg.get('content', '')}]
            })

        payload = {
            'contents': contents,
            'systemInstruction': {
                'parts': [{'text': system_prompt}]
            },
            'generationConfig': {
                'temperature': 0.7,
                'maxOutputTokens': 1024
            }
        }

        try:
            req = urllib.request.Request(
                self.endpoint,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                result = json.loads(response.read().decode('utf-8'))
                candidates = result.get('candidates', [])
                if candidates:
                    parts = candidates[0].get('content', {}).get('parts', [])
                    reply_text = parts[0].get('text', '') if parts else ''
                    token_count = result.get('usageMetadata', {}).get('totalTokenCount', 150)
                    return reply_text, {}, token_count, self.model
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}. Falling back to Mock Provider.")

        # Fallback nếu gọi API thất bại
        return FallbackMockLLMProvider().generate_chat_response(messages, system_prompt)

    def analyze_grammar(self, text: str, target_level: str = 'B1') -> Dict[str, Any]:
        payload = {
            'contents': [
                {'role': 'user', 'parts': [{'text': f"Vui lòng phân tích đoạn văn bản tiếng Anh sau:\n\n{text}"}]}
            ],
            'systemInstruction': {
                'parts': [{'text': GRAMMAR_ANALYZER_SYSTEM_PROMPT}]
            },
            'generationConfig': {
                'temperature': 0.2,
                'responseMimeType': 'application/json'
            }
        }

        try:
            req = urllib.request.Request(
                self.endpoint,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                result = json.loads(response.read().decode('utf-8'))
                candidates = result.get('candidates', [])
                if candidates:
                    raw_json = candidates[0].get('content', {}).get('parts', [{}])[0].get('text', '{}')
                    return json.loads(raw_json)
        except Exception as e:
            logger.warning(f"Gemini Grammar Analysis failed: {e}. Falling back to Mock Provider.")

        return FallbackMockLLMProvider().analyze_grammar(text, target_level)


class GroqLLMProvider(BaseLLMProvider):
    """
    Tích hợp Groq Cloud API (Llama-3.1, Mixtral) với tốc độ phản hồi cực nhanh.
    """

    def __init__(self, api_key: str, model: str = 'llama-3.1-70b-versatile'):
        self.api_key = api_key
        self.model = model
        self.endpoint = "https://api.groq.com/openai/v1/chat/completions"

    def generate_chat_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str
    ) -> Tuple[str, Dict[str, Any], int, str]:
        formatted_messages = [{'role': 'system', 'content': system_prompt}]
        for msg in messages:
            formatted_messages.append({
                'role': msg.get('role', 'user'),
                'content': msg.get('content', '')
            })

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
                    'Authorization': f"Bearer {self.api_key}"
                }
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                result = json.loads(response.read().decode('utf-8'))
                reply = result['choices'][0]['message']['content']
                tokens = result.get('usage', {}).get('total_tokens', 120)
                return reply, {}, tokens, self.model
        except Exception as e:
            logger.warning(f"Groq API call failed: {e}. Falling back to Mock Provider.")

        return FallbackMockLLMProvider().generate_chat_response(messages, system_prompt)

    def analyze_grammar(self, text: str, target_level: str = 'B1') -> Dict[str, Any]:
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
                    'Authorization': f"Bearer {self.api_key}"
                }
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                result = json.loads(response.read().decode('utf-8'))
                raw_json = result['choices'][0]['message']['content']
                return json.loads(raw_json)
        except Exception as e:
            logger.warning(f"Groq Grammar Analysis failed: {e}. Falling back to Mock Provider.")

        return FallbackMockLLMProvider().analyze_grammar(text, target_level)


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


def get_llm_provider() -> BaseLLMProvider:
    """
    Factory function chọn LLM Provider phù hợp dựa trên cấu hình môi trường.
    """
    gemini_key = os.getenv('GEMINI_API_KEY') or getattr(settings, 'GEMINI_API_KEY', '')
    if gemini_key:
        return GeminiLLMProvider(api_key=gemini_key)

    groq_key = os.getenv('GROQ_API_KEY') or getattr(settings, 'GROQ_API_KEY', '')
    if groq_key:
        return GroqLLMProvider(api_key=groq_key)

    return FallbackMockLLMProvider()

from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .serializers import (
    ChatSessionListSerializer,
    ChatSessionDetailSerializer,
    ChatSessionCreateSerializer,
    SendMessageRequestSerializer,
    SendMessageResponseSerializer,
    ChatMessageSerializer,
    GrammarCheckRequestSerializer,
    GrammarCheckResponseSerializer,
    GenerateProgressQuizRequestSerializer,
    GenerateTeacherQuizRequestSerializer,
    GeneratedQuestionPreviewSerializer
)


# ==================== CHAT SESSION SCHEMAS ====================

list_sessions_schema = extend_schema(
    tags=['AI Tutor & Chatbot'],
    summary='Danh sách các phiên trò chuyện AI của tôi',
    description='Lấy danh sách các phiên trò chuyện của học viên kèm bộ lọc theo loại phiên (`session_type`), tìm kiếm tiêu đề hoặc khóa học.',
    parameters=[
        OpenApiParameter(name='session_type', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='Loại phiên: GENERAL, LESSON_TUTOR, GRAMMAR_CHECK, ROLEPLAY'),
        OpenApiParameter(name='search', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='Tìm kiếm theo tiêu đề hoặc tên khóa học/bài học'),
    ],
    responses={
        200: OpenApiResponse(
            description='Lấy danh sách thành công',
            response=ChatSessionListSerializer(many=True)
        ),
        401: OpenApiResponse(description='Chưa xác thực')
    }
)

create_session_schema = extend_schema(
    tags=['AI Tutor & Chatbot'],
    summary='Khởi tạo phiên trò chuyện AI mới',
    description='Tạo phiên chat với AI Tutor. Hỗ trợ 4 chế độ: Trợ lý chung (`GENERAL`), Gia sư bài học (`LESSON_TUTOR`), Sửa lỗi ngữ pháp (`GRAMMAR_CHECK`), Nhập vai hội thoại (`ROLEPLAY`).',
    request=ChatSessionCreateSerializer,
    responses={
        201: OpenApiResponse(
            description='Tạo phiên chat thành công',
            response=ChatSessionDetailSerializer
        ),
        400: OpenApiResponse(description='Dữ liệu không hợp lệ'),
        401: OpenApiResponse(description='Chưa xác thực')
    }
)

get_session_detail_schema = extend_schema(
    tags=['AI Tutor & Chatbot'],
    summary='Xem chi tiết phiên chat & Lịch sử tin nhắn',
    description='Lấy toàn bộ lịch sử tin nhắn trao đổi giữa học viên và AI trong phiên hội thoại.',
    responses={
        200: OpenApiResponse(
            description='Lấy chi tiết thành công',
            response=ChatSessionDetailSerializer
        ),
        401: OpenApiResponse(description='Chưa xác thực'),
        404: OpenApiResponse(description='Không tìm thấy phiên chat')
    }
)

delete_session_schema = extend_schema(
    tags=['AI Tutor & Chatbot'],
    summary='Xóa phiên trò chuyện',
    description='Xóa phiên trò chuyện và toàn bộ lịch sử tin nhắn liên quan.',
    responses={
        200: OpenApiResponse(description='Xóa thành công'),
        401: OpenApiResponse(description='Chưa xác thực'),
        404: OpenApiResponse(description='Không tìm thấy phiên chat')
    }
)


# ==================== CHAT INTERACTION & GRAMMAR SCHEMAS ====================

send_message_schema = extend_schema(
    tags=['AI Tutor & Chatbot'],
    summary='Gửi tin nhắn đến Trợ lý AI Tutor',
    description='Gửi câu hỏi hoặc phản hồi của học viên. Hệ thống tự động nạp ngữ cảnh (Trình độ CEFR, bài học), gọi LLM Provider (Gemini/Groq), phân tích lỗi ngữ pháp và trả về câu trả lời sư phạm.',
    request=SendMessageRequestSerializer,
    responses={
        201: OpenApiResponse(
            description='Gửi tin nhắn thành công và nhận phản hồi AI',
            response=SendMessageResponseSerializer
        ),
        400: OpenApiResponse(description='Nội dung tin nhắn không hợp lệ'),
        401: OpenApiResponse(description='Chưa xác thực'),
        404: OpenApiResponse(description='Không tìm thấy phiên chat')
    }
)

grammar_check_schema = extend_schema(
    tags=['AI Tutor & Chatbot'],
    summary='Kiểm tra & Phân tích Sửa lỗi Ngữ pháp Tiếng Anh',
    description='API chuyên sâu: Phân tích đoạn văn bản tiếng Anh, phát hiện lỗi sai (thì, hòa hợp chủ vị, từ vựng, mạo từ), đưa ra câu sửa hoàn chỉnh và các cách diễn đạt tự nhiên hơn.',
    request=GrammarCheckRequestSerializer,
    responses={
        200: OpenApiResponse(
            description='Phân tích ngữ pháp thành công',
            response=GrammarCheckResponseSerializer
        ),
        400: OpenApiResponse(description='Dữ liệu không hợp lệ'),
        401: OpenApiResponse(description='Chưa xác thực')
    }
)


# ==================== AI QUIZ GENERATOR SCHEMAS ====================

generate_progress_quiz_schema = extend_schema(
    tags=['AI Quiz Generator'],
    summary='Học viên: Sinh đề ôn tập AI dựa trên bài học đã hoàn thành (UC_S7)',
    description='Tự động quét các bài học mà học viên ĐÃ HOÀN THÀNH trong Chapter chỉ định, gọi AI tạo đề trắc nghiệm tức thời và lưu vào cơ sở dữ liệu để làm bài ngay.',
    request=GenerateProgressQuizRequestSerializer,
    responses={
        201: OpenApiResponse(description='Tạo đề ôn tập AI thành công!'),
        400: OpenApiResponse(description='Chưa hoàn thành bài học nào trong chương hoặc lỗi dữ liệu'),
        401: OpenApiResponse(description='Chưa xác thực')
    }
)

generate_teacher_quiz_schema = extend_schema(
    tags=['AI Quiz Generator'],
    summary='Giáo viên: Sinh câu hỏi trắc nghiệm theo Chủ đề & Trình độ (UC_T4)',
    description='Cho phép Giáo viên / Admin nhập chủ đề (topic), trình độ (level) và kỹ năng để AI sinh bộ câu hỏi trắc nghiệm kèm 4 đáp án và lời giải thích xem trước.',
    request=GenerateTeacherQuizRequestSerializer,
    responses={
        200: OpenApiResponse(
            description='Sinh câu hỏi trắc nghiệm thành công',
            response=GeneratedQuestionPreviewSerializer(many=True)
        ),
        400: OpenApiResponse(description='Dữ liệu không hợp lệ'),
        401: OpenApiResponse(description='Chưa xác thực'),
        403: OpenApiResponse(description='Chỉ dành cho Giáo viên hoặc Admin')
    }
)


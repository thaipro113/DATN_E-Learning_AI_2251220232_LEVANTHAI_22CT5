from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .serializers import (
    LearningPathDetailSerializer,
    LearningPathStepSerializer,
    GenerateLearningPathRequestSerializer,
    SkillGapAnalysisSerializer,
    CourseRecommendationSerializer
)


# ==================== LEARNING PATH SCHEMAS ====================

get_my_learning_path_schema = extend_schema(
    tags=['Adaptive Learning & Recommendations'],
    summary='Xem Lộ trình học tập cá nhân hóa hiện tại của tôi',
    description='Lấy toàn bộ thông tin Lộ trình học tập đang kích hoạt của học viên kèm danh sách các chặng và phần trăm tiến độ hoàn thành.',
    responses={
        200: OpenApiResponse(
            description='Lấy lộ trình thành công',
            response=LearningPathDetailSerializer
        ),
        401: OpenApiResponse(description='Chưa xác thực')
    }
)

generate_learning_path_schema = extend_schema(
    tags=['Adaptive Learning & Recommendations'],
    summary='AI Tự động Sinh / Tái tạo Lộ trình Học tập Thích ứng mới',
    description='Hệ thống tự động phân tích điểm yếu từ các bài kiểm tra gần nhất, lưu trữ lộ trình cũ và kiến tạo lộ trình học mới theo trình độ mục tiêu của học viên.',
    request=GenerateLearningPathRequestSerializer,
    responses={
        201: OpenApiResponse(
            description='Khởi tạo lộ trình học tập thành công',
            response=LearningPathDetailSerializer
        ),
        400: OpenApiResponse(description='Dữ liệu không hợp lệ'),
        401: OpenApiResponse(description='Chưa xác thực')
    }
)

complete_step_schema = extend_schema(
    tags=['Adaptive Learning & Recommendations'],
    summary='Đánh dấu Hoàn thành một chặng trong Lộ trình',
    description='Cập nhật trạng thái chặng học thành Đã hoàn thành (`is_completed = True`), hệ thống tự động tính toán lại tổng tiến độ (%) của toàn bộ lộ trình.',
    responses={
        200: OpenApiResponse(
            description='Cập nhật tiến độ thành công',
            response=LearningPathStepSerializer
        ),
        400: OpenApiResponse(description='Chặng học không hợp lệ'),
        401: OpenApiResponse(description='Chưa xác thực'),
        404: OpenApiResponse(description='Không tìm thấy chặng học')
    }
)


# ==================== SKILL GAPS & RECOMMENDATIONS SCHEMAS ====================

list_skill_gaps_schema = extend_schema(
    tags=['Adaptive Learning & Recommendations'],
    summary='Bảng Phân tích Lỗ hổng Kỹ năng (Skill Gap Analysis)',
    description='Trả về ma trận điểm thành thạo của học viên trên 6 kỹ năng (Listening, Reading, Writing, Speaking, Grammar, Vocabulary) cùng danh sách các dạng bài còn yếu và lời khuyên sư phạm từ AI.',
    responses={
        200: OpenApiResponse(
            description='Lấy phân tích thành công',
            response=SkillGapAnalysisSerializer(many=True)
        ),
        401: OpenApiResponse(description='Chưa xác thực')
    }
)

list_course_recommendations_schema = extend_schema(
    tags=['Adaptive Learning & Recommendations'],
    summary='Danh sách Khóa học được AI đề xuất cho tôi',
    description='Gợi ý các khóa học phù hợp nhất với trình độ và điểm yếu của học viên dựa trên thuật toán Content-Based Filtering.',
    responses={
        200: OpenApiResponse(
            description='Lấy danh sách đề xuất thành công',
            response=CourseRecommendationSerializer(many=True)
        ),
        401: OpenApiResponse(description='Chưa xác thực')
    }
)

dismiss_course_recommendation_schema = extend_schema(
    tags=['Adaptive Learning & Recommendations'],
    summary='Ẩn / Bỏ qua Khóa học được đề xuất',
    description='Đánh dấu ẩn khóa học khỏi danh sách gợi ý của học viên.',
    responses={
        200: OpenApiResponse(description='Đã ẩn gợi ý thành công'),
        401: OpenApiResponse(description='Chưa xác thực'),
        404: OpenApiResponse(description='Không tìm thấy gợi ý')
    }
)

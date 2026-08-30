from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from common.responses import success_response, error_response
from .models import CourseRecommendation
from .serializers import (
    LearningPathDetailSerializer,
    LearningPathStepSerializer,
    GenerateLearningPathRequestSerializer,
    SkillGapAnalysisSerializer,
    CourseRecommendationSerializer
)
from .services import (
    LearningPathService,
    SkillGapService,
    CourseRecommendationService
)
from .schemas import (
    get_my_learning_path_schema,
    generate_learning_path_schema,
    complete_step_schema,
    list_skill_gaps_schema,
    list_course_recommendations_schema,
    dismiss_course_recommendation_schema
)


# ==================== LEARNING PATH VIEWS ====================

class MyLearningPathAPIView(APIView):
    """
    API Endpoint quản lý Lộ trình Học tập Cá nhân hóa của học viên.
    """
    permission_classes = [IsAuthenticated]

    @get_my_learning_path_schema
    def get(self, request):
        path = LearningPathService.get_active_learning_path(student=request.user)
        if not path:
            # Tự động sinh lộ trình mặc định nếu học viên chưa có
            path = LearningPathService.generate_adaptive_learning_path(
                student=request.user,
                target_level=request.user.level
            )

        serializer = LearningPathDetailSerializer(path)
        return success_response(
            data=serializer.data,
            message="Lấy thông tin lộ trình học tập thành công!",
            status_code=status.HTTP_200_OK
        )

    @generate_learning_path_schema
    def post(self, request):
        serializer = GenerateLearningPathRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu tạo lộ trình không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        target_level = serializer.validated_data.get('target_level')
        goal_description = serializer.validated_data.get('goal_description', '')

        path = LearningPathService.generate_adaptive_learning_path(
            student=request.user,
            target_level=target_level,
            goal_description=goal_description
        )

        return success_response(
            data=LearningPathDetailSerializer(path).data,
            message="AI đã kiến tạo Lộ trình Học tập Thích ứng mới thành công!",
            status_code=status.HTTP_201_CREATED
        )


class CompleteLearningPathStepAPIView(APIView):
    """
    API Endpoint đánh dấu hoàn thành một chặng trong Lộ trình.
    """
    permission_classes = [IsAuthenticated]

    @complete_step_schema
    def patch(self, request, step_id):
        success, message, step = LearningPathService.complete_step(
            user=request.user,
            step_id=str(step_id)
        )

        if not success:
            return error_response(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        return success_response(
            data=LearningPathStepSerializer(step).data,
            message=message,
            status_code=status.HTTP_200_OK
        )


# ==================== SKILL GAPS & RECOMMENDATIONS VIEWS ====================

class SkillGapAnalysisAPIView(APIView):
    """
    API Endpoint xem bảng phân tích năng lực và lỗ hổng kiến thức từng kỹ năng.
    """
    permission_classes = [IsAuthenticated]

    @list_skill_gaps_schema
    def get(self, request):
        gaps = SkillGapService.analyze_student_skill_gaps(student=request.user)
        serializer = SkillGapAnalysisSerializer(gaps, many=True)
        return success_response(
            data=serializer.data,
            message="Lấy phân tích năng lực kỹ năng thành công!",
            status_code=status.HTTP_200_OK
        )


class CourseRecommendationListAPIView(APIView):
    """
    API Endpoint lấy danh sách các khóa học được AI đề xuất cho học viên.
    """
    permission_classes = [IsAuthenticated]

    @list_course_recommendations_schema
    def get(self, request):
        recs = CourseRecommendationService.generate_course_recommendations(student=request.user)
        active_recs = [r for r in recs if not r.is_dismissed]
        serializer = CourseRecommendationSerializer(active_recs, many=True)
        return success_response(
            data=serializer.data,
            message="Lấy danh sách khóa học đề xuất thành công!",
            status_code=status.HTTP_200_OK
        )


class DismissCourseRecommendationAPIView(APIView):
    """
    API Endpoint ẩn / bỏ qua đề xuất khóa học.
    """
    permission_classes = [IsAuthenticated]

    @dismiss_course_recommendation_schema
    def post(self, request, recommendation_id):
        dismissed = CourseRecommendationService.dismiss_recommendation(
            student=request.user,
            recommendation_id=str(recommendation_id)
        )
        if not dismissed:
            return error_response(
                message="Không tìm thấy đề xuất khóa học để ẩn.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        return success_response(
            message="Đã ẩn đề xuất khóa học thành công!",
            status_code=status.HTTP_200_OK
        )

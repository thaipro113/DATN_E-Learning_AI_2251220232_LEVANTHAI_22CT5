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
    CourseRecommendationSerializer,
    WeakTopicQuizRequestSerializer,
    CourseRecommendationWizardRequestSerializer
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


class WeakTopicQuizGenerateAPIView(APIView):
    """
    API Endpoint: Luyện tập điểm yếu với AI (Weak-Topic Practice).
    Học viên chọn một weak topic, AI LLM tự động sinh 5 câu hỏi trắc nghiệm mới toanh.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = WeakTopicQuizRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu yêu cầu không hợp lệ.",
                data=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        topics_list = serializer.validated_data.get('topics', [])
        topic = serializer.validated_data.get('topic', '')
        sub_topic = serializer.validated_data.get('sub_topic', '')
        if topics_list and not topic:
            topic = ", ".join(topics_list[:4])
        if not topic:
            topic = "General English Grammar & Common Mistakes"

        level = serializer.validated_data.get('level', 'B1')
        quantity = serializer.validated_data.get('quantity', 5)

        from apps.ai.llm_client import get_llm_provider
        provider = get_llm_provider()

        try:
            quiz_result = provider.generate_weak_topic_quiz(
                topic=topic,
                sub_topic=sub_topic,
                level=level,
                quantity=quantity
            )
            return success_response(
                data=quiz_result,
                message=f"AI đã sinh thành công {len(quiz_result.get('questions', []))} câu hỏi luyện tập cho các lỗi sai!",
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return error_response(
                message=f"Lỗi khi sinh câu hỏi luyện tập từ AI: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StudentMistakeAnalysisAPIView(APIView):
    """
    API Endpoint: Trích xuất và phân tích toàn bộ lỗi sai của học viên khi làm bài trắc nghiệm.
    - Kiểm tra học viên đã đăng ký khóa học hay chưa.
    - Kiểm tra học viên đã làm bài trắc nghiệm hay chưa.
    - Đọc chi tiết từng câu hỏi làm sai, đáp án học viên chọn, đáp án đúng.
    - Trích xuất chủ đề (Topic), cấu trúc ngữ pháp (Sub-topic), lý giải của AI.
    - Gom nhóm các chủ đề yếu để học viên chọn và yêu cầu AI sinh đề trắc nghiệm luyện tập.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.learning.models import Enrollment
        from apps.assessments.models import StudentAnswer, QuizAttempt, QuestionAIAnalysis
        from apps.ai.services import QuestionAnalysisAIService

        student = request.user
        has_enrolled_courses = Enrollment.objects.filter(student=student).exists()
        has_quiz_attempts = QuizAttempt.objects.filter(student=student).exists()

        # Lấy tất cả câu trả lời sai của học viên
        wrong_answers = StudentAnswer.objects.filter(
            attempt__student=student,
            is_correct=False
        ).select_related(
            'question',
            'selected_option',
            'attempt__quiz',
            'question__ai_analysis'
        ).prefetch_related('question__options').order_by('-created_at')

        mistakes_list = []
        topics_counter = {}

        for ans in wrong_answers:
            q = ans.question
            ai = getattr(q, 'ai_analysis', None)
            if not ai:
                try:
                    ai = QuestionAnalysisAIService.analyze_and_store_question(q)
                except Exception:
                    ai = None

            topic = ai.topic if ai else (q.skill or 'Ngữ pháp chung')
            sub_topic = ai.sub_topic if ai else ''
            difficulty = ai.difficulty if ai else q.level
            reason = ai.reason if ai else (q.explanation or '')

            # Lấy danh sách phương án lựa chọn
            options_data = [
                {
                    'id': str(opt.id),
                    'content': opt.content,
                    'is_correct': opt.is_correct
                }
                for opt in q.options.all().order_by('order_index')
            ]
            correct_opt = next((opt['content'] for opt in options_data if opt['is_correct']), '')
            student_opt = ans.selected_option.content if ans.selected_option else ans.text_answer

            # Gom nhóm theo chủ đề
            topic_key = topic
            if topic_key not in topics_counter:
                topics_counter[topic_key] = {
                    'topic': topic,
                    'sub_topic': sub_topic,
                    'count': 0,
                    'difficulty': difficulty,
                    'skill': q.skill,
                    'sample_reason': reason
                }
            topics_counter[topic_key]['count'] += 1

            mistakes_list.append({
                'id': str(ans.id),
                'question_id': str(q.id),
                'question_content': q.content,
                'options': options_data,
                'student_selected': student_opt,
                'correct_answer': correct_opt,
                'topic': topic,
                'sub_topic': sub_topic,
                'difficulty': difficulty,
                'skill': q.skill,
                'reason': reason,
                'quiz_title': ans.attempt.quiz.title if ans.attempt and ans.attempt.quiz else 'Bài trắc nghiệm',
                'attempt_date': ans.created_at.strftime('%d/%m/%Y %H:%M')
            })

        sorted_topics = sorted(topics_counter.values(), key=lambda x: x['count'], reverse=True)

        return success_response(
            data={
                'has_enrolled_courses': has_enrolled_courses,
                'has_quiz_attempts': has_quiz_attempts,
                'total_mistakes': len(mistakes_list),
                'weak_topics': sorted_topics,
                'mistakes': mistakes_list
            },
            message="Phân tích lỗi sai trắc nghiệm của học viên thành công!",
            status_code=status.HTTP_200_OK
        )


class CourseRecommendationWizardAPIView(APIView):
    """
    API Endpoint: AI Course Recommendation Wizard 4 bước.
    Dựa trên 4 bước chọn (mục tiêu, trình độ, kỹ năng ưu tiên, thời gian học) và CSDL PostgreSQL.
    LLM xếp hạng và giải thích lý do sư phạm phù hợp.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CourseRecommendationWizardRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu khảo sát không hợp lệ.",
                data=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        try:
            recs = CourseRecommendationService.recommend_courses_with_wizard(
                student=request.user,
                goal=serializer.validated_data.get('goal', ''),
                self_level=serializer.validated_data.get('self_level', 'B1'),
                priority_skill=serializer.validated_data.get('priority_skill', ''),
                daily_time=serializer.validated_data.get('daily_time', '30 phút'),
                limit=5
            )

            rec_serializer = CourseRecommendationSerializer(recs, many=True)
            return success_response(
                data=rec_serializer.data,
                message="AI đã phân tích CSDL và tìm thấy các khóa học phù hợp nhất với bạn!",
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return error_response(
                message=f"Lỗi khi gợi ý khóa học từ AI: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

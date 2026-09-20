from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from common.responses import success_response, error_response
from .serializers import (
    WeakTopicQuizRequestSerializer,
    CourseRecommendationWizardRequestSerializer
)


# ==================== LỘ TRÌNH & ĐỀ XUẤT (ĐÃ LƯỢC BỎ BẢNG CSDL) ====================

class MyLearningPathAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(data=None, message="Chức năng đã được lược bớt để tập trung vào các chức năng cốt lõi.")

    def post(self, request):
        return success_response(data=None, message="Chức năng đã được lược bớt để tập trung vào các chức năng cốt lõi.")


class CompleteLearningPathStepAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, step_id):
        return success_response(data=None, message="OK")


class SkillGapAnalysisAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(data=[], message="OK")


class CourseRecommendationListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(data=[], message="OK")


class DismissCourseRecommendationAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, recommendation_id):
        return success_response(message="OK")


class CourseRecommendationWizardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return success_response(data=[], message="OK")


# ==================== CHỨC NĂNG AI CỐT LÕI: PHÂN TÍCH LỖI SAI & LUYỆN TẬP ====================

class StudentMistakeAnalysisAPIView(APIView):
    """
    API Endpoint: Trích xuất và phân tích toàn bộ lỗi sai của học viên khi làm bài trắc nghiệm.
    (Chức năng AI trọng tâm của đồ án: Phân tích lỗi sai bằng LLM)
    - Đọc chi tiết từng câu hỏi làm sai, đáp án học viên chọn, đáp án đúng.
    - Trích xuất chủ đề (Topic), cấu trúc ngữ pháp (Sub-topic), lý giải của AI từ QuestionAIAnalysis.
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

        # Lấy tất cả câu trả lời sai chưa được khắc phục của học viên
        wrong_answers = StudentAnswer.objects.filter(
            attempt__student=student,
            is_correct=False,
            is_resolved=False
        ).select_related(
            'question',
            'selected_option',
            'attempt__quiz',
            'question__ai_analysis'
        ).prefetch_related('question__options').order_by('-created_at')

        # Từ điển chuẩn hóa tên tiếng Việt cho các chủ đề ngữ pháp tiếng Anh
        TOPIC_VI_MAP = {
            'Present Continuous': 'Thì hiện tại tiếp diễn',
            'Present Progressive': 'Thì hiện tại tiếp diễn',
            'Present Continuous (Present Progressive)': 'Thì hiện tại tiếp diễn',
            'Present Simple': 'Thì hiện tại đơn',
            'Present Simple vs. Present Continuous': 'Phân biệt Thì hiện tại đơn & Hiện tại tiếp diễn',
            'Present Perfect': 'Thì hiện tại hoàn thành',
            'Present Perfect Continuous': 'Thì hiện tại hoàn thành tiếp diễn',
            'Past Simple': 'Thì quá khứ đơn',
            'Past Continuous': 'Thì quá khứ tiếp diễn',
            'Past Perfect': 'Thì quá khứ hoàn thành',
            'Future Simple': 'Thì tương lai đơn',
            'Relative Clauses': 'Mệnh đề quan hệ',
            'Conditionals': 'Câu điều kiện',
            'Passive Voice': 'Thể bị động',
            'Reported Speech': 'Câu gián tiếp / tường thuật',
            'Modal Verbs': 'Động từ khuyết thiếu',
            'Prepositions': 'Giới từ',
            'Articles': 'Mạo từ',
            'Gerunds and Infinitives': 'Danh động từ & Động từ nguyên mẫu',
        }

        # Gom nhóm câu hỏi trùng lặp: Nếu học viên làm sai nhiều lần cùng 1 câu hỏi,
        # chỉ lấy 1 bản ghi với mốc thời gian mới nhất và đếm số lần làm sai
        grouped_answers = {}
        for ans in wrong_answers:
            q_id = str(ans.question.id)
            if q_id not in grouped_answers:
                grouped_answers[q_id] = []
            grouped_answers[q_id].append(ans)

        mistakes_list = []
        topics_counter = {}

        for q_id, ans_group in grouped_answers.items():
            # ans_group đã được order_by('-created_at') nên phần tử đầu tiên là mốc thời gian mới nhất
            latest_ans = ans_group[0]
            repeat_count = len(ans_group)
            all_mistake_ids = [str(a.id) for a in ans_group]

            q = latest_ans.question
            ai = getattr(q, 'ai_analysis', None)
            if not ai:
                try:
                    ai = QuestionAnalysisAIService.analyze_and_store_question(q)
                except Exception:
                    ai = None

            topic = ai.topic if ai else (q.skill or 'Ngữ pháp chung')
            topic_vi = TOPIC_VI_MAP.get(topic, TOPIC_VI_MAP.get(topic.split('(')[0].strip(), ''))
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
            student_opt = latest_ans.selected_option.content if latest_ans.selected_option else latest_ans.text_answer

            # Gom nhóm theo chủ đề
            topic_key = topic
            if topic_key not in topics_counter:
                topics_counter[topic_key] = {
                    'topic': topic_key,
                    'topic_vi': topic_vi,
                    'sub_topics': set(),
                    'count': 0,
                    'sample_reason': reason
                }
            topics_counter[topic_key]['count'] += 1
            if sub_topic:
                topics_counter[topic_key]['sub_topics'].add(sub_topic)

            mistakes_list.append({
                'id': str(latest_ans.id),
                'mistake_id': str(latest_ans.id),
                'all_ids': all_mistake_ids,
                'repeat_count': repeat_count,
                'question_id': str(q.id),
                'question_content': q.content,
                'question_text': q.content,
                'quiz_title': latest_ans.attempt.quiz.title,
                'student_choice': student_opt,
                'student_selected': student_opt,
                'correct_choice': correct_opt,
                'correct_answer': correct_opt,
                'options': options_data,
                'topic': topic,
                'topic_vi': topic_vi,
                'sub_topic': sub_topic,
                'difficulty': difficulty,
                'reason': reason,
                'attempted_at': latest_ans.created_at.strftime('%d/%m/%Y %H:%M'),
                'attempt_date': latest_ans.created_at.strftime('%d/%m/%Y %H:%M')
            })

        # Danh sách chủ đề tổng hợp
        weak_topics_summary = []
        for t_info in topics_counter.values():
            weak_topics_summary.append({
                'topic': t_info['topic'],
                'topic_vi': t_info['topic_vi'],
                'count': t_info['count'],
                'sub_topics': list(t_info['sub_topics']),
                'sub_topic': ", ".join(list(t_info['sub_topics'])[:3]),
                'sample_reason': t_info['sample_reason']
            })

        weak_topics_summary.sort(key=lambda x: x['count'], reverse=True)

        return success_response(
            data={
                'has_enrolled_courses': has_enrolled_courses,
                'has_quiz_attempts': has_quiz_attempts,
                'total_mistakes': len(mistakes_list),
                'mistakes': mistakes_list,
                'weak_topics': weak_topics_summary,
                'weak_topics_summary': weak_topics_summary
            },
            message="Lấy danh sách lỗi sai và phân tích thành công!"
        )


class ResolveStudentMistakeAPIView(APIView):
    """
    API Endpoint: Đánh dấu câu hỏi sai đã được học viên luyện tập và xóa khỏi danh sách.
    Hỗ trợ xóa từng câu đơn lẻ (URL param) hoặc xóa hàng loạt (Body JSON).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, mistake_id=None):
        from apps.assessments.models import StudentAnswer

        target_ids = []
        if mistake_id:
            target_ids.append(mistake_id)

        body_ids = request.data.get('mistake_ids', []) if isinstance(request.data, dict) else []
        if isinstance(body_ids, list):
            target_ids.extend(body_ids)

        # Loại bỏ trùng lặp
        target_ids = list(set(target_ids))

        if not target_ids:
            return error_response(
                message="Vui lòng cung cấp mã câu hỏi sai cần xóa.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        updated = StudentAnswer.objects.filter(
            id__in=target_ids,
            attempt__student=request.user
        ).update(is_resolved=True)

        if updated > 0:
            return success_response(
                data={"resolved_count": updated, "resolved": True},
                message=f"Đã khắc phục và xóa thành công {updated} câu hỏi sai!",
                status_code=status.HTTP_200_OK
            )
        return error_response(
            message="Không tìm thấy câu trả lời tương ứng hoặc đã được khắc phục.",
            status_code=status.HTTP_404_NOT_FOUND
        )


class WeakTopicQuizGenerateAPIView(APIView):
    """
    API Endpoint: Luyện tập điểm yếu với AI (Weak-Topic Practice).
    Học viên chọn một weak topic, AI LLM tự động sinh câu hỏi trắc nghiệm mới.
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

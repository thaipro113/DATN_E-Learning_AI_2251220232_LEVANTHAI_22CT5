import uuid
from typing import Tuple, Dict, Any, List, Optional
from django.db import transaction
from django.db.models import Q
from apps.accounts.models import CustomUser
from apps.courses.models import Course, Chapter, Lesson
from apps.learning.models import Enrollment, LessonProgress
from apps.assessments.models import (
    Quiz,
    Question,
    AnswerOption,
    QuizType,
    QuestionType,
    SkillType
)
from .models import ChatSession, ChatMessage, SessionType, MessageSenderType
from .prompts import build_system_prompt, build_quiz_generation_prompt
from .llm_client import get_llm_provider


class AIService:
    """
    Tầng xử lý nghiệp vụ cho Hệ thống Trợ lý Gia sư AI và Phân tích Ngữ pháp.
    """

    @staticmethod
    def create_session(student: CustomUser, validated_data: dict) -> ChatSession:
        """
        Khởi tạo phiên trò chuyện AI mới và lưu tin nhắn mở đầu (nếu có).
        """
        initial_message = validated_data.pop('initial_message', None)
        session = ChatSession.objects.create(student=student, **validated_data)
        if initial_message:
            ChatMessage.objects.create(
                session=session,
                sender_type=MessageSenderType.AI,
                content=initial_message,
                model_used='AI Communication Coach'
            )
        return session

    @staticmethod
    def list_student_sessions(student: CustomUser, filters: Dict[str, Any] = None):
        """
        Lấy danh sách các phiên trò chuyện của học viên.
        """
        filters = filters or {}
        queryset = ChatSession.objects.filter(student=student, is_active=True).select_related('course', 'lesson')

        session_type = filters.get('session_type')
        if session_type:
            queryset = queryset.filter(session_type=session_type.upper())

        search = filters.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(course__title__icontains=search) |
                Q(lesson__title__icontains=search)
            )

        return queryset.order_by('-updated_at')

    @staticmethod
    def get_session_detail(user: CustomUser, session_id: str) -> Optional[ChatSession]:
        """
        Lấy chi tiết phiên trò chuyện kèm toàn bộ lịch sử tin nhắn.
        """
        try:
            session_uuid = uuid.UUID(str(session_id))
            queryset = ChatSession.objects.select_related('student', 'course', 'lesson').prefetch_related('messages')

            if user.role != 'ADMIN':
                queryset = queryset.filter(student=user)

            return queryset.filter(id=session_uuid).first()
        except (ValueError, TypeError):
            return None

    @staticmethod
    def delete_session(user: CustomUser, session_id: str) -> bool:
        """
        Xóa (Soft delete) phiên trò chuyện.
        """
        session = AIService.get_session_detail(user=user, session_id=session_id)
        if not session:
            return False

        session.is_active = False
        session.save(update_fields=['is_active', 'updated_at'])
        return True

    @staticmethod
    def send_message_and_get_ai_reply(
        student: CustomUser,
        session_id: str,
        content: str,
        audio_url: str = None
    ) -> Tuple[bool, str, Optional[ChatMessage], Optional[ChatMessage]]:
        """
        Gửi tin nhắn từ học viên, lưu vào DB, gọi LLM xử lý và lưu tin nhắn phản hồi của AI.
        """
        session = AIService.get_session_detail(user=student, session_id=session_id)
        if not session:
            return False, "Không tìm thấy phiên trò chuyện yêu cầu.", None, None

        if not content or not content.strip():
            return False, "Nội dung tin nhắn không được để trống.", None, None

        with transaction.atomic():
            # 1. Lưu tin nhắn của học viên
            user_message = ChatMessage.objects.create(
                session=session,
                sender_type=MessageSenderType.USER,
                content=content.strip(),
                audio_url=audio_url
            )

            # 2. Xây dựng System Prompt kèm ngữ cảnh khóa học/bài học
            course_title = session.course.title if session.course else None
            lesson_title = session.lesson.title if session.lesson else None
            student_level = getattr(session, 'target_level', None) or session.student.level or 'B1'

            system_prompt = build_system_prompt(
                session_type=session.session_type,
                target_level=student_level,
                course_title=course_title,
                lesson_title=lesson_title
            )

            # Lấy 10 tin nhắn gần nhất để làm ngữ cảnh hội thoại liên tục
            recent_messages = list(session.messages.order_by('created_at')[:10])
            history = []
            for msg in recent_messages:
                role = 'user' if msg.sender_type == MessageSenderType.USER else 'assistant'
                history.append({'role': role, 'content': msg.content})

            # 3. Gọi LLM Provider
            provider = get_llm_provider()
            reply_text, grammar_corrections, token_count, model_name = provider.generate_chat_response(
                messages=history,
                system_prompt=system_prompt
            )

            # 4. Lưu tin nhắn phản hồi của AI
            ai_message = ChatMessage.objects.create(
                session=session,
                sender_type=MessageSenderType.AI,
                content=reply_text,
                grammar_corrections=grammar_corrections or {},
                token_count=token_count,
                model_used=model_name
            )

            # Cập nhật thời điểm phiên chat
            session.save(update_fields=['updated_at'])

        return True, "Gửi tin nhắn và nhận phản hồi AI thành công!", user_message, ai_message

    @staticmethod
    def check_grammar_text(text: str, target_level: str = 'B1') -> Dict[str, Any]:
        """
        API Chuyên biệt: Phân tích & Sửa lỗi ngữ pháp/từ vựng cho một đoạn văn bản.
        """
        if not text or not text.strip():
            return {
                'has_errors': False,
                'original_text': '',
                'corrected_text': '',
                'errors_count': 0,
                'errors': [],
                'better_alternatives': [],
                'overall_comment_vi': "Vui lòng nhập đoạn văn bản cần kiểm tra."
            }

        provider = get_llm_provider()
        return provider.analyze_grammar(text=text.strip(), target_level=target_level)


class AIQuizService:
    """
    Tầng xử lý nghiệp vụ cho việc Sinh bài tập trắc nghiệm tự động bằng AI (AI Quiz Generation Engine).
    Hỗ trợ 2 Use Case:
    1. Học viên: Tự động tạo Quiz ôn tập nhanh dựa trên các bài học đã hoàn thành trong Chapter (UC_S7).
    2. Giáo viên: Sinh bộ câu hỏi trắc nghiệm theo Topic, Trình độ CEFR và Kỹ năng (UC_T4).
    """

    @staticmethod
    def generate_practice_quiz_by_progress(
        student: CustomUser,
        chapter_id: str,
        num_questions: int = 5
    ) -> Tuple[bool, str, Optional[Quiz]]:
        """
        Sinh đề ôn tập AI tức thời dựa trên các bài học đã học trong Chapter của học viên.
        """
        try:
            chapter_uuid = uuid.UUID(str(chapter_id))
            chapter = Chapter.objects.select_related('course').filter(id=chapter_uuid).first()
        except (ValueError, TypeError):
            return False, "Mã chương học không hợp lệ.", None

        if not chapter:
            return False, "Không tìm thấy chương học yêu cầu.", None

        course = chapter.course

        # 1. Kiểm tra lần ghi danh của học viên
        enrollment = Enrollment.objects.filter(student=student, course=course).first()
        if not enrollment:
            return False, "Bạn chưa ghi danh vào khóa học chứa chương này.", None

        # 2. Lấy danh sách các bài học mà học viên ĐÃ HOÀN THÀNH trong chương này
        completed_progresses = LessonProgress.objects.filter(
            enrollment=enrollment,
            lesson__chapter=chapter,
            is_completed=True
        ).select_related('lesson')

        if not completed_progresses.exists():
            # Nếu chưa đánh dấu hoàn thành, lấy các bài học trong chương để học viên có thể ôn tập ngay
            chapter_lessons = Lesson.objects.filter(chapter=chapter).order_by('order_index')
            if chapter_lessons.exists():
                completed_lessons_info = [
                    f"{l.title} ({l.content[:120] if l.content else 'Kiến thức trọng tâm bài học'})"
                    for l in chapter_lessons
                ]
            else:
                return False, f"Chương '{chapter.title}' chưa có bài học nào để tạo đề ôn tập.", None
        else:
            completed_lessons_info = [
                f"{p.lesson.title} ({p.lesson.content[:120] if p.lesson.content else 'Kiến thức trọng tâm bài học'})"
                for p in completed_progresses
            ]

        # 3. Tạo Prompt bám sát ngữ cảnh các bài đã học
        prompt = build_quiz_generation_prompt(
            context_type='PROGRESS_BASED',
            target_level=student.level or 'B1',
            num_questions=min(max(num_questions, 3), 10),
            chapter_title=chapter.title,
            completed_lessons=completed_lessons_info
        )

        # 4. Gọi LLM Provider sinh câu hỏi
        provider = get_llm_provider()
        questions_raw = provider.generate_quiz_questions(prompt)

        if not questions_raw:
            return False, "Không thể sinh câu hỏi từ mô hình AI vào lúc này. Vui lòng thử lại sau.", None

        # 5. Lưu Quiz loại PRACTICE và các Questions/Options vào CSDL
        with transaction.atomic():
            quiz_title = f"⚡ Ôn tập AI: {chapter.title}"
            quiz = Quiz.objects.create(
                course=course,
                created_by=student,
                title=quiz_title,
                description=f"Đề ôn tập thích ứng được AI tạo tự động dựa trên {len(completed_lessons_info)} bài học bạn đã hoàn thành trong chương '{chapter.title}'.",
                quiz_type=QuizType.PRACTICE,
                level=student.level or 'B1',
                time_limit_minutes=max(len(questions_raw) * 2, 5),
                passing_score=70.0,
                is_published=True
            )

            for q_idx, q_data in enumerate(questions_raw, start=1):
                skill_val = q_data.get('skill', 'GRAMMAR')
                if skill_val not in [c[0] for c in SkillType.choices]:
                    skill_val = SkillType.GRAMMAR

                level_val = q_data.get('level', student.level or 'B1')

                question = Question.objects.create(
                    quiz=quiz,
                    content=q_data.get('content', f"Question {q_idx}"),
                    question_type=QuestionType.SINGLE_CHOICE,
                    skill=skill_val,
                    level=level_val,
                    explanation=q_data.get('explanation_vi', ''),
                    points=float(q_data.get('points', 1.0)),
                    order_index=q_idx
                )

                options_data = q_data.get('options', [])
                # Đảm bảo có ít nhất 1 đáp án đúng
                has_correct = any(opt.get('is_correct') for opt in options_data)
                for opt_idx, opt in enumerate(options_data, start=1):
                    is_corr = opt.get('is_correct', False)
                    if not has_correct and opt_idx == 1:
                        is_corr = True  # Fallback nếu AI quên cờ đúng

                    AnswerOption.objects.create(
                        question=question,
                        content=opt.get('content', f"Option {opt_idx}"),
                        is_correct=is_corr,
                        order_index=opt_idx
                    )

        return True, f"Tạo đề ôn tập AI thành công gồm {quiz.total_questions} câu hỏi!", quiz

    @staticmethod
    def generate_quiz_for_teacher(
        teacher: CustomUser,
        topic: str,
        level: str = 'B1',
        count: int = 5,
        skill: str = 'GRAMMAR'
    ) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Sinh danh sách câu hỏi trắc nghiệm theo chủ đề để Giáo viên xem trước và chỉnh sửa trên Form.
        """
        count = min(max(count, 1), 20)
        prompt = build_quiz_generation_prompt(
            context_type='TOPIC_BASED',
            target_level=level,
            num_questions=count,
            topic=topic,
            skill=skill
        )

        provider = get_llm_provider()
        questions = provider.generate_quiz_questions(prompt)

        if not questions:
            return False, "Không thể sinh câu hỏi vào lúc này. Vui lòng thử lại.", []

        return True, f"Sinh thành công {len(questions)} câu hỏi trắc nghiệm từ AI!", questions

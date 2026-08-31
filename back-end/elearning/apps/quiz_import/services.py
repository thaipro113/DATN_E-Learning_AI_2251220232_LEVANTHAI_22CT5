import logging
from typing import List, Dict, Any, Tuple, Optional
from django.db import transaction
from django.core.files.uploadedfile import UploadedFile

from apps.accounts.models import CustomUser, UserRole
from apps.assessments.models import (
    Quiz,
    Question,
    AnswerOption,
    QuestionType,
    SkillType
)
from .models import QuizImportBatch, ImportSourceType, BatchStatus
from .parsers import (
    RawTextQuizParser,
    CSVQuizParser,
    DocxQuizParser,
    AIQuizExtractionParser
)

logger = logging.getLogger(__name__)


class QuizImportService:
    """
    Service quản lý toàn bộ quy trình Import đề thi:
    1. Tiếp nhận tệp hoặc văn bản
    2. Phân tích cú pháp & Bóc tách câu hỏi
    3. Cho phép xem trước (Preview)
    4. Ghi dữ liệu hàng loạt vào CSDL Đề thi (Bulk Insert)
    """

    @classmethod
    def create_and_parse_batch(
        cls,
        teacher: CustomUser,
        title: str = "Phiên nhập đề thi",
        source_type: str = ImportSourceType.RAW_TEXT,
        file: Optional[UploadedFile] = None,
        raw_text: str = "",
        use_ai: bool = False,
        quiz_id: Optional[str] = None
    ) -> QuizImportBatch:
        """
        Tạo mới một batch và thực hiện phân tích cú pháp trích xuất danh sách câu hỏi.
        """
        target_quiz = None
        if quiz_id:
            target_quiz = Quiz.objects.filter(id=quiz_id).first()

        batch = QuizImportBatch.objects.create(
            teacher=teacher,
            quiz=target_quiz,
            title=title or f"Import Đề thi ({source_type})",
            source_type=source_type,
            file=file,
            raw_text=raw_text,
            use_ai=use_ai,
            status=BatchStatus.PENDING
        )

        try:
            parsed_questions = cls._execute_parsing(batch)
            if parsed_questions:
                batch.parsed_data = parsed_questions
                batch.total_parsed = len(parsed_questions)
                batch.status = BatchStatus.PARSED
                batch.error_log = ""
            else:
                batch.status = BatchStatus.FAILED
                batch.error_log = "Không tìm thấy hoặc không bóc tách được câu hỏi nào từ nguồn cung cấp."
        except Exception as e:
            logger.error(f"Error while parsing QuizImportBatch {batch.id}: {e}", exc_info=True)
            batch.status = BatchStatus.FAILED
            batch.error_log = str(e)

        batch.save()
        return batch

    @classmethod
    def _execute_parsing(cls, batch: QuizImportBatch) -> List[Dict[str, Any]]:
        """
        Lựa chọn parser phù hợp theo định dạng nguồn và tùy chọn AI.
        """
        # 1. Nếu bật cờ AI -> Ưu tiên AI Smart Parser
        if batch.use_ai:
            text_to_parse = batch.raw_text
            if batch.file and not text_to_parse:
                # Đọc nội dung file dạng text
                file_bytes = batch.file.read()
                if batch.source_type == ImportSourceType.DOCX:
                    text_to_parse = DocxQuizParser.extract_text_from_docx(file_bytes)
                else:
                    text_to_parse = file_bytes.decode('utf-8', errors='ignore')
            return AIQuizExtractionParser().parse(text_to_parse)

        # 2. Phân tích theo bộ Parser chuyên biệt từng định dạng
        if batch.source_type == ImportSourceType.RAW_TEXT:
            return RawTextQuizParser().parse(batch.raw_text)

        elif batch.source_type == ImportSourceType.CSV:
            if not batch.file:
                return CSVQuizParser().parse(batch.raw_text)
            csv_content = batch.file.read().decode('utf-8', errors='ignore')
            return CSVQuizParser().parse(csv_content)

        elif batch.source_type == ImportSourceType.DOCX:
            if not batch.file:
                return RawTextQuizParser().parse(batch.raw_text)
            file_bytes = batch.file.read()
            return DocxQuizParser().parse(file_bytes)

        elif batch.source_type == ImportSourceType.XLSX:
            # Nếu là file Excel, thử đọc dạng CSV text hoặc văn bản
            if batch.file:
                file_bytes = batch.file.read()
                return RawTextQuizParser().parse(file_bytes.decode('utf-8', errors='ignore'))
            return RawTextQuizParser().parse(batch.raw_text)

        return RawTextQuizParser().parse(batch.raw_text)

    @classmethod
    def confirm_and_import_to_quiz(
        cls,
        user: CustomUser,
        batch_id: str,
        quiz_id: str,
        custom_questions: Optional[List[Dict[str, Any]]] = None
    ) -> Tuple[bool, str, int]:
        """
        Xác nhận và chèn toàn bộ câu hỏi vào Đề thi đích trong CSDL.
        Hỗ trợ việc Giáo viên có thể tùy chỉnh danh sách câu hỏi trong bảng Preview trước khi Import.
        """
        batch = QuizImportBatch.objects.filter(id=batch_id).first()
        if not batch:
            return False, "Không tìm thấy phiên import đề thi.", 0

        # Kiểm tra quyền: Chỉ người tạo batch hoặc Admin mới được xác nhận
        if batch.teacher != user and user.role != UserRole.ADMIN:
            return False, "Bạn không có quyền thực hiện thao tác trên phiên import này.", 0

        quiz = Quiz.objects.filter(id=quiz_id).first()
        if not quiz:
            return False, "Không tìm thấy Đề thi đích để import câu hỏi.", 0

        # Sử dụng danh sách tùy chỉnh từ frontend hoặc dữ liệu parsed gốc
        questions_data = custom_questions if custom_questions is not None else batch.parsed_data
        if not questions_data:
            return False, "Không có câu hỏi nào để import vào đề thi.", 0

        # Thực thi Bulk Create trong Transaction Atomic
        try:
            with transaction.atomic():
                # Lấy số thứ tự câu hỏi hiện tại trong đề thi để đánh chỉ mục nối tiếp
                current_max_order = quiz.questions.count()
                imported_count = 0

                for idx, q_data in enumerate(questions_data, start=1):
                    q_content = q_data.get('content', '').strip()
                    if not q_content:
                        continue

                    q_type = q_data.get('question_type', QuestionType.SINGLE_CHOICE)
                    if q_type not in QuestionType.values:
                        q_type = QuestionType.SINGLE_CHOICE

                    q_skill = q_data.get('skill', SkillType.GRAMMAR)
                    if q_skill not in SkillType.values:
                        q_skill = SkillType.GRAMMAR

                    q_points = float(q_data.get('points') or 10.0)
                    q_explanation = q_data.get('explanation', '')

                    # 1. Tạo Question
                    question_obj = Question.objects.create(
                        quiz=quiz,
                        content=q_content,
                        question_type=q_type,
                        skill=q_skill,
                        points=q_points,
                        explanation=q_explanation,
                        order_index=current_max_order + idx
                    )

                    # 2. Tạo AnswerOptions
                    options = q_data.get('options', [])
                    for opt_idx, opt in enumerate(options, start=1):
                        opt_content = opt.get('content', '').strip()
                        if not opt_content:
                            continue
                        is_correct = bool(opt.get('is_correct', False))

                        AnswerOption.objects.create(
                            question=question_obj,
                            content=opt_content,
                            is_correct=is_correct,
                            order_index=opt_idx
                        )

                    imported_count += 1

                # Cập nhật trạng thái Batch
                batch.quiz = quiz
                batch.status = BatchStatus.IMPORTED
                batch.total_imported = imported_count
                batch.save()

                return True, f"Đã import thành công {imported_count} câu hỏi vào đề thi '{quiz.title}'!", imported_count

        except Exception as e:
            logger.error(f"Failed to bulk import questions into Quiz {quiz_id}: {e}", exc_info=True)
            return False, f"Đã xảy ra lỗi trong quá trình lưu câu hỏi: {str(e)}", 0

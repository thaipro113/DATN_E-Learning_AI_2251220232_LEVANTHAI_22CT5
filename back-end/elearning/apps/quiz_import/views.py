from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import status

from common.responses import success_response, error_response
from .models import QuizImportBatch
from .services import QuizImportService
from .serializers import (
    CreateQuizImportBatchSerializer,
    QuizImportBatchDetailSerializer,
    ConfirmImportRequestSerializer
)
from .schemas import (
    create_import_batch_schema,
    get_import_batch_detail_schema,
    confirm_import_schema,
    list_import_batches_schema
)


class QuizImportUploadAPIView(APIView):
    """
    API Endpoint tiếp nhận Upload tệp hoặc dán đoạn văn bản đề thi thô để bóc tách.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @create_import_batch_schema
    def post(self, request):
        serializer = CreateQuizImportBatchSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu import đề thi không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        validated_data = serializer.validated_data
        batch = QuizImportService.create_and_parse_batch(
            teacher=request.user,
            title=validated_data.get('title', 'Phiên nhập đề thi'),
            source_type=validated_data.get('source_type'),
            file=validated_data.get('file'),
            raw_text=validated_data.get('raw_text', ''),
            use_ai=validated_data.get('use_ai', False),
            quiz_id=str(validated_data.get('quiz_id')) if validated_data.get('quiz_id') else None
        )

        response_serializer = QuizImportBatchDetailSerializer(batch)
        msg = f"Đã trích xuất thành công {batch.total_parsed} câu hỏi!" if batch.total_parsed > 0 else "Không tìm thấy câu hỏi hợp lệ trong nội dung."

        return success_response(
            data=response_serializer.data,
            message=msg,
            status_code=status.HTTP_201_CREATED
        )


class QuizImportBatchDetailAPIView(APIView):
    """
    API Endpoint lấy chi tiết phiên Import kèm dữ liệu câu hỏi xem trước (Preview Data).
    """
    permission_classes = [IsAuthenticated]

    @get_import_batch_detail_schema
    def get(self, request, batch_id):
        batch = QuizImportBatch.objects.filter(id=batch_id).first()
        if not batch:
            return error_response(
                message="Không tìm thấy phiên import đề thi.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        serializer = QuizImportBatchDetailSerializer(batch)
        return success_response(
            data=serializer.data,
            message="Lấy thông tin phiên import thành công!",
            status_code=status.HTTP_200_OK
        )


class ConfirmQuizImportAPIView(APIView):
    """
    API Endpoint xác nhận và lưu toàn bộ câu hỏi vào Đề thi đích trong CSDL.
    """
    permission_classes = [IsAuthenticated]

    @confirm_import_schema
    def post(self, request, batch_id):
        serializer = ConfirmImportRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu xác nhận import không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        quiz_id = str(serializer.validated_data.get('quiz_id'))
        custom_questions = serializer.validated_data.get('questions')

        success, message, imported_count = QuizImportService.confirm_and_import_to_quiz(
            user=request.user,
            batch_id=str(batch_id),
            quiz_id=quiz_id,
            custom_questions=custom_questions
        )

        if not success:
            return error_response(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        return success_response(
            data={'imported_count': imported_count, 'quiz_id': quiz_id},
            message=message,
            status_code=status.HTTP_200_OK
        )


class QuizImportBatchListAPIView(APIView):
    """
    API Endpoint lấy danh sách lịch sử các phiên import của Giáo viên.
    """
    permission_classes = [IsAuthenticated]

    @list_import_batches_schema
    def get(self, request):
        batches = QuizImportBatch.objects.filter(teacher=request.user)
        serializer = QuizImportBatchDetailSerializer(batches, many=True)
        return success_response(
            data=serializer.data,
            message="Lấy danh sách lịch sử import thành công!",
            status_code=status.HTTP_200_OK
        )

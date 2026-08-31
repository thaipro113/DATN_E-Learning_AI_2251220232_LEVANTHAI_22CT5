from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import status

from .serializers import (
    CreateQuizImportBatchSerializer,
    QuizImportBatchDetailSerializer,
    ConfirmImportRequestSerializer
)


create_import_batch_schema = extend_schema(
    summary="Upload tệp / Dán đề thi để bóc tách câu hỏi",
    description="Cho phép Giáo viên hoặc Admin tải lên tệp (.docx, .csv, .xlsx) hoặc dán văn bản thô. Hệ thống sẽ bóc tách và trả về dữ liệu câu hỏi xem trước (Preview Data).",
    request=CreateQuizImportBatchSerializer,
    responses={
        status.HTTP_201_CREATED: OpenApiResponse(
            response=QuizImportBatchDetailSerializer,
            description="Tạo batch và bóc tách câu hỏi thành công."
        ),
        status.HTTP_400_BAD_REQUEST: OpenApiResponse(
            description="Dữ liệu tải lên không hợp lệ."
        ),
        status.HTTP_401_UNAUTHORIZED: OpenApiResponse(
            description="Chưa xác thực danh tính."
        )
    },
    tags=["Quiz Import & Digitizer"]
)


get_import_batch_detail_schema = extend_schema(
    summary="Xem chi tiết phiên Import đề thi và danh sách câu hỏi xem trước (Preview)",
    description="Lấy thông tin chi tiết một phiên import, bao gồm danh sách đầy đủ các câu hỏi, loại câu hỏi, kỹ năng và đáp án trích xuất.",
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response=QuizImportBatchDetailSerializer,
            description="Lấy thông tin phiên import thành công."
        ),
        status.HTTP_404_NOT_FOUND: OpenApiResponse(
            description="Không tìm thấy phiên import."
        )
    },
    tags=["Quiz Import & Digitizer"]
)


confirm_import_schema = extend_schema(
    summary="Xác nhận và Import hàng loạt câu hỏi vào Đề thi",
    description="Lưu toàn bộ danh sách câu hỏi đã bóc tách (hoặc danh sách đã chỉnh sửa) vào CSDL Đề thi (Quiz).",
    request=ConfirmImportRequestSerializer,
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            description="Đã import câu hỏi vào đề thi thành công."
        ),
        status.HTTP_400_BAD_REQUEST: OpenApiResponse(
            description="Không thể import (thiếu câu hỏi hoặc dữ liệu không hợp lệ)."
        ),
        status.HTTP_404_NOT_FOUND: OpenApiResponse(
            description="Không tìm thấy phiên import hoặc đề thi đích."
        )
    },
    tags=["Quiz Import & Digitizer"]
)


list_import_batches_schema = extend_schema(
    summary="Lịch sử các phiên import đề thi của Giáo viên",
    description="Lấy danh sách tất cả các phiên import đề thi do Giáo viên đang đăng nhập thực hiện.",
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response=QuizImportBatchDetailSerializer(many=True),
            description="Lấy lịch sử import thành công."
        )
    },
    tags=["Quiz Import & Digitizer"]
)

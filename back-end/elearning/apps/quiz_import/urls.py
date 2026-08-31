from django.urls import path
from .views import (
    QuizImportUploadAPIView,
    QuizImportBatchDetailAPIView,
    ConfirmQuizImportAPIView,
    QuizImportBatchListAPIView
)

app_name = 'quiz_import'

urlpatterns = [
    # 1. Tải lên tệp / Dán văn bản để bóc tách câu hỏi
    path('upload/', QuizImportUploadAPIView.as_view(), name='upload_quiz'),

    # 2. Danh sách lịch sử các phiên import của Giáo viên
    path('batches/', QuizImportBatchListAPIView.as_view(), name='list_batches'),

    # 3. Xem chi tiết phiên import và dữ liệu câu hỏi xem trước (Preview)
    path('batches/<uuid:batch_id>/', QuizImportBatchDetailAPIView.as_view(), name='batch_detail'),

    # 4. Xác nhận và Import hàng loạt câu hỏi vào Đề thi đích
    path('batches/<uuid:batch_id>/confirm/', ConfirmQuizImportAPIView.as_view(), name='confirm_import'),
]

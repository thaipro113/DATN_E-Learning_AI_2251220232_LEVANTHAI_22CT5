import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('courses', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ChatSession',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier (UUID4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Record creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Record last update timestamp')),
                ('title', models.CharField(default='Cuộc trò chuyện mới', max_length=255, verbose_name='Tiêu đề cuộc trò chuyện')),
                ('session_type', models.CharField(choices=[('GENERAL', 'Trợ lý học tập tổng quát'), ('LESSON_TUTOR', 'Gia sư bài học chuyên sâu'), ('GRAMMAR_CHECK', 'Kiểm tra & Sửa lỗi ngữ pháp'), ('ROLEPLAY', 'Luyện giao tiếp & Nhập vai theo ngữ cảnh')], default='GENERAL', max_length=30, verbose_name='Loại phiên chat')),
                ('target_level', models.CharField(choices=[('A1', 'A1 - Căn bản'), ('A2', 'A2 - Sơ cấp'), ('B1', 'B1 - Trung cấp'), ('B2', 'B2 - Trung cao cấp'), ('C1', 'C1 - Cao cấp'), ('C2', 'C2 - Thành thạo'), ('ALL', 'Mọi trình độ')], default='ALL', max_length=10, verbose_name='Trình độ tiếng Anh mục tiêu')),
                ('is_active', models.BooleanField(default=True, verbose_name='Đang hoạt động')),
                ('course', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='ai_chat_sessions', to='courses.course', verbose_name='Khóa học liên kết')),
                ('lesson', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='ai_chat_sessions', to='courses.lesson', verbose_name='Bài học liên kết')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chat_sessions', to=settings.AUTH_USER_MODEL, verbose_name='Học viên')),
            ],
            options={
                'verbose_name': 'Phiên trò chuyện AI',
                'verbose_name_plural': 'Danh sách phiên trò chuyện AI',
                'db_table': 'ai_chat_sessions',
                'ordering': ['-updated_at'],
            },
        ),
        migrations.CreateModel(
            name='ChatMessage',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier (UUID4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Record creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Record last update timestamp')),
                ('sender_type', models.CharField(choices=[('USER', 'Học viên'), ('AI', 'Trợ lý AI'), ('SYSTEM', 'Chỉ dẫn hệ thống (System Prompt)')], default='USER', max_length=20, verbose_name='Người gửi')),
                ('content', models.TextField(verbose_name='Nội dung tin nhắn')),
                ('audio_url', models.URLField(blank=True, max_length=500, null=True, verbose_name='Tệp âm thanh phát âm')),
                ('grammar_corrections', models.JSONField(blank=True, default=dict, help_text='Chứa danh sách các lỗi sai phát hiện được và đề xuất sửa đổi', verbose_name='Phân tích sửa lỗi ngữ pháp & từ vựng')),
                ('token_count', models.PositiveIntegerField(default=0, verbose_name='Số token tiêu thụ')),
                ('model_used', models.CharField(default='gemini-1.5-flash', max_length=100, verbose_name='Mô hình AI sử dụng')),
                ('session', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='ai.chatsession', verbose_name='Phiên chat')),
            ],
            options={
                'verbose_name': 'Tin nhắn AI',
                'verbose_name_plural': 'Lịch sử tin nhắn AI',
                'db_table': 'ai_chat_messages',
                'ordering': ['created_at'],
            },
        ),
    ]

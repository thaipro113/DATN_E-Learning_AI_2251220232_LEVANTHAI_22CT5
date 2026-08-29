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
            name='Quiz',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier (UUID4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Record creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Record last update timestamp')),
                ('title', models.CharField(max_length=255, verbose_name='Tiêu đề đề thi')),
                ('description', models.TextField(blank=True, default='', verbose_name='Mô tả đề thi')),
                ('quiz_type', models.CharField(choices=[('PLACEMENT', 'Đánh giá năng lực đầu vào'), ('PRACTICE', 'Luyện tập theo bài/chương'), ('FINAL', 'Đề thi cuối khóa')], default='PRACTICE', max_length=20, verbose_name='Loại đề thi')),
                ('level', models.CharField(choices=[('A1', 'A1 - Căn bản'), ('A2', 'A2 - Sơ cấp'), ('B1', 'B1 - Trung cấp'), ('B2', 'B2 - Trung cao cấp'), ('C1', 'C1 - Cao cấp'), ('C2', 'C2 - Thành thạo'), ('ALL', 'Mọi trình độ')], default='ALL', max_length=10, verbose_name='Trình độ mục tiêu')),
                ('time_limit_minutes', models.PositiveIntegerField(default=30, help_text='0 = Không giới hạn thời gian', verbose_name='Thời gian làm bài (phút)')),
                ('passing_score', models.DecimalField(decimal_places=2, default=50.0, help_text='Tỷ lệ % tối thiểu để vượt qua bài thi (VD: 50.00%)', max_digits=5, verbose_name='Điểm đạt (%)')),
                ('is_published', models.BooleanField(default=True, verbose_name='Đã phát hành công khai')),
                ('course', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='quizzes', to='courses.course', verbose_name='Khóa học liên kết')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_quizzes', to=settings.AUTH_USER_MODEL, verbose_name='Người tạo')),
                ('lesson', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='quizzes', to='courses.lesson', verbose_name='Bài học liên kết')),
            ],
            options={
                'verbose_name': 'Đề thi / Bài kiểm tra',
                'verbose_name_plural': 'Danh sách đề thi',
                'db_table': 'quizzes',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Question',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier (UUID4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Record creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Record last update timestamp')),
                ('content', models.TextField(verbose_name='Nội dung câu hỏi')),
                ('question_type', models.CharField(choices=[('SINGLE_CHOICE', 'Trắc nghiệm 1 đáp án'), ('MULTIPLE_CHOICE', 'Trắc nghiệm nhiều đáp án'), ('TRUE_FALSE', 'Đúng / Sai'), ('FILL_IN_THE_BLANK', 'Điền vào chỗ trống')], default='SINGLE_CHOICE', max_length=30, verbose_name='Loại câu hỏi')),
                ('skill', models.CharField(choices=[('LISTENING', 'Kỹ năng Nghe'), ('READING', 'Kỹ năng Đọc'), ('WRITING', 'Kỹ năng Viết'), ('SPEAKING', 'Kỹ năng Nói'), ('GRAMMAR', 'Ngữ pháp'), ('VOCABULARY', 'Từ vựng')], default='GRAMMAR', max_length=20, verbose_name='Kỹ năng đánh giá')),
                ('level', models.CharField(choices=[('A1', 'A1 - Căn bản'), ('A2', 'A2 - Sơ cấp'), ('B1', 'B1 - Trung cấp'), ('B2', 'B2 - Trung cao cấp'), ('C1', 'C1 - Cao cấp'), ('C2', 'C2 - Thành thạo')], default='A1', max_length=10, verbose_name='Trình độ câu hỏi')),
                ('audio_url', models.URLField(blank=True, max_length=500, null=True, verbose_name='Tệp âm thanh (cho bài nghe)')),
                ('image_url', models.URLField(blank=True, max_length=500, null=True, verbose_name='Hình ảnh minh họa')),
                ('explanation', models.TextField(blank=True, default='', help_text='Hiển thị cho học viên sau khi hoàn thành bài thi', verbose_name='Lời giải thích chi tiết')),
                ('points', models.DecimalField(decimal_places=2, default=1.0, max_digits=4, verbose_name='Điểm số')),
                ('order_index', models.PositiveIntegerField(default=1, verbose_name='Thứ tự câu hỏi')),
                ('quiz', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='questions', to='assessments.quiz', verbose_name='Đề thi')),
            ],
            options={
                'verbose_name': 'Câu hỏi',
                'verbose_name_plural': 'Ngân hàng câu hỏi',
                'db_table': 'questions',
                'ordering': ['order_index'],
                'unique_together': {('quiz', 'order_index')},
            },
        ),
        migrations.CreateModel(
            name='AnswerOption',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier (UUID4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Record creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Record last update timestamp')),
                ('content', models.TextField(verbose_name='Nội dung đáp án')),
                ('is_correct', models.BooleanField(default=False, verbose_name='Đáp án đúng')),
                ('order_index', models.PositiveIntegerField(default=1, verbose_name='Thứ tự lựa chọn')),
                ('question', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='options', to='assessments.question', verbose_name='Câu hỏi')),
            ],
            options={
                'verbose_name': 'Lựa chọn đáp án',
                'verbose_name_plural': 'Danh sách lựa chọn đáp án',
                'db_table': 'answer_options',
                'ordering': ['order_index'],
            },
        ),
        migrations.CreateModel(
            name='QuizAttempt',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier (UUID4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Record creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Record last update timestamp')),
                ('started_at', models.DateTimeField(auto_now_add=True, verbose_name='Thời gian bắt đầu')),
                ('completed_at', models.DateTimeField(blank=True, null=True, verbose_name='Thời gian nộp bài')),
                ('score', models.DecimalField(decimal_places=2, default=0.0, max_digits=6, verbose_name='Điểm đạt được')),
                ('max_score', models.DecimalField(decimal_places=2, default=0.0, max_digits=6, verbose_name='Điểm tối đa')),
                ('percentage', models.DecimalField(decimal_places=2, default=0.0, max_digits=5, verbose_name='Tỷ lệ đúng (%)')),
                ('is_passed', models.BooleanField(default=False, verbose_name='Đã vượt qua')),
                ('status', models.CharField(choices=[('IN_PROGRESS', 'Đang làm bài'), ('COMPLETED', 'Đã hoàn thành'), ('ABANDONED', 'Đã hủy bài thi')], default='IN_PROGRESS', max_length=20, verbose_name='Trạng thái lần thi')),
                ('quiz', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attempts', to='assessments.quiz', verbose_name='Đề thi')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='quiz_attempts', to=settings.AUTH_USER_MODEL, verbose_name='Học viên')),
            ],
            options={
                'verbose_name': 'Lần thi của học viên',
                'verbose_name_plural': 'Danh sách lần thi',
                'db_table': 'quiz_attempts',
                'ordering': ['-started_at'],
            },
        ),
        migrations.CreateModel(
            name='StudentAnswer',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier (UUID4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Record creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Record last update timestamp')),
                ('text_answer', models.TextField(blank=True, default='', verbose_name='Câu trả lời tự luận / điền từ')),
                ('is_correct', models.BooleanField(default=False, verbose_name='Đúng hay sai')),
                ('score_earned', models.DecimalField(decimal_places=2, default=0.0, max_digits=4, verbose_name='Điểm nhận được')),
                ('attempt', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='student_answers', to='assessments.quizattempt', verbose_name='Lần thi')),
                ('question', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='student_answers', to='assessments.question', verbose_name='Câu hỏi')),
                ('selected_option', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='selected_by_students', to='assessments.answeroption', verbose_name='Đáp án trắc nghiệm đã chọn')),
            ],
            options={
                'verbose_name': 'Câu trả lời của học viên',
                'verbose_name_plural': 'Danh sách câu trả lời',
                'db_table': 'student_answers',
                'unique_together': {('attempt', 'question')},
            },
        ),
    ]

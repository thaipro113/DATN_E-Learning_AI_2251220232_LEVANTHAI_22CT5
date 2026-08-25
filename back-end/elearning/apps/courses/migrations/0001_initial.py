import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=150, unique=True, verbose_name='Tên danh mục')),
                ('slug', models.SlugField(blank=True, max_length=180, unique=True, verbose_name='Slug định danh')),
                ('description', models.TextField(blank=True, null=True, verbose_name='Mô tả danh mục')),
                ('icon_url', models.URLField(blank=True, max_length=500, null=True, verbose_name='Đường dẫn icon')),
                ('is_active', models.BooleanField(default=True, verbose_name='Đang hoạt động')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Ngày cập nhật')),
            ],
            options={
                'verbose_name': 'Danh mục khóa học',
                'verbose_name_plural': 'Danh mục khóa học',
                'db_table': 'categories',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Course',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier (UUID4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Record creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Record last update timestamp')),
                ('title', models.CharField(max_length=255, verbose_name='Tiêu đề khóa học')),
                ('slug', models.SlugField(blank=True, max_length=280, unique=True, verbose_name='Slug định danh')),
                ('description', models.TextField(verbose_name='Mô tả tổng quan khóa học')),
                ('level', models.CharField(choices=[('A1', 'A1 - Beginner (Mới bắt đầu)'), ('A2', 'A2 - Elementary (Sơ cấp)'), ('B1', 'B1 - Intermediate (Trung cấp)'), ('B2', 'B2 - Upper-Intermediate (Trung cao cấp)'), ('C1', 'C1 - Advanced (Cao cấp)'), ('C2', 'C2 - Proficiency (Thành thạo)')], default='A1', max_length=10, verbose_name='Trình độ khóa học')),
                ('thumbnail_url', models.URLField(blank=True, max_length=500, null=True, verbose_name='Ảnh đại diện khóa học')),
                ('price', models.DecimalField(decimal_places=0, default=0, max_digits=12, verbose_name='Học phí (VND)')),
                ('is_free', models.BooleanField(default=True, verbose_name='Khóa học miễn phí')),
                ('status', models.CharField(choices=[('DRAFT', 'Bản nháp'), ('PUBLISHED', 'Đã xuất bản'), ('ARCHIVED', 'Đã lưu trữ')], default='DRAFT', max_length=20, verbose_name='Trạng thái khóa học')),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='courses', to='courses.category', verbose_name='Danh mục')),
                ('teacher', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='teaching_courses', to=settings.AUTH_USER_MODEL, verbose_name='Giáo viên phụ trách')),
            ],
            options={
                'verbose_name': 'Khóa học',
                'verbose_name_plural': 'Danh sách khóa học',
                'db_table': 'courses',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Chapter',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier (UUID4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Record creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Record last update timestamp')),
                ('title', models.CharField(max_length=255, verbose_name='Tiêu đề chương')),
                ('description', models.TextField(blank=True, null=True, verbose_name='Mô tả ngắn')),
                ('order_index', models.PositiveIntegerField(default=1, verbose_name='Thứ tự sắp xếp')),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chapters', to='courses.course', verbose_name='Khóa học')),
            ],
            options={
                'verbose_name': 'Chương học',
                'verbose_name_plural': 'Danh sách chương học',
                'db_table': 'chapters',
                'ordering': ['order_index', 'created_at'],
                'unique_together': {('course', 'order_index')},
            },
        ),
        migrations.CreateModel(
            name='Lesson',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier (UUID4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Record creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Record last update timestamp')),
                ('title', models.CharField(max_length=255, verbose_name='Tiêu đề bài học')),
                ('content', models.TextField(blank=True, null=True, verbose_name='Nội dung bài giảng (Markdown/Văn bản)')),
                ('video_url', models.URLField(blank=True, max_length=500, null=True, verbose_name='Đường dẫn video bài giảng')),
                ('duration_minutes', models.PositiveIntegerField(default=10, verbose_name='Thời lượng ước tính (phút)')),
                ('order_index', models.PositiveIntegerField(default=1, verbose_name='Thứ tự sắp xếp')),
                ('is_preview', models.BooleanField(default=False, verbose_name='Cho phép học thử')),
                ('chapter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lessons', to='courses.chapter', verbose_name='Chương học')),
            ],
            options={
                'verbose_name': 'Bài học',
                'verbose_name_plural': 'Danh sách bài học',
                'db_table': 'lessons',
                'ordering': ['order_index', 'created_at'],
                'unique_together': {('chapter', 'order_index')},
            },
        ),
        migrations.CreateModel(
            name='Material',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier (UUID4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Record creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Record last update timestamp')),
                ('title', models.CharField(max_length=255, verbose_name='Tên tài liệu')),
                ('file_url', models.URLField(max_length=500, verbose_name='Đường dẫn tệp tài liệu')),
                ('file_type', models.CharField(choices=[('PDF', 'Tài liệu PDF'), ('DOCX', 'Tài liệu Word'), ('MP3', 'Tệp âm thanh MP3'), ('OTHER', 'Tài liệu khác')], default='PDF', max_length=20, verbose_name='Loại tệp')),
                ('file_size_bytes', models.BigIntegerField(default=0, verbose_name='Dung lượng tệp (bytes)')),
                ('lesson', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='materials', to='courses.lesson', verbose_name='Bài học')),
            ],
            options={
                'verbose_name': 'Tài liệu bài học',
                'verbose_name_plural': 'Tài liệu bài học',
                'db_table': 'materials',
                'ordering': ['created_at'],
            },
        ),
    ]

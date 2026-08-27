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
            name='Enrollment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier (UUID4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Record creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Record last update timestamp')),
                ('enrolled_at', models.DateTimeField(auto_now_add=True, verbose_name='Thời gian ghi danh')),
                ('status', models.CharField(choices=[('ACTIVE', 'Đang học'), ('COMPLETED', 'Đã hoàn thành'), ('CANCELLED', 'Đã hủy ghi danh')], default='ACTIVE', max_length=20, verbose_name='Trạng thái học tập')),
                ('progress_percent', models.DecimalField(decimal_places=2, default=0.0, max_digits=5, verbose_name='Tiến độ hoàn thành (%)')),
                ('completed_at', models.DateTimeField(blank=True, null=True, verbose_name='Thời gian hoàn thành')),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='enrollments', to='courses.course', verbose_name='Khóa học')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='enrollments', to=settings.AUTH_USER_MODEL, verbose_name='Học viên')),
            ],
            options={
                'verbose_name': 'Ghi danh khóa học',
                'verbose_name_plural': 'Danh sách ghi danh',
                'db_table': 'enrollments',
                'ordering': ['-enrolled_at'],
                'unique_together': {('student', 'course')},
            },
        ),
        migrations.CreateModel(
            name='Certificate',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier (UUID4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Record creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Record last update timestamp')),
                ('certificate_code', models.CharField(help_text='Ví dụ: CERT-ELN-2026-ABC123XYZ', max_length=60, unique=True, verbose_name='Mã chứng chỉ duy nhất')),
                ('issued_at', models.DateTimeField(auto_now_add=True, verbose_name='Thời gian cấp')),
                ('pdf_url', models.URLField(blank=True, max_length=500, null=True, verbose_name='Đường dẫn tệp PDF chứng chỉ')),
                ('enrollment', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='certificate', to='learning.enrollment', verbose_name='Lần ghi danh')),
            ],
            options={
                'verbose_name': 'Chứng chỉ hoàn thành',
                'verbose_name_plural': 'Danh sách chứng chỉ',
                'db_table': 'certificates',
                'ordering': ['-issued_at'],
            },
        ),
        migrations.CreateModel(
            name='LessonProgress',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier (UUID4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Record creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Record last update timestamp')),
                ('is_completed', models.BooleanField(default=False, verbose_name='Đã hoàn thành')),
                ('completed_at', models.DateTimeField(blank=True, null=True, verbose_name='Thời gian hoàn thành')),
                ('last_watched_second', models.PositiveIntegerField(default=0, verbose_name='Vị trí video dừng lại (giây)')),
                ('enrollment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lesson_progresses', to='learning.enrollment', verbose_name='Lần ghi danh')),
                ('lesson', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='student_progresses', to='courses.lesson', verbose_name='Bài học')),
            ],
            options={
                'verbose_name': 'Tiến độ bài học',
                'verbose_name_plural': 'Danh sách tiến độ bài học',
                'db_table': 'lesson_progresses',
                'ordering': ['-updated_at'],
                'unique_together': {('enrollment', 'lesson')},
            },
        ),
    ]

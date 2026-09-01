import uuid
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.courses.models import Category, Course, Chapter, Lesson, CourseStatus
from apps.learning.models import Enrollment, LessonProgress, EnrollmentStatus
from apps.assessments.models import (
    Quiz, Question, AnswerOption, QuizType, QuestionType, SkillType
)
from apps.recommendations.models import (
    SkillGapAnalysis, CourseRecommendation, LearningPath, LearningPathStep, LearningPathStatus, StepType
)


class Command(BaseCommand):
    help = 'Nạp dữ liệu mẫu thực tế, đầy đủ và phong phú cho hệ thống E-Learning AI (Idempotent Database Seeder).'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('=== BẮT ĐẦU NẠP DỮ LIỆU MẪU CHO E-LEARNING AI PLATFORM ==='))

        with transaction.atomic():
            # 1. TẠO TÀI KHOẢN NGƯỜI DÙNG (USERS)
            self.stdout.write('1. Khởi tạo tài khoản Học viên, Giảng viên và Quản trị viên...')

            student, _ = CustomUser.objects.get_or_create(
                email='thaipro1132004@gmail.com',
                defaults={
                    'full_name': 'Lê Văn Thái',
                    'role': UserRole.STUDENT,
                    'level': EnglishLevel.B1,
                    'is_active': True
                }
            )
            student.set_password('levanthai113')
            student.save()

            teacher1, _ = CustomUser.objects.get_or_create(
                email='teacher@gmail.com',
                defaults={
                    'full_name': 'Thầy Nguyễn Văn An',
                    'role': UserRole.TEACHER,
                    'level': EnglishLevel.C1,
                    'is_active': True
                }
            )
            teacher1.set_password('levanthai113')
            teacher1.save()

            teacher2, _ = CustomUser.objects.get_or_create(
                email='teacher1@gmail.com',
                defaults={
                    'full_name': 'Cô Trần Thị Mai',
                    'role': UserRole.TEACHER,
                    'level': EnglishLevel.C1,
                    'is_active': True
                }
            )
            teacher2.set_password('levanthai113')
            teacher2.save()

            admin_user, _ = CustomUser.objects.get_or_create(
                email='admin@elearning.edu.vn',
                defaults={
                    'full_name': 'Admin Quản Trị Hệ Thống',
                    'role': UserRole.ADMIN,
                    'level': EnglishLevel.C2,
                    'is_active': True,
                    'is_staff': True,
                    'is_superuser': True
                }
            )
            admin_user.set_password('levanthai113')
            admin_user.save()

            self.stdout.write(self.style.SUCCESS('   ✓ Đã tạo 4 tài khoản chuẩn.'))

            # 2. TẠO DANH MỤC KHÓA HỌC (CATEGORIES)
            self.stdout.write('2. Khởi tạo danh mục khóa học...')
            cat_grammar, _ = Category.objects.get_or_create(
                slug='ngu-phap',
                defaults={'name': 'Ngữ pháp Tiếng Anh', 'description': 'Nắm vững các thì và cấu trúc câu chuẩn CEFR.'}
            )
            cat_vocab, _ = Category.objects.get_or_create(
                slug='tu-vung-doc-hieu',
                defaults={'name': 'Từ vựng & Đọc hiểu', 'description': 'Mở rộng vốn từ học thuật và kỹ năng đọc hiểu nhanh.'}
            )
            cat_comm, _ = Category.objects.get_or_create(
                slug='giao-tiep-phat-am',
                defaults={'name': 'Giao tiếp & Phát âm', 'description': 'Luyện phản xạ giao tiếp tự nhiên và chuẩn âm IPA.'}
            )
            cat_exam, _ = Category.objects.get_or_create(
                slug='luyen-thi-tong-hop',
                defaults={'name': 'Luyện thi Tổng hợp', 'description': 'Chiến thuật làm bài thi TOEIC, IELTS đạt điểm cao.'}
            )

            # 3. TẠO CÁC KHÓA HỌC (COURSES, CHAPTERS, LESSONS)
            self.stdout.write('3. Khởi tạo khóa học, chương và bài học video...')

            # Khóa 1: Ngữ Pháp Nền Tảng A1-A2
            course1, _ = Course.objects.get_or_create(
                slug='ngu-phap-tieng-anh-nen-tang-a1-a2',
                defaults={
                    'category': cat_grammar,
                    'teacher': teacher1,
                    'title': 'Ngữ Pháp Tiếng Anh Nền Tảng (CEFR A1-A2)',
                    'description': 'Làm chủ các thì cơ bản, đại từ, mạo từ và cách đặt câu chuẩn xác trong tiếng Anh.',
                    'level': EnglishLevel.A2,
                    'price': Decimal('0'),
                    'is_free': True,
                    'status': CourseStatus.PUBLISHED
                }
            )

            ch1_1, _ = Chapter.objects.get_or_create(
                course=course1,
                order_index=1,
                defaults={'title': 'Chương 1: Các Thì Hiện Tại & Cấu Trúc Câu Cơ Bản', 'description': 'Hệ thống thì hiện tại và cách dùng trong giao tiếp.'}
            )

            les1_1, _ = Lesson.objects.get_or_create(
                chapter=ch1_1,
                order_index=1,
                defaults={
                    'title': 'Bài 1: Thì Hiện Tại Đơn & Hiện Tại Tiếp Diễn',
                    'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    'content': 'Phân biệt hành động mang tính thói quen (Hiện tại đơn) và hành động đang xảy ra (Hiện tại tiếp diễn).',
                    'duration_minutes': 12,
                    'is_preview': True
                }
            )

            les1_2, _ = Lesson.objects.get_or_create(
                chapter=ch1_1,
                order_index=2,
                defaults={
                    'title': 'Bài 2: Mạo Từ (A, An, The) và Danh Từ Đếm Được / Không Đếm Được',
                    'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    'content': 'Quy tắc dùng mạo từ xác định và không xác định trong câu.',
                    'duration_minutes': 14,
                    'is_preview': False
                }
            )

            ch1_2, _ = Chapter.objects.get_or_create(
                course=course1,
                order_index=2,
                defaults={'title': 'Chương 2: Các Thì Quá Khứ & Câu Điều Kiện', 'description': 'Cách kể chuyện trong quá khứ và đặt giả thiết.'}
            )

            les1_3, _ = Lesson.objects.get_or_create(
                chapter=ch1_2,
                order_index=1,
                defaults={
                    'title': 'Bài 3: Thì Quá Khứ Đơn & Quá Khứ Tiếp Diễn',
                    'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    'content': 'Sự kết hợp giữa hành động đang diễn ra và hành động cắt ngang trong quá khứ.',
                    'duration_minutes': 15,
                    'is_preview': False
                }
            )

            les1_4, _ = Lesson.objects.get_or_create(
                chapter=ch1_2,
                order_index=2,
                defaults={
                    'title': 'Bài 4: Mệnh Đề Quan Hệ & Câu Điều Kiện Loại 1, 2',
                    'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    'content': 'Cấu trúc Who, Which, That và cách đặt câu điều kiện thực tế và giả định.',
                    'duration_minutes': 18,
                    'is_preview': False
                }
            )

            # Khóa 2: Đọc Hiểu & Từ Vựng B1
            course2, _ = Course.objects.get_or_create(
                slug='luyen-doc-hieu-va-mo-rong-1500-tu-vung-b1',
                defaults={
                    'category': cat_vocab,
                    'teacher': teacher2,
                    'title': 'Luyện Đọc Hiểu & Mở Rộng 1500 Từ Vựng (CEFR B1)',
                    'description': 'Kỹ năng Skimming & Scanning, phương pháp ghi nhớ từ vựng học thuật qua ngữ cảnh.',
                    'level': EnglishLevel.B1,
                    'price': Decimal('0'),
                    'is_free': True,
                    'status': CourseStatus.PUBLISHED
                }
            )

            ch2_1, _ = Chapter.objects.get_or_create(
                course=course2,
                order_index=1,
                defaults={'title': 'Chương 1: Chiến Thuật Đọc Hiểu Nhanh', 'description': 'Phương pháp đọc lướt và tìm ý chính.'}
            )

            Lesson.objects.get_or_create(
                chapter=ch2_1,
                order_index=1,
                defaults={
                    'title': 'Bài 1: Kỹ Năng Đọc Lướt Skimming & Đọc Quét Scanning',
                    'duration_minutes': 15,
                    'is_preview': True
                }
            )

            # Khóa 3: Tiếng Anh B2
            course3, _ = Course.objects.get_or_create(
                slug='chinh-phuc-tieng-anh-trung-cao-cap-b2',
                defaults={
                    'category': cat_exam,
                    'teacher': teacher1,
                    'title': 'Chinh Phục Tiếng Anh Trung Cao Cấp (CEFR B2)',
                    'description': 'Cấu trúc câu phức, mệnh đề quan hệ rút gọn, đảo ngữ và phản xạ giao tiếp tự nhiên.',
                    'level': EnglishLevel.B2,
                    'price': Decimal('299000'),
                    'is_free': False,
                    'status': CourseStatus.PUBLISHED
                }
            )

            self.stdout.write(self.style.SUCCESS('   ✓ Đã tạo 3 khóa học chuẩn kèm chương & bài học.'))

            # 4. TẠO ĐỀ THI TRẮC NGHIỆM CHUẨN (QUIZZES, QUESTIONS, OPTIONS)
            self.stdout.write('4. Khởi tạo ngân hàng đề thi trắc nghiệm...')

            quiz1, _ = Quiz.objects.get_or_create(
                course=course1,
                title='Đề Kiểm Tra Tổng Hợp Ngữ Pháp CEFR B1',
                defaults={
                    'created_by': teacher1,
                    'description': 'Bài kiểm tra trắc nghiệm đánh giá kiến thức thì, câu điều kiện và mệnh đề quan hệ.',
                    'quiz_type': QuizType.PRACTICE,
                    'level': EnglishLevel.B1,
                    'time_limit_minutes': 15,
                    'passing_score': 70.0,
                    'is_published': True
                }
            )

            sample_questions = [
                {
                    'content': 'Which sentence uses the Past Simple tense correctly?',
                    'skill': SkillType.GRAMMAR,
                    'level': EnglishLevel.B1,
                    'explanation': 'Động từ "went" là dạng quá khứ bất quy tắc của "go", dùng khi có mốc thời gian xác định "yesterday".',
                    'options': [
                        ('She goed to London yesterday.', False),
                        ('She went to London yesterday.', True),
                        ('She has gone to London yesterday.', False),
                        ('She was go to London yesterday.', False),
                    ]
                },
                {
                    'content': 'Choose the correct form: "If I ______ you, I would accept that job offer."',
                    'skill': SkillType.GRAMMAR,
                    'level': EnglishLevel.B1,
                    'explanation': 'Câu điều kiện loại 2 diễn tả giả định trái ngược với hiện tại, to be chia là "were" cho tất cả các ngôi.',
                    'options': [
                        ('am', False),
                        ('was', False),
                        ('were', True),
                        ('have been', False),
                    ]
                },
                {
                    'content': 'What is the synonym of the word "essential"?',
                    'skill': SkillType.VOCABULARY,
                    'level': EnglishLevel.B1,
                    'explanation': '"Essential" có nghĩa là "thiết yếu / cần thiết", đồng nghĩa với "crucial" hoặc "necessary".',
                    'options': [
                        ('Crucial', True),
                        ('Trivial', False),
                        ('Optional', False),
                        ('Secondary', False),
                    ]
                },
                {
                    'content': 'Complete the sentence: "She has been working here ______ five years."',
                    'skill': SkillType.GRAMMAR,
                    'level': EnglishLevel.B1,
                    'explanation': 'Dùng "for" đi kèm một khoảng thời gian ("five years") trong thì Hiện tại hoàn thành.',
                    'options': [
                        ('since', False),
                        ('for', True),
                        ('during', False),
                        ('at', False),
                    ]
                },
                {
                    'content': 'Choose the correct relative pronoun: "The scientist ______ discovered the vaccine won the award."',
                    'skill': SkillType.GRAMMAR,
                    'level': EnglishLevel.B1,
                    'explanation': 'Dùng đại từ quan hệ "who" làm chủ ngữ thay thế cho danh từ chỉ người ("The scientist").',
                    'options': [
                        ('which', False),
                        ('who', True),
                        ('whom', False),
                        ('whose', False),
                    ]
                }
            ]

            for q_idx, q_data in enumerate(sample_questions, start=1):
                question, _ = Question.objects.get_or_create(
                    quiz=quiz1,
                    content=q_data['content'],
                    defaults={
                        'question_type': QuestionType.SINGLE_CHOICE,
                        'skill': q_data['skill'],
                        'level': q_data['level'],
                        'explanation': q_data['explanation'],
                        'points': Decimal('2.0'),
                        'order_index': q_idx
                    }
                )

                for opt_idx, (opt_content, is_corr) in enumerate(q_data['options'], start=1):
                    AnswerOption.objects.get_or_create(
                        question=question,
                        content=opt_content,
                        defaults={
                            'is_correct': is_corr,
                            'order_index': opt_idx
                        }
                    )

            self.stdout.write(self.style.SUCCESS('   ✓ Đã tạo đề thi trắc nghiệm kèm câu hỏi & đáp án giải thích.'))

            # 5. TẠO GHI DANH & TIẾN ĐỘ HỌC TẬP CHO HỌC VIÊN (ENROLLMENT & PROGRESS)
            self.stdout.write('5. Khởi tạo ghi danh và tiến độ học tập của sinh viên...')

            enrollment1, _ = Enrollment.objects.get_or_create(
                student=student,
                course=course1,
                defaults={
                    'status': EnrollmentStatus.ACTIVE,
                    'progress_percent': Decimal('75.00')
                }
            )

            # Đánh dấu bài 1, 2, 3 đã hoàn thành
            for les in [les1_1, les1_2, les1_3]:
                LessonProgress.objects.get_or_create(
                    enrollment=enrollment1,
                    lesson=les,
                    defaults={
                        'is_completed': True,
                        'last_watched_second': les.duration_minutes * 60,
                        'completed_at': timezone.now()
                    }
                )

            # 6. TẠO MA TRẬN 6 KỸ NĂNG & LỘ TRÌNH THÍCH ỨNG AI (SKILL GAPS & PATH)
            self.stdout.write('6. Khởi tạo ma trận 6 kỹ năng và lộ trình học tập cá nhân hóa AI...')

            skill_data = [
                (SkillType.GRAMMAR, 45.0, ['Past Simple', 'Conditionals'], 'Cần ôn lại cấu trúc câu điều kiện loại 2 và 3.'),
                (SkillType.VOCABULARY, 60.0, ['Academic Words'], 'Mở rộng 300 từ vựng theo chủ đề giáo dục và công nghệ.'),
                (SkillType.READING, 75.0, ['Scanning Speed'], 'Luyện tập kỹ năng đọc lướt để tăng tốc độ làm bài.'),
                (SkillType.LISTENING, 85.0, ['Connected Speech'], 'Duy trì nghe tiếng Anh thực tế qua tin tức và podcast.'),
                (SkillType.WRITING, 55.0, ['Paragraph Coherence'], 'Tập viết câu phức và sử dụng từ nối đa dạng.'),
                (SkillType.SPEAKING, 70.0, ['Word Stress'], 'Luyện nói tương tác với Trợ lý Gia sư AI Tutor.'),
            ]

            for s_type, s_score, weak_top, advice in skill_data:
                SkillGapAnalysis.objects.update_or_create(
                    student=student,
                    skill_type=s_type,
                    defaults={
                        'proficiency_score': s_score,
                        'weak_topics': weak_top,
                        'recommended_action': advice
                    }
                )

            # Khóa học AI đề xuất
            CourseRecommendation.objects.update_or_create(
                student=student,
                course=course1,
                defaults={
                    'relevance_score': 95.0,
                    'reason': 'Dựa trên phân tích lỗ hổng ngữ pháp câu điều kiện và thì quá khứ của bạn.'
                }
            )

            CourseRecommendation.objects.update_or_create(
                student=student,
                course=course2,
                defaults={
                    'relevance_score': 88.0,
                    'reason': 'Giúp bạn mở rộng 1500 từ vựng và nâng cao kỹ năng đọc hiểu CEFR B1.'
                }
            )

            # Lộ trình học tập 5 chặng
            path, _ = LearningPath.objects.get_or_create(
                student=student,
                defaults={
                    'title': 'Lộ trình Chinh phục B2 Upper-Intermediate',
                    'target_level': EnglishLevel.B2,
                    'current_estimated_level': EnglishLevel.B1,
                    'goal_description': 'Đạt chuẩn đầu ra B2, thành thạo ngữ pháp phức và tự tin giao tiếp công sở.',
                    'status': LearningPathStatus.IN_PROGRESS,
                    'total_steps': 5,
                    'completed_steps': 2,
                    'progress_percentage': 40.0
                }
            )

            steps = [
                (1, 'Củng cố Ngữ pháp: Các Thì Quá Khứ & Câu Điều Kiện', 'Hoàn thành 4 bài giảng video trọng tâm.', StepType.LESSON, True),
                (2, 'Đàm thoại phản xạ 3 buổi với Trợ lý AI Tutor', 'Thực hành hội thoại trực tiếp và sửa lỗi ngữ pháp.', StepType.AI_PRACTICE, True),
                (3, 'Mở rộng 500 từ vựng chuyên ngành & Đọc hiểu B2', 'Luyện kỹ năng Skimming & Scanning bài báo học thuật.', StepType.LESSON, False),
                (4, 'Làm bài kiểm tra đánh giá giữa kỳ (Mid-term Quiz)', 'Đạt tối thiểu 75% số điểm để chuyển sang chặng tiếp theo.', StepType.QUIZ, False),
                (5, 'Thi thử chuẩn hóa B2 & Nhận Chứng chỉ hoàn thành', 'Tổng duyệt kiến thức toàn khóa và nhận chứng chỉ tốt nghiệp.', StepType.COURSE, False),
            ]

            for s_idx, s_title, s_desc, s_type, is_done in steps:
                LearningPathStep.objects.update_or_create(
                    learning_path=path,
                    step_index=s_idx,
                    defaults={
                        'title': s_title,
                        'description': s_desc,
                        'step_type': s_type,
                        'is_completed': is_done,
                        'completed_at': timezone.now() if is_done else None
                    }
                )

            self.stdout.write(self.style.SUCCESS('   ✓ Đã tạo ma trận 6 kỹ năng và lộ trình thích ứng 5 chặng.'))

        self.stdout.write(self.style.SUCCESS('\n=== NẠP DỮ LIỆU MẪU HOÀN TẤT THÀNH CÔNG 100%! ==='))
        self.stdout.write('Thông tin tài khoản kiểm thử:')
        self.stdout.write('  👨‍🎓 Học viên:    thaipro1132004@gmail.com        / levanthai113')
        self.stdout.write('  👨‍🏫 Giảng viên:  teacher@gmail.com               / levanthai113')
        self.stdout.write('  👨‍🏫 Giảng viên:  teacher1@gmail.com              / levanthai113')
        self.stdout.write('  🛡️ Quản trị:    admin@elearning.edu.vn          / levanthai113')

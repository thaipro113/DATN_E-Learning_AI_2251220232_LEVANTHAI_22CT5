from django.test import TestCase
from django.db.utils import IntegrityError
from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.courses.models import Category, Course, Chapter, Lesson, Material, CourseStatus, MaterialType


class CoursesModelTest(TestCase):
    """
    Bộ kiểm thử cho các Models trong apps/courses (Category, Course, Chapter, Lesson, Material).
    """

    def setUp(self):
        self.teacher = CustomUser.objects.create_user(
            email='teacher_models@example.com',
            password='TestPassword123!',
            full_name='Teacher Model Tester',
            role=UserRole.TEACHER
        )
        self.category = Category.objects.create(
            name='IELTS Preparation',
            description='IELTS preparation courses'
        )

    def test_category_creation_and_auto_slug(self):
        """Kiểm tra tạo danh mục và tự động sinh slug."""
        self.assertEqual(self.category.name, 'IELTS Preparation')
        self.assertEqual(self.category.slug, 'ielts-preparation')
        self.assertTrue(self.category.is_active)
        self.assertEqual(str(self.category), 'IELTS Preparation')

    def test_course_creation_and_pricing_logic(self):
        """Kiểm tra tạo khóa học, slug và tự động nhận diện miễn phí/trả phí."""
        # Khóa học miễn phí (price = 0)
        free_course = Course.objects.create(
            category=self.category,
            teacher=self.teacher,
            title='IELTS Free Starter',
            description='Starter course for IELTS',
            level=EnglishLevel.A1,
            price=0
        )
        self.assertEqual(free_course.slug, 'ielts-free-starter')
        self.assertTrue(free_course.is_free)
        self.assertEqual(free_course.status, CourseStatus.DRAFT)

        # Khóa học trả phí (price > 0)
        paid_course = Course.objects.create(
            category=self.category,
            teacher=self.teacher,
            title='IELTS Master Class',
            description='Master course for IELTS 7.5+',
            level=EnglishLevel.C1,
            price=599000
        )
        self.assertEqual(paid_course.slug, 'ielts-master-class')
        self.assertFalse(paid_course.is_free)

    def test_chapter_creation_and_ordering(self):
        """Kiểm tra tạo chương học trong khóa học."""
        course = Course.objects.create(
            category=self.category,
            teacher=self.teacher,
            title='English Grammar in Use',
            description='Grammar course',
            level=EnglishLevel.B1
        )
        chapter1 = Chapter.objects.create(course=course, title='Tenses in English', order_index=1)
        chapter2 = Chapter.objects.create(course=course, title='Passive Voice', order_index=2)

        self.assertEqual(course.total_chapters, 2)
        self.assertEqual(chapter1.order_index, 1)
        self.assertEqual(chapter2.order_index, 2)

    def test_chapter_unique_together_constraint(self):
        """Kiểm tra ràng buộc duy nhất order_index trong cùng 1 khóa học."""
        course = Course.objects.create(
            category=self.category,
            teacher=self.teacher,
            title='Unique Chapter Course',
            description='Test uniqueness',
            level=EnglishLevel.A2
        )
        Chapter.objects.create(course=course, title='Chapter 1', order_index=1)

        with self.assertRaises(IntegrityError):
            Chapter.objects.create(course=course, title='Duplicate Chapter 1', order_index=1)

    def test_lesson_and_material_creation(self):
        """Kiểm tra tạo bài học và tài liệu đính kèm."""
        course = Course.objects.create(
            category=self.category,
            teacher=self.teacher,
            title='Vocabulary Mastery',
            description='Learn 3000 words',
            level=EnglishLevel.B2
        )
        chapter = Chapter.objects.create(course=course, title='Chapter 1: Daily Life', order_index=1)
        lesson = Lesson.objects.create(
            chapter=chapter,
            title='Lesson 1: Food and Drinks',
            content='Vocabulary about food',
            video_url='https://youtube.com/watch?v=example',
            duration_minutes=15,
            order_index=1,
            is_preview=True
        )

        material = Material.objects.create(
            lesson=lesson,
            title='Food Vocabulary PDF',
            file_url='https://example.com/food.pdf',
            file_type=MaterialType.PDF,
            file_size_bytes=1048576
        )

        self.assertEqual(course.total_lessons, 1)
        self.assertTrue(lesson.is_preview)
        self.assertEqual(material.file_type, MaterialType.PDF)
        self.assertEqual(lesson.materials.count(), 1)

from django.test import TestCase
from apps.accounts.models import CustomUser, UserRole, EnglishLevel
from apps.courses.models import Category, Course, Chapter, Lesson, Material, CourseStatus, MaterialType
from apps.courses.services import CategoryService, CourseService, CurriculumService


class CoursesServicesTest(TestCase):
    """
    Bộ kiểm thử cho các tầng nghiệp vụ CategoryService, CourseService, CurriculumService.
    """

    def setUp(self):
        self.teacher = CustomUser.objects.create_user(
            email='teacher_service@example.com',
            password='TestPassword123!',
            full_name='Teacher Tester',
            role=UserRole.TEACHER
        )
        self.admin_user = CustomUser.objects.create_superuser(
            email='admin_service@example.com',
            password='TestPassword123!',
            full_name='Admin Tester'
        )
        self.student = CustomUser.objects.create_user(
            email='student_service@example.com',
            password='TestPassword123!',
            full_name='Student Tester',
            role=UserRole.STUDENT
        )

        self.category = CategoryService.create_category({
            'name': 'Communication English',
            'description': 'Daily communication'
        })

    # ------------------ 1. CategoryService Tests ------------------
    def test_list_and_search_categories(self):
        """Kiểm tra lấy danh sách và tìm kiếm danh mục."""
        CategoryService.create_category({'name': 'TOEIC Prep', 'is_active': True})
        CategoryService.create_category({'name': 'Hidden Category', 'is_active': False})

        # Học viên chỉ thấy 2 danh mục active
        student_categories = CategoryService.list_categories(is_admin=False)
        self.assertEqual(student_categories.count(), 2)

        # Admin thấy cả 3 danh mục
        admin_categories = CategoryService.list_categories(is_admin=True)
        self.assertEqual(admin_categories.count(), 3)

        # Tìm kiếm theo từ khóa
        searched = CategoryService.list_categories(is_admin=False, search_query='TOEIC')
        self.assertEqual(searched.count(), 1)
        self.assertEqual(searched.first().name, 'TOEIC Prep')

    def test_delete_category_soft_vs_hard(self):
        """Kiểm tra xóa mềm khi có khóa học và xóa cứng khi không có khóa học."""
        # Danh mục rỗng -> Xóa cứng khỏi DB
        empty_cat = CategoryService.create_category({'name': 'Empty Category'})
        CategoryService.delete_category(empty_cat)
        self.assertFalse(Category.objects.filter(name='Empty Category').exists())

        # Danh mục có khóa học -> Ẩn is_active=False
        course = CourseService.create_course(self.teacher, {
            'title': 'Course in Category',
            'description': 'Desc',
            'category': self.category
        })
        CategoryService.delete_category(self.category)
        self.category.refresh_from_db()
        self.assertFalse(self.category.is_active)
        self.assertTrue(Category.objects.filter(id=self.category.id).exists())

    # ------------------ 2. CourseService Tests ------------------
    def test_create_and_update_course(self):
        """Kiểm tra tạo và cập nhật thông tin khóa học."""
        course = CourseService.create_course(self.teacher, {
            'title': 'Pronunciation Master',
            'description': 'Improve accent',
            'level': EnglishLevel.A2,
            'price': 200000
        })
        self.assertEqual(course.teacher, self.teacher)
        self.assertEqual(course.status, CourseStatus.DRAFT)

        updated_course = CourseService.update_course(course, {'price': 150000})
        self.assertEqual(updated_course.price, 150000)

    def test_publish_course_validation(self):
        """Kiểm tra điều kiện xuất bản khóa học (phải có chapter và lesson)."""
        course = CourseService.create_course(self.teacher, {
            'title': 'Publish Test Course',
            'description': 'Testing publish logic'
        })

        # Xuất bản thất bại khi chưa có chương
        success, message, _ = CourseService.publish_course(course)
        self.assertFalse(success)

        # Thêm chương và bài học
        chapter = CurriculumService.create_chapter(course, {'title': 'Chapter 1'})
        CurriculumService.create_lesson(chapter, {'title': 'Lesson 1'})

        # Xuất bản thành công
        success, message, published_course = CourseService.publish_course(course)
        self.assertTrue(success)
        self.assertEqual(published_course.status, CourseStatus.PUBLISHED)

    # ------------------ 3. CurriculumService Tests ------------------
    def test_curriculum_crud_and_permissions(self):
        """Kiểm tra CRUD chương học, bài học và quyền xem bài học thử."""
        course = CourseService.create_course(self.teacher, {
            'title': 'Full Curriculum Course',
            'description': 'Desc'
        })
        chapter = CurriculumService.create_chapter(course, {'title': 'Unit 1'})
        self.assertEqual(chapter.order_index, 1)

        # Bài 1 học thử (is_preview=True)
        preview_lesson = CurriculumService.create_lesson(chapter, {
            'title': 'Preview Lesson',
            'is_preview': True
        })
        # Bài 2 bài kín (is_preview=False)
        locked_lesson = CurriculumService.create_lesson(chapter, {
            'title': 'Locked Lesson',
            'is_preview': False
        })

        # Học viên xem được bài học thử
        lesson, has_perm, _ = CurriculumService.get_lesson_detail_with_permission(
            str(preview_lesson.id), user=self.student
        )
        self.assertTrue(has_perm)
        self.assertIsNotNone(lesson)

        # Học viên KHÔNG xem được bài kín khi chưa ghi danh
        lesson, has_perm, _ = CurriculumService.get_lesson_detail_with_permission(
            str(locked_lesson.id), user=self.student
        )
        self.assertFalse(has_perm)

        # Giáo viên sở hữu xem được bài kín
        lesson, has_perm, _ = CurriculumService.get_lesson_detail_with_permission(
            str(locked_lesson.id), user=self.teacher
        )
        self.assertTrue(has_perm)

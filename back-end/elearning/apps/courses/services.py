import uuid
from django.db.models import Count, Q
from .models import Category, Course, Chapter, Lesson, Material, CourseStatus
from apps.accounts.models import CustomUser


class CategoryService:
    """
    Tầng xử lý nghiệp vụ cho Danh mục khóa học (Category).
    """

    @staticmethod
    def list_categories(is_admin: bool = False, search_query: str = None):
        queryset = Category.objects.all()

        if not is_admin:
            queryset = queryset.filter(is_active=True)

        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) | Q(description__icontains=search_query)
            )

        queryset = queryset.annotate(
            courses_count=Count('courses', filter=Q(courses__status=CourseStatus.PUBLISHED))
        ).order_by('name')

        return queryset

    @staticmethod
    def get_category_by_id_or_slug(identifier: str, is_admin: bool = False):
        queryset = Category.objects.annotate(
            courses_count=Count('courses', filter=Q(courses__status=CourseStatus.PUBLISHED))
        )

        if not is_admin:
            queryset = queryset.filter(is_active=True)

        if identifier.isdigit():
            category = queryset.filter(id=int(identifier)).first()
        else:
            category = queryset.filter(slug=identifier).first()

        return category

    @staticmethod
    def create_category(validated_data: dict) -> Category:
        return Category.objects.create(**validated_data)

    @staticmethod
    def update_category(category: Category, validated_data: dict) -> Category:
        for attr, value in validated_data.items():
            setattr(category, attr, value)
        category.save()
        return category

    @staticmethod
    def delete_category(category: Category) -> tuple[bool, str]:
        if category.courses.exists():
            category.is_active = False
            category.save()
            return True, "Danh mục đang chứa khóa học nên đã được chuyển sang trạng thái ẩn."
        
        category.delete()
        return True, "Xóa danh mục thành công."


class CourseService:
    """
    Tầng xử lý nghiệp vụ cho Khóa học (Course).
    """

    @staticmethod
    def list_courses(filters: dict = None, user=None):
        filters = filters or {}
        queryset = Course.objects.select_related('category', 'teacher')

        if user and user.is_authenticated and user.role == 'ADMIN':
            if filters.get('status'):
                queryset = queryset.filter(status=filters.get('status'))
        elif user and user.is_authenticated and user.role == 'TEACHER':
            queryset = queryset.filter(
                Q(status=CourseStatus.PUBLISHED) | Q(teacher=user)
            )
            if filters.get('status'):
                queryset = queryset.filter(status=filters.get('status'))
        else:
            queryset = queryset.filter(status=CourseStatus.PUBLISHED)

        category_param = filters.get('category')
        if category_param:
            if str(category_param).isdigit():
                queryset = queryset.filter(category_id=int(category_param))
            else:
                queryset = queryset.filter(category__slug=category_param)

        level_param = filters.get('level')
        if level_param:
            queryset = queryset.filter(level=level_param.upper())

        is_free_param = filters.get('is_free')
        if is_free_param is not None:
            if str(is_free_param).lower() in ['true', '1']:
                queryset = queryset.filter(is_free=True)
            elif str(is_free_param).lower() in ['false', '0']:
                queryset = queryset.filter(is_free=False)

        search_query = filters.get('search')
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(teacher__full_name__icontains=search_query)
            )

        ordering = filters.get('ordering', '-created_at')
        allowed_orderings = ['created_at', '-created_at', 'price', '-price', 'title', '-title']
        if ordering in allowed_orderings:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-created_at')

        return queryset

    @staticmethod
    def get_my_teaching_courses(teacher: CustomUser):
        return Course.objects.filter(teacher=teacher).select_related('category').order_by('-created_at')

    @staticmethod
    def get_course_detail(identifier: str, user=None):
        queryset = Course.objects.select_related('category', 'teacher').prefetch_related(
            'chapters__lessons__materials'
        )

        try:
            uuid_obj = uuid.UUID(identifier)
            course = queryset.filter(id=uuid_obj).first()
        except ValueError:
            course = queryset.filter(slug=identifier).first()

        if not course:
            return None

        if course.status != CourseStatus.PUBLISHED:
            if not user or not user.is_authenticated:
                return None
            if user.role != 'ADMIN' and course.teacher != user:
                return None

        return course

    @staticmethod
    def create_course(teacher: CustomUser, validated_data: dict) -> Course:
        return Course.objects.create(teacher=teacher, **validated_data)

    @staticmethod
    def update_course(course: Course, validated_data: dict) -> Course:
        for attr, value in validated_data.items():
            setattr(course, attr, value)
        course.save()
        return course

    @staticmethod
    def delete_course(course: Course) -> tuple[bool, str]:
        course.status = CourseStatus.ARCHIVED
        course.save()
        return True, "Khóa học đã được lưu trữ (Archived) thành công."

    @staticmethod
    def publish_course(course: Course) -> tuple[bool, str, Course]:
        chapters_count = course.chapters.count()
        lessons_count = Lesson.objects.filter(chapter__course=course).count()

        if chapters_count == 0 or lessons_count == 0:
            return False, "Khóa học phải có ít nhất 1 chương học và 1 bài học mới có thể xuất bản.", course

        course.status = CourseStatus.PUBLISHED
        course.save()
        return True, "Khóa học đã được xuất bản công khai thành công!", course


class CurriculumService:
    """
    Tầng xử lý nghiệp vụ cho Cấu trúc Khóa học: Chương học (Chapter), Bài học (Lesson) & Tài liệu (Material).
    """

    # ------------------ CHAPTER SERVICES ------------------
    @staticmethod
    def get_chapter_by_id(chapter_id: str):
        try:
            return Chapter.objects.select_related('course__teacher').filter(id=chapter_id).first()
        except (ValueError, TypeError):
            return None

    @staticmethod
    def create_chapter(course: Course, validated_data: dict) -> Chapter:
        """
        Tạo chương học mới. Nếu không chỉ định order_index thì tự tăng tiếp theo.
        """
        if not validated_data.get('order_index'):
            last_order = course.chapters.count()
            validated_data['order_index'] = last_order + 1

        chapter = Chapter.objects.create(course=course, **validated_data)
        return chapter

    @staticmethod
    def update_chapter(chapter: Chapter, validated_data: dict) -> Chapter:
        for attr, value in validated_data.items():
            setattr(chapter, attr, value)
        chapter.save()
        return chapter

    @staticmethod
    def delete_chapter(chapter: Chapter) -> bool:
        chapter.delete()
        return True

    # ------------------ LESSON SERVICES ------------------
    @staticmethod
    def get_lesson_by_id(lesson_id: str):
        try:
            return Lesson.objects.select_related('chapter__course__teacher').prefetch_related('materials').filter(id=lesson_id).first()
        except (ValueError, TypeError):
            return None

    @staticmethod
    def create_lesson(chapter: Chapter, validated_data: dict) -> Lesson:
        """
        Tạo bài học mới trong chương. Nếu không chỉ định order_index thì tự tăng.
        """
        if not validated_data.get('order_index'):
            last_order = chapter.lessons.count()
            validated_data['order_index'] = last_order + 1

        lesson = Lesson.objects.create(chapter=chapter, **validated_data)
        return lesson

    @staticmethod
    def get_lesson_detail_with_permission(lesson_id: str, user=None) -> tuple[Lesson | None, bool, str]:
        """
        Lấy chi tiết nội dung bài giảng và kiểm tra phân quyền truy cập:
        - Giáo viên phụ trách khóa học hoặc Admin: Toàn quyền xem.
        - Khách / Học viên: Cho phép xem nếu bài học bật cờ `is_preview=True` (học thử) hoặc đã ghi danh khóa học.
        """
        lesson = CurriculumService.get_lesson_by_id(lesson_id)
        if not lesson:
            return None, False, "Không tìm thấy bài học yêu cầu."

        course = lesson.chapter.course

        # 1. Admin hoặc giáo viên sở hữu
        if user and user.is_authenticated and (user.role == 'ADMIN' or course.teacher == user):
            return lesson, True, "Thành công"

        # 2. Bài học cho phép học thử công khai
        if lesson.is_preview:
            return lesson, True, "Thành công (Bài học thử)"

        # 3. Học viên đã đăng nhập và đã đăng ký khóa học
        if user and user.is_authenticated:
            # Kiểm tra quan hệ ghi danh nếu có bảng enrollments
            if hasattr(course, 'enrollments') and course.enrollments.filter(student=user, status__in=['ACTIVE', 'COMPLETED']).exists():
                return lesson, True, "Thành công"

        return None, False, "Bạn cần đăng ký khóa học để xem toàn bộ nội dung bài giảng này."

    @staticmethod
    def update_lesson(lesson: Lesson, validated_data: dict) -> Lesson:
        for attr, value in validated_data.items():
            setattr(lesson, attr, value)
        lesson.save()
        return lesson

    @staticmethod
    def delete_lesson(lesson: Lesson) -> bool:
        lesson.delete()
        return True

    # ------------------ MATERIAL SERVICES ------------------
    @staticmethod
    def get_material_by_id(material_id: str):
        try:
            return Material.objects.select_related('lesson__chapter__course__teacher').filter(id=material_id).first()
        except (ValueError, TypeError):
            return None

    @staticmethod
    def add_material(lesson: Lesson, validated_data: dict) -> Material:
        material = Material.objects.create(lesson=lesson, **validated_data)
        return material

    @staticmethod
    def delete_material(material: Material) -> bool:
        material.delete()
        return True

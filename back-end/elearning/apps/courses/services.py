from django.db.models import Count, Q
from .models import Category, Course, Chapter, Lesson, CourseStatus
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
        """
        Lấy danh sách khóa học kèm bộ lọc nâng cao.
        - Khách / Học viên: Chỉ xem các khóa status='PUBLISHED'.
        - Giáo viên / Admin: Có thể lọc thêm các khóa của mình hoặc theo status.
        """
        filters = filters or {}
        queryset = Course.objects.select_related('category', 'teacher')

        # Phân quyền hiển thị theo vai trò
        if user and user.is_authenticated and user.role == 'ADMIN':
            # Admin có thể xem tất cả các trạng thái
            if filters.get('status'):
                queryset = queryset.filter(status=filters.get('status'))
        elif user and user.is_authenticated and user.role == 'TEACHER':
            # Giáo viên xem các khóa PUBLISHED hoặc các khóa do chính mình tạo
            queryset = queryset.filter(
                Q(status=CourseStatus.PUBLISHED) | Q(teacher=user)
            )
            if filters.get('status'):
                queryset = queryset.filter(status=filters.get('status'))
        else:
            # Học viên / Khách chỉ xem khóa đã xuất bản
            queryset = queryset.filter(status=CourseStatus.PUBLISHED)

        # Lọc theo danh mục
        category_param = filters.get('category')
        if category_param:
            if str(category_param).isdigit():
                queryset = queryset.filter(category_id=int(category_param))
            else:
                queryset = queryset.filter(category__slug=category_param)

        # Lọc theo trình độ (A1 - C2)
        level_param = filters.get('level')
        if level_param:
            queryset = queryset.filter(level=level_param.upper())

        # Lọc theo miễn phí / trả phí
        is_free_param = filters.get('is_free')
        if is_free_param is not None:
            if str(is_free_param).lower() in ['true', '1']:
                queryset = queryset.filter(is_free=True)
            elif str(is_free_param).lower() in ['false', '0']:
                queryset = queryset.filter(is_free=False)

        # Tìm kiếm theo từ khóa
        search_query = filters.get('search')
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(teacher__full_name__icontains=search_query)
            )

        # Sắp xếp
        ordering = filters.get('ordering', '-created_at')
        allowed_orderings = ['created_at', '-created_at', 'price', '-price', 'title', '-title']
        if ordering in allowed_orderings:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-created_at')

        return queryset

    @staticmethod
    def get_my_teaching_courses(teacher: CustomUser):
        """
        Lấy danh sách tất cả các khóa học do giáo viên chỉ định tạo ra.
        """
        return Course.objects.filter(teacher=teacher).select_related('category').order_by('-created_at')

    @staticmethod
    def get_course_detail(identifier: str, user=None):
        """
        Lấy chi tiết khóa học kèm danh sách chương, bài học và tài liệu.
        Kiểm tra quyền nếu khóa học đang ở trạng thái DRAFT.
        """
        queryset = Course.objects.select_related('category', 'teacher').prefetch_related(
            'chapters__lessons__materials'
        )

        import uuid
        try:
            uuid_obj = uuid.UUID(identifier)
            course = queryset.filter(id=uuid_obj).first()
        except ValueError:
            course = queryset.filter(slug=identifier).first()

        if not course:
            return None

        # Nếu khóa học chưa xuất bản (DRAFT hoặc ARCHIVED)
        if course.status != CourseStatus.PUBLISHED:
            # Chỉ cho phép Admin hoặc chính Giáo viên tạo khóa học xem
            if not user or not user.is_authenticated:
                return None
            if user.role != 'ADMIN' and course.teacher != user:
                return None

        return course

    @staticmethod
    def create_course(teacher: CustomUser, validated_data: dict) -> Course:
        """
        Tạo mới khóa học và gán quyền sở hữu cho giáo viên.
        """
        course = Course.objects.create(teacher=teacher, **validated_data)
        return course

    @staticmethod
    def update_course(course: Course, validated_data: dict) -> Course:
        """
        Cập nhật thông tin khóa học.
        """
        for attr, value in validated_data.items():
            setattr(course, attr, value)
        course.save()
        return course

    @staticmethod
    def delete_course(course: Course) -> tuple[bool, str]:
        """
        Lưu trữ hoặc xóa khóa học:
        - Chuyển trạng thái sang ARCHIVED để bảo toàn lịch sử học tập của học viên.
        """
        course.status = CourseStatus.ARCHIVED
        course.save()
        return True, "Khóa học đã được lưu trữ (Archived) thành công."

    @staticmethod
    def publish_course(course: Course) -> tuple[bool, str, Course]:
        """
        Xuất bản khóa học ra công chúng (status = 'PUBLISHED').
        Điều kiện: Khóa học phải có ít nhất 1 chương học và 1 bài học.
        """
        chapters_count = course.chapters.count()
        lessons_count = Lesson.objects.filter(chapter__course=course).count()

        if chapters_count == 0 or lessons_count == 0:
            return False, "Khóa học phải có ít nhất 1 chương học và 1 bài học mới có thể xuất bản.", course

        course.status = CourseStatus.PUBLISHED
        course.save()
        return True, "Khóa học đã được xuất bản công khai thành công!", course

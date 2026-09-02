from rest_framework import serializers
from .models import Category, Course, Chapter, Lesson, Material, CourseStatus, MaterialType
from apps.accounts.models import CustomUser, EnglishLevel


# ==================== CATEGORY SERIALIZERS ====================

class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị thông tin chi tiết danh mục khóa học cho người dùng.
    """
    courses_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'icon_url',
            'is_active',
            'courses_count',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'courses_count', 'created_at', 'updated_at']


class CategoryCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer tiếp nhận và kiểm tra dữ liệu khi Quản trị viên thêm/sửa Danh mục.
    """
    name = serializers.CharField(
        max_length=150,
        min_length=2,
        help_text="Tên danh mục khóa học (VD: Tiếng Anh Giao Tiếp, Ngữ Pháp, IELTS...)"
    )

    class Meta:
        model = Category
        fields = ['name', 'description', 'icon_url', 'is_active']
        extra_kwargs = {
            'description': {'required': False, 'allow_blank': True},
            'icon_url': {'required': False, 'allow_blank': True},
            'is_active': {'required': False, 'default': True}
        }

    def validate_name(self, value):
        normalized_name = value.strip()
        category_id = self.instance.id if self.instance else None

        if Category.objects.filter(name__iexact=normalized_name).exclude(id=category_id).exists():
            raise serializers.ValidationError("Tên danh mục này đã tồn tại trong hệ thống.")

        return normalized_name


class CategorySimpleSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị thông tin danh mục rút gọn lồng trong Khóa học.
    """
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon_url']


# ==================== TEACHER / COMMON SERIALIZERS ====================

class TeacherSimpleSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị thông tin giáo viên phụ trách khóa học.
    """
    class Meta:
        model = CustomUser
        fields = ['id', 'full_name', 'email', 'avatar_url', 'bio']


# ==================== MATERIAL SERIALIZERS ====================

class MaterialSimpleSerializer(serializers.ModelSerializer):
    """
    Serializer tài liệu đính kèm lồng trong bài học.
    """
    file_type_display = serializers.CharField(source='get_file_type_display', read_only=True)

    class Meta:
        model = Material
        fields = ['id', 'title', 'file_url', 'file_type', 'file_type_display', 'file_size_bytes', 'created_at']


class MaterialCreateSerializer(serializers.ModelSerializer):
    """
    Serializer tiếp nhận dữ liệu khi thêm tài liệu cho bài học.
    """
    class Meta:
        model = Material
        fields = ['title', 'file_url', 'file_type', 'file_size_bytes']
        extra_kwargs = {
            'file_type': {'required': False, 'default': MaterialType.PDF},
            'file_size_bytes': {'required': False, 'default': 0}
        }


# ==================== LESSON SERIALIZERS ====================

class LessonSimpleSerializer(serializers.ModelSerializer):
    """
    Serializer bài học lồng trong chương học (mục lục rút gọn).
    """
    materials_count = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id',
            'title',
            'duration_minutes',
            'order_index',
            'is_preview',
            'video_url',
            'materials_count'
        ]

    def get_materials_count(self, obj):
        return obj.materials.count()


class LessonDetailResponseSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị chi tiết bài học (nội dung lý thuyết Markdown, video, danh sách tài liệu).
    """
    materials = MaterialSimpleSerializer(many=True, read_only=True)
    chapter_title = serializers.CharField(source='chapter.title', read_only=True)
    course_title = serializers.CharField(source='chapter.course.title', read_only=True)

    class Meta:
        model = Lesson
        fields = [
            'id',
            'title',
            'content',
            'video_url',
            'duration_minutes',
            'order_index',
            'is_preview',
            'chapter_title',
            'course_title',
            'materials',
            'created_at',
            'updated_at'
        ]


class LessonCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer tiếp nhận dữ liệu khi Giáo viên/Admin tạo hoặc cập nhật Bài học.
    """
    video_url = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="YouTube URL hoặc dữ liệu video"
    )

    class Meta:
        model = Lesson
        fields = [
            'title',
            'content',
            'video_url',
            'duration_minutes',
            'order_index',
            'is_preview'
        ]
        extra_kwargs = {
            'content': {'required': False, 'allow_blank': True},
            'video_url': {'required': False, 'allow_blank': True},
            'duration_minutes': {'required': False, 'default': 10},
            'order_index': {'required': False, 'allow_null': True},
            'is_preview': {'required': False, 'default': False}
        }


# ==================== CHAPTER SERIALIZERS ====================

class ChapterSimpleSerializer(serializers.ModelSerializer):
    """
    Serializer chương học kèm danh sách các bài học con.
    """
    lessons = LessonSimpleSerializer(many=True, read_only=True)
    total_lessons = serializers.SerializerMethodField()

    class Meta:
        model = Chapter
        fields = ['id', 'title', 'description', 'order_index', 'total_lessons', 'lessons']

    def get_total_lessons(self, obj):
        return obj.lessons.count()


class ChapterCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer tiếp nhận dữ liệu khi Giáo viên/Admin tạo hoặc cập nhật Chương học.
    """
    class Meta:
        model = Chapter
        fields = ['title', 'description', 'order_index']
        extra_kwargs = {
            'description': {'required': False, 'allow_blank': True},
            'order_index': {'required': False, 'allow_null': True}
        }


# ==================== COURSE SERIALIZERS ====================

class CourseListSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị danh sách khóa học trên trang chủ / tìm kiếm.
    """
    category = CategorySimpleSerializer(read_only=True)
    teacher = TeacherSimpleSerializer(read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_chapters = serializers.IntegerField(read_only=True)
    total_lessons = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = [
            'id',
            'title',
            'slug',
            'description',
            'level',
            'level_display',
            'thumbnail_url',
            'price',
            'is_free',
            'status',
            'status_display',
            'category',
            'teacher',
            'total_chapters',
            'total_lessons',
            'created_at',
            'updated_at'
        ]


class CourseDetailSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị toàn bộ chi tiết khóa học bao gồm mục lục các chương và bài học.
    """
    category = CategorySimpleSerializer(read_only=True)
    teacher = TeacherSimpleSerializer(read_only=True)
    chapters = ChapterSimpleSerializer(many=True, read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_chapters = serializers.IntegerField(read_only=True)
    total_lessons = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = [
            'id',
            'title',
            'slug',
            'description',
            'level',
            'level_display',
            'thumbnail_url',
            'price',
            'is_free',
            'status',
            'status_display',
            'category',
            'teacher',
            'total_chapters',
            'total_lessons',
            'chapters',
            'created_at',
            'updated_at'
        ]


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer tiếp nhận dữ liệu khi Giáo viên/Admin tạo hoặc cập nhật Khóa học.
    """
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.filter(is_active=True),
        source='category',
        required=False,
        allow_null=True,
        help_text="ID danh mục của khóa học"
    )
    thumbnail_url = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="Đường dẫn ảnh hoặc Base64"
    )

    class Meta:
        model = Course
        fields = [
            'title',
            'description',
            'category_id',
            'level',
            'thumbnail_url',
            'price',
            'status'
        ]
        extra_kwargs = {
            'thumbnail_url': {'required': False, 'allow_blank': True},
            'price': {'required': False, 'default': 0},
            'status': {'required': False, 'default': CourseStatus.DRAFT},
        }

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Học phí không được là số âm.")
        return value

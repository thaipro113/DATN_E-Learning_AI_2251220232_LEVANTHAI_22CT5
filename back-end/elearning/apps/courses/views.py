from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from common.responses import success_response, error_response
from common.permissions import IsAdminUserRole, IsTeacherUserRole, IsOwnerOrReadOnly
from .models import Course, Chapter, Lesson, Material
from .serializers import (
    CategorySerializer,
    CategoryCreateUpdateSerializer,
    CourseListSerializer,
    CourseDetailSerializer,
    CourseCreateUpdateSerializer,
    ChapterSimpleSerializer,
    ChapterCreateUpdateSerializer,
    LessonSimpleSerializer,
    LessonDetailResponseSerializer,
    LessonCreateUpdateSerializer,
    MaterialSimpleSerializer,
    MaterialCreateSerializer
)
from .services import CategoryService, CourseService, CurriculumService
from .schemas import (
    list_categories_schema,
    get_category_schema,
    create_category_schema,
    update_category_schema,
    delete_category_schema,
    list_courses_schema,
    my_teaching_courses_schema,
    get_course_detail_schema,
    create_course_schema,
    update_course_schema,
    delete_course_schema,
    publish_course_schema,
    create_chapter_schema,
    update_chapter_schema,
    delete_chapter_schema,
    create_lesson_schema,
    get_lesson_detail_schema,
    update_lesson_schema,
    delete_lesson_schema,
    create_material_schema,
    delete_material_schema
)


# ==================== CATEGORY VIEWS ====================

class CategoryListCreateAPIView(APIView):
    """
    API Endpoint lấy danh sách hoặc tạo mới Danh mục khóa học:
    - GET: Công khai (Public).
    - POST: Quản trị viên (Admin only).
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUserRole()]
        return [AllowAny()]

    @list_categories_schema
    def get(self, request):
        is_admin = bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')
        search_query = request.query_params.get('search', None)

        categories = CategoryService.list_categories(
            is_admin=is_admin,
            search_query=search_query
        )

        serializer = CategorySerializer(categories, many=True)
        return success_response(
            data=serializer.data,
            message="Lấy danh sách danh mục khóa học thành công!",
            status_code=status.HTTP_200_OK
        )

    @create_category_schema
    def post(self, request):
        serializer = CategoryCreateUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu danh mục không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        category = CategoryService.create_category(serializer.validated_data)

        return success_response(
            data=CategorySerializer(category).data,
            message="Tạo danh mục khóa học thành công!",
            status_code=status.HTTP_201_CREATED
        )


class CategoryDetailAPIView(APIView):
    """
    API Endpoint xem chi tiết, cập nhật hoặc xóa Danh mục:
    - GET: Công khai theo ID hoặc Slug.
    - PATCH / DELETE: Quản trị viên (Admin only).
    """
    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT', 'DELETE']:
            return [IsAdminUserRole()]
        return [AllowAny()]

    def _get_category(self, identifier, request):
        is_admin = bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')
        category = CategoryService.get_category_by_id_or_slug(identifier, is_admin=is_admin)
        return category

    @get_category_schema
    def get(self, request, identifier):
        category = self._get_category(identifier, request)
        if not category:
            return error_response(
                message="Không tìm thấy danh mục khóa học yêu cầu.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        return success_response(
            data=CategorySerializer(category).data,
            message="Lấy chi tiết danh mục thành công!",
            status_code=status.HTTP_200_OK
        )

    @update_category_schema
    def patch(self, request, identifier):
        category = self._get_category(identifier, request)
        if not category:
            return error_response(
                message="Không tìm thấy danh mục để cập nhật.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        serializer = CategoryCreateUpdateSerializer(
            instance=category,
            data=request.data,
            partial=True
        )
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu cập nhật không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        updated_category = CategoryService.update_category(category, serializer.validated_data)

        return success_response(
            data=CategorySerializer(updated_category).data,
            message="Cập nhật danh mục thành công!",
            status_code=status.HTTP_200_OK
        )

    @delete_category_schema
    def delete(self, request, identifier):
        category = self._get_category(identifier, request)
        if not category:
            return error_response(
                message="Không tìm thấy danh mục để xóa.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        _, message = CategoryService.delete_category(category)

        return success_response(
            message=message,
            status_code=status.HTTP_200_OK
        )


# ==================== COURSE VIEWS ====================

class CourseListCreateAPIView(APIView):
    """
    API Endpoint danh sách và tạo mới Khóa học:
    - GET: Công khai danh sách khóa học có bộ lọc.
    - POST: Giáo viên hoặc Admin tạo khóa học mới.
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsTeacherUserRole()]
        return [AllowAny()]

    @list_courses_schema
    def get(self, request):
        filters = {
            'category': request.query_params.get('category'),
            'level': request.query_params.get('level'),
            'is_free': request.query_params.get('is_free'),
            'search': request.query_params.get('search'),
            'ordering': request.query_params.get('ordering'),
            'status': request.query_params.get('status')
        }

        courses = CourseService.list_courses(filters=filters, user=request.user)

        from common.pagination import StandardResultsSetPagination
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(courses, request)
        serializer = CourseListSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)

    @create_course_schema
    def post(self, request):
        serializer = CourseCreateUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu tạo khóa học không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        course = CourseService.create_course(
            teacher=request.user,
            validated_data=serializer.validated_data
        )

        return success_response(
            data=CourseDetailSerializer(course).data,
            message="Tạo khóa học thành công!",
            status_code=status.HTTP_201_CREATED
        )


class TeacherCoursesAPIView(APIView):
    """
    API Endpoint lấy danh sách các khóa học do chính Giáo viên đang đăng nhập phụ trách.
    """
    permission_classes = [IsTeacherUserRole]

    @my_teaching_courses_schema
    def get(self, request):
        courses = CourseService.get_my_teaching_courses(teacher=request.user)
        serializer = CourseListSerializer(courses, many=True)
        return success_response(
            data=serializer.data,
            message="Lấy danh sách khóa học giảng dạy thành công!",
            status_code=status.HTTP_200_OK
        )


class CourseDetailAPIView(APIView):
    """
    API Endpoint xem chi tiết, cập nhật hoặc lưu trữ Khóa học.
    """
    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT', 'DELETE']:
            return [IsTeacherUserRole(), IsOwnerOrReadOnly()]
        return [AllowAny()]

    @get_course_detail_schema
    def get(self, request, identifier):
        course = CourseService.get_course_detail(identifier=identifier, user=request.user)
        if not course:
            return error_response(
                message="Không tìm thấy khóa học hoặc khóa học chưa được công bố.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        return success_response(
            data=CourseDetailSerializer(course).data,
            message="Lấy thông tin chi tiết khóa học thành công!",
            status_code=status.HTTP_200_OK
        )

    @update_course_schema
    def patch(self, request, identifier):
        course = CourseService.get_course_detail(identifier=identifier, user=request.user)
        if not course:
            return error_response(
                message="Không tìm thấy khóa học để cập nhật.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        self.check_object_permissions(request, course)

        serializer = CourseCreateUpdateSerializer(
            instance=course,
            data=request.data,
            partial=True
        )
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu cập nhật khóa học không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        updated_course = CourseService.update_course(course, serializer.validated_data)

        return success_response(
            data=CourseDetailSerializer(updated_course).data,
            message="Cập nhật khóa học thành công!",
            status_code=status.HTTP_200_OK
        )

    @delete_course_schema
    def delete(self, request, identifier):
        course = CourseService.get_course_detail(identifier=identifier, user=request.user)
        if not course:
            return error_response(
                message="Không tìm thấy khóa học để xóa.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        self.check_object_permissions(request, course)

        _, message = CourseService.delete_course(course)

        return success_response(
            message=message,
            status_code=status.HTTP_200_OK
        )


class CoursePublishAPIView(APIView):
    """
    API Endpoint xuất bản khóa học ra công chúng (Publish).
    """
    permission_classes = [IsTeacherUserRole, IsOwnerOrReadOnly]

    @publish_course_schema
    def post(self, request, identifier):
        course = CourseService.get_course_detail(identifier=identifier, user=request.user)
        if not course:
            return error_response(
                message="Không tìm thấy khóa học để xuất bản.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        self.check_object_permissions(request, course)

        success, message, published_course = CourseService.publish_course(course)
        if not success:
            return error_response(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        return success_response(
            data=CourseDetailSerializer(published_course).data,
            message=message,
            status_code=status.HTTP_200_OK
        )


# ==================== CURRICULUM (CHAPTER / LESSON / MATERIAL) VIEWS ====================

class ChapterListCreateAPIView(APIView):
    """
    API Endpoint tạo chương học mới trong Khóa học.
    """
    permission_classes = [IsTeacherUserRole]

    @create_chapter_schema
    def post(self, request, course_id):
        course = CourseService.get_course_detail(identifier=str(course_id), user=request.user)
        if not course:
            return error_response(
                message="Không tìm thấy khóa học để thêm chương.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        # Kiểm tra quyền chủ sở hữu
        if request.user.role != 'ADMIN' and course.teacher != request.user:
            return error_response(
                message="Bạn không phải giáo viên phụ trách khóa học này.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        serializer = ChapterCreateUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu chương học không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        chapter = CurriculumService.create_chapter(course, serializer.validated_data)

        return success_response(
            data=ChapterSimpleSerializer(chapter).data,
            message="Tạo chương học thành công!",
            status_code=status.HTTP_201_CREATED
        )


class ChapterDetailAPIView(APIView):
    """
    API Endpoint cập nhật hoặc xóa Chương học.
    """
    permission_classes = [IsTeacherUserRole]

    def _check_permission(self, chapter, request):
        if request.user.role != 'ADMIN' and chapter.course.teacher != request.user:
            return False
        return True

    @update_chapter_schema
    def patch(self, request, chapter_id):
        chapter = CurriculumService.get_chapter_by_id(chapter_id)
        if not chapter:
            return error_response(
                message="Không tìm thấy chương học.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if not self._check_permission(chapter, request):
            return error_response(
                message="Bạn không có quyền chỉnh sửa chương học này.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        serializer = ChapterCreateUpdateSerializer(instance=chapter, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu cập nhật chương học không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        updated_chapter = CurriculumService.update_chapter(chapter, serializer.validated_data)

        return success_response(
            data=ChapterSimpleSerializer(updated_chapter).data,
            message="Cập nhật chương học thành công!",
            status_code=status.HTTP_200_OK
        )

    @delete_chapter_schema
    def delete(self, request, chapter_id):
        chapter = CurriculumService.get_chapter_by_id(chapter_id)
        if not chapter:
            return error_response(
                message="Không tìm thấy chương học.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if not self._check_permission(chapter, request):
            return error_response(
                message="Bạn không có quyền xóa chương học này.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        CurriculumService.delete_chapter(chapter)

        return success_response(
            message="Xóa chương học và các nội dung bên trong thành công!",
            status_code=status.HTTP_200_OK
        )


class LessonCreateAPIView(APIView):
    """
    API Endpoint tạo bài học mới trong Chương học.
    """
    permission_classes = [IsTeacherUserRole]

    @create_lesson_schema
    def post(self, request, chapter_id):
        chapter = CurriculumService.get_chapter_by_id(chapter_id)
        if not chapter:
            return error_response(
                message="Không tìm thấy chương học.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if request.user.role != 'ADMIN' and chapter.course.teacher != request.user:
            return error_response(
                message="Bạn không có quyền thêm bài học vào khóa học này.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        serializer = LessonCreateUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu bài học không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        lesson = CurriculumService.create_lesson(chapter, serializer.validated_data)

        return success_response(
            data=LessonDetailResponseSerializer(lesson).data,
            message="Tạo bài học mới thành công!",
            status_code=status.HTTP_201_CREATED
        )


class LessonDetailAPIView(APIView):
    """
    API Endpoint xem nội dung chi tiết, sửa hoặc xóa Bài học.
    """
    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT', 'DELETE']:
            return [IsTeacherUserRole()]
        return [AllowAny()]

    def _check_teacher_permission(self, lesson, request):
        if request.user.role != 'ADMIN' and lesson.chapter.course.teacher != request.user:
            return False
        return True

    @get_lesson_detail_schema
    def get(self, request, lesson_id):
        lesson, has_perm, message = CurriculumService.get_lesson_detail_with_permission(
            lesson_id=lesson_id,
            user=request.user
        )

        if not lesson:
            if not has_perm:
                return error_response(
                    message=message,
                    status_code=status.HTTP_403_FORBIDDEN
                )
            return error_response(
                message=message,
                status_code=status.HTTP_404_NOT_FOUND
            )

        return success_response(
            data=LessonDetailResponseSerializer(lesson).data,
            message="Lấy nội dung bài học thành công!",
            status_code=status.HTTP_200_OK
        )

    @update_lesson_schema
    def patch(self, request, lesson_id):
        lesson = CurriculumService.get_lesson_by_id(lesson_id)
        if not lesson:
            return error_response(
                message="Không tìm thấy bài học.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if not self._check_teacher_permission(lesson, request):
            return error_response(
                message="Bạn không có quyền chỉnh sửa bài học này.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        serializer = LessonCreateUpdateSerializer(instance=lesson, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu cập nhật bài học không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        updated_lesson = CurriculumService.update_lesson(lesson, serializer.validated_data)

        return success_response(
            data=LessonDetailResponseSerializer(updated_lesson).data,
            message="Cập nhật bài học thành công!",
            status_code=status.HTTP_200_OK
        )

    @delete_lesson_schema
    def delete(self, request, lesson_id):
        lesson = CurriculumService.get_lesson_by_id(lesson_id)
        if not lesson:
            return error_response(
                message="Không tìm thấy bài học.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if not self._check_teacher_permission(lesson, request):
            return error_response(
                message="Bạn không có quyền xóa bài học này.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        CurriculumService.delete_lesson(lesson)

        return success_response(
            message="Xóa bài học thành công!",
            status_code=status.HTTP_200_OK
        )


class MaterialCreateAPIView(APIView):
    """
    API Endpoint đính kèm tài liệu vào bài học.
    """
    permission_classes = [IsTeacherUserRole]

    @create_material_schema
    def post(self, request, lesson_id):
        lesson = CurriculumService.get_lesson_by_id(lesson_id)
        if not lesson:
            return error_response(
                message="Không tìm thấy bài học để đính kèm tài liệu.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if request.user.role != 'ADMIN' and lesson.chapter.course.teacher != request.user:
            return error_response(
                message="Bạn không có quyền thêm tài liệu vào bài học này.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        serializer = MaterialCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dữ liệu tài liệu không hợp lệ.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        material = CurriculumService.add_material(lesson, serializer.validated_data)

        return success_response(
            data=MaterialSimpleSerializer(material).data,
            message="Đính kèm tài liệu thành công!",
            status_code=status.HTTP_201_CREATED
        )


class MaterialDetailAPIView(APIView):
    """
    API Endpoint xóa tài liệu đính kèm.
    """
    permission_classes = [IsTeacherUserRole]

    @delete_material_schema
    def delete(self, request, material_id):
        material = CurriculumService.get_material_by_id(material_id)
        if not material:
            return error_response(
                message="Không tìm thấy tài liệu.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if request.user.role != 'ADMIN' and material.lesson.chapter.course.teacher != request.user:
            return error_response(
                message="Bạn không có quyền xóa tài liệu này.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        CurriculumService.delete_material(material)

        return success_response(
            message="Xóa tài liệu đính kèm thành công!",
            status_code=status.HTTP_200_OK
        )

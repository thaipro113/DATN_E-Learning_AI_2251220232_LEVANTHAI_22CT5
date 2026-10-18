from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminUserRole(BasePermission):
    """
    Allows access only to users with the ADMIN role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == 'ADMIN' or request.user.is_staff or request.user.is_superuser)
        )


class IsReviewerUserRole(BasePermission):
    """
    Cho phép truy cập chỉ dành cho Người phản biện / Thẩm định bài giảng (REVIEWER).
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'REVIEWER' or request.user.is_staff or request.user.is_superuser)
        )


class IsReviewerOrAdminUserRole(BasePermission):
    """
    Cho phép truy cập dành cho Người phản biện (REVIEWER) hoặc Quản trị viên (ADMIN)
    để rà soát, phản biện và phê duyệt khóa học.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['REVIEWER', 'ADMIN'] or request.user.is_staff or request.user.is_superuser)
        )


class IsTeacherUserRole(BasePermission):
    """
    Allows access only to users with the TEACHER or ADMIN role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role in ['TEACHER', 'ADMIN'] or request.user.is_superuser)
        )


class IsStudentUserRole(BasePermission):
    """
    Allows access only to users with the STUDENT role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'STUDENT'
        )


class IsOwnerOrReadOnly(BasePermission):
    """
    Cho phép Giảng viên chính (Teacher), Giảng viên đồng phụ trách (co_teachers)
    hoặc Quản trị viên (Admin) sửa / xóa khóa học và học liệu bên trong.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        # Admin có toàn quyền quản trị
        if request.user.role == 'ADMIN' or request.user.is_staff or request.user.is_superuser:
            return True

        # Kiểm tra nếu obj trực tiếp là Course
        if hasattr(obj, 'teacher'):
            if obj.teacher == request.user:
                return True
            if hasattr(obj, 'co_teachers') and obj.co_teachers.filter(id=request.user.id).exists():
                return True

        # Kiểm tra nếu obj là Chapter, Lesson, Material thuộc về một Course
        course = getattr(obj, 'course', None)
        if not course and hasattr(obj, 'chapter') and getattr(obj.chapter, 'course', None):
            course = obj.chapter.course
        if not course and hasattr(obj, 'lesson') and getattr(obj.lesson, 'chapter', None):
            course = obj.lesson.chapter.course

        if course:
            if course.teacher == request.user:
                return True
            if hasattr(course, 'co_teachers') and course.co_teachers.filter(id=request.user.id).exists():
                return True

        # Fallback kiểm tra sở hữu thông thường (author, user)
        owner = getattr(obj, 'user', None) or getattr(obj, 'author', None)
        return owner == request.user

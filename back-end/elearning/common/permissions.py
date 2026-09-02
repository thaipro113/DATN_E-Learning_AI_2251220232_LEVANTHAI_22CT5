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
    Chỉ cho phép Chủ sở hữu (Chính giảng viên tạo ra khóa học) hoặc Quản trị viên (Admin) sửa / xóa.
    Giảng viên khác tuyệt đối không có quyền sửa hay xóa khóa học của người khác.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        # Admin có toàn quyền quản trị
        if request.user.role == 'ADMIN' or request.user.is_staff or request.user.is_superuser:
            return True
        # Chỉ đúng Giảng viên là chủ sở hữu (Owner) mới có quyền sửa/xóa
        owner = getattr(obj, 'teacher', None) or getattr(obj, 'user', None) or getattr(obj, 'author', None)
        return owner == request.user

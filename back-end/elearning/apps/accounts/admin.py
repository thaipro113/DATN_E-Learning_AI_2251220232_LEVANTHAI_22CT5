from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ('email', 'full_name', 'role', 'level', 'is_active', 'is_staff', 'created_at')
    list_filter = ('role', 'level', 'is_active', 'is_staff', 'created_at')
    search_fields = ('email', 'full_name', 'phone_number')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Thông tin cá nhân'), {'fields': ('full_name', 'avatar_url', 'phone_number', 'bio')}),
        (_('Phân quyền & Cấp độ'), {'fields': ('role', 'level')}),
        (_('Trạng thái & Quyền hạn'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Mốc thời gian'), {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'last_login')

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'role', 'level', 'password', 'is_active', 'is_staff'),
        }),
    )

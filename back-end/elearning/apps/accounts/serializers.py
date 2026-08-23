from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.validators import EmailValidator
from django.contrib.auth import authenticate
from .models import CustomUser, UserRole, EnglishLevel


class UserResponseSerializer(serializers.ModelSerializer):
    """
    Serializer định dạng thông tin người dùng trả về cho Client.
    Tuyệt đối không chứa password_hash để bảo vệ an toàn thông tin.
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id',
            'email',
            'full_name',
            'role',
            'role_display',
            'level',
            'level_display',
            'avatar_url',
            'phone_number',
            'bio',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    """
    Serializer tiếp nhận và kiểm tra tính hợp lệ của dữ liệu đăng ký tài khoản.
    """
    email = serializers.EmailField(
        required=True,
        validators=[EmailValidator(message="Định dạng email không hợp lệ.")],
        help_text="Địa chỉ email hợp lệ và duy nhất"
    )
    full_name = serializers.CharField(
        required=True,
        max_length=255,
        min_length=2,
        help_text="Họ và tên của người dùng (tối thiểu 2 ký tự)"
    )
    password = serializers.CharField(
        required=True,
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        help_text="Mật khẩu bảo mật tối thiểu 8 ký tự"
    )
    confirm_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text="Xác nhận lại mật khẩu vừa nhập"
    )
    role = serializers.ChoiceField(
        choices=[UserRole.STUDENT, UserRole.TEACHER],
        default=UserRole.STUDENT,
        help_text="Vai trò đăng ký: STUDENT (Học viên) hoặc TEACHER (Giáo viên)"
    )
    level = serializers.ChoiceField(
        choices=EnglishLevel.choices,
        default=EnglishLevel.A1,
        help_text="Trình độ tiếng Anh ban đầu (A1 - C2)"
    )

    def validate_email(self, value):
        """
        Kiểm tra xem email đã được đăng ký trong hệ thống trước đó chưa.
        """
        normalized_email = value.lower().strip()
        if CustomUser.objects.filter(email=normalized_email).exists():
            raise serializers.ValidationError("Địa chỉ email này đã được sử dụng. Vui lòng chọn email khác.")
        return normalized_email

    def validate(self, attrs):
        """
        Kiểm tra khớp mật khẩu xác nhận và độ mạnh của mật khẩu theo chuẩn Django.
        """
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')

        if password != confirm_password:
            raise serializers.ValidationError({"confirm_password": "Mật khẩu xác nhận không trùng khớp."})

        # Sử dụng trình kiểm tra mật khẩu bảo mật của Django
        validate_password(password)

        return attrs


class LoginSerializer(serializers.Serializer):
    """
    Serializer tiếp nhận và kiểm tra thông tin đăng nhập (Email & Password).
    """
    email = serializers.EmailField(
        required=True,
        help_text="Địa chỉ email đã đăng ký tài khoản"
    )
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text="Mật khẩu tài khoản"
    )

    def validate(self, attrs):
        email = attrs.get('email', '').lower().strip()
        password = attrs.get('password', '')

        if not email or not password:
            raise serializers.ValidationError("Vui lòng nhập đầy đủ email và mật khẩu.")

        user = CustomUser.objects.filter(email=email).first()

        if user is None or not user.check_password(password):
            raise serializers.ValidationError("Email hoặc mật khẩu không chính xác.")

        if not user.is_active:
            raise serializers.ValidationError("Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt. Vui lòng liên hệ Quản trị viên.")

        attrs['user'] = user
        return attrs


class TokenResponseSerializer(serializers.Serializer):
    """
    Serializer mô tả cấu trúc trả về của JWT Tokens (phục vụ Swagger Docs).
    """
    access = serializers.CharField(help_text="JWT Access Token có thời hạn ngắn (dùng để xác thực API)")
    refresh = serializers.CharField(help_text="JWT Refresh Token có thời hạn dài (dùng để cấp lại Access Token)")


class AuthResponseSerializer(serializers.Serializer):
    """
    Serializer mô tả cấu trúc trả về đầy đủ sau khi Đăng ký / Đăng nhập thành công.
    """
    user = UserResponseSerializer()
    tokens = TokenResponseSerializer()

import uuid
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from django.utils import timezone
from django.db.models import Q
from apps.accounts.models import UserRole
from apps.learning.models import Enrollment, EnrollmentStatus
from .models import FlashcardDeck, Flashcard, UserCardProgress, DeckCategory, DeckStatus, AccessScope
from .serializers import (
    FlashcardDeckSerializer,
    FlashcardDeckDetailSerializer,
    FlashcardSerializer,
    UserCardProgressSerializer,
)


def is_valid_uuid(val):
    if not val:
        return False
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, AttributeError):
        return False


class FlashcardDeckViewSet(viewsets.ModelViewSet):
    """
    ViewSet quản lý toàn diện các Bộ thẻ / Đề tài Flashcards.
    """
    queryset = FlashcardDeck.objects.select_related('author', 'course', 'reviewed_by').prefetch_related('cards').all()
    lookup_field = 'id'

    def get_serializer_class(self):
        if self.action in ['retrieve', 'detail']:
            return FlashcardDeckDetailSerializer
        return FlashcardDeckSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_object(self):
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_val = self.kwargs.get(lookup_url_kwarg)
        queryset = self.filter_queryset(self.get_queryset())
        
        if is_valid_uuid(lookup_val):
            obj = queryset.filter(id=lookup_val).first()
        else:
            obj = queryset.filter(code=lookup_val).first()

        if not obj:
            raise NotFound('Không tìm thấy bộ thẻ flashcard yêu cầu.')
            
        self.check_object_permissions(self.request, obj)
        return obj

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        # 1. Lọc theo Query Params
        category = self.request.query_params.get('category')
        if category:
            cat_upper = category.upper()
            if cat_upper in ['SYSTEM', 'TEACHER', 'PERSONAL']:
                qs = qs.filter(category=cat_upper)
            elif category.lower() == 'all':
                pass

        course_id = self.request.query_params.get('course_id') or self.request.query_params.get('courseId')
        if course_id:
            if is_valid_uuid(course_id):
                qs = qs.filter(Q(course__id=course_id) | Q(course_title__icontains=course_id))
            else:
                qs = qs.filter(course_title__icontains=course_id)

        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param.upper())

        # 2. Phân quyền hiển thị
        if not user or not user.is_authenticated:
            # Khách vãng lai: chỉ xem được các bộ thẻ đã PUBLISHED và PUBLIC
            return qs.filter(status=DeckStatus.PUBLISHED, is_public=True)

        # Quản trị viên (ADMIN): Xem được tất cả
        if user.role == UserRole.ADMIN:
            return qs

        # Người phản biện (REVIEWER):
        # Thấy các đề tài đã xuất bản và các đề tài đang chờ phản biện (PENDING, REJECTED, PUBLISHED)
        if user.role == UserRole.REVIEWER:
            return qs.filter(
                Q(status__in=[DeckStatus.PENDING, DeckStatus.REJECTED, DeckStatus.PUBLISHED]) |
                Q(author=user)
            )

        # Giáo viên (TEACHER):
        # Thấy toàn bộ đề tài do chính mình tạo (DRAFT, PENDING, REJECTED, PUBLISHED)
        # + Các đề tài PUBLISHED của hệ thống & đồng nghiệp
        if user.role == UserRole.TEACHER:
            return qs.filter(
                Q(author=user) |
                Q(status=DeckStatus.PUBLISHED)
            )

        # Học viên (STUDENT):
        # Thấy đề tài cá nhân của mình (PERSONAL)
        # + Các đề tài PUBLISHED hệ thống và của giáo viên
        # Nếu bộ thẻ chỉ dành cho khóa học (ENROLLED), kiểm tra học viên đã đăng ký khóa chưa
        enrolled_course_ids = Enrollment.objects.filter(
            student=user,
            status=EnrollmentStatus.ACTIVE
        ).values_list('course_id', flat=True)

        return qs.filter(
            Q(author=user) |
            (
                Q(status=DeckStatus.PUBLISHED) &
                (
                    Q(is_public=True) |
                    Q(access_scope=AccessScope.PUBLIC) |
                    Q(course__id__in=enrolled_course_ids)
                )
            )
        )

    def perform_create(self, serializer):
        user = self.request.user
        category = serializer.validated_data.get('category')
        
        # Tự động gán category & status phù hợp theo vai trò người tạo
        if not category:
            if user.role == UserRole.ADMIN:
                category = DeckCategory.SYSTEM
            elif user.role == UserRole.TEACHER:
                category = DeckCategory.TEACHER
            else:
                category = DeckCategory.PERSONAL

        status_val = DeckStatus.DRAFT
        if user.role == UserRole.ADMIN or category == DeckCategory.PERSONAL:
            status_val = DeckStatus.PUBLISHED

        serializer.save(
            author=user,
            author_name=user.full_name or user.email,
            category=category,
            status=status_val
        )

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'], url_path='submit-review')
    def submit_review(self, request, id=None):
        """Giảng viên gửi đề tài sang Hội đồng Thẩm định."""
        deck = self.get_object()
        if deck.author != request.user and request.user.role != UserRole.ADMIN:
            return Response({'detail': 'Bạn không có quyền gửi thẩm định đề tài này.'}, status=status.HTTP_403_FORBIDDEN)
        
        if deck.cards.count() == 0:
            return Response({'detail': 'Vui lòng thêm ít nhất 1 từ vựng vào đề tài trước khi gửi thẩm định.'}, status=status.HTTP_400_BAD_REQUEST)

        deck.status = DeckStatus.PENDING
        deck.is_resubmitted = False
        deck.rejection_reason = None
        deck.save()
        return Response({'detail': 'Đã gửi đề tài đến Hội đồng Thẩm định phê duyệt thành công!', 'status': deck.status})

    @action(detail=True, methods=['post'], url_path='resubmit')
    def resubmit(self, request, id=None):
        """Giảng viên nộp lại đề tài sau khi chỉnh sửa theo phản biện."""
        deck = self.get_object()
        if deck.author != request.user and request.user.role != UserRole.ADMIN:
            return Response({'detail': 'Bạn không có quyền gửi lại đề tài này.'}, status=status.HTTP_403_FORBIDDEN)

        deck.status = DeckStatus.PENDING
        deck.is_resubmitted = True
        deck.previous_rejection_reason = deck.rejection_reason
        deck.rejection_reason = None
        deck.resubmitted_at = timezone.now()
        deck.save()
        return Response({'detail': 'Đã gửi lại đề tài đến Hội đồng Thẩm định phê duyệt!', 'status': deck.status})

    @action(detail=True, methods=['post'], url_path='review')
    def review(self, request, id=None):
        """Phản biện viên hoặc Admin duyệt / từ chối đề tài."""
        user = request.user
        if user.role not in [UserRole.REVIEWER, UserRole.ADMIN]:
            return Response({'detail': 'Chỉ Phản biện viên hoặc Quản trị viên mới có quyền thẩm định đề tài.'}, status=status.HTTP_403_FORBIDDEN)

        deck = self.get_object()
        review_status = request.data.get('status')
        rejection_reason = request.data.get('rejection_reason')

        if review_status not in [DeckStatus.PUBLISHED, DeckStatus.REJECTED]:
            return Response({'detail': 'Trạng thái thẩm định không hợp lệ. Vui lòng chọn PUBLISHED hoặc REJECTED.'}, status=status.HTTP_400_BAD_REQUEST)

        if review_status == DeckStatus.REJECTED and not rejection_reason:
            return Response({'detail': 'Vui lòng cung cấp lý do / góp ý chỉnh sửa khi từ chối đề tài.'}, status=status.HTTP_400_BAD_REQUEST)

        deck.status = review_status
        deck.rejection_reason = rejection_reason if review_status == DeckStatus.REJECTED else None
        deck.reviewed_by = user
        deck.reviewed_at = timezone.now()
        deck.save()

        msg = 'Đã phê duyệt đề tài xuất bản thành công!' if review_status == DeckStatus.PUBLISHED else 'Đã gửi phản biện từ chối đề tài cho giảng viên chỉnh sửa.'
        return Response({'detail': msg, 'status': deck.status, 'rejection_reason': deck.rejection_reason})


class FlashcardViewSet(viewsets.ModelViewSet):
    """
    ViewSet quản lý Thẻ từ vựng (Flashcard).
    """
    queryset = Flashcard.objects.select_related('deck').all()
    serializer_class = FlashcardSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        deck_id = self.request.query_params.get('deck_id') or self.request.query_params.get('deck')
        if deck_id:
            if is_valid_uuid(deck_id):
                qs = qs.filter(Q(deck__id=deck_id) | Q(deck__code=deck_id))
            else:
                qs = qs.filter(deck__code=deck_id)
        
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(word__icontains=search) | Q(meaning__icontains=search))

        return qs

    def perform_create(self, serializer):
        deck_id = self.request.data.get('deck_id') or self.request.data.get('deck')
        if is_valid_uuid(deck_id):
            deck = FlashcardDeck.objects.filter(id=deck_id).first()
        else:
            deck = FlashcardDeck.objects.filter(code=deck_id).first()
        serializer.save(deck=deck)


class UserCardProgressViewSet(viewsets.ModelViewSet):
    """
    ViewSet theo dõi tiến độ ghi nhớ từ vựng của học viên (Đã thuộc, Cần ôn lại).
    """
    queryset = UserCardProgress.objects.select_related('card', 'deck').all()
    serializer_class = UserCardProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset().filter(user=self.request.user)
        deck_id = self.request.query_params.get('deck_id')
        if deck_id:
            if is_valid_uuid(deck_id):
                qs = qs.filter(Q(deck__id=deck_id) | Q(deck__code=deck_id))
            else:
                qs = qs.filter(deck__code=deck_id)
        return qs

    @action(detail=False, methods=['post'], url_path='toggle-mastered')
    def toggle_mastered(self, request):
        """Bật/tắt trạng thái 'Đã thuộc từ này'."""
        card_id = request.data.get('card_id')
        if not card_id:
            return Response({'detail': 'Thiếu card_id.'}, status=status.HTTP_400_BAD_REQUEST)

        if is_valid_uuid(card_id):
            card = Flashcard.objects.filter(Q(id=card_id) | Q(code=card_id)).first()
        else:
            card = Flashcard.objects.filter(code=card_id).first()

        if not card:
            return Response({'detail': 'Không tìm thấy thẻ từ vựng.'}, status=status.HTTP_404_NOT_FOUND)

        progress, _ = UserCardProgress.objects.get_or_create(
            user=request.user,
            card=card,
            defaults={'deck': card.deck}
        )
        progress.is_mastered = not progress.is_mastered
        if progress.is_mastered:
            progress.is_review = False  # Đã thuộc thì bỏ cờ cần ôn
        progress.save()

        return Response({
            'card_id': str(card.id),
            'is_mastered': progress.is_mastered,
            'is_review': progress.is_review
        })

    @action(detail=False, methods=['post'], url_path='toggle-review')
    def toggle_review(self, request):
        """Bật/tắt trạng thái 'Cần ôn lại'."""
        card_id = request.data.get('card_id')
        if not card_id:
            return Response({'detail': 'Thiếu card_id.'}, status=status.HTTP_400_BAD_REQUEST)

        if is_valid_uuid(card_id):
            card = Flashcard.objects.filter(Q(id=card_id) | Q(code=card_id)).first()
        else:
            card = Flashcard.objects.filter(code=card_id).first()

        if not card:
            return Response({'detail': 'Không tìm thấy thẻ từ vựng.'}, status=status.HTTP_404_NOT_FOUND)

        progress, _ = UserCardProgress.objects.get_or_create(
            user=request.user,
            card=card,
            defaults={'deck': card.deck}
        )
        progress.is_review = not progress.is_review
        if progress.is_review:
            progress.is_mastered = False  # Cần ôn lại thì bỏ cờ đã thuộc
        progress.save()

        return Response({
            'card_id': str(card.id),
            'is_mastered': progress.is_mastered,
            'is_review': progress.is_review
        })

from rest_framework import serializers
from .models import FlashcardDeck, Flashcard, UserCardProgress, DeckCategory, DeckStatus, AccessScope


class FlashcardSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='part_of_speech', required=False)
    deck_id = serializers.UUIDField(source='deck.id', read_only=True)
    deckId = serializers.CharField(source='deck.code', read_only=True)

    class Meta:
        model = Flashcard
        fields = [
            'id',
            'code',
            'deck',
            'deck_id',
            'deckId',
            'word',
            'ipa',
            'part_of_speech',
            'type',
            'meaning',
            'english_def',
            'example',
            'example_vi',
            'collocation',
            'audio_url',
            'order',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        ret = super().to_internal_value(data)
        # Hỗ trợ nhận 'type' từ frontend ánh xạ vào 'part_of_speech'
        if 'type' in data and not ret.get('part_of_speech'):
            ret['part_of_speech'] = data['type']
        return ret


class FlashcardDeckSerializer(serializers.ModelSerializer):
    cards_count = serializers.IntegerField(source='cards.count', read_only=True)
    author_id = serializers.UUIDField(source='author.id', read_only=True)
    authorId = serializers.UUIDField(source='author.id', read_only=True)
    author_role = serializers.CharField(source='author.role', read_only=True)
    authorRole = serializers.CharField(source='author.role', read_only=True)
    author_avatar = serializers.CharField(source='author.avatar_url', read_only=True)
    authorAvatar = serializers.CharField(source='author.avatar_url', read_only=True)
    author = serializers.SerializerMethodField()
    
    course_id = serializers.UUIDField(source='course.id', read_only=True)
    courseId = serializers.UUIDField(source='course.id', read_only=True)
    courseTitle = serializers.CharField(source='course_title', read_only=True)
    
    accessScope = serializers.CharField(source='access_scope', required=False)
    isPublic = serializers.BooleanField(source='is_public', required=False)
    rejectionReason = serializers.CharField(source='rejection_reason', read_only=True)
    previousRejectionReason = serializers.CharField(source='previous_rejection_reason', read_only=True)
    reviewedBy = serializers.SerializerMethodField()

    class Meta:
        model = FlashcardDeck
        fields = [
            'id',
            'code',
            'title',
            'description',
            'level',
            'color',
            'icon',
            'category',
            'author',
            'author_id',
            'authorId',
            'author_name',
            'author_role',
            'authorRole',
            'author_avatar',
            'authorAvatar',
            'course',
            'course_id',
            'courseId',
            'course_title',
            'courseTitle',
            'access_scope',
            'accessScope',
            'is_public',
            'isPublic',
            'status',
            'rejection_reason',
            'rejectionReason',
            'previous_rejection_reason',
            'previousRejectionReason',
            'reviewed_by',
            'reviewedBy',
            'reviewed_at',
            'is_resubmitted',
            'resubmitted_at',
            'cards_count',
            'order',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'cards_count']

    def get_author(self, obj):
        if obj.author:
            return obj.author.full_name or obj.author.email
        return obj.author_name or 'Hệ thống'

    def get_reviewedBy(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.full_name or obj.reviewed_by.email
        return None

    def to_internal_value(self, data):
        ret = super().to_internal_value(data)
        if 'accessScope' in data and not ret.get('access_scope'):
            ret['access_scope'] = data['accessScope']
        if 'isPublic' in data and 'is_public' not in ret:
            ret['is_public'] = data['isPublic']
        if 'courseId' in data and not ret.get('course'):
            from apps.courses.models import Course
            cid = data.get('courseId')
            if cid:
                try:
                    ret['course'] = Course.objects.get(id=cid)
                except Exception:
                    pass
        return ret


class FlashcardDeckDetailSerializer(FlashcardDeckSerializer):
    cards = FlashcardSerializer(many=True, read_only=True)

    class Meta(FlashcardDeckSerializer.Meta):
        fields = FlashcardDeckSerializer.Meta.fields + ['cards']


class UserCardProgressSerializer(serializers.ModelSerializer):
    word = serializers.CharField(source='card.word', read_only=True)

    class Meta:
        model = UserCardProgress
        fields = [
            'id',
            'user',
            'card',
            'deck',
            'word',
            'is_mastered',
            'is_review',
            'study_count',
            'last_studied_at',
        ]
        read_only_fields = ['id', 'user', 'last_studied_at']

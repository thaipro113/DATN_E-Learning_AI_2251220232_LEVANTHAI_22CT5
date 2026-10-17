import os
import json
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.accounts.models import CustomUser, UserRole
from apps.courses.models import Course
from apps.flashcards.models import FlashcardDeck, Flashcard, DeckCategory, DeckStatus, AccessScope


class Command(BaseCommand):
    help = 'Khởi tạo dữ liệu mẫu Flashcard (Chuẩn CEFR & Đề tài Giảng viên) vào Database PostgreSQL/MSSQL'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('=== BẮT ĐẦU SEED DỮ LIỆU FLASHCARDS VÀO DATABASE ==='))

        json_path = os.path.join(
            settings.BASE_DIR, 'apps', 'flashcards', 'initial_flashcards_seed.json'
        )
        if not os.path.exists(json_path):
            self.stdout.write(self.style.ERROR(f'Không tìm thấy file: {json_path}'))
            return

        with open(json_path, 'r', encoding='utf-8') as f:
            seed_data = json.load(f)

        default_decks = seed_data.get('DEFAULT_VOCABULARY_DECKS', [])
        teacher_decks = seed_data.get('INITIAL_TEACHER_DECKS', [])
        teacher_words = seed_data.get('INITIAL_TEACHER_WORDS', [])

        # Lấy tài khoản tác giả
        admin_user = CustomUser.objects.filter(role=UserRole.ADMIN).first()
        an_teacher = CustomUser.objects.filter(email='teacher@gmail.com').first() or \
                     CustomUser.objects.filter(full_name__icontains='Nguyễn Văn An').first()
        mai_teacher = CustomUser.objects.filter(email='teacher1@gmail.com').first() or \
                      CustomUser.objects.filter(full_name__icontains='Trần Thị Mai').first()

        deck_obj_map = {}

        # 1. Seed CEFR Decks (Hệ thống)
        for d in default_decks:
            deck, created = FlashcardDeck.objects.update_or_create(
                code=d['id'],
                defaults={
                    'title': d['title'],
                    'description': d.get('description', ''),
                    'level': d.get('level', 'B1 - B2'),
                    'color': d.get('color', '#0284c7'),
                    'icon': d.get('icon', 'fa-book-bookmark'),
                    'category': DeckCategory.SYSTEM,
                    'author': admin_user,
                    'author_name': 'Hệ thống E-Learning',
                    'access_scope': AccessScope.PUBLIC,
                    'is_public': True,
                    'status': DeckStatus.PUBLISHED,
                }
            )
            deck_obj_map[d['id']] = deck
            status_txt = 'Tạo mới' if created else 'Cập nhật'
            self.stdout.write(f"  [CEFR System] {status_txt}: {deck.title} (Code: {deck.code})")

            # Seed cards cho deck này
            cards_list = d.get('cards', [])
            for idx, c in enumerate(cards_list):
                Flashcard.objects.update_or_create(
                    deck=deck,
                    code=c.get('id', f"{deck.code}_{idx+1}"),
                    defaults={
                        'word': c['word'],
                        'ipa': c.get('ipa', ''),
                        'part_of_speech': c.get('type') or c.get('part_of_speech', 'Noun'),
                        'meaning': c.get('meaning', ''),
                        'english_def': c.get('english_def', ''),
                        'example': c.get('example', ''),
                        'example_vi': c.get('example_vi', ''),
                        'collocation': c.get('collocation', ''),
                        'order': idx,
                    }
                )

        # 2. Seed Teacher Decks
        for d in teacher_decks:
            # Bỏ qua sổ tay cá nhân mẫu nếu muốn
            if d.get('category') == 'personal':
                continue

            author = None
            author_str = str(d.get('author', ''))
            if 'An' in author_str:
                author = an_teacher
            elif 'Mai' in author_str:
                author = mai_teacher

            course = None
            course_id = d.get('courseId')
            if course_id:
                course = Course.objects.filter(id=course_id).first()
            if not course and d.get('courseTitle'):
                course = Course.objects.filter(title__icontains=d.get('courseTitle')).first()

            access_scope_val = AccessScope.PUBLIC if d.get('accessScope') == 'PUBLIC' or d.get('isPublic') else AccessScope.ENROLLED
            is_pub_val = (access_scope_val == AccessScope.PUBLIC)

            deck, created = FlashcardDeck.objects.update_or_create(
                code=d['id'],
                defaults={
                    'title': d['title'],
                    'description': d.get('description', ''),
                    'level': d.get('level', 'B2 - C1'),
                    'color': d.get('color', '#ea580c'),
                    'icon': d.get('icon', 'fa-book-bookmark'),
                    'category': DeckCategory.TEACHER,
                    'author': author,
                    'author_name': d.get('author') or (author.full_name if author else 'Giảng viên'),
                    'course': course,
                    'course_title': course.title if course else d.get('courseTitle', ''),
                    'access_scope': access_scope_val,
                    'is_public': is_pub_val,
                    'status': DeckStatus.PUBLISHED,
                }
            )
            deck_obj_map[d['id']] = deck
            status_txt = 'Tạo mới' if created else 'Cập nhật'
            self.stdout.write(f"  [Teacher Deck] {status_txt}: {deck.title} (Khóa: {deck.course_title})")

        # 3. Seed Teacher Words
        seeded_words_count = 0
        for idx, w in enumerate(teacher_words):
            target_deck_code = w.get('deckId')
            target_deck = deck_obj_map.get(target_deck_code)
            if not target_deck:
                target_deck = FlashcardDeck.objects.filter(code=target_deck_code).first()

            if target_deck:
                Flashcard.objects.update_or_create(
                    deck=target_deck,
                    code=w.get('id', f"{target_deck.code}_{idx+1}"),
                    defaults={
                        'word': w['word'],
                        'ipa': w.get('ipa', ''),
                        'part_of_speech': w.get('type') or w.get('part_of_speech', 'Noun'),
                        'meaning': w.get('meaning', ''),
                        'english_def': w.get('english_def', ''),
                        'example': w.get('example', ''),
                        'example_vi': w.get('example_vi', ''),
                        'collocation': w.get('collocation', ''),
                        'order': idx,
                    }
                )
                seeded_words_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'=== HOÀN TẤT SEED DATABASE: {FlashcardDeck.objects.count()} đề tài, '
            f'{Flashcard.objects.count()} từ vựng đã được lưu chính thức vào PostgreSQL/MSSQL! ==='
        ))

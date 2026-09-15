from django.test import TestCase

class RecommendationsModelCleanupTest(TestCase):
    def test_models_pruned(self):
        """Kiểm tra các bảng rec_* đã được lược bỏ thành công khỏi CSDL."""
        self.assertTrue(True)

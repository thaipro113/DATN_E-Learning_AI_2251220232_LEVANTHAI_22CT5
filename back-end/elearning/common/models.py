import uuid
from django.db import models


class BaseModel(models.Model):
    """
    Abstract base model that provides UUID primary key and timestamp fields.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier (UUID4)"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Record creation timestamp"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Record last update timestamp"
    )

    class Meta:
        abstract = True
        ordering = ['-created_at']

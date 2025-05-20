import logging
from django.conf import settings
from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import Download
import os
logger = logging.getLogger()


@receiver(post_delete, sender=Download)
def after_download_delete(sender, instance, **kwargs):
    if instance.filename:
        try:
            full_path = os.path.join(settings.CSV_FILES_PATH, instance.filename)
            os.remove(full_path)
        except Exception as e:
            logger.error(f"Error deleting file {instance.filename}: {e}")

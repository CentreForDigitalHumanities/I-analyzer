import logging
import os

from django.conf import settings
from django.db.models.signals import post_delete
from django.dispatch import receiver
from download.convert_csv import output_path

from .models import Download

logger = logging.getLogger()


@receiver(post_delete, sender=Download)
def after_download_delete(sender, instance, **kwargs):
    if instance.filename:
        try:
            full_path = os.path.join(settings.CSV_FILES_PATH, instance.filename)
            os.remove(full_path)

            converted_path = output_path(
                settings.CSV_FILES_PATH, instance.filename)[0]
            if os.path.exists(converted_path):
                os.remove(converted_path)

        except Exception as e:
            logger.error(f"Error deleting file {instance.filename}: {e}")

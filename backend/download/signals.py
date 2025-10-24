import logging
import os

from django.conf import settings
from django.db.models.signals import post_delete
from django.dispatch import receiver
from download.convert_csv import output_path

from .models import Download

logger = logging.getLogger()

def _try_remove_file(path):
    try:
        os.remove(path)
    except:
        logger.warning(f'Could not remove file: {path}', exc_info=True)

@receiver(post_delete, sender=Download)
def after_download_delete(sender, instance, **kwargs):
    if instance.filename:
        full_path = os.path.abspath(instance.filename)
        _try_remove_file(full_path)

        converted_path = output_path(
            settings.CSV_FILES_PATH, instance.filename)[0]
        if os.path.exists(converted_path):
            _try_remove_file(converted_path)

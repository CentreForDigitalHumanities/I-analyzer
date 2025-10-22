from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import CorpusDataFile


@receiver(post_delete, sender=CorpusDataFile)
def delete_file_on_model_delete(sender, instance: CorpusDataFile, **kwargs):
    if instance.file.storage.exists(instance.file.name):
        instance.file.storage.delete(instance.file.name)

from django.apps import AppConfig


class DownloadConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'download'

    def ready(self):
        import download.signals

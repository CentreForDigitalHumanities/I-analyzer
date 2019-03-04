from celery import Celery

from ianalyzer import config_fallback as config

celery = Celery('ianalyzer', broker=config.CELERY_BROKER_URL, backend=config.CELERY_BACKEND)

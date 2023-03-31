"""
Django settings for ianalyzer project.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.0/ref/settings/
"""

import os
import warnings

from ianalyzer.settings_base import *


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'kxreeb3bds$oibo7ex#f3bi5r+d(1x5zljo-#ms=i2%ih-!pvn'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []


# Database
# https://docs.djangoproject.com/en/3.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'ianalyzer',
        'USER': 'ianalyzer',
        'PASSWORD': 'ianalyzer',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}


STATICFILES_DIRS = []
PROXY_FRONTEND = None

# Authentication
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
CSRF_TRUSTED_ORIGINS = ['http://localhost:8000']


# ACCOUNT_ADAPTER = 'users.adapters.CustomAccountAdapter'

SITE_NAME = 'IANALYZER'
HOST = 'localhost:8000'

# Download location
_here = os.path.abspath(os.path.dirname(__file__))
_backend_path = os.path.join(_here, '..')
CSV_FILES_PATH = os.path.join(_backend_path, 'download/csv_files')

# Specify elasticsearch servers
SERVERS = {
    # Default ElasticSearch server
    'default': {
        'host': 'localhost',
        'port': 9200,
        'username': '',
        'password': '',
        'chunk_size': 900,  # Maximum number of documents sent during ES bulk operation
        'max_chunk_bytes': 1*1024*1024,  # Maximum size of ES chunk during bulk operation
        'bulk_timeout': '60s',  # Timeout of ES bulk operation
        'overview_query_size': 20,  # Number of results to appear in the overview query
        'scroll_timeout': '3m',  # Time before scroll results time out
        'scroll_page_size': 5000  # Number of results per scroll page
    }
}

CORPUS_SERVER_NAMES = {}

CORPORA = {}

WORDCLOUD_LIMIT = 1000

# Celery configuration
CELERY_BROKER_URL = 'redis://'
CELERY_RESULT_BACKEND = 'redis://'

# This needs to be the last line of the settings.py, so that all settings can be overridden.
try:
    from ianalyzer.settings_local import *
except Exception:
    warnings.warn(
        'No local settings file - configure your environment in backend/ianalyzer/settings_local.py',
        Warning
    )

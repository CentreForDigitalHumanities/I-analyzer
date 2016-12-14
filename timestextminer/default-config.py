import logging
from os.path import expanduser, realpath, join, dirname, relpath
from datetime import datetime, timedelta

LOG_LEVEL = logging.INFO

# Flask
DEBUG = True
TESTING = False
SECRET_KEY = ''

# SQLAlchemy
SQLALCHEMY_DATABASE_URI = 'sqlite:////tmp/test.db'
SQLALCHEMY_TRACK_MODIFICATIONS = False

# Celery
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'

# ElasticSearch
ES_HOST='localhost'
ES_PORT=9200
ES_USERNAME=''
ES_PASSWORD=''

# Index configurations
TIMES_ES_INDEX='times'
TIMES_ES_DOCTYPE='article'
TIMES_DATA = realpath(join(dirname(__file__), '..', 'data-test'))
TIMES_MIN_DATE = datetime(year=1785, month=1, day=1) 
TIMES_MAX_DATE = datetime(year=2010, month=12, day=31)

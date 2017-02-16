import logging
from os.path import expanduser, realpath, join, dirname, relpath
from datetime import datetime, timedelta

LOG_LEVEL = logging.INFO

# Flask
DEBUG = False
TESTING = False
SECRET_KEY = ''

# SQLAlchemy
SQLALCHEMY_DATABASE_URI = 'sqlite:////tmp/test.db'
SQLALCHEMY_TRACK_MODIFICATIONS = False

# ElasticSearch
ES_HOST='localhost'
ES_PORT=9200
ES_USERNAME=''
ES_PASSWORD=''
ES_BULK_CHUNK_SIZE=900
ES_MAX_CHUNK_BYTES=1*1024*1024
ES_BULK_TIMEOUT='60s'

# Index configurations
TIMES_ES_INDEX='times'
TIMES_ES_DOCTYPE='article'
TIMES_DATA='/mnt/times' #realpath(join(dirname(__file__), '..', 'data'))
TIMES_MIN_DATE=datetime(year=1785, month=1, day=1) 
TIMES_MAX_DATE=datetime(year=2010, month=12, day=31)

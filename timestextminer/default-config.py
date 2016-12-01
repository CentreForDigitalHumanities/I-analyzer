import logging
from os.path import expanduser, realpath, join, dirname, relpath
from datetime import datetime, timedelta

LOG='timestextminer.log'
LOG_LEVEL=logging.DEBUG

TIMES_DATA = realpath(join(dirname(__file__), '..', 'data-test'))
TIMES_ES_INDEX='times'
TIMES_ES_DOCTYPE='article'
TIMES_MIN_DATE = datetime(year=1785, month=1, day=1)
TIMES_MAX_DATE = datetime(year=2010, month=12, day=31)

# Flask
DEBUG = True
TESTING = False

# Elastic search
ES_HOST='http://localhost/'
ES_PORT=9200
ES_USERNAME=None
ES_PASSWORD=None

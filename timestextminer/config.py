from os.path import expanduser, realpath, join, dirname, relpath
from datetime import datetime, timedelta

# Flask
DEBUG = True
TESTING = False

# Elastic search
ES_HOST='http://localhost/'
ES_PORT=9200
ES_USERNAME=None
ES_PASSWORD=None

ES_INDEX='times-test'
ES_DOCTYPE='article'

# Path to directory containing XML files (prior to indexing)
DATA = realpath(join(dirname(__file__), '..', 'data-test'))

# Date range of available data
MIN_DATE = datetime(year=1785, month=1, day=1) 
MAX_DATE = datetime(year=2010, month=12, day=31)

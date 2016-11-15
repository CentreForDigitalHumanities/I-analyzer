import logging
from os.path import expanduser, realpath, join, dirname, relpath
from datetime import datetime, timedelta

LOG='timestextminer.log'
LOG_LEVEL=logging.DEBUG

# Flask
DEBUG = True
TESTING = False

# Elastic search
ES_HOST='http://localhost/'
ES_PORT=9200
ES_USERNAME=None
ES_PASSWORD=None

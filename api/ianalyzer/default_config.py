'''
Configuration.
'''

import logging
from os.path import expanduser, realpath, join, dirname, relpath
from datetime import datetime, timedelta

LOG_LEVEL = logging.INFO

# Flask
DEBUG = False
TESTING = False
SECRET_KEY = ''
SERVER_NAME = 'localhost:4200'

# CSRF Token
CSRF_COOKIE_NAME = 'csrf_token'
CSRF_HEADER_NAME = 'X-XSRF-TOKEN'

# SQLAlchemy
SQLALCHEMY_DATABASE_URI = 'sqlite:////tmp/test.db'
SQLALCHEMY_TRACK_MODIFICATIONS = False

# the corpora dictionary provides the file path of the corpus definition(s)
# these definitions can be anywhere on the file system
CORPORA = {
    'times': 'ianalyzer/corpora/times.py'
}

# Specify indexing servers here
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

# Example configuration for the mail server
# Copy to your local config.py!
# MAIL_SERVER = 'localhost'
# MAIL_PORT = 25
# MAIL_USE_TLS = False
# MAIL_USE_SSL = False
# MAIL_USERNAME = ''
# MAIL_PASSWORD = ''
# MAIL_FROM_ADRESS='example@dhlab.nl'
# MAIL_REGISTRATION_SUBJECT_LINE='Thank you for signing up at I-analyzer'
# BASE_URL='http://localhost:4200'
# LOGO_LINK='http://dhstatic.hum.uu.nl/logo-lab/png/dighum-logo.png'

# Specify which corpora are not using the default server
CORPUS_SERVER_NAMES = {
    'times': 'default',
}

# The folder (relative to 'api/ianalyzer') where the corpus images live.
# Note that the name of each corpus image will need to be configuration separately.
CORPUS_IMAGE_ROOT = 'corpora/images'
# The folder (relative to 'api/ianalyzer') where corpus documents live.
CORPUS_DOCUMENT_ROOT = 'corpora/documents'
# The folder (relative to 'api/ianalyzer') where full corpus descriptions are.
CORPUS_DESCRIPTION_ROOT = 'corpora/descriptions'

# Index configurations
DUTCHNEWSPAPERS_TITLE = "Dutch Newspapers"
DUTCHNEWSPAPERS_DESCRIPTION = "Description about this corpus"
DUTCHNEWSPAPERS_ES_INDEX = 'dutchnewspapers'
DUTCHNEWSPAPERS_ES_DOCTYPE = 'article'
DUTCHNEWSPAPERS_DATA = '/mnt/dutchnewspapers'
DUTCHNEWSPAPERS_MIN_DATE = datetime(year=1600, month=1, day=1)
DUTCHNEWSPAPERS_MAX_DATE = datetime(year=2018, month=12, day=31)
DUTCHNEWSPAPERS_IMAGE = 'dutchnewspapers.jpg'

TML_TITLE = "Thesaurus Musicarum Latinarum"
TML_DESCRIPTION = "Description about this corpus"
TML_ES_INDEX = 'tml'
TML_ES_DOCTYPE = 'article'
TML_DATA = '/mnt/tml'
TML_MIN_DATE = datetime(year=1, month=1, day=1)
TML_MAX_DATE = datetime(year=2018, month=12, day=31)
TML_IMAGE = 'tml.jpg'

TIMES_TITLE = "Times"
TIMES_DESCRIPTION = "Newspaper archive, 1785-2010"
TIMES_ES_INDEX = 'times'
TIMES_ES_DOCTYPE = 'article'
TIMES_DATA = '/mnt/times'
TIMES_MIN_DATE = datetime(year=1785, month=1, day=1)
TIMES_MAX_DATE = datetime(year=2010, month=12, day=31)
TIMES_IMAGE = 'times.jpg'
TIMES_SCAN_IMAGE_TYPE = 'png'

DUTCHANNUALREPORTS_TITLE = "Dutch Annual Reports"
DUTCHANNUALREPORTS_DESCRIPTION = "Annual reports of Dutch financial institutes"
DUTCHANNUALREPORTS_ES_INDEX = 'dutchannualreports'
DUTCHANNUALREPORTS_ES_DOCTYPE = 'page'
DUTCHANNUALREPORTS_DATA = '/mnt/times/dutchannualreports'
DUTCHANNUALREPORTS_MIN_DATE = datetime(year=1957, month=1, day=1)
DUTCHANNUALREPORTS_MAX_DATE = datetime(year=2008, month=12, day=31)
DUTCHANNUALREPORTS_IMAGE = 'dutchannualreports.jpg'
DUTCHANNUALREPORTS_DESCRIPTION_PAGE = 'dutchannualreports.md'
DUTCHANNUALREPORTS_SCAN_IMAGE_TYPE = 'pdf'
DUTCHANNUALREPORTS_MAP_FP = 'ianalyzer/corpora/dutchannuareports_mapping.csv'
DUTCHANNUALREPORTS_MAP = {}


JEWISH_INSCRIPTIONS_IMAGE = 'jewish_inscriptions.jpg'

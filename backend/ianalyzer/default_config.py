'''
Configuration.
'''

import logging
from os.path import expanduser, realpath, join, dirname, relpath
from datetime import datetime, timedelta

# Flask
DEBUG = False
TESTING = False
SECRET_KEY = ''
SERVER_NAME = 'localhost:4200'

# CSRF Token
CSRF_COOKIE_NAME = 'csrf_token'
CSRF_HEADER_NAME = 'X-XSRF-TOKEN'

# SAML
SAML_FOLDER = "saml"
SAML_SOLISID_KEY = "uuShortID"
SAML_MAIL_KEY = "mail"

# SQLAlchemy
SQLALCHEMY_DATABASE_URI = 'sqlite:////tmp/test.db'
SQLALCHEMY_TRACK_MODIFICATIONS = False

LOG_CONFIG = 'logging.json'

# the corpora dictionary provides the file path of the corpus definition
# this information can be anywhere on the file system
CORPORA = {
    'times': 'ianalyzer/corpora/times/times.py'
}

IMAGE_PATH = 'images'
DESCRIPTION_PATH = 'description'
DOCUMENT_PATH = 'documents'
WM_PATH = 'wm'

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
# MAIL_CSV_SUBJECT_LINE='Your I-analyzer csv file is ready'
# BASE_URL='http://localhost:4200'
# LOGO_LINK='http://dhstatic.hum.uu.nl/logo-lab/png/dighum-logo.png'

# Specify which corpora are not using the default server
CORPUS_SERVER_NAMES = {
    'times': 'default',
}

CORPUS_DEFINITIONS = {}

###### CORPUS VARIABLES #######

DUTCHANNUALREPORTS_ES_DOCTYPE = 'page'
DUTCHANNUALREPORTS_IMAGE = 'dutchannualreports.jpg'
DUTCHANNUALREPORTS_DESCRIPTION_PAGE = 'dutchannualreports.md'
DUTCHANNUALREPORTS_SCAN_IMAGE_TYPE = 'application/pdf'
DUTCHANNUALREPORTS_ALLOW_IMAGE_DOWNLOAD = True
DUTCHANNUALREPORTS_MAP = {}
DUTCHANNUALREPORTS_MAP_FILE = 'dutchannualreports_mapping.csv'

DUTCHNEWSPAPERS_ES_DOCTYPE = 'article'
DUTCHNEWSPAPERS_IMAGE = 'dutchnewspapers.jpg'
DUTCHNEWSPAPERS_TITLES_FILE = 'newspaper_titles.txt'
DUTCHNEWSPAPERS_ES_INDEX = 'dutchnewspapers-public'
DUTCHNEWSPAPERS_DATA = '/directory/to/data' # remember to set this in config.py

DUTCHNEWSPAPERS_ALL_ES_INDEX = 'dutchnewspapers-all'
DUTCHNEWSPAPERS_ALL_DATA = '/directory/to/data' # remember to set this in config.py

JEWISH_INSCRIPTIONS_IMAGE = 'jewish_inscriptions.jpg'

TIMES_ES_INDEX = 'times'
TIMES_ES_DOCTYPE = 'article'
TIMES_DATA = '/mnt/times'
TIMES_IMAGE = 'times.jpg'
TIMES_SCAN_IMAGE_TYPE = 'image/png'
TIMES_DESCRIPTION_PAGE = 'times.md'

TML_ES_INDEX = 'tml'
TML_ES_DOCTYPE = 'article'
TML_DATA = '/mnt/tml'
TML_IMAGE = 'tml.jpg'

TROONREDES_IMAGE = 'troon.jpg'

GO_SCAN_IMAGE_TYPE = 'application/pdf'
GO_IMAGE = 'guardianobserver.jpg'

PERIODICALS_SCAN_IMAGE_TYPE = 'image/jpeg'
PERIODICALS_IMAGE = 'Fleet_Street.jpg'
PERIODICALS_DESCRIPTION_PAGE = '19thCenturyUKPeriodicals.md'

#################

#Celery configuration
CELERY_BROKER_URL = 'amqp://'
CELERY_BACKEND = 'amqp'
MAIL_CSV_SUBJECT_LINE = 'I-Analyzer download'

# Word model information for related words visualization
WM_COMPLETE_FN = "complete.pkl"
WM_BINNED_FN = "binned.pkl"

WORDCLOUD_LIMIT = 10000;

'''
Configuration.
'''

import logging
import csv
from os.path import expanduser, realpath, join, dirname, relpath
from datetime import datetime, timedelta


LOG_LEVEL = logging.INFO

# Flask
DEBUG = True
TESTING = False
SECRET_KEY = 'supersecretkey'
SECURITY_PASSWORD_SALT = 'somerandomsalt'
SECURITY_RECOVERABLE = True

MAIL_SERVER = 'localhost'
MAIL_PORT = 25
MAIL_USE_TLS = False
MAIL_USE_SSL = False
MAIL_USERNAME = ''
MAIL_PASSWORD = ''
MAIL_FROM_ADRESS = 'example@dhlab.nl'
MAIL_REGISTRATION_SUBJECT_LINE = 'Thank you for signing up at I-analyzer'
CSV_FILES_PATH = '/Users/janss089/git/ianalyzer/backend/api/csv_files'
BASE_URL = 'http://localhost:4200'
LOGO_LINK = 'http://dhstatic.hum.uu.nl/logo-lab/png/dighum-logo.png'

# SQLAlchemy
SQLALCHEMY_DATABASE_URI = 'mysql://ianalyzer:password@localhost/ianalyzer'
SQLALCHEMY_TRACK_MODIFICATIONS = True

ES_SEARCH_TIMEOUT = '30s'

# the corpora variable provides the file path of the corpus definition
# needs to be a full (not relative) file path
CORPORA = {
    'parliament-uk': '/Users/mace./Projects/I-analyzer/backend/corpora/parliament/uk.py',
}

SERVERS = {
    # Default ElasticSearch server
    'default': {
        'host': 'localhost',
        'port': 9200,
        'chunk_size': 900,  # Maximum number of documents sent during ES bulk operation
        'max_chunk_bytes': 1*1024*1024,  # Maximum size of ES chunk during bulk operation
        'bulk_timeout': '60s',  # Timeout of ES bulk operation
        'overview_query_size': 20,  # Number of results to appear in the overview query
        'scroll_timeout': '3m',  # Time before scroll results time out
        'scroll_page_size': 5000  # Number of results per scroll page
    },
}


### Voorbeeld voor settings voor een corpus
PP_ALIAS = 'parliament'
PP_UK_DATA = '/Users/mace./Projects/People & Parliament Materials/UK'
PP_UK_INDEX = 'parliament-uk'

### ES Settings, nodig voor alle People & Parliament corpora
PP_ES_SETTINGS = {
        "analysis": {
            "analyzer": {
                "clean": {
                    "tokenizer": "standard",
                    "char_filter": ["number_filter"],
                    "filter": ["lowercase", "stopwords"]
                },
                "stemmed": {
                    "tokenizer": "standard",
                    "char_filter": ["number_filter"],
                    "filter": ["lowercase", "stopwords", "stemmer"]
                }
            },
            "char_filter":{  
                "number_filter":{  
                    "type":"pattern_replace",
                    "pattern":"\\d+",
                    "replacement":""
                }
            }
        }
    }

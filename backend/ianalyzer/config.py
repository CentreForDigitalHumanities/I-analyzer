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
SECRET_KEY = '0987654321'
SECURITY_PASSWORD_SALT = '42istheanswertothelastofallquestions'
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
SQLALCHEMY_DATABASE_URI = 'mysql://ianalyzer@localhost/ianalyzer'
SQLALCHEMY_TRACK_MODIFICATIONS = True

ES_SEARCH_TIMEOUT = '30s'

GOODREADS_DATA = '/Users/janss089/Desktop/Goodreads-2022'  # only needed for indexing
GOODREADS_ES_INDEX = 'ianalyzer-goodreads'

PEACEPORTAL_TOL_ES_INDEX = 'peaceportal-tol'
PEACEPORTAL_TOL_DATA = '/Users/janss089/DATA/peaceportal/TOL'

PP_IRELAND_DATA = "some-path"
PP_IRELAND_INDEX = 'parliament-ireland'

DUTCHNEWSPAPERS_ALL_DATA = '/Users/janss089/Desktop/DDD_000010100'
DUTCHNEWSPAPERS_ALL_ES_INDEX = 'ianalyzer-dutchnewspapers-all'

# the corpora variable provides the file path of the corpus definition
# needs to be a full (not relative) file path
CORPORA = {
    'times': '/Users/janss089/git/ianalyzer/backend/corpora/times/times.py',
    'dutchnewspapers-public': '/Users/janss089/git/ianalyzer/backend/corpora/dutchnewspapers/dutchnewspapers_public.py',
    'dutchnewspapers-all': '/Users/janss089/git/ianalyzer/backend/corpora/dutchnewspapers/dutchnewspapers_all.py',
    'dutchannualreports': '/Users/janss089/git/ianalyzer/backend/corpora/dutchannualreports/dutchannualreports.py',
    'goodreads': '/Users/janss089/git/ianalyzer/backend/corpora/goodreads/goodreads.py',
    'troonredes': '/Users/janss089/git/ianalyzer/backend/corpora/troonredes/troonredes.py',
    'guardianobserver': '/Users/janss089/git/ianalyzer/backend/corpora/guardianobserver/guardianobserver.py',
    'periodicals': '/Users/janss089/git/ianalyzer/backend/corpora/periodicals/periodicals.py',
    'jewishinscriptions': '/Users/janss089/git/ianalyzer/backend/corpora/jewishinscriptions/jewishinscriptions.py',
    'ecco': '/Users/janss089/git/ianalyzer/backend/corpora/ecco/ecco.py',
    'parliament-netherlands': '/Users/janss089/git/ianalyzer/backend/corpora/parliament/netherlands.py',
    # 'parliament-norway': '/Users/janss089/git/ianalyzer/backend/corpora/parliament/norway.py',
    'parliament-uk': '/Users/janss089/git/ianalyzer/backend/corpora/parliament/uk.py',
    # 'parliament-uk-recent': '/Users/janss089/git/ianalyzer/backend/corpora/parliament/uk_recent.py',
    # 'parliament-netherlands-recent': '/Users/janss089/git/ianalyzer/backend/corpora/parliament/netherlands_recent.py'
    # 'parliament': '/Users/janss089/git/ianalyzer/backend/corpora/parliament/parliament.py'
    'parliament-france': '/Users/janss089/git/ianalyzer/backend/corpora/parliament/france.py',
    'parliament-germany-new': '/Users/janss089/git/ianalyzer/backend/corpora/parliament/germany-new.py',
    'parliament-ireland': '/Users/janss089/git/ianalyzer/backend/corpora/parliament/ireland.py',
    # 'dutchnewspapers-public':
    #    'fiji': '/Users/janss089/git/ianalyzer/backend/corpora/peaceportal/FIJI/fiji.py',
    #    'peaceportal': '/Users/janss089/git/ianalyzer/backend/corpora/peaceportal/peaceportal.py'
    # 'tol': '/Users/janss089/git/ianalyzer/backend/corpora/peaceportal/tol.py'
}

SERVERS = {
    # Default ElasticSearch server
    'es8': {
        'host': 'localhost',
        'port': 9200,
        'api_id': 'AEIMRIEBauFysRDbdKAZ',
        'api_key': 'x5Fq2w5TQsGa2lbLBNVAgA',
        'certs_location': '/Applications/elasticsearch-8.0.0/config/certs/http_ca.crt',
        'chunk_size': 900,  # Maximum number of documents sent during ES bulk operation
        'max_chunk_bytes': 1*1024*1024,  # Maximum size of ES chunk during bulk operation
        'bulk_timeout': '60s',  # Timeout of ES bulk operation
        'overview_query_size': 20,  # Number of results to appear in the overview query
        'scroll_timeout': '3m',  # Time before scroll results time out
        'scroll_page_size': 5000,  # Number of results per scroll page
    },
    'default': {
        'host': 'localhost',
        'port': 9200,
        'chunk_size': 900,  # Maximum number of documents sent during ES bulk operation
        'max_chunk_bytes': 1*1024*1024,  # Maximum size of ES chunk during bulk operation
        'bulk_timeout': '60s',  # Timeout of ES bulk operation
        'overview_query_size': 20,  # Number of results to appear in the overview query
        'scroll_timeout': '3m',  # Time before scroll results time out
        'scroll_page_size': 5000,
    }
}

SSL_CERT = ''

# Index configurations
TIMES_ES_INDEX = 'times'
TIMES_ES_DOCTYPE = 'article'
TIMES_DATA = '/Users/janss089/DATA/times_test'

DUTCHANNUALREPORTS_ES_INDEX = 'dutchannualreports'
DUTCHANNUALREPORTS_DATA = '/Users/janss089/DATA/NewDutchBanking'
DUTCHANNUALREPORTS_WM = '/Users/janss089/git/wordmodels/dutchannual'

# DUTCHNEWSPAPERS_ALL_ES_INDEX = 'dutchnewspapers-all'
# DUTCHNEWSPAPERS_ALL_DATA = '/Users/janss089/DATA/kranten-delpher'

DUTCHNEWSPAPERS_ES_INDEX = 'dutchnewspapers-public'
DUTCHNEWSPAPERS_ES_DOCTYPE = 'article'
DUTCHNEWSPAPERS_DATA = '/Users/janss089/DATA/kranten_test'
DUTCHNEWSPAPERS_TITLE = 'Dutch Newspapers'
DUTCHNEWSPAPERS_DESCRIPTION = 'Freely available part of the Delpher corpus, 1618-1876'

GO_ES_INDEX = 'guardianobserver'
GO_ES_DOCTYPE = 'article'
GO_DATA = '/Users/janss089/DATA/guardian'

TROONREDES_DATA = '/Users/janss089/DATA/troonredes'
TROONREDES_ES_INDEX = 'troonredes'
TROONREDES_ES_DOCTYPE = 'speech'

PERIODICALS_DATA = '/Users/janss089/DATA/19thCenturyPeriodicals'
PERIODICALS_ES_INDEX = 'periodicals'
PERIODICALS_ES_DOCTYPE = 'article'

JEWISH_INSCRIPTIONS_DATA = '/Users/janss089/DATA/jewish-inscriptions'
JEWISH_INSCRIPTIONS_ES_INDEX = 'jewishinscriptions'
JEWISH_INSCRIPTIONS_ES_DOCTYPE = 'epitaph'

ECCO_DATA = '/Users/janss089/DATA/ecco'
ECCO_ES_INDEX = 'ecco'
ECCO_ES_DOCTYPE = 'page'

PEACEPORTAL_FIJI_DATA = '/Users/janss089/DATA/peaceportal/FIJI'
PEACEPORTAL_FIJI_ES_INDEX = 'peaceportal-fiji'
PEACEPORTAL_ALIAS = 'peaceportal'

PP_ALIAS = 'parliament'
PP_UK_DATA = '/Users/janss089/DATA/PeopleParliament/'
PP_UK_RECENT_DATA = '/Users/janss089/Desktop/RecentNL/ParlaMint-NL/ParlaMint-NL.TEI'
PP_UK_INDEX = 'parliament-uk'

PP_NO_INDEX = 'parliament-norway'
PP_NO_DATA = '/Users/janss089/DATA/PeopleParliament/Norway'

PP_NL_INDEX = 'parliament-netherlands'
PP_NL_DATA = '/Users/janss089/Desktop/uncompressed/d/nl/proc'
# PP_NL_RECENT_DATA = '/Users/janss089/Desktop/ParlaMint-NL/ParlaMint-NL.TEI'


PP_FR_INDEX = 'parliament-france'
# PP_FR_DATA = '/Users/janss089/Desktop/test'
PP_FR_DATA = '/Volumes/data/GW/CDH/DHLab/PeopleandParliament/ExampleData/France/'
PP_FR_WM = '/Users/janss089/Desktop/wm-france/france'

PP_GERMANY_NEW_DATA = '/Volumes/data/GW/CDH/DHLab/PeopleandParliament/ExampleData/Germany-tiny/'
PP_GERMANY_NEW_INDEX = 'parliament-germany-new'

PP_UK_WM = '/Users/janss089/Desktop/uk-lem-sep'

# TROONREDES_WM = '/Users/janss089/git/wordmodels/troonredes'

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

# SAML
SAML_FOLDER = "/Users/janss089/git/ianalyzer/saml"
SAML_SOLISID_KEY = "uuShortID"
SAML_MAIL_KEY = "mail"


CORPUS_SERVER_NAMES = {
}

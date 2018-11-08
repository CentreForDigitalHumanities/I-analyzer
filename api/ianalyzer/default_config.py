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

# Specify which corpora are not using the default server
CORPUS_SERVER_NAMES = {
    'times': 'default',
}

# Index configurations
DUTCHNEWSPAPERS_TITLE = "Dutch Newspapers"
DUTCHNEWSPAPERS_DESCRIPTION = "Description about this corpus"
DUTCHNEWSPAPERS_ES_INDEX = 'dutchnewspapers'
DUTCHNEWSPAPERS_ES_DOCTYPE = 'article'
DUTCHNEWSPAPERS_DATA = '/Users/3248526/corpora/kranten_pd_voorbeeld'
DUTCHNEWSPAPERS_MIN_DATE = datetime(year=1600, month=1, day=1)
DUTCHNEWSPAPERS_MAX_DATE = datetime(year=2018, month=12, day=31)
DUTCHNEWSPAPERS_IMAGE = '/static/images/dutchnewspapers.jpg'

TML_TITLE = "Thesaurus Musicarum Latinarum"
TML_DESCRIPTION = "Description about this corpus"
TML_ES_INDEX = 'tml'
TML_ES_DOCTYPE = 'article'
TML_DATA = '/Users/3248526/corpora/tml'
TML_MIN_DATE = datetime(year=1, month=1, day=1)
TML_MAX_DATE = datetime(year=2018, month=12, day=31)
TML_IMAGE = '/static/images/times.jpg'

TIMES_TITLE = "Times"
TIMES_DESCRIPTION = "Newspaper archive, 1785-2010"
TIMES_ES_INDEX = 'times'
TIMES_ES_DOCTYPE = 'article'
TIMES_DATA = '/mnt/times'
TIMES_MIN_DATE = datetime(year=1785, month=1, day=1)
TIMES_MAX_DATE = datetime(year=2010, month=12, day=31)
TIMES_IMAGE = '/static/images/times.jpg'

DUTCHBANK_TITLE = "Dutch Banking"
DUTCHBANK_DESCRIPTION = "Annual reports of Dutch finanical institutes"
DUTCHBANK_ES_INDEX = 'dutchbank'
DUTCHBANK_ES_DOCTYPE = 'article'
DUTCHBANK_DATA = '/mnt/dutchbank'
DUTCHBANK_MIN_DATE = datetime(year=1785, month=1, day=1)
DUTCHBANK_MAX_DATE = datetime(year=2010, month=12, day=31)
DUTCHBANK_IMAGE = '/static/images/dutchbanking.jpg'
DUTCHBANK_MAP = {
    'AA':       'ABN AMRO',
    'AB':       'Amsterdamsche Bank',
    'AMRO':     'AMRO Bank',
    'Albert':   'H. Albert de Bary',
    'BMH':      'Bank Mees & Hope',
    'CCBB':     'Cooperatieve Centrale Boerenleenbank',
    'CCRB':     'Cooperatieve Centrale Raiffeisen-Bank',
    'CDK':      'Crediet en Depositokas',
    'CEB':      'Crediet en Effectenkas',
    'CL':       'Credit Llyonnais Bank Nederland',
    'FORTIS':   'Fortis Bank',
    'FRIES':    'Friesland Bank',
    'GB':       'Generale Bank',
    'HBU':      'Hollandsche Bank Unie',
    'HKB':      'Hollandsche Koopmansbank',
    'IDM':      'Industriele Disconto Maatschappij',
    'ING':      'ING Bank',
    'KAS':      'Kas Bank',
    'Kempen':   'Kempen & Co',
    'LANS':     'Van Lanschot',
    'Lab':      'Labouchere & Co.',
    'Mendes':   'Bank Mendes Gans',
    'NCB':      'Nederlandsche Credietbank',
    'NHM':      'Nederlandsche Handel-Maatschappij',
    'NIB':      'De Nationale Investeringsbank',
    'NMB':      'Nederlandsche Middenstandsbank',
    'NMBPost':  'NMB Postbank Groep',
    'PHP':      'Pierson, Heldring en Pierson',
    'Pari':     'Paribas Nederland',
    'Post':     'Postbank',
    'RB':       'Rotterdamsche Bank',
    'SNS':      'SNS Bank',
    'SlavB':    'Slavenburg\'s Bank',
    'Staal':    'bankierskantoor Staal &Co/Staalbankiers',
    'TB':       'Twentsche Bank',
    'TRIODOS':  'Triodos Bank',
}


JEWISH_INSCRIPTIONS_IMAGE = '/static/images/jewish_inscriptions.jpg'

MAIL_SERVER = 'localhost'
MAIL_PORT = 25
MAIL_USE_TLS = False
MAIL_USE_SSL = False
MAIL_USERNAME = ''
MAIL_PASSWORD = ''
MAIL_FROM_ADRESS='r.g.v.loeber@uu.nl'
MAIL_REGISTRATION_SUBJECT_LINE='Thank you for signing up at I-analyzer'
BASE_URL='http://localhost:4200'
LOGO_LINK='http://dhstatic.hum.uu.nl/logo-lab/png/dighum-logo.png'

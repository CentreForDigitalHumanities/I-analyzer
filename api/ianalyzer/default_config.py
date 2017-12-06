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

# SQLAlchemy
SQLALCHEMY_DATABASE_URI = 'sqlite:////tmp/test.db'
SQLALCHEMY_TRACK_MODIFICATIONS = False

# the corpora dictionary provides the file path of the corpus definition(s)
# these definitions can be anywhere on the file system
CORPORA = {
   'times': 'ianalyzer/corpora/times.py'
}

# Global corpus variables
AVAILABLE_CORPORA = ['times']
CORPUS = 'times'
CORPUS_URL = 'Times.index'
CORPUS_ENDPOINT = 'Times'

# ElasticSearch
ES_HOST='localhost'
ES_PORT=9200
ES_USERNAME=''
ES_PASSWORD=''
ES_CHUNK_SIZE=900 # Maximum number of documents sent during ES bulk operation
ES_MAX_CHUNK_BYTES=1*1024*1024 # Maximum size of ES chunk during bulk operation
ES_BULK_TIMEOUT='60s' # Timeout of ES bulk operation
ES_EXAMPLE_QUERY_SIZE=5 # Number of results to appear in example query
ES_SCROLL_TIMEOUT='3m' # Time before scroll results time out
ES_SCROLL_PAGESIZE=5000 # Number of results per scroll page

# Index configurations
TIMES_TITLE = "Times"
TIMES_DESCRIPTION = "Description about this corpus"
TIMES_ES_INDEX='times'
TIMES_ES_DOCTYPE='article'
TIMES_DATA='/mnt/times'
TIMES_MIN_DATE=datetime(year=1785, month=1, day=1)
TIMES_MAX_DATE=datetime(year=2010, month=12, day=31)

DUTCHBANK_TITLE = "Dutch Banking"
DUTCHBANK_DESCRIPTION = "Description about this corpus"
DUTCHBANK_ES_INDEX='dutchbank'
DUTCHBANK_ES_DOCTYPE='article'
DUTCHBANK_DATA='/mnt/dutchbank'
DUTCHBANK_MIN_DATE=datetime(year=1785, month=1, day=1)
DUTCHBANK_MAX_DATE=datetime(year=2010, month=12, day=31)
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

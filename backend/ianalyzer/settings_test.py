from ianalyzer.settings import *

CORPORA = {
    'small-mock-corpus': os.path.join(BASE_DIR, 'visualization', 'tests', 'mock_corpora', 'small_mock_corpus.py'),
    'large-mock-corpus': os.path.join(BASE_DIR, 'visualization', 'tests', 'mock_corpora', 'large_mock_corpus.py'),
    'multilingual-mock-corpus': os.path.join(BASE_DIR, 'download', 'tests', 'mock_corpora', 'multilingual_mock_corpus.py'),
    'times': os.path.join(BASE_DIR, 'corpora', 'times', 'times.py')
}

TIMES_DATA = os.path.join(BASE_DIR, 'addcorpus', 'tests')
TIMES_ES_INDEX = 'times-test'

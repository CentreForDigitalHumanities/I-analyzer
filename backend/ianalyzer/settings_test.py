from ianalyzer.settings import *


def path_in_testdir(app, *path_from_app_tests):
    return os.path.join(BASE_DIR, app, 'tests', *path_from_app_tests)

def test_corpus_path(*path):
    return os.path.join(BASE_DIR, 'corpora_test', *path)

CORPORA = {
    'small-mock-corpus': test_corpus_path('small', 'small_mock_corpus.py'),
    'large-mock-corpus': test_corpus_path('large', 'large_mock_corpus.py'),
    'multilingual-mock-corpus': test_corpus_path('mixed_language', 'multilingual_mock_corpus.py'),
    'times': os.path.join(BASE_DIR, 'corpora', 'times', 'times.py'),
    'media-mock-corpus': test_corpus_path('media', 'media_mock_corpus.py'),
    'mock-csv-corpus': test_corpus_path('csv', 'mock_csv_corpus.py'),
    'mock-basic-corpus': test_corpus_path('csv', 'mock_basic_corpus.py'),
    'wordmodels-mock-corpus': path_in_testdir('wordmodels', 'mock-corpus', 'mock_corpus.py'),
    'tagging-mock-corpus': path_in_testdir('tag', 'tag_mock_corpus.py'),
}

TIMES_DATA = path_in_testdir('addcorpus', '../python_corpora/tests')
TIMES_ES_INDEX = 'times-test'

SERVERS['default']['index_prefix'] = 'test'

import pytest
import os
from download.tests.mock_corpora.multilingual_mock_corpus import SPECS as ML_MOCK_CORPUS_SPECS
from visualization.conftest import small_mock_corpus, large_mock_corpus, index_small_mock_corpus, \
    index_large_mock_corpus, small_mock_corpus_specs, large_mock_corpus_specs, index_test_corpus, \
    clear_test_corpus
from visualization.query import MATCH_ALL
from download import tasks

here = os.path.abspath(os.path.dirname(__file__))

@pytest.fixture()
def csv_directory(settings, tmpdir):
    dir =  tmpdir.mkdir('/csv_files')
    settings.CSV_FILES_PATH = str(dir)
    return settings.CSV_FILES_PATH

@pytest.fixture(scope='session')
def ml_mock_corpus():
    return 'multilingual-mock-corpus'

@pytest.fixture(params=['small-mock-corpus', 'large-mock-corpus', 'multilingual-mock-corpus'], scope='session')
def mock_corpus(request):
    'parametrised version of the mock corpus fixtures: runs with all'

    return request.param

@pytest.fixture()
def ml_mock_corpus_specs():
    return ML_MOCK_CORPUS_SPECS

@pytest.fixture()
def mock_corpus_specs(mock_corpus, small_mock_corpus, large_mock_corpus, ml_mock_corpus, small_mock_corpus_specs, large_mock_corpus_specs, ml_mock_corpus_specs):
    '''Return various specifications for the mock corpus (number of documents etc.)'''

    specs = {
        small_mock_corpus: small_mock_corpus_specs,
        large_mock_corpus: large_mock_corpus_specs,
        ml_mock_corpus: ml_mock_corpus_specs,
    }
    return specs[mock_corpus]

@pytest.fixture(scope='session')
def index_ml_mock_corpus(es_client, ml_mock_corpus):
    index_test_corpus(es_client, ml_mock_corpus)
    yield ml_mock_corpus
    clear_test_corpus(es_client, ml_mock_corpus)

@pytest.fixture(scope='session')
def index_mock_corpus(es_client, mock_corpus, index_small_mock_corpus, index_large_mock_corpus, index_ml_mock_corpus):
    yield mock_corpus

def save_all_results_csv(mock_corpus, mock_corpus_specs):
    fields = mock_corpus_specs['fields']
    query = mock_corpus_specs['example_query']

    request_json = {
        'corpus': mock_corpus,
        'es_query': MATCH_ALL,
        'fields': fields,
        'route': '/search/{};query={}'.format(mock_corpus, query)
    }
    results = tasks.download_scroll(request_json)
    filename = tasks.make_csv(results, request_json)

    return filename

@pytest.fixture()
def small_mock_corpus_results_csv(small_mock_corpus, small_mock_corpus_specs, index_small_mock_corpus, csv_directory):
    return save_all_results_csv(small_mock_corpus, small_mock_corpus_specs)

@pytest.fixture()
def large_mock_corpus_results_csv(large_mock_corpus, large_mock_corpus_specs, index_large_mock_corpus, csv_directory):
    return save_all_results_csv(large_mock_corpus, large_mock_corpus_specs)

@pytest.fixture()
def ml_mock_corpus_results_csv(ml_mock_corpus, ml_mock_corpus_specs, index_ml_mock_corpus, csv_directory):
    return save_all_results_csv(ml_mock_corpus, ml_mock_corpus_specs)

@pytest.fixture()
def mock_corpus_results_csv(mock_corpus, small_mock_corpus, large_mock_corpus, ml_mock_corpus, small_mock_corpus_results_csv, large_mock_corpus_results_csv, ml_mock_corpus_results_csv):
    files = {
        small_mock_corpus: small_mock_corpus_results_csv,
        large_mock_corpus: large_mock_corpus_results_csv,
        ml_mock_corpus: ml_mock_corpus_results_csv,
    }

    return files[mock_corpus]

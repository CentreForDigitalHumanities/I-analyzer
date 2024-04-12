import pytest
import os
from corpora_test.mixed_language.multilingual_mock_corpus import SPECS as ML_MOCK_CORPUS_SPECS
from addcorpus.conftest import basic_corpus
from es.conftest import basic_corpus_index
from visualization.conftest import small_mock_corpus_specs, large_mock_corpus_specs

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

@pytest.fixture()
def index_mock_corpus(es_client, mock_corpus, index_small_mock_corpus, index_large_mock_corpus, index_ml_mock_corpus):
    yield mock_corpus

def all_results_request_json(mock_corpus, mock_corpus_specs):
    fields = mock_corpus_specs['fields']
    query = mock_corpus_specs['example_query']

    return {
        'corpus': mock_corpus,
        'es_query': MATCH_ALL,
        'fields': fields,
        'route': '/search/{};query={}'.format(mock_corpus, query)
    }

def save_all_results_csv(mock_corpus, mock_corpus_specs):
    request_json = all_results_request_json(mock_corpus, mock_corpus_specs)
    fake_id = mock_corpus + '_all_results'
    filename = tasks.make_download(request_json, fake_id)

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

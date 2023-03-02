from users.models import CustomUser
import pytest
import os
from visualization.tests.mock_corpora.small_mock_corpus import SPECS as SMALL_MOCK_CORPUS_SPECS
from visualization.tests.mock_corpora.large_mock_corpus import SPECS as LARGE_MOCK_CORPUS_SPECS
from download.tests.mock_corpora.multilingual_mock_corpus import SPECS as ML_MOCK_CORPUS_SPECS
from visualization.conftest import index_mock_corpus, select_small_mock_corpus, select_large_mock_corpus
from addcorpus.load_corpus import load_all_corpora
from visualization.query import MATCH_ALL
from download import tasks

here = os.path.abspath(os.path.dirname(__file__))

@pytest.fixture()
def csv_directory(settings, tmpdir):
    dir =  tmpdir.mkdir('/csv_files')
    settings.CSV_FILES_PATH = str(dir)
    return settings.CSV_FILES_PATH


@pytest.fixture(params=['small-mock-corpus', 'large-mock-corpus', 'multilingual-mock-corpus'], scope='module')
def mock_corpus(request):
    '''Return the name of a mock corpus'''

    return request.param


@pytest.fixture()
def select_multilingual_mock_corpus(mock_corpus):
    '''Only run test with the large mock corpus - skip otherwise.'''

    if mock_corpus != 'multilingual-mock-corpus':
        pytest.skip()

    return mock_corpus


@pytest.fixture()
def mock_corpus_specs(mock_corpus):
    '''Return various specifications for the mock corpus (number of documents etc.)'''

    specs = {
        'small-mock-corpus': SMALL_MOCK_CORPUS_SPECS,
        'large-mock-corpus': LARGE_MOCK_CORPUS_SPECS,
        'multilingual-mock-corpus': ML_MOCK_CORPUS_SPECS
    }
    return specs[mock_corpus]

@pytest.fixture()
def all_results_csv(mock_corpus, mock_corpus_specs, index_mock_corpus, csv_directory):
    '''generate a results csv for the mock corpus corpus based on a match_all query'''

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

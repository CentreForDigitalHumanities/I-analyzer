import pytest
import os

from addcorpus.models import Corpus
from corpora_test.mixed_language.multilingual_mock_corpus import SPECS as ML_MOCK_CORPUS_SPECS
from download import tasks
from tag.models import Tag, TaggedDocument
from visualization.conftest import small_mock_corpus_specs, large_mock_corpus_specs
from visualization.query import MATCH_ALL

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
def tagged_mock_corpus(small_mock_corpus, admin_user, auth_user):
    '''a wrapper around small_mock_corpus, adding tags by two users'''
    corpus = Corpus.objects.get(name=small_mock_corpus)
    tag1 = Tag.objects.create(name='female writer', user=auth_user)
    tag2 = Tag.objects.create(name='female protagonist', user=auth_user)
    # this tag should not be in the export
    tag3 = Tag.objects.create(name='interesting', user=admin_user)
    tagged_doc1 = TaggedDocument.objects.create(corpus=corpus, doc_id=1)
    tagged_doc1.tags.add(tag1, tag3)
    tagged_doc2 = TaggedDocument.objects.create(corpus=corpus, doc_id=2)
    tagged_doc2.tags.add(tag1, tag2, tag3)
    tagged_doc3 = TaggedDocument.objects.create(corpus=corpus, doc_id=3)
    tagged_doc3.tags.add(tag2)
    return corpus


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
def small_mock_corpus_elasticsearch_results():
    return [
        {'_id': 1, '_source': {'date': '1818-01-01', 'genre': "Science fiction"}},
        {'_id': 2, '_source': {'date': '1813-01-28', 'genre': "Romance"}},
        {'_id': 3, '_source': {'date': '1865-11-09', 'genre': "Children"}},
    ]


@pytest.fixture()
def mock_corpus_results_csv(mock_corpus, small_mock_corpus, large_mock_corpus, ml_mock_corpus, small_mock_corpus_results_csv, large_mock_corpus_results_csv, ml_mock_corpus_results_csv):
    files = {
        small_mock_corpus: small_mock_corpus_results_csv,
        large_mock_corpus: large_mock_corpus_results_csv,
        ml_mock_corpus: ml_mock_corpus_results_csv,
    }

    return files[mock_corpus]

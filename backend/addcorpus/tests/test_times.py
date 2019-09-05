from os.path import expanduser, realpath, join, dirname, relpath, abspath
from datetime import datetime
from importlib import reload

import pytest

from ianalyzer import config_fallback as config
from ianalyzer.tests.conftest import test_app
from addcorpus import load_corpus



@pytest.fixture(scope="module")
def client():
    from .. import factories
    return factories.elasticsearch("times")



# @pytest.fixture(autouse=True)
# def configuration(monkeypatch):
#     monkeypatch.setattr(config, 'SQLALCHEMY_DATABASE_URI', 'sqlite:////tmp/test.db')
#     monkeypatch.setattr(config, 'TIMES_DATA', realpath(join(dirname(__file__))))
#     monkeypatch.setattr(config, 'CORPORA', {'times': abspath('corpora/times/times.py')})


def test_times_source(test_app):
    '''
    Verify that times source files are read correctly.
    '''
    # initialize the corpora module within the testing context
    times_corpus = load_corpus.load_corpus('times')

    print(dirname(__file__), times_corpus.data_directory)

    # Assert that indeed we are drawing sources from the testing folder
    assert dirname(__file__) == abspath(times_corpus.data_directory)


    # Obtain our mock source XML
    sources = times_corpus.sources(
        start=datetime(1970,1,1),
        end=datetime(1970,1,1)
    )


    docs = times_corpus.documents(sources)
    doc1 = next(docs)
    assert len(list(docs)) == 1
    # doc2 = next(docs)
    assert 'Category A' in doc1['category']
    assert doc1['content'] == 'A test paragraph.\nAnd another.'
    assert doc1['date'] == '1970-01-01'




import pytest
from os.path import expanduser, realpath, join, dirname, relpath
from datetime import datetime

from ianalyzer import config

@pytest.fixture(scope="module")
def client():
    from .. import factories
    return factories.elasticsearch()



@pytest.fixture(autouse=True)
def configuration(monkeypatch):
    monkeypatch.setattr(config, 'SQLALCHEMY_DATABASE_URI', 'sqlite:////tmp/test.db')
    monkeypatch.setattr(config, 'TIMES_DATA', realpath(join(dirname(__file__))))



def test_times_source():
    '''
    Verify that times source files are read correctly.
    '''
    
    config.CORPUS = 'times'
    config.CORPUS_ENDPOINT = 'Times'
    config.CORPUS_URL = 'Times.index'
    config.CORPORA = {'times': '/Users/janss089/git/ianalyzer/ianalyzer/corpora/times.py'}
    from ianalyzer import corpora

    
    # Assert that indeed we are drawing sources from the testing folder
    assert dirname(__file__) in corpora.corpus_obj.data_directory 
    
    
    # Obtain our mock source XML
    sources = list(corpora.corpus_obj.sources(
        start=datetime(1970,1,1),
        end=datetime(1970,1,1)
    ))
    assert len(sources) == 1
    
    
    docs = corpora.corpus_obj.documents(sources)
    doc1 = next(docs)
    doc2 = next(docs)
    assert 'Category A' in doc1['category']
    assert doc1['content'] == 'A test paragraph.\nAnd another.'
    assert doc1['date'] == '1970-01-01'




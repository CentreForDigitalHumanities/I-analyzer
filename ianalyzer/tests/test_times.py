import pytest
from os.path import expanduser, realpath, join, dirname, relpath
from datetime import datetime


@pytest.fixture(scope="module")
def client():
    from .. import factories
    return factories.elasticsearch()



@pytest.fixture(autouse=True)
def configuration(monkeypatch):
    from .. import config
    monkeypatch.setattr(config, 'SQLALCHEMY_DATABASE_URI', 'sqlite:////tmp/test.db')
    monkeypatch.setattr(config, 'TIMES_DATA', realpath(join(dirname(__file__))))



def test_times_source():
    '''
    Verify that times source files are read correctly.
    '''
    
    from ..corpora import corpora
    
    corpus = corpora.get('times')
    
    # Assert that indeed we are drawing sources from the testing folder
    assert dirname(__file__) in corpus.data_directory 
    
    
    # Obtain our mock source XML
    sources = list(corpus.sources(
        start=datetime(1970,1,1),
        end=datetime(1970,1,1)
    ))
    assert len(sources) == 1
    
    
    docs = corpus.documents(sources)
    doc1 = next(docs)
    doc2 = next(docs)
    assert 'Category A' in doc1['category']
    assert doc1['content'] == 'A test paragraph.\nAnd another.'
    assert doc1['date'] == '1970-01-01'




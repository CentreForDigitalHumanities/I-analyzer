import pytest
import warnings
from ianalyzer.elasticsearch import elasticsearch

def test_elasticsearch():
    '''
    Make the elasticsearch client and try to connect to the
    elasticsearch server.

    Only throws a warning if it fails to connect, as we may be
    running unit tests without an active server.
    '''
    client = elasticsearch('some-corpus')

    try:
        # try requesting something
        info = client.info()
    except:
        warnings.warn('Cannot connect to elasticsearch server', RuntimeWarning)
        pytest.skip('Cannot connect to elasticsearch server')

    assert info['tagline'] == 'You Know, for Search'

def test_corpus_server_settings(settings):
    '''Test that corpora are properly linked to
    server configurations'''

    settings.CORPUS_SERVER_NAMES = {
        'some-corpus': 'default',
        'another-corpus': 'undefined-server'
    }

    # connect to server 'default', should run without issue
    assert elasticsearch('some-corpus')

    # here we should retrieve the configuration for 'undefined-server'.
    # which should raise a KeyError
    with pytest.raises(KeyError):
        elasticsearch('another-corpus')

    # if the corpus is not in CORPUS_SERVER_NAMES
    # we should connect to default
    assert elasticsearch('corpus-without-explicit-server')

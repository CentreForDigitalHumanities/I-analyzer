from ianalyzer.elasticsearch import elasticsearch

def test_elasticsearch():
    client = elasticsearch('mock-corpus')
    assert client

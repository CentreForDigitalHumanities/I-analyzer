from indexing.serializers import IndexHealthSerializer
from indexing.health_check import CorpusIndexHealth

def test_index_health_serializer(json_mock_corpus, index_json_mock_corpus, es_server):
    health = CorpusIndexHealth(json_mock_corpus)
    serializer = IndexHealthSerializer(health)
    assert serializer.data

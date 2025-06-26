from indexing.serializers import IndexHealthSerializer, IndexJobSerializer
from indexing.health_check import CorpusIndexHealth
from indexing.create_job import create_indexing_job
from addcorpus.models import Corpus
from indexing.models import TaskStatus

def test_index_health_serializer(json_mock_corpus, index_json_mock_corpus, es_server):
    health = CorpusIndexHealth(json_mock_corpus)
    serializer = IndexHealthSerializer(health)
    assert serializer.data

def test_indexjob_serializer(db, basic_mock_corpus):
    corpus = Corpus.objects.get(name=basic_mock_corpus)
    job = create_indexing_job(corpus)
    serializer = IndexJobSerializer(job)
    assert serializer.data == {
        'id': job.pk,
        'corpus': corpus.pk,
        'status': TaskStatus.CREATED
    }

def test_indexjob_create(db, basic_mock_corpus):
    corpus = Corpus.objects.get(name=basic_mock_corpus)
    serializer = IndexJobSerializer(data={'corpus': corpus.pk})
    assert serializer.is_valid()
    job = serializer.create(serializer.validated_data)
    assert len(job.tasks()) == 2 # tasks: create + populate


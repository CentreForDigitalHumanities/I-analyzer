from rest_framework.serializers import (
    Serializer, BooleanField, ChoiceField, CharField,
    ModelSerializer, ValidationError,
    PrimaryKeyRelatedField
)

from indexing.models import TaskStatus, IndexJob
from indexing.create_job import create_indexing_job
from addcorpus.models import Corpus
from addcorpus.validation.indexing import CorpusNotIndexableError

class IndexHealthSerializer(Serializer):
    corpus = PrimaryKeyRelatedField(read_only=True)
    server_active = BooleanField()
    index_active = BooleanField()
    index_compatible = BooleanField()
    latest_job = PrimaryKeyRelatedField(read_only=True)
    job_status = ChoiceField(choices=TaskStatus.choices)
    includes_latest_data = BooleanField()
    corpus_ready_to_index = BooleanField()
    corpus_validation_feedback = CharField()


class IndexJobSerializer(ModelSerializer):
    class Meta:
        model = IndexJob
        fields = ['id', 'corpus', 'status']
        read_only_fields = ['id', 'status']

    def create(self, validated_data):
        corpus = validated_data.get('corpus')
        return create_indexing_job(corpus, clear=True)

    def validate_corpus(self, value: Corpus):
        try:
            value.validate_ready_to_index()
        except CorpusNotIndexableError as e:
            raise ValidationError(str(e))

        return value

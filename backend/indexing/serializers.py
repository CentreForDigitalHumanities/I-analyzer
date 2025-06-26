from rest_framework.serializers import (
    Serializer, BooleanField, ChoiceField, IntegerField, CharField,
    ModelSerializer
)

from indexing.models import TaskStatus, IndexJob
from indexing.create_job import create_indexing_job

class IndexHealthSerializer(Serializer):
    corpus = IntegerField(source='corpus.pk')
    server_active = BooleanField()
    index_active = BooleanField()
    index_compatible = BooleanField()
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

    def update(self, instance, validated_data):
        raise NotImplementedError()

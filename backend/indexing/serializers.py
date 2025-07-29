from rest_framework.serializers import (
    Serializer, BooleanField, ChoiceField, IntegerField, CharField
)

from indexing.models import TaskStatus

class IndexHealthSerializer(Serializer):
    corpus = IntegerField(source='corpus.pk')
    server_active = BooleanField()
    index_active = BooleanField()
    index_compatible = BooleanField()
    job_status = ChoiceField(choices=TaskStatus.choices)
    includes_latest_data = BooleanField()
    corpus_ready_to_index = BooleanField()
    corpus_validation_feedback = CharField()

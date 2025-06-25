from rest_framework.serializers import Serializer, BooleanField, ChoiceField, IntegerField

from indexing.models import TaskStatus

class IndexHealthSerializer(Serializer):
    corpus = IntegerField(source='corpus.pk')
    server_active = BooleanField()
    index_active = BooleanField()
    index_compatible = BooleanField()
    job_status = ChoiceField(choices=TaskStatus.choices)
    includes_latest_data = BooleanField()

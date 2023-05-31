from rest_framework import serializers
from django.conf import settings
from typing import Tuple
from addcorpus.corpus import Corpus
from addcorpus.models import MAX_LENGTH_NAME, MAX_LENGTH_DESCRIPTION

class CorpusSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=MAX_LENGTH_NAME)
    description = serializers.CharField(max_length=MAX_LENGTH_DESCRIPTION)

    def to_representation(self, instance: Tuple[str, Corpus]):
        name, definition = instance
        return {
            'name': name,
            **definition.serialize()
        }

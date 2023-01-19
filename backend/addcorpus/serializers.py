from rest_framework import serializers
from django.conf import settings
from typing import Tuple
from addcorpus.corpus import Corpus

class CorpusSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=settings.MAX_LENGTH_NAME)
    description = serializers.CharField(max_length=settings.MAX_LENGTH_NAME)

    def to_representation(self, instance: Tuple[str, Corpus]):
        name, definition = instance
        return {
            'name': name,
            **definition.serialize()
        }

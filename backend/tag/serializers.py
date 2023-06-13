from rest_framework import serializers

from .models import Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'user', 'name', 'description']
        read_only_fields = ['id', 'user']

from rest_framework import serializers
from download.models import Download

class DownloadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Download
        fields = ['download_type', 'corpus', 'started', 'completed',  'parameters', 'status',]

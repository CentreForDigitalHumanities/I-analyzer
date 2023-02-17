from rest_framework import serializers
from api.models import Query

class QuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = Query
        fields = ['query_json', 'corpus', 'started', 'completed', 'transferred', 'total_results', 'user']

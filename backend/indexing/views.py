from rest_framework.generics import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response

from addcorpus.permissions import editable_corpora
from indexing.serializers import IndexHealthSerializer
from indexing.health_check import CorpusIndexHealth

class IndexHealthView(APIView):
    def get(self, request, corpus: str):
        queryset = editable_corpora(request.user)
        corpus_obj = get_object_or_404(queryset, id=corpus)
        health = CorpusIndexHealth(corpus_obj)
        serializer = IndexHealthSerializer(health)
        return Response(serializer.data)

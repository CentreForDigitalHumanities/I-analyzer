from django.shortcuts import render
from rest_framework.views import APIView
from addcorpus.models import Corpus
from addcorpus.serializers import CorpusSerializer
from rest_framework.response import Response
from addcorpus.load_corpus import load_all_corpora

class CorpusView(APIView):
    def get(self, request, format=None):
        corpora = load_all_corpora()
        serializer = CorpusSerializer(corpora.items(), many=True)
        return Response(serializer.data)

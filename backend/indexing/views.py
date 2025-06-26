from rest_framework.generics import get_object_or_404
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet
from rest_framework.mixins import CreateModelMixin, ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response

from addcorpus.permissions import editable_corpora, CanEditCorpus
from indexing.serializers import IndexHealthSerializer, IndexJobSerializer
from indexing.health_check import CorpusIndexHealth
from indexing.models import IndexJob
from addcorpus.models import Corpus
from indexing.run_job import perform_indexing_async

class IndexHealthView(APIView):
    def get(self, request, corpus: str):
        queryset = editable_corpora(request.user)
        corpus_obj = get_object_or_404(queryset, id=corpus)
        health = CorpusIndexHealth(corpus_obj)
        serializer = IndexHealthSerializer(health)
        return Response(serializer.data)


class IndexJobView(CreateModelMixin, ListModelMixin, RetrieveModelMixin, GenericViewSet):
    '''
    Viewset for running and inspecting index jobs.

    Creating a job will also schedule it. The list/retrieve endpoints can be used to
    inspect the status of a job.
    '''

    serializer_class = IndexJobSerializer
    permission_classes = [CanEditCorpus]

    def corpus_from_object(self, obj: IndexJob) -> Corpus:
        return obj.corpus

    def get_queryset(self):
        corpora = editable_corpora(self.request.user)
        return IndexJob.objects.filter(corpus__in=corpora)

    def perform_create(self, serializer):
        '''
        Overwrites ModelViewSet.perform_create
        Starts the job after creating.
        '''
        job = serializer.save()
        perform_indexing_async(job)

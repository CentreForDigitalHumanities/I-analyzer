from rest_framework.views import APIView
from addcorpus.serializers import CorpusSerializer, CorpusDocumentationPageSerializer, CorpusJSONDefinitionSerializer
from addcorpus.python_corpora.load_corpus import corpus_dir, load_corpus_definition
import os
from django.http.response import FileResponse
from addcorpus.permissions import (
    CanSearchCorpus, corpus_name_from_request, IsCurator,
    IsCuratorOrReadOnly)
from rest_framework.exceptions import NotFound
from rest_framework import viewsets
from addcorpus.models import Corpus, CorpusConfiguration, CorpusDocumentationPage

from django.conf import settings

class CorpusView(viewsets.ReadOnlyModelViewSet):
    '''
    List all available corpora
    '''

    serializer_class = CorpusSerializer

    def get_queryset(self):
        return self.request.user.searchable_corpora()


class CorpusDocumentationPageViewset(viewsets.ModelViewSet):
    '''
    Markdown documentation pages for corpora.
    '''

    permission_classes = [IsCuratorOrReadOnly]
    serializer_class = CorpusDocumentationPageSerializer

    def get_queryset(self):
        # curators are not limited to active corpora (to allow editing)
        if self.request.user.is_staff:
            corpora = Corpus.objects.all()
        else:
           corpora = self.request.user.searchable_corpora()

        return CorpusDocumentationPage.objects.filter(
            corpus_configuration__corpus__in=corpora
        )


class CorpusImageView(APIView):
    '''
    Return the image for a corpus.
    '''

    permission_classes = [CanSearchCorpus, IsCuratorOrReadOnly]

    def get(self, request, *args, **kwargs):
        corpus_name = corpus_name_from_request(request)
        corpus_config = CorpusConfiguration.objects.get(corpus__name=corpus_name)
        if corpus_config.image:
            path = corpus_config.image.path
        else:
            path = settings.DEFAULT_CORPUS_IMAGE

        return FileResponse(open(path, 'rb'))


class CorpusDocumentView(APIView):
    '''
    Return a file for a corpus - e.g. extra metadata.
    '''

    permission_classes = [CanSearchCorpus]

    def get(self, request, *args, **kwargs):
        corpus = Corpus.objects.get(corpus_name_from_request(request))
        if not corpus.has_python_definition:
            raise NotFound()
        path = os.path.join(corpus_dir(corpus.name), 'documents', kwargs['filename'])
        if not os.path.isfile(path):
            raise NotFound()
        return FileResponse(open(path, 'rb'))


class CorpusDefinitionViewset(viewsets.ModelViewSet):
    permission_classes = [IsCurator]
    serializer_class = CorpusJSONDefinitionSerializer

    def get_queryset(self):
        return Corpus.objects.filter(has_python_definition=False)

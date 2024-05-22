from rest_framework.views import APIView
from addcorpus.serializers import CorpusSerializer, CorpusDocumentationPageSerializer, CorpusJSONDefinitionSerializer
from addcorpus.python_corpora.load_corpus import corpus_dir, load_corpus_definition
import os
from django.http.response import FileResponse
from addcorpus.permissions import (
    CorpusAccessPermission, filter_user_corpora, corpus_name_from_request, IsCurator,
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
        corpora = Corpus.objects.filter(active=True)
        filtered_corpora = filter_user_corpora(corpora, self.request.user)
        return filtered_corpora


def send_corpus_file(corpus='', subdir='', filename=''):
    '''
    Returns a FileResponse for a file in the corpus directory.

    E.g. arguments `(corpus='times', subdir='images', filename='times.jpeg')` will return the file
    at `<location-of-times-definition>/images/times.jpeg`
    '''

    path = os.path.join(corpus_dir(corpus), subdir, filename)

    if not os.path.isfile(path):
        raise NotFound()

    return FileResponse(open(path, 'rb'))

class CorpusDocumentationPageViewset(viewsets.ReadOnlyModelViewSet):
    permission_classes = [CorpusAccessPermission, IsCuratorOrReadOnly]
    serializer_class = CorpusDocumentationPageSerializer

    @staticmethod
    def get_relevant_pages(pages, corpus_name):
        # only include wordmodels documentation if models are present
        if Corpus.objects.get(name=corpus_name).has_python_definition:
            definition = load_corpus_definition(corpus_name)
            if definition.word_models_present:
                return pages
        return pages.exclude(type=CorpusDocumentationPage.PageType.WORDMODELS)

    def get_queryset(self):
        corpus_name = corpus_name_from_request(self.request)
        pages = CorpusDocumentationPage.objects.filter(
            corpus_configuration__corpus__name=corpus_name)
        relevant_pages = self.get_relevant_pages(pages, corpus_name)
        canonical_order = [e.value for e in CorpusDocumentationPage.PageType]

        return sorted(
            relevant_pages, key=lambda p: canonical_order.index(p.type))


class CorpusImageView(APIView):
    '''
    Return the image for a corpus.
    '''

    permission_classes = [IsCuratorOrReadOnly]

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
    Return a document for a corpus - e.g. extra metadata.
    '''

    permission_classes = [CorpusAccessPermission]

    def get(self, request, *args, **kwargs):
        return send_corpus_file(subdir='documents', **kwargs)


class CorpusDefinitionViewset(viewsets.ModelViewSet):
    permission_classes = [IsCurator]
    serializer_class = CorpusJSONDefinitionSerializer

    def get_queryset(self):
        return Corpus.objects.filter(has_python_definition=False)

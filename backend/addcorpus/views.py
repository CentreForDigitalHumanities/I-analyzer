from rest_framework.views import APIView
from addcorpus.serializers import CorpusSerializer
from rest_framework.response import Response
from addcorpus.python_corpora.load_corpus import corpus_dir
import os
from django.http.response import FileResponse
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from addcorpus.permissions import CorpusAccessPermission, filter_user_corpora
from rest_framework.exceptions import NotFound
from addcorpus.models import Corpus

class CorpusView(APIView):
    '''
    List all available corpora
    '''

    permission_classes = (IsAuthenticatedOrReadOnly,)

    def get(self, request, *args, **kwargs):
        corpora = Corpus.objects.filter(configuration__isnull=False)
        filtered_corpora = filter_user_corpora(corpora, request.user)
        serializer = CorpusSerializer(filtered_corpora, many=True)
        return Response(serializer.data)


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

class CorpusImageView(APIView):
    '''
    Return the image for a corpus.
    '''

    permission_classes = (IsAuthenticatedOrReadOnly,)

    def get(self, request, *args, **kwargs):
        return send_corpus_file(subdir='images', **kwargs)

class CorpusDocumentationView(APIView):
    '''
    Return the documentation for a corpus
    '''

    permission_classes = [IsAuthenticatedOrReadOnly, CorpusAccessPermission]

    def get(self, request, *args, **kwargs):
        return send_corpus_file(subdir='description', **kwargs)

class CorpusDocumentView(APIView):
    '''
    Return a document for a corpus - e.g. extra metadata.
    '''

    permission_classes = [IsAuthenticatedOrReadOnly, CorpusAccessPermission]

    def get(self, request, *args, **kwargs):
        return send_corpus_file(subdir='documents', **kwargs)

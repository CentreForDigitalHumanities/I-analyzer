from rest_framework.views import APIView
from addcorpus.serializers import CorpusSerializer
from rest_framework.response import Response
from addcorpus.load_corpus import load_all_corpora, corpus_dir
import os
from django.http.response import FileResponse
from rest_framework.permissions import IsAuthenticated
from addcorpus.permissions import CorpusAccessPermission, filter_user_corpora


class CorpusView(APIView):
    '''
    List all available corpora
    '''

    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        corpora = load_all_corpora()
        filtered_corpora = filter_user_corpora(corpora, request.user)
        serializer = CorpusSerializer(filtered_corpora.items(), many=True)
        return Response(serializer.data)


class CorpusImageView(APIView):
    '''
    Return the image for a corpus.
    '''

    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        corpus = kwargs.get('corpus')
        image_name = kwargs.get('image_name')
        image_path = os.path.join(corpus_dir(corpus), 'images', image_name)
        return FileResponse(open(image_path, 'rb'))


class CorpusDocumentationView(APIView):
    '''
    Return the documentation for a corpus
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def get(self, request, *args, **kwargs):
        corpus = kwargs.get('corpus')
        documentation_file = kwargs.get('documentation_file')
        documentation_path = os.path.join(corpus_dir(
            corpus), 'description', documentation_file)
        return FileResponse(open(documentation_path, 'rb'))

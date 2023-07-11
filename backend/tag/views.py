from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from django.http import HttpRequest
from rest_framework.exceptions import NotFound

from .models import Tag, TaggedDocument
from .permissions import IsTagOwner
from .serializers import TagSerializer
from addcorpus.models import Corpus
from addcorpus.permissions import CorpusAccessPermission, corpus_name_from_request

def check_corpus_name(request: HttpRequest):
    '''
    Returns the name of the corpus specified in the request query parameters,
    if there is one.

    Raises 404 if this is not a real corpus.
    '''

    corpus_name = request.query_params.get('corpus', None)
    if corpus_name and not Corpus.objects.filter(name=corpus_name):
        raise NotFound(f'corpus {corpus_name} does not exist')
    return corpus_name

class TagViewSet(ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated, IsTagOwner]
    queryset = Tag.objects.all()

    def perform_create(self, serializer):
        '''Overwrites ModelViewSet.perfor0m_create
        Auto-assigns the authenticated user on creation'''
        return serializer.save(user=self.request.user)

    def list(self, *args, **kwargs):
        '''Overwrites ModelViewSet.list
        Filters the default queryset by ownership.
        Only applies to list view, the class queryset is unaffected.

        Supports filtering on a corpus by specifying the name as a query parameter.
        '''

        corpus_name = check_corpus_name(self.request)

        filters = {
            'user': self.request.user,
            'tagged_docs__corpus__name': corpus_name
        }

        queryset = self.queryset.filter(**filters).distinct()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class DocumentTagsView(APIView):
    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def get(self, request, *args, **kwargs):
        '''
        Get the tags for a document
        '''

        tagged = TaggedDocument.objects.filter(
            corpus__name=kwargs.get('corpus'),
            doc_id=kwargs.get('doc_id'),
        )

        if tagged:
            tags =tagged.first().tags.filter(user=request.user)
        else:
            tags = []

        serializer = TagSerializer(tags, many=True)
        return Response(serializer.data)

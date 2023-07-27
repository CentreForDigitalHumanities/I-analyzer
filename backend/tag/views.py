from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from django.http import HttpRequest
from rest_framework.exceptions import NotFound, PermissionDenied, ParseError

from .models import Tag, TaggedDocument
from .permissions import IsTagOwner
from .serializers import TagSerializer
from addcorpus.models import Corpus
from addcorpus.permissions import CorpusAccessPermission

def check_corpus_name(request: HttpRequest):
    '''
    Returns the name of the corpus specified in the request query parameters,
    if there is one.

    Raises 404 if this corpus does not exist.
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
        '''Overwrites ModelViewSet.perform_create
        Auto-assigns the authenticated user on creation'''
        return serializer.save(user=self.request.user)

    def list(self, *args, **kwargs):
        '''Overwrites ModelViewSet.list
        Filters the default queryset by ownership.
        Only applies to list view, the class queryset is unaffected.

        Supports filtering on a corpus by specifying the name as a query parameter.
        '''


        filters = {
            'user': self.request.user,
        }

        corpus_name = check_corpus_name(self.request)
        if corpus_name:
            filters.update({
                'tagged_docs__corpus__name': corpus_name
            })

        queryset = self.queryset.filter(**filters).distinct()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class DocumentTagsView(APIView):
    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def get(self, request, *args, **kwargs):
        '''
        Get the tags for a document
        '''

        doc = self._get_document(**kwargs)

        if doc:
            tags = doc.tags.filter(user=request.user)
        else:
            tags = []

        serializer = TagSerializer(tags, many=True)
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        '''
        Add or remove tags for a document

        The payload should specify a list of operations, like so:

        ```
        [
            {"op": "add", "value": 47},
            {"op": "remove": "value": 123},
            {"op": "add", "value": 12},
        ]
        ```
        '''

        doc = self._get_document(**kwargs) or self._create_document(**kwargs)

        for op in request.data:
            tag_id = op.get('value')
            tag = self._get_tag(request, tag_id)
            action = self._get_patch_action(op, doc)
            action(tag)

        return Response('done')

    def _get_document(self, **kwargs):
        match = TaggedDocument.objects.filter(
            corpus__name=kwargs.get('corpus'),
            doc_id=kwargs.get('doc_id'),
        )

        if match.exists():
            return match.first()

    def _create_document(self, **kwargs):
        corpus_name = kwargs.get('corpus') # note: corpus name is verified in permissions
        doc_id = kwargs.get('doc_id')
        corpus = Corpus.objects.get(name=corpus_name)
        return TaggedDocument.objects.create(corpus=corpus, doc_id=doc_id)

    def _get_tag(self, request, tag_id):
        if not Tag.objects.filter(id=tag_id).exists():
            raise NotFound(f'Tag {tag_id} does not exist')

        tag = Tag.objects.get(id=tag_id)

        if not tag.user == request.user:
            raise PermissionDenied(f'You do not have permission to modify tag {tag_id}')

        return tag

    def _get_patch_action(self, op, doc: TaggedDocument):
        actions = {
            'add': doc.tags.add,
            'remove': doc.tags.remove
        }

        action = actions.get(op.get('op', None), None)
        if not action:
            raise ParseError('could not parse action')

        return action

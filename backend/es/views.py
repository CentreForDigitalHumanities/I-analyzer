from rest_framework.views import APIView
from rest_framework.response import Response
from ianalyzer.elasticsearch import elasticsearch
from es.search import get_index
import logging
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import APIException, NotFound, PermissionDenied
from addcorpus.permissions import CorpusAccessPermission
from tag.filter import include_tag_filter
from tag.permissions import IsTagOwner
from tag.models import Tag

logger = logging.getLogger(__name__)

def get_query_parameters(request):
        'get query params from a request'

        # extract each query_param with .get, otherwise they return as lists
        return {
            key: request.query_params.get(key)
            for key in request.query_params
        }

def verify_tag_exists(id):
    if not Tag.objects.filter(id=id).exists():
        raise NotFound(f'Tag {id} does not exist')

def verify_tag_permission(id, request):
    tag = Tag.objects.get(id=id)
    if not IsTagOwner().has_object_permission(request, None, tag):
        raise PermissionDenied(f'You do not have permission to access tag {id}')

def verify_tags(request):
    tags = request.data.get('tags', None)

    if not tags:
        return

    for id in tags:
        verify_tag_exists(id)
        verify_tag_permission(id, request)


def specify_tags(query, corpus_name, request):
    '''
    Specifies tag contents if needed.

    If the query JSON contains a `tags` key,
    it is removed and replaced with a filter
    on the tags' document IDs.
    '''

    tags = query.pop('tags', None)
    return include_tag_filter(query, tags, corpus_name)

class ForwardSearchView(APIView):
    '''
    Forward search request to elasticsearch

    The request should specify a query in the elasticsearch query DSL; c.f.

    https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html

    The request data should be the query JSON. You can optionally include
    extra key/value pairs as query parameters in the request. They
    will be merged with the JSON data.

    On top of any properties included in the query DSL, the request may also specify
    a `tags`property. This should be an array of values, referring to IDs of tags
    on which the results should be filtered.
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def post(self, request, *args, **kwargs):
        corpus_name = kwargs.get('corpus')
        client = elasticsearch(corpus_name)
        index = get_index(corpus_name)

        # combine request json with query parameters (size, scroll)
        query = {
            **request.data,
            **get_query_parameters(request)
        }

        verify_tags(request)
        query = specify_tags(query, corpus_name, request.user)

        try:
            results = client.search(
                index=index,
                **query,
                track_total_hits=True,
            )
        except Exception as e:
            logger.exception(e)
            raise APIException('Search failed')

        return Response(results)

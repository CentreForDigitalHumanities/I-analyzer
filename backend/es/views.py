from rest_framework.views import APIView
from rest_framework.response import Response
from ianalyzer.elasticsearch import elasticsearch
from es.search import get_index
import logging
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import APIException
from addcorpus.permissions import CorpusAccessPermission
from tag.filter import include_tag_filter

logger = logging.getLogger(__name__)

def get_query_parameters(request):
        'get query params from a request'

        # extract each query_param with .get, otherwise they return as lists
        return {
            key: request.query_params.get(key)
            for key in request.query_params
        }

def specify_tags(query, corpus_name):
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

        query = specify_tags(query, corpus_name)

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

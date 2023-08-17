from rest_framework.views import APIView
from rest_framework.response import Response
from ianalyzer.elasticsearch import elasticsearch
from es.search import get_index
import logging
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import APIException
from addcorpus.permissions import CorpusAccessPermission
from tag.filter import handle_tags_in_request
from tag.permissions import CanSearchTags

logger = logging.getLogger(__name__)

def get_query_parameters(request):
        'get query params from a request'

        # extract each query_param with .get, otherwise they return as lists
        return {
            key: request.query_params.get(key)
            for key in request.query_params
        }

class ForwardSearchView(APIView):
    '''
    Forward search request to elasticsearch

    The request may specify:
    - `es_query`: a query in the elasticsearch query DSL; c.f.
    https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html
    - `tags`: an array of tag IDs that the results should be filtered on. Multiple tags
    are combined with OR logic: a document must match any of them.

    You can optionally include extra key/value pairs as query parameters
    in the request. They will be merged with the elasticsearch query. E.g.,
    adding `size=100` as a query parameter will merge `{"size":100}` into the query.
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission, CanSearchTags]

    def post(self, request, *args, **kwargs):
        corpus_name = kwargs.get('corpus')
        client = elasticsearch(corpus_name)
        index = get_index(corpus_name)

        handle_tags_in_request(request)

        # combine request json with query parameters (size, scroll)
        query = {
            **request.data.get('es_query', {}),
            **get_query_parameters(request)
        }

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

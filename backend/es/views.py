from rest_framework.views import APIView
from rest_framework.response import Response
from ianalyzer.elasticsearch import elasticsearch
from es.search import get_index
import logging
from rest_framework.permissions import IsAuthenticated
from addcorpus.load_corpus import load_corpus
from rest_framework.exceptions import NotFound, PermissionDenied, APIException

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
    '''

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        corpus_name = kwargs.get('corpus')

        # check if the corpus exists
        try:
            corpus = load_corpus(corpus_name)
        except:
            raise NotFound('Corpus does not exist')

        # check if the user has access
        if not request.user.has_access(corpus_name):
            return PermissionDenied('You do not have permission to access this corpus')

        client = elasticsearch(corpus_name)
        index = get_index(corpus_name)

        # combine request json with query parameters (size, scroll)
        query = {
            **request.data,
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

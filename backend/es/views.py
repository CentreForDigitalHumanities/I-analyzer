from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response

class ForwardSearchView(APIView):
    '''
    Forward search request to elasticsearch
    '''

    def post(self, request, *args, **kwargs):
        return Response(None)
        # TODO: forward request

        # def require_access(corpus_name):
        #     """ Abort if the current user is not authorized for corpus_name. """
        #     if not current_user.has_access(corpus_name):
        #         abort(401)  # Unauthorized

        # require_access(corpus_name)
        # client = elasticsearch(corpus_name)
        # index = get_index(corpus_name)
        # try:
        #     results = client.search(
        #         index=index,
        #         body=json.loads(request.get_data()),
        #         track_total_hits=True,
        #         **request.args.to_dict()
        #     )
        # except ConnectionError as e:
        #     logger.error(e)
        #     abort(503)  # Service unavailable
        # except ConnectionTimeout as e:
        #     logger.error(e)
        #     abort(504)  # Gateway Timeout
        # return Response(json.dumps(results.raw))

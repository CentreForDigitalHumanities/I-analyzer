from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from addcorpus.permissions import CorpusAccessPermission, corpus_name_from_request
from wordmodels import utils, visualisations
from rest_framework.exceptions import APIException

class RelatedWordsView(APIView):
    '''
    Get words with the highest similarity to the query term
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def post(self, request, *args, **kwargs):
        corpus = corpus_name_from_request(request)
        results = visualisations.get_diachronic_contexts(
            request.data['query_term'],
            corpus,
            number_similar = request.data['neighbours'],
        )
        if isinstance(results, str):
            # the method returned an error string
            raise APIException(detail=results)
        else:
            return Response({
                    'similarities_over_time': results[0],
                    'similarities_over_time_local_top_n': results[1],
                    'time_points': results[1]
            })

class SimilarityView(APIView):
    '''
    Get similarity between two query terms
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def get(self, request, *args, **kwargs):
        corpus = corpus_name_from_request(request)
        term_1 = request.query_params.get('term_1')
        term_2 = request.query_params.get('term_2')

        results = visualisations.get_similarity_over_time(term_1, term_2, corpus)

        if isinstance(results, str):
            # the method returned an error string
            raise APIException(detail=results)
        else:
            return Response(results)

class DocumentationView(APIView):
    '''
    Get word models documentation for a corpus
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def get(self, request, *args, **kwargs):
        corpus = corpus_name_from_request(request)
        documentation = utils.load_wm_documentation(corpus)

        return Response({
            'documentation': documentation
        })

class WordInModelView(APIView):
    '''
    Check if a word has a vector in the model for a corpus
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def get(self, request, *args, **kwargs):
        corpus = corpus_name_from_request(request)
        query_term = request.query_params.get('query_term')

        results = utils.word_in_modelss(query_term, corpus)

        if isinstance(results, str):
            # the method returned an error string
            raise APIException(detail=results)
        else:
            return Response(results)

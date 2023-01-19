from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response

class RelatedWordsView(APIView):
    '''
    Get words with the highest similarity to the query term
    '''

    def post(self, request, *args, **kwargs):
        return Response(None)

        # TODO: related words
        # if not request.json:
        #     abort(400)
        # results = visualisations.get_diachronic_contexts(
        #     request.json['query_term'],
        #     request.json['corpus_name'],
        #     number_similar = request.json.get('neighbours'),
        # )
        # if isinstance(results, str):
        #     # the method returned an error string
        #     response = jsonify({
        #         'success': False,
        #         'message': results})
        # else:
        #     response = jsonify({
        #         'success': True,
        #         'data': {
        #             'total_similarities': results[0],
        #             'similarities_over_time': results[1],
        #             'similarities_over_time_local_top_n': results[3],
        #             'time_points': results[2]
        #         }
        #     })
        # return response

class SimilarityView(APIView):
    '''
    Get similarity between two query terms
    '''

    def post(self, request, *args, **kwargs):
        return Response(None)
        # TODO: similarity view

        # if not request.args:
        #     abort(400)
        # results = visualisations.get_similarity_over_time(
        #     request.args['term_1'],
        #     request.args['term_2'],
        #     request.args['corpus_name']
        # )
        # if isinstance(results, str):
        #     # the method returned an error string
        #     response = jsonify({
        #         'success': False,
        #         'message': results})
        # else:
        #     response = jsonify({
        #         'success': True,
        #         'data': results
        #     })
        # return response

class DocumentationView(APIView):
    '''
    Get word models documentation for a corpus
    '''

    def get(self, request, *args, **kwargs):
        return Response(None)

        # TODO: documentation view
        # if not request.args and 'corpus_name' in request.args:
        #     abort(400)

        # corpus = request.args['corpus_name']
        # documentation = utils.load_wm_documentation(corpus)

        # return {
        #     'documentation': documentation
        # }

class WordInModelView(APIView):
    '''
    Check if a word has a vector in the model for a corpus
    '''

    def get(self, request, *args, **kwargs):
        return Response(None)

        # TODO: word in model view
        # if not request.args:
        #     abort(400)
        # results = utils.word_in_model(
        #     request.args['query_term'],
        #     request.args['corpus_name']
        # )
        # if isinstance(results, str):
        #     # the method returned an error string
        #     response = jsonify({
        #         'success': False,
        #         'message': results})
        # else:
        #     response = jsonify({
        #         'success': True,
        #         'result': results
        #     })
        # return response

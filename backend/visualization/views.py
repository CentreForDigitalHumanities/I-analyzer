from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response

class WordcloudView(APIView):
    '''
    Most frequent terms for a small batch of results
    '''
    def post(self, request, *args, **kwargs):
        return Response(None)

        # TODO : wordcloud view
        # if not request.json:
        #     abort(400)
        # if request.json['size']>1000:
        #     abort(400)
        # else:
        #     word_counts = tasks.get_wordcloud_data.delay(request.json)
        #     if not word_counts:
        #         return jsonify({'success': False, 'message': 'Could not generate word cloud data.'})
        #     else:
        #         return jsonify({'success': True, 'data': word_counts.get()})

class WordcloudTaskView(APIView):
    '''
    Schedule a task to retrieve the word cloud
    for a large number of results
    '''

    def post(self, request, *args, **kwargs):
        # This view is not used but maintained in case
        # we re-introduce this functionality

        return Response(None)
        # TODO: wordcloud task view
        # if not request.json:
        #     abort(400)
        # else:
        #     word_counts = tasks.get_wordcloud_data.delay(request.json)
        #     if not word_counts:
        #         return jsonify({'success': False, 'message': 'Could not set up word cloud generation.'})
        #     else:
        #         return jsonify({'success': True, 'task_ids': [word_counts.id, word_counts.parent.id]})

class NgramView(APIView):
    '''
    Schedule a task to retrieve ngrams containing the search term
    '''

    def post(self, request, *args, **kwargs):
        return Response(None)
        # TODO: ngram view
        # if not request.json:
        #     abort(400)
        # else:
        #     ngram_counts_task = tasks.get_ngram_data.delay(request.json)
        #     if not ngram_counts_task:
        #         return jsonify({'success': False, 'message': 'Could not set up ngram generation.'})
        #     else:
        #         return jsonify({'success': True, 'task_ids': [ngram_counts_task.id ]})

class DateTermFrequencyView(APIView):
    '''
    Schedule a task to retrieve term frequency
    compared by a date field
    '''

    def post(self, request, *args, **kwargs):
        return Response(None)
        # TODO: date term frequency task view
        # if not request.json:
        #     abort(400)

        # for key in ['es_query', 'corpus_name', 'field_name', 'bins']:
        #     if not key in request.json:
        #         abort(400)

        # for bin in request.json['bins']:
        #     for key in ['start_date', 'end_date', 'size']:
        #         if not key in bin:
        #             abort(400)

        # group = tasks.timeline_term_frequency_tasks(request.json).apply_async()
        # subtasks = group.children
        # if not tasks:
        #     return jsonify({'success': False, 'message': 'Could not set up term frequency generation.'})
        # else:
        #     return jsonify({'success': True, 'task_ids': [task.id for task in subtasks]})


class AggregateTermFrequencyView(APIView):
    '''
    Schedule a task to retrieve term frequency
    compared by a keyword field
    '''

    def post(self, request, *args, **kwargs):
        return Response(None)
        # TODO: aggregate term frequency task view
        # if not request.json:
        #     abort(400)

        # for key in ['es_query', 'corpus_name', 'field_name', 'bins']:
        #     if not key in request.json:
        #         abort(400)

        # for bin in request.json['bins']:
        #     for key in ['field_value', 'size']:
        #         if not key in bin:
        #             abort(400)

        # group = tasks.histogram_term_frequency_tasks(request.json).apply_async()
        # subtasks = group.children
        # if not tasks:
        #     return jsonify({'success': False, 'message': 'Could not set up term frequency generation.'})
        # else:
        #     return jsonify({'success': True, 'task_ids': [task.id for task in subtasks]})

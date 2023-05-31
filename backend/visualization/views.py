from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import APIException, ParseError
from visualization import tasks
import logging
from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from addcorpus.permissions import CorpusAccessPermission
from api.utils import check_json_keys

logger = logging.getLogger()

class WordcloudView(APIView):
    '''
    Most frequent terms for a small batch of results
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def post(self, request, *args, **kwargs):
        check_json_keys(request, ['corpus', 'es_query', 'field', 'size'])
        wordcloud_limit = settings.WORDCLOUD_LIMIT
        if request.data['size'] > wordcloud_limit:
            raise ParseError(detail=f'size exceeds {wordcloud_limit} documents')

        try:
            word_counts = tasks.get_wordcloud_data(request.data) # no need to run async: we will use the result directly
            return Response(word_counts)
        except Exception as e:
            logger.error(e)
            raise APIException(detail='could not generate word cloud data')

class WordcloudTaskView(APIView):
    '''
    Schedule a task to retrieve the word cloud
    for a large number of results
    '''

    def post(self, request, *args, **kwargs):
        # This view is not used but maintained in case
        # we re-introduce this functionality

        try:
            word_counts_task = tasks.get_wordcloud_data.delay(request.data)
            return Response({
                'task_ids': [word_counts_task.id, word_counts_task.parent.id]
            })
        except:
            raise APIException('Could not set up word cloud generation')

class NgramView(APIView):
    '''
    Schedule a task to retrieve ngrams containing the search term
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def post(self, request, *args, **kwargs):
        check_json_keys(request, [
            'es_query', 'corpus_name', 'field', 'ngram_size', 'term_position',
            'freq_compensation', 'subfield', 'max_size_per_interval',
            'number_of_ngrams', 'date_field'
        ])

        try:
            ngram_counts_task = tasks.get_ngram_data.delay(request.data)
            return Response({
                'task_ids': [ngram_counts_task.id]
            })
        except Exception as e:
            logger.error(e)
            raise APIException(detail='Could not set up ngram generation.')

class DateTermFrequencyView(APIView):
    '''
    Schedule a task to retrieve term frequency
    compared by a date field
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def post(self, request, *args, **kwargs):
        check_json_keys(request, ['es_query', 'corpus_name', 'field_name', 'bins'])

        for bin in request.data['bins']:
            for key in ['start_date', 'end_date', 'size']:
                if not key in bin:
                    raise ParseError(detail=f'key {key} is not present for all bins in request data')

        try:
            group = tasks.timeline_term_frequency_tasks(request.data).apply_async()
            subtasks = group.children
            return Response({'task_ids': [task.id for task in subtasks]})
        except Exception as e:
            logger.error(e)
            raise APIException('Could not set up term frequency generation.')


class AggregateTermFrequencyView(APIView):
    '''
    Schedule a task to retrieve term frequency
    compared by a keyword field
    '''

    def post(self, request, *args, **kwargs):
        check_json_keys(request, ['es_query', 'corpus_name', 'field_name', 'bins'])

        for bin in request.data['bins']:
            for key in ['field_value', 'size']:
                if not key in bin:
                    raise ParseError(detail=f'key {key} is not present for all bins in request data')

        try:
            group = tasks.histogram_term_frequency_tasks(request.data).apply_async()
            subtasks = group.children
            return Response({'task_ids': [task.id for task in subtasks]})
        except Exception as e:
            logger.error(e)
            raise APIException('Could not set up term frequency generation.')

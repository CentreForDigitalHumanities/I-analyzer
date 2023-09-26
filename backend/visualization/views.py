from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import APIException, ParseError
from visualization import tasks
import logging
from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from addcorpus.permissions import CorpusAccessPermission
from tag.permissions import CanSearchTags
from visualization.field_stats import report_coverage
from addcorpus.permissions import corpus_name_from_request
from api.utils import check_json_keys
from tag.filter import handle_tags_in_request

logger = logging.getLogger()



class WordcloudView(APIView):
    '''
    Most frequent terms for a small batch of results
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission, CanSearchTags]

    def post(self, request, *args, **kwargs):
        check_json_keys(request, ['corpus', 'es_query', 'field', 'size'])
        wordcloud_limit = settings.WORDCLOUD_LIMIT
        if request.data['size'] > wordcloud_limit:
            raise ParseError(
                detail=f'size exceeds {wordcloud_limit} documents')

        try:
            handle_tags_in_request(request)
            # no need to run async: we will use the result directly
            word_counts = tasks.get_wordcloud_data(request.data)
            return Response(word_counts)
        except Exception as e:
            logger.error(e)
            raise APIException(detail='could not generate word cloud data')


class NgramView(APIView):
    '''
    Schedule a task to retrieve ngrams containing the search term
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission, CanSearchTags]

    def post(self, request, *args, **kwargs):
        check_json_keys(request, [
            'es_query', 'corpus_name', 'field', 'ngram_size', 'term_position',
            'freq_compensation', 'subfield', 'max_size_per_interval',
            'number_of_ngrams', 'date_field'
        ])

        try:
            handle_tags_in_request(request)
            chord = tasks.ngram_data_tasks(request.data)
            subtasks = [chord, *chord.parent.children]
            return Response({'task_ids': [task.id for task in subtasks]})
        except Exception as e:
            logger.error(e)
            raise APIException(detail='Could not set up ngram generation.')


class DateTermFrequencyView(APIView):
    '''
    Schedule a task to retrieve term frequency
    compared by a date field
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission, CanSearchTags]

    def post(self, request, *args, **kwargs):
        check_json_keys(
            request, ['es_query', 'corpus_name', 'field_name', 'bins'])

        for bin in request.data['bins']:
            for key in ['start_date', 'end_date', 'size']:
                if not key in bin:
                    raise ParseError(
                        detail=f'key {key} is not present for all bins in request data')

        try:
            handle_tags_in_request(request)
            group = tasks.timeline_term_frequency_tasks(
                request.data).apply_async()
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

    permission_classes = [IsAuthenticated, CorpusAccessPermission, CanSearchTags]

    def post(self, request, *args, **kwargs):
        check_json_keys(
            request, ['es_query', 'corpus_name', 'field_name', 'bins'])

        for bin in request.data['bins']:
            for key in ['field_value', 'size']:
                if not key in bin:
                    raise ParseError(
                        detail=f'key {key} is not present for all bins in request data')

        try:
            handle_tags_in_request(request)
            group = tasks.histogram_term_frequency_tasks(
                request.data).apply_async()
            subtasks = group.children
            return Response({'task_ids': [task.id for task in subtasks]})
        except Exception as e:
            logger.error(e)
            raise APIException('Could not set up term frequency generation.')


class FieldCoverageView(APIView):
    '''
    Get the coverage of each field in a corpus
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def get(self, request, *args, **kwargs):
        corpus = corpus_name_from_request(request)
        report = report_coverage(corpus)
        return Response(report)

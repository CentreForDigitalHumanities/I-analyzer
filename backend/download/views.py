from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from ianalyzer.exceptions import NotImplemented
from rest_framework.viewsets import ModelViewSet
from download.serializers import DownloadSerializer
from download.models import Download
from django.http.response import FileResponse
from django.conf import settings
from download import convert_csv, tasks
import os
from rest_framework.exceptions import ValidationError, APIException
from es import download as es_download
from rest_framework.permissions import IsAuthenticated
from addcorpus.permissions import CorpusAccessPermission, corpus_name_from_request
import logging

logger = logging.getLogger()

class ResultsDownloadView(APIView):
    '''
    Download search results up to 1.000 documents
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def post(self, request, *args, **kwargs):
        for key in ['es_query', 'corpus', 'fields', 'route', 'encoding']:
            if key not in request.data:
                raise ValidationError(detail=f'Download failed: specification for {key} is missing')

        max_size = 1000
        size = request.data.get('size', max_size)

        if size > max_size:
            raise ValidationError(detail='Download failed: too many documents requested')

        try:
            corpus = corpus_name_from_request(request)
            search_results = es_download.normal_search(corpus, request.data['es_query'], request.data['size'])
            csv_path = tasks.make_csv(search_results, request.data)
            directory, filename = os.path.split(csv_path)
            converted_filename = convert_csv.convert_csv(directory, filename, 'search_results', request.data['encoding'])
            csv_file = os.path.join(directory, converted_filename)
        except Exception as e:
            logger.error(e)
            raise APIException(detail = 'Download failed: could not generate csv file')

        return FileResponse(open(csv_file, 'rb'), filename=filename, as_attachment=True)


class ResultsDownloadTaskView(APIView):
    '''
    Schedule a task to download search results
    over 10.000 documents
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def post(self, request, *args, **kwargs):
        for key in ['es_query', 'corpus', 'fields', 'route']:
            if key not in request.data:
                raise ValidationError(detail=f'Download failed: specification for {key} is missing')

        if not request.user.email:
            return ValidationError(detail='Download failed: user email not known')

        # Celery task
        try:
            task_chain = tasks.download_search_results(request.data, request.user)
            result = task_chain.apply_async()
            return Response({'task_ids': [result.id, result.parent.id]})
        except Exception as e:
            logger.error(e)
            raise APIException(detail='Download failed: could not generate csv file')


class FullDataDownloadTaskView(APIView):
    '''
    Schedule a task to download the full data
    for a visualisation.
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def post(self, request, *args, **kwargs):
        for key in ['visualization', 'parameters', 'corpus']:
            if key not in request.data:
                raise ValidationError(detail=f'Download failed: specification for {key} is missing')

        visualization_type = request.data['visualization']
        known_visualisations = ['date_term_frequency', 'aggregate_term_frequency']
        if visualization_type not in known_visualisations:
            raise ValidationError(f'Download failed: unknown visualisation type "{visualization_type}"')

        try:
            task_chain = tasks.download_full_data(request.data, request.user)
            task_chain.apply_async()
            return Response({'task_ids': [task_chain.id]})
        except:
            raise APIException('Download failed: server error')


class DownloadHistoryViewset(ModelViewSet):
    '''
    Retrieve list of all the user's downloads
    '''

    serializer_class = DownloadSerializer

    def get_queryset(self):
        return self.request.user.downloads.all()


class FileDownloadView(APIView):
    '''
    Retrieve a CSV file saved in your download history
    '''

    def get(self, request, *args, **kwargs):
        id = kwargs.get('id')
        encoding = request.query_params.get('encoding', 'utf-8')
        format = request.query_params.get('format', None)

        record = Download.objects.get(id=id)
        directory = settings.CSV_FILES_PATH

        converted_filename = convert_csv.convert_csv(
            directory, record.filename, record.download_type, encoding, format)
        path = os.path.join(directory, converted_filename)

        return FileResponse(open(path, 'rb'), filename=record.filename, as_attachment=True)

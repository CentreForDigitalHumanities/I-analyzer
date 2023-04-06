import logging
import os

from addcorpus.models import Corpus
from addcorpus.permissions import (CorpusAccessPermission,
                                   corpus_name_from_request)
from django.conf import settings
from django.http.response import FileResponse
from download import convert_csv, tasks
from download.models import Download
from download.serializers import DownloadSerializer
from es import download as es_download
from rest_framework.exceptions import (APIException, NotFound,
                                       PermissionDenied, ValidationError)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

logger = logging.getLogger()

def send_csv_file(directory, filename, download_type, encoding, format=None):
    '''
    Perform final formatting and send a CSV file as a FileResponse
    '''
    converted_filename = convert_csv.convert_csv(
        directory, filename, download_type, encoding, format)
    path = os.path.join(directory, converted_filename)
    return FileResponse(open(path, 'rb'), filename=filename, as_attachment=True)

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
            corpus_name = corpus_name_from_request(request)
            corpus = Corpus.objects.get(name=corpus_name)
            search_results = es_download.normal_search(
                corpus_name, request.data['es_query'], request.data['size'])
            csv_path = tasks.make_csv(search_results, request.data)
            directory, filename = os.path.split(csv_path)
            # Create download for download history
            download = Download.objects.create(
                download_type='search_results', corpus=corpus, parameters=request.data, user=request.user)
            download.complete(filename=filename)
            return send_csv_file(directory, filename, 'search_results', request.data['encoding'])
        except Exception as e:
            logger.error(e)
            raise APIException(detail = 'Download failed: could not generate csv file')


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
            raise ValidationError(detail='Download failed: user email not known')

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
        except Exception as e:
            logger.error(e)
            raise APIException('Download failed: server error')


class DownloadHistoryViewset(ModelViewSet):
    '''
    Retrieve list of all the user's downloads
    '''

    serializer_class = DownloadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.request.user.downloads.all()


class FileDownloadView(APIView):
    '''
    Retrieve a CSV file saved in your download history
    '''

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        id = kwargs.get('id')
        encoding = request.query_params.get('encoding', 'utf-8')
        format = request.query_params.get('table_format', None)

        record = Download.objects.get(id=id)
        if not record.user == request.user:
            raise PermissionDenied(detail='User has no access to this download')

        directory = settings.CSV_FILES_PATH

        if not os.path.isfile(os.path.join(directory, record.filename)):
            raise NotFound(detail='File does not exist')

        return send_csv_file(directory, record.filename, record.download_type, encoding, format)

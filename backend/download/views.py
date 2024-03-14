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
from rest_framework.exceptions import (APIException, NotFound, ParseError,
                                       PermissionDenied)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from api.utils import check_json_keys
from api.api_query import api_query_to_es_query

logger = logging.getLogger()

def send_csv_file(download, directory, encoding, format=None):
    '''
    Perform final formatting and send a CSV file as a FileResponse
    '''
    converted_filename = convert_csv.convert_csv(
        directory, download.filename, download.download_type, encoding, format)
    path = os.path.join(directory, converted_filename)

    return FileResponse(open(path, 'rb'), filename=download.descriptive_filename(), as_attachment=True)

class ResultsDownloadView(APIView):
    '''
    Download search results up to 1.000 documents
    '''

    permission_classes = [CorpusAccessPermission]

    def post(self, request, *args, **kwargs):
        check_json_keys(request, ['es_query', 'corpus', 'fields', 'route', 'encoding'])
        try:
            corpus_name = corpus_name_from_request(request)
            corpus = Corpus.objects.get(name=corpus_name)
            max_size = corpus.configuration.direct_download_limit
            size = request.data.get('es_query').pop('size', max_size)
            if size > max_size:
                raise ParseError(
                    detail='Download failed: too many documents requested')

            user = request.user if request.user.is_authenticated else None
            download = Download.objects.create(
                download_type='search_results', corpus=corpus, parameters=request.data, user=user)
            csv_path = tasks.make_download(request.data, download.id, size)
            directory, filename = os.path.split(csv_path)
            # Create download for download history
            download.complete(filename=filename)
            return send_csv_file(download, directory, request.data['encoding'])
        except Exception as e:
            logger.error(e)
            raise APIException(
                detail='Download failed: could not generate csv file')


class ResultsDownloadTaskView(APIView):
    '''
    Schedule a task to download search results
    over 10.000 documents
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def post(self, request, *args, **kwargs):
        check_json_keys(request, ['es_query', 'corpus', 'fields', 'route'])

        if not request.user.email:
            raise APIException(detail='Download failed: user email not known')

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
        check_json_keys(request, ['visualization', 'parameters', 'corpus_name'])

        visualization_type = request.data['visualization']
        known_visualisations = ['date_term_frequency', 'aggregate_term_frequency', 'ngram']
        if visualization_type not in known_visualisations:
            raise ParseError(f'Download failed: unknown visualisation type "{visualization_type}"')

        try:
            task_chain = tasks.download_full_data(request.data, request.user)
            result = task_chain.apply_async()
            return Response({'task_ids': [result.id]})
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

        download = Download.objects.get(id=id)
        if not download.user == request.user:
            raise PermissionDenied(detail='User has no access to this download')

        directory = settings.CSV_FILES_PATH

        if not os.path.isfile(os.path.join(directory, download.filename)):
            raise NotFound(detail='File does not exist')

        return send_csv_file(download, directory, encoding, format)

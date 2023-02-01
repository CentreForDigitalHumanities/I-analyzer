from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from api.serializers import QuerySerializer
from rest_framework.permissions import IsAuthenticated
from ianalyzer.exceptions import NotImplemented
from rest_framework.exceptions import NotFound, ValidationError
import logging
from rest_framework.permissions import IsAuthenticated
from addcorpus.permissions import corpus_name_from_request, CorpusAccessPermission
from addcorpus.load_corpus import load_corpus
from django.http.response import FileResponse
import os

logger = logging.getLogger()

class QueryViewset(viewsets.ModelViewSet):
    '''
    Access search history
    '''

    permission_classes = [IsAuthenticated]
    serializer_class = QuerySerializer

    def get_queryset(self):
        return self.request.user.queries.all()

class TaskStatusView(APIView):
    '''
    Get the status of an array of backend tasks (working/done/failed),
    and the results if they are complete
    '''

    def post(self, request, *args, **kwargs):
        # this a POST request because a list of requested IDs can make
        # the url too long

        return Response({
            'success': False,
            'message': 'Could not get data'
        })

        # TODO: get results from celery
        # task_ids = request.json.get('task_ids')
        # if not task_ids:
        #     abort(400, 'no task id specified')

        # results = [celery_app.AsyncResult(id=task_id) for task_id in task_ids]
        # if not all(results):
        #     return jsonify({'success': False, 'message': 'Could not get data.'})
        # else:
        #     if all(result.state == 'SUCCESS' for result in results):
        #         outcomes = [result.get() for result in results]
        #         return jsonify({'success': True, 'done': True, 'results': outcomes})
        #     elif all(result.state in ['PENDING', 'STARTED', 'SUCCESS'] for result in results):
        #         return jsonify({'success': True, 'done': False})
        #     else:
        #         for result in results:
        #             logger.error(result.info)
        #         return jsonify({'success': False, 'message': 'Task failed.'})

class AbortTasksView(APIView):
    '''
    Cancel backend tasks
    '''

    def post(self, request, *args, **kwargs):
        raise NotImplemented

        # TODO: cancel tasks
        # if not request.json:
        #     abort(400)
        # else:
        #     task_ids = request.json['task_ids']
        #     try:
        #         celery_app.control.revoke(task_ids, terminate=True)
        #     except Exception as e:
        #         current_app.logger.critical(e)
        #         return jsonify({'success': False})
        #     return jsonify({'success': True})

class GetMediaView(APIView):
    '''
    Return the image/pdf of a document
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def get(self, request, *args, **kwargs):
        corpus_name = corpus_name_from_request(request)

        if not 'image_path' in request.query_params:
            raise ValidationError(detail='No image path provided')

        image_path = request.query_params['image_path']
        corpus = load_corpus(corpus_name)

        if len(request.query_params)>2:
            # there are more arguments, currently used for pdf retrieval only
            try:
                out = corpus.get_media(request.query_params)
            except Exception as e:
                logger.error(e)
                raise ValidationError()
            if not out:
                raise NotFound()

            return FileResponse(open(out, 'rb'), filename='scan.pdf', as_attachment=True, content_type='application/pdf')
        else:
            path = os.path.join(corpus.data_directory, image_path)
            if not os.path.isfile(path):
                raise NotFound()
            else:
                _, filename = os.path.split(image_path)
                return FileResponse(open(path, 'rb'), filename=filename, as_attachment=True, content_type=corpus.scan_image_type)


class MediaMetadataView(APIView):
    '''
    Return metadata on the media for a document
    '''

    permission_classes = [IsAuthenticated, CorpusAccessPermission]

    def post(self, request, *args, **kwargs):
        corpus_name = corpus_name_from_request(request)
        corpus = load_corpus(corpus_name)
        if not 'document' in request.data:
            raise ValidationError(detail='no document specified')
        data = corpus.request_media(request.data['document'])
        logger.info(data)
        if 'media' not in data or len(data['media'])==0:
            raise NotFound(detail='this document has no associated media')
        else:
            return Response(data)


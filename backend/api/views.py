from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from api.serializers import QuerySerializer
from django.http.response import HttpResponseServerError
from ianalyzer.exceptions import NotImplemented

class QueryViewset(viewsets.ModelViewSet):
    '''
    Access search history
    '''

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
    Concerns image/pdf versions of documents.
    Exact purpose unknown.
    '''

    def get(self, request, *args, **kwargs):
        raise NotImplemented

        # corpus_index = request.args['corpus']
        # image_path = request.args['image_path']
        # backend_corpus = load_corpus(corpus_index)
        # if not corpus_index in [corpus.name for corpus in current_user.role.corpora]:
        #     abort(403)
        # if len(list(request.args.keys()))>2:
        #     # there are more arguments, currently used for pdf retrieval only
        #     try:
        #         out = backend_corpus.get_media(request.args)
        #     except Exception as e:
        #         current_app.logger.error(e)
        #         abort(400)
        #     if not out:
        #         abort(404)
        #     response = make_response(send_file(out, attachment_filename="scan.pdf", as_attachment=True, mimetype=backend_corpus.scan_image_type))
        #     return response
        # else:
        #     absolute_path = join(backend_corpus.data_directory, image_path)
        #     if not isfile(absolute_path):
        #         abort(404)
        #     else:
        #         return send_file(absolute_path, mimetype=backend_corpus.scan_image_type, as_attachment=True)


class RequestMediaView(APIView):
    '''
    Concerns image/pdf versions of documents.
    Exact purpose unknown.
    '''

    def post(self, request, *args, **kwargs):
        raise NotImplemented

        # if not request.json:
        #     abort(400)
        # corpus_index = request.json['corpus_index']
        # backend_corpus = load_corpus(corpus_index)
        # if not corpus_index in [corpus.name for corpus in current_user.role.corpora]:
        #     abort(403)
        # else:
        #     data = backend_corpus.request_media(request.json['document'])
        #     current_app.logger.info(data)
        #     if 'media' not in data or len(data['media'])==0:
        #         return jsonify({'success': False})
        #     data['success'] = True
        #     return jsonify(data)


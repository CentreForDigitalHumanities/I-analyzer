from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from api.serializers import QuerySerializer
from django.http.response import HttpResponseServerError

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
        return HttpResponseServerError('not implemented')

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


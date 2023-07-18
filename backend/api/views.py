from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from api.serializers import QuerySerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import APIException
import logging
from api.utils import check_json_keys
from celery import current_app as celery_app

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

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # this a POST request because a list of requested IDs can make
        # the url too long

        check_json_keys(request, ['task_ids'])
        task_ids = request.data['task_ids']

        results = [celery_app.AsyncResult(id=task_id) for task_id in task_ids]
        if not all(results):
            raise APIException(detail='Could not get task data')

        # all tasks finished
        if all(result.state == 'SUCCESS' for result in results):
            outcomes = [result.get() for result in results]
            return Response({
                'status': 'done',
                'results': outcomes
            })

        # no failed tasks, but not all finished
        if all(result.state in ['PENDING', 'STARTED', 'SUCCESS'] for result in results):
            return Response({'status': 'working'})

        # some tasks failed
        for result in results:
            logger.error(result.info)
        return Response({'status': 'failed'})

class AbortTasksView(APIView):
    '''
    Cancel backend tasks
    '''

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        check_json_keys(request, ['task_ids'])
        task_ids = request.data['task_ids']
        try:
            celery_app.control.revoke(task_ids, terminate=True)
            return Response({'success': True})
        except Exception as e:
            logger.critical(e)
            raise APIException()

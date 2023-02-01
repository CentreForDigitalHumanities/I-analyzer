from django.urls import path
from api.views import *

urlpatterns = [
    path('task_status', TaskStatusView.as_view()),
    path('abort_tasks', AbortTasksView.as_view()),
    path('get_media', GetMediaView.as_view()),
    path('request_media', MediaMetadataView.as_view()),
]

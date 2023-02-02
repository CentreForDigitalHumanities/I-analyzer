from django.urls import path
from media.views import *

urlpatterns = [
    path('get_media', GetMediaView.as_view(), name='get-media'),
    path('request_media', MediaMetadataView.as_view()),
]

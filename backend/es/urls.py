from django.urls import path
from es.views import *

urlpatterns = [
    path('<str:corpus>/_search', ForwardSearchView.as_view()),
]

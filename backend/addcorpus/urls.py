from django.urls import path
from addcorpus.views import *

urlpatterns = [
    path('', CorpusView.as_view()),
    path('image/<str:corpus>/<str:image_name>', CorpusImageView.as_view()),
    path('documentation/<str:corpus>/<str:documentation_file>', CorpusDocumentationView.as_view())
]

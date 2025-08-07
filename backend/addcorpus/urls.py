from django.urls import path
from addcorpus.views import (
    CorpusImageView, CorpusView, CorpusDocumentView, CorpusDefinitionSchemaView
)

urlpatterns = [
    path('', CorpusView.as_view({'get': 'list'})),
    path('image/<str:corpus>', CorpusImageView.as_view()),
    path('document/<str:corpus>/<str:filename>', CorpusDocumentView.as_view()),
    path('definition-schema', CorpusDefinitionSchemaView.as_view()),
]

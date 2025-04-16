from django.urls import path
from wordmodels.views import *

urlpatterns = [
    path('related_words', RelatedWordsView.as_view()),
    path('similarity_over_time', SimilarityView.as_view()),
    path('word_in_models', WordInModelView.as_view()),
    path('local_graph', LocalGraphView.as_view()),
]

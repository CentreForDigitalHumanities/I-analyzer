from django.urls import path
from wordmodels.views import *

urlpatterns = [
    path('related_words', RelatedWordsView.as_view()),
    path('similarity_over_time', SimilarityView.as_view()),
    path('documentation', DocumentationView.as_view()),
    path('word_in_models', WordInModelView.as_view()),
]

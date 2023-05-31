from django.urls import path
from wordmodels.views import *

urlpatterns = [
    path('related_words', RelatedWordsView.as_view()),
    path('similarity_over_time', SimilarityView.as_view()),
    path('documentation', DocumentationView.as_view()),
    path('word_in_model', WordInModelView.as_view()),
]

from django.urls import path
from visualization.views import *

urlpatterns = [
    path('wordcloud', WordcloudView.as_view()),
    path('wordcloud_task', WordcloudTaskView.as_view()),
    path('ngram', NgramView.as_view()),
    path('date_term_frequency', DateTermFrequencyView.as_view()),
    path('aggregate_term_frequency', AggregateTermFrequencyView.as_view()),
    path('coverage/<str:corpus>', FieldCoverageView.as_view())
]

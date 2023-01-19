from django.urls import path
from addcorpus.views import CorpusView

urlpatterns = [
    path('', CorpusView.as_view())
]

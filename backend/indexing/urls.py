from django.urls import path
from indexing.views import IndexHealthView

urlpatterns = [
    path('health/<str:corpus>', IndexHealthView.as_view()),
]

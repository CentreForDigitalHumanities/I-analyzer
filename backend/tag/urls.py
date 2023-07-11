from django.urls import path
from .views import DocumentTagsView

urlpatterns = [
    path('document_tags/<str:corpus>/<str:doc_id>', DocumentTagsView.as_view())
]

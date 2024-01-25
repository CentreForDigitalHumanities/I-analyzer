from django.urls import path, re_path
from .views import DocumentTagsView

urlpatterns = [
    re_path(r'^document_tags/(?P<corpus>[A-Za-z\-_]+)/(?P<doc_id>.+)$', DocumentTagsView.as_view())
]

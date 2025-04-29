from rest_framework import permissions
from rest_framework.exceptions import NotFound
from rest_framework.request import Request
from django.db.models import Q

from addcorpus.models import Corpus, CorpusConfiguration


def corpus_name_from_request(request: Request):
    '''
    Extract the corpus name from a request
    '''
    # corpus name can be in kwargs, query params or data json...
    kwargs = request.parser_context['kwargs']
    query_params = request.query_params
    data_json = request.data
    # ... stored as 'corpus' or 'corpus_name'
    possible_corpus_specifications = (
        data.get('corpus', None) or data.get('corpus_name', None)
        for data in [kwargs, query_params, data_json]
    )
    # take the first value that is not None
    corpus = next(
        (corpus_name for corpus_name in possible_corpus_specifications if corpus_name),
        None
    )
    return corpus


def corpus_config_from_request(request: Request) -> CorpusConfiguration:
    corpus_name = corpus_name_from_request(request)
    return CorpusConfiguration.objects.get(corpus__name=corpus_name)


class CanSearchCorpus(permissions.BasePermission):
    message = 'You do not have permission to access this corpus'

    def has_permission(self, request, view):
        user = request.user
        corpus_name = corpus_name_from_request(request)

        # check if the corpus exists
        try:
            corpus = Corpus.objects.get(name=corpus_name)
        except:
            raise NotFound('Corpus does not exist')

        # check if the user has access
        return user.searchable_corpora().contains(corpus)


class CanEditCorpus(permissions.BasePermission):
    '''
    The user is permitted to use the corpus definition API.

    This requires that the user is an admin user. In addition, permission for an
    object requires that the user owns the corpus.

    For object permissions: the view may handle an object related to a corpus rather than
    the corpus object itself. Therefore, it must implement a method `corpus_from_object`,
    which fetches the corpus object for the request.
    '''

    message = 'You do not have permission to manage this corpus'

    def has_permission(self, request: Request, view):
        return request.user.is_staff

    def has_object_permission(self, request: Request, view, obj):
        user = request.user
        corpus = view.corpus_from_object(obj)
        return corpus.owners.contains(user)


class CanEditCorpusOrReadOnly(permissions.BasePermission):
    '''
    The user is permitted to edit the corpus, or it is a read-only request.
    '''

    message = 'You do not have permission to edit this corpus'

    def has_permission(self, request: Request, view):
        if self._is_safe_method(request):
            return True

        return request.user.is_staff

    def has_object_permission(self, request, view, obj):
        if self._is_safe_method(request):
            return True

        user = request.user
        corpus = view.corpus_from_object(obj)
        return corpus.owners.contains(user)

    def _is_safe_method(self, request: Request):
        return request.method in permissions.SAFE_METHODS


class CanSearchOrEditCorpus(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        user = request.user
        corpus = view.corpus_from_object(obj)

        return user.searchable_corpora().contains(corpus) or (
            user.is_staff and corpus.owners.contains(user)
        )

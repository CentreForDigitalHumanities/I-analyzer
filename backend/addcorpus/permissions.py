from rest_framework import permissions
from rest_framework.exceptions import NotFound
from users.models import CustomUser
from typing import List
from addcorpus.models import Corpus

def corpus_name_from_request(request):
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


def filter_user_corpora(corpora: List[Corpus], user: CustomUser) -> List[Corpus]:
    '''
    Filter all available corpora to only
    include the ones the user has access to
    '''

    return [
         corpus
         for corpus in corpora
         if user.has_access(corpus.name)
    ]


class CorpusAccessPermission(permissions.BasePermission):
    message = 'You do not have permission to access this corpus'

    def has_permission(self, request, view):
        user = request.user
        corpus_name = corpus_name_from_request(request)

        # check if the corpus exists
        try:
            corpus = Corpus.objects.get(name=corpus_name)
            assert corpus.ready_to_publish()
        except:
            raise NotFound('Corpus does not exist')

        # check if the user has access
        return user.has_access(corpus)

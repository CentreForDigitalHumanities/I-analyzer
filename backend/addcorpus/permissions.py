from rest_framework import permissions
from addcorpus.load_corpus import load_corpus
from rest_framework.exceptions import NotFound

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

class CorpusAccessPermission(permissions.BasePermission):
    message = 'You do not have permission to access this corpus'

    def has_permission(self, request, view):
        user = request.user
        corpus = corpus_name_from_request(request)

        # check if the corpus exists
        try:
            load_corpus(corpus)
        except:
            raise NotFound('Corpus does not exist')

        # check if the user has access
        return user.has_access(corpus)

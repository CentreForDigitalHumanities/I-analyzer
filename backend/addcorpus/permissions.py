from rest_framework import permissions
from addcorpus.load_corpus import load_corpus
from rest_framework.exceptions import NotFound

class CorpusAccessPermission(permissions.BasePermission):
    message = 'You do not have permission to access this corpus'

    def has_permission(self, request, view):
        user = request.user
        kwargs = request.parser_context['kwargs']
        data = request.data
        corpus = kwargs.get('corpus', None) or data.get('corpus', None) or data.get('corpus_name', None)

        # check if the corpus exists
        try:
            load_corpus(corpus)
        except:
            raise NotFound('Corpus does not exist')

        return user.has_access(corpus)

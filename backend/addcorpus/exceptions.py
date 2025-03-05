from addcorpus.models import Corpus


class PythonDefinitionRequired(Exception):
    '''
    Exception that can be raised when attempting to use functionality only applicable for
    Python corpora, on a corpus that does not have a Python definition.
    '''

    def __init__(self, corpus: Corpus, message: str, *args):
        self.corpus = corpus
        self.message = message
        super().__init__(*args)


    def __str__(self):
        return f'{self.message} (corpus: {self.corpus})'

class NoPythonDefinitionAllowed(Exception):
    '''
    Exception that can be raised when attempting to use functionality only applicable for
    database-only corpora, on a corpus with a Python definition.
    '''

    def __init__(self, corpus: Corpus, message: str, *args):
        self.corpus = corpus
        self.message = message
        super().__init__(*args)


    def __str__(self):
        return f'{self.message} (corpus: {self.corpus})'


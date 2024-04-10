from addcorpus.models import Corpus
from ianalyzer_readers.readers.core import Reader

from addcorpus.python_corpora.load_corpus import load_corpus_definition


def make_reader(corpus: Corpus) -> Reader:
    '''
    From a corpus, returns a Reader object that allows source extraction

    For Python corpora, simply loads the definition class,
    for JSON based corpora, construct Reader from the database.
    '''
    if corpus.has_python_definition:
        return load_corpus_definition(corpus.name)
    raise NotImplementedError('Only supports python corpora')

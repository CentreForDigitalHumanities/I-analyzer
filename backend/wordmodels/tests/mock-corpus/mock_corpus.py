import datetime
from addcorpus.corpus import Corpus, Field

from os.path import abspath, dirname, join

here = abspath(dirname(__file__))

class MockCorpus(Corpus):
    title = "Mock corpus with SVD_PPMI models"
    description = "Mock corpus for testing word models, saved as gensim Keyed Vectors"
    es_index = 'nothing'
    min_date = datetime.datetime(year=1810, month=1, day=1)
    max_date = datetime.datetime(year=1899, month=12, day=31)
    image = 'nothing.jpeg'
    data_directory = 'nothing'
    word_model_path = join(here, 'mock-word-models')
    fields = [
        Field(
            name = 'content',
        )
    ]

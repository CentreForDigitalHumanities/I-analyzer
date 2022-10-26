import datetime
from addcorpus.corpus import Corpus, Field

from os.path import abspath, dirname, join

here = abspath(dirname(__file__))

class MockWordVecCorpus(Corpus):
    title = "Mock corpus with word2vec models"
    description = "Mock corpus for testing Word2Vec models"
    es_index = 'nothing'
    min_date = datetime.datetime(year=1880, month=1, day=1)
    max_date = datetime.datetime(year=1939, month=12, day=31)
    image = 'nothing.jpeg'
    data_directory = 'nothing'
    word_model_path = join(here, 'word2vec')
    word_model_type = 'word2vec'
    fields = [
        Field(
            name = 'content',
        )
    ]

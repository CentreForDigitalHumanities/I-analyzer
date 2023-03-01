import datetime
import os

from addcorpus.corpus import Corpus

here = os.path.abspath(os.path.dirname(__file__))

class ExampleCorpus(Corpus):
    """Example corpus class for testing"""

    title = "Example"
    description = "Example corpus"
    es_index = 'nothing'
    min_date = datetime.datetime(year=1, month=1, day=1)
    max_date = datetime.datetime(year=2022, month=12, day=31)
    image = 'nothing.jpeg'
    data_directory = '/data'
    field_entry = 'character'

    fields = []

class ExampleCorpusWithWordModels(ExampleCorpus):
    word_model_path = here

def test_word_models_present():
    corpus = ExampleCorpus()
    assert corpus.word_models_present == False

    corpus_with_word_models = ExampleCorpusWithWordModels()
    assert corpus_with_word_models.word_models_present == True

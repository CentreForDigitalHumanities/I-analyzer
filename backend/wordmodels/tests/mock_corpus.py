import datetime
from addcorpus.corpus import Corpus, Field

class MockCorpus(Corpus):
    title = "Mock corpus"
    description = "Mock corpus for testing word models"
    es_index = 'nothing'
    min_date = datetime.datetime(year=1, month=1, day=1)
    max_date = datetime.datetime(year=2022, month=12, day=31)
    image = 'nothing.jpeg'
    data_directory = 'nothing'
    word_models_present = True

    fields = [
        Field(
            name = 'content',
        )
    ]

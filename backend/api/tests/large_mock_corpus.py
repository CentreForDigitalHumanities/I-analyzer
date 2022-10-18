from datetime import datetime
from addcorpus.corpus import Corpus, Field
import random

TOTAL_DOCUMENTS = 11000

# some constants for generating data
MIN_YEAR = 1800
MAX_YEAR = 1900
WORDS = [ 'the', 'quick', 'brown', 'fox', 'jumped', 'over', 'the', 'lazy', 'dog' ]

def generate_date():
    year = random.randint(MIN_YEAR, MAX_YEAR)
    month = random.randint(1, 12)
    date = datetime(year = year, month = month, day = 1)
    return date.strftime('%Y-%m-%d')

def generate_text():
    tokens = random.sample(WORDS, 5)
    return ' '.join(tokens)

class LargeMockCorpus(Corpus):
    '''
    For testing the download limit: a mock corpus that contains over
    10.000 documents.
    '''

    title = 'Large mock Corpus'
    description = 'Corpus for testing'
    visualize = []
    min_date = datetime(year=1800, month=1, day=1)
    max_date = datetime(year=1899, month=12, day=31)
    es_index = 'large-mock-corpus'
    image = 'test.jpeg'
    data_directory = 'bogus'

    def sources(self, start=min_date, end=max_date):
        return range(TOTAL_DOCUMENTS)

    def source2dicts(self, source):
        return [{
            'date': generate_date(),
            'content': generate_text()
        }]

    date = Field(
        name = 'date',
        es_mapping = {
            'type': 'date',
        }
    )

    content = Field(
        name = 'content',
        es_mapping = {
            'type': 'text'
        }
    )

    fields = [date, content]

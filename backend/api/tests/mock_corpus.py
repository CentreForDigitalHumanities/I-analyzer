from datetime import datetime
from addcorpus.corpus import Corpus, Field

# Fake corpus class for unit tests

class MockCorpus(Corpus):
    title = 'Mock Corpus'
    description = 'Corpus for testing'
    visualize = []
    min_date = datetime(year=1900, month=1, day=1)
    max_date = datetime(year=1999, month=12, day=31)
    image = 'test.jpeg'
    data_directory = 'bogus'
    
    date = Field(
        name = 'date',
        es_mapping = {
            'type': 'date',
        }
    )

    content = Field(
        name = 'content',
        es_mapping = {
            'type': 'text',
        }
    )

    content_deluxe = Field(
        name = 'content_deluxe',
        es_mapping= {
            'type': 'text',
            "fields": {
                "clean": {
                    "type": "text",
                },
                "stemmed": {
                    "type": "text",
                },
                "length": {
                    "type": "token_count",
                }
            }
        }
    )

    genre = Field(
        name = 'genre',
        es_mapping= {
            'type': 'keyword'
        }
    )

    fields = [date, content, content_deluxe, genre]

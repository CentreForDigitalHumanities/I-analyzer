from enum import Enum

CATEGORIES = [
    ('newspaper', 'Newspapers'),
    ('parliament', 'Parliamentary debates'),
    ('periodical', 'Periodicals'),
    ('finance', 'Financial reports'),
    ('ruling', 'Court rulings'),
    ('review', 'Online reviews'),
    ('inscription', 'Funerary inscriptions'),
    ('oration', 'Orations'),
    ('book', 'Books'),
]
'''
Types of data
'''

class MappingType(Enum):
    'Elasticsearch mapping types that are implemented in I-analyzer'

    TEXT = 'text'
    KEYWORD = 'keyword'
    DATE = 'date'
    INTEGER  = 'integer'
    FLOAT = 'float'
    BOOLEAN = 'boolean'


class VisualizationType(Enum):
    '''Types of visualisations available'''

    RESULTS_COUNT = 'resultscount'
    TERM_FREQUENCY = 'termfrequency'
    NGRAM = 'ngram'
    WORDCLOUD = 'wordcloud'

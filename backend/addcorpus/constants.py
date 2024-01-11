from enum import Enum

CATEGORIES = [
    ('parliament', 'Parliamentary debates'),
    ('periodical', 'Newspapers and other periodicals'),
    ('finance', 'Financial reports'),
    ('ruling', 'Court rulings'),
    ('review', 'Online reviews'),
    ('inscription', 'Funerary inscriptions'),
    ('oration', 'Orations'),
    ('book', 'Books'),
    ('informative', 'Informative'),
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
    GEO_POINT = 'geo_point'


class VisualizationType(Enum):
    '''Types of visualisations available'''

    RESULTS_COUNT = 'resultscount'
    TERM_FREQUENCY = 'termfrequency'
    NGRAM = 'ngram'
    WORDCLOUD = 'wordcloud'

FORBIDDEN_FIELD_NAMES = [
    'query',
    'fields',
    'sort',
    'highlight',
    'visualize',
    'visualizedField',
    'normalize',
    'ngramSettings'
]
'''
Field names that cannot be used because they are also query parameters in frontend routes.

Using them would make routing ambiguous.
'''

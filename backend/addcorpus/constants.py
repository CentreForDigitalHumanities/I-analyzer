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
    DATE_RANGE = 'date_range'
    INTEGER  = 'integer'
    FLOAT = 'float'
    BOOLEAN = 'boolean'
    GEO_POINT = 'geo_point'
    ANNOTATED_TEXT = 'annotated_text'


class VisualizationType(Enum):
    '''Types of visualisations available'''

    RESULTS_COUNT = 'resultscount'
    TERM_FREQUENCY = 'termfrequency'
    NGRAM = 'ngram'
    WORDCLOUD = 'wordcloud'
    MAP = 'map'

FORBIDDEN_FIELD_NAMES = [
    'query',
    'fields',
    'sort',
    'highlight',
    'visualize',
    'visualizedField',
    'normalize',
    'ngramSettings',
    'scan',
    'tab-scan'
    'p',
    'tags',
    'context',
    'tab',
]
'''
Field names that cannot be used because they interfere with other functionality.

This is usually because they are also query parameters in frontend routes, and using them
would make routing ambiguous.

`query` is also forbidden because it is a reserved column in CSV downloads. Likewise,
`context` is forbidden because it's used in download requests.

`scan` and `tab-scan` are added because they interfere with element IDs in the DOM.
'''

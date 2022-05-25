from datetime import datetime

MIN_DATE = datetime(year=1800, month=1, day=1)
MAX_DATE = datetime(year=2021, month=12, day=31)

BASIC_KEYWORD_MAPPING = {
    'type': 'keyword',
    'fields': {
        'length': {
            'type': 'token_count',
            'analyzer': 'standard'
        }
    }
}

BASIC_TEXT_MAPPING = {
    'type': 'text',
    'fields': {
        'length': {
            'type': 'token_count',
            'analyzer': 'standard'
        }
    }
}
from datetime import datetime

MIN_DATE = datetime(year=1800, month=1, day=1)
MAX_DATE = datetime(year=2021, month=12, day=31)

BASIC_KEYWORD_MAPPING = {
    'type': 'keyword'
}

BASIC_TEXT_MAPPING = {
    'type': 'text'
}

def document_context():
    return {
        'context_fields': ['debate_id'],
        'sort_field': 'sequence',
        'sort_direction': 'asc',
        'context_display_name': 'debate'
    }

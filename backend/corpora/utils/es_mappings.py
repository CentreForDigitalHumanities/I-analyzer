BASIC_KEYWORD_MAPPING = {
    'type': 'keyword'
}

BASIC_TEXT_MAPPING = {
    'type': 'text'
}

BASIC_DATE_MAPPING = {
    'type': 'date', 'format': 'yyyy-MM-dd'
}

MULTIFIELD_MAPPING = {
    "type" : "text",
    "fields": {
        "clean": {
            "type": "text",
            "analyzer": "clean",
            "term_vector": "with_positions_offsets"
        },
        "stemmed": {
            "type": "text",
            "analyzer": "stemmed",
            "term_vector": "with_positions_offsets",
        },
        "length": {
            "type":     "token_count",
            "analyzer": "standard"
        }
    }
}

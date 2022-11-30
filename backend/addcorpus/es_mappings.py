def text_mapping():
    return {
        'type': 'text'
    }

def keyword_mapping():
    return {
        'type': 'keyword'
    }

def date_mapping(format='yyyy-MM-dd'):
    return {
        'type': 'date',
        'format': format
    }

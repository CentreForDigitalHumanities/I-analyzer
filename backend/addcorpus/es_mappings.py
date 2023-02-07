def main_content_mapping(token_counts = True, stopword_analysis = False, stemming_analysis = False):
    '''
    Mapping for the main content field. Options:

    - `token_counts`: enables aggregations for the total number of words. Used for relative term frequencies.
    - `stopword_analysis`: enables analysis using stopword removal. Requires setting a `clean` analyser in the `es_settings` of the corpus.
    - `stemming_analysis`: enables analysis using stemming. Requires a `stemmed` analyser in the `es_settings` for the corpus.
    '''

    mapping = {
        'type': 'text'
    }

    if any([token_counts, stopword_analysis, stemming_analysis]):
        multifields = {}
        if token_counts:
            multifields['length'] = {
                "type":     "token_count",
                "analyzer": "standard"
            }
        if stopword_analysis:
            multifields['clean'] = {
                "type": "text",
                "analyzer": "clean",
                "term_vector": "with_positions_offsets" # include character positions for highlighting
            }
        if stemming_analysis:
            multifields['stemmed'] = {
                "type": "text",
                "analyzer": "stemmed",
                "term_vector": "with_positions_offsets",
            }
        mapping['fields'] = multifields

    return mapping


def text_mapping():
    '''
    Mapping for text fields that are not the main content. Performs tokenisation and lowercasing for full-text
    search, but does not support other analysis options.
    '''

    return {
        'type': 'text'
    }

def keyword_mapping(enable_full_text_search = False):
    '''
    Mapping for keyword fields. Keyword fields allow filtering and histogram visualisations.

    They do not have full text search by default. Set `enable_full_text_search = True` if you want this field to be searchable as well as filterable.
    '''

    mapping = {
        'type': 'keyword'
    }
    if enable_full_text_search:
        mapping['fields'] = {
            'text': { 'type': 'text' },
        }

    return mapping

def date_mapping(format='yyyy-MM-dd'):
    return {
        'type': 'date',
        'format': format
    }

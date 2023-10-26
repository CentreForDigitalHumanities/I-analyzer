def main_content_mapping(token_counts=True, stopword_analyzer=None, stemming_analyzer=None, updated_highlighting=False):
    '''
    Mapping for the main content field. Options:

    - `token_counts`: enables aggregations for the total number of words. Used for relative term frequencies.
    - `stopword_analyzer`: enables analysis using stopword removal. Can be a string specifying `clean-{language}` analyser in the `es_settings` of the corpus, or True for `clean`
    - `stemming_analysis`: enables analysis using stemming. Can be a string specifying a `stemmed-{}` analyser in the `es_settings` for the corpus, or Truem for `stemmed`
    - 'updated_highlighting': enables the new highlighter, which only works for fields that are indexed with the term vector set to 'with_positions_offsets'.
    '''

    mapping = {
        'type': 'text'
    }

    if updated_highlighting:
        mapping.update({
        'term_vector': 'with_positions_offsets' # include char positions on _source (in addition to the multifields) for highlighting
    })

    if any([token_counts, stopword_analyzer, stemming_analyzer]):
        multifields = {}
        if token_counts:
            multifields['length'] = {
                "type":     "token_count",
                "analyzer": "standard"
            }
        if stopword_analyzer:
            if type(stopword_analyzer)==bool:
                stopword_analyzer = 'clean'
            multifields['clean'] = {
                "type": "text",
                "analyzer": stopword_analyzer,
                "term_vector": "with_positions_offsets" # include character positions for highlighting
            }
        if stemming_analyzer:
            if type(stemming_analyzer)==bool:
                stemming_analyzer = 'stemmed'
            multifields['stemmed'] = {
                "type": "text",
                "analyzer": stemming_analyzer,
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

def int_mapping():
    return {
        'type': 'integer'
    }

def bool_mapping():
    return {'type': 'boolean'}

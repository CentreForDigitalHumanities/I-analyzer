import api.analyze as analyze
import pytest

TOTAL_WORDS_IN_MOCK_CORPUS = 67

def test_extract_data_for_term_frequency(test_app):
    highlight_specs, aggregators = analyze.extract_data_for_term_frequency('mock-corpus')

    # highlighter should look at text and keyword fields
    target_fields = ['title', 'content', 'genre']
    assert set(target_fields) == set(highlight_specs['fields'])

    # no .length multifield for all fields, so no aggregator
    assert aggregators == None

    # restrict the search field to one with token counts
    fields_with_token_counts = ['content']
    highlight_specs, aggregators = analyze.extract_data_for_term_frequency('mock-corpus', fields_with_token_counts)
    
    # highlighter should be restricted as well
    assert set(fields_with_token_counts) == set(highlight_specs['fields'])

    # token count aggregator should be included
    aggregators_target = {
        'token_count_content': {
            'sum': {
                'field': 'content.length'
            }
        }
    }
    assert aggregators == aggregators_target

def test_match_count(test_app, test_es_client):
    """Test counting matches of the search term"""

    if not test_es_client:
        pytest.skip('No elastic search client')

    frequencies = [
        ('Alice', 2), # 1 in alice in wonderland title, 1 in its content
        ('rejoice', 1), # 1 in content of frankenstein
        ('evil forebodings', 2), # multiword, each occurs once
        ('of', 5), # matches in multiple documents
        ('nomatches', 0),
    ]

    for text, freq in frequencies:
        query = make_query(query_text=text)
        highlight_specs, aggregators = analyze.extract_data_for_term_frequency('mock-corpus')
        match_count = analyze.get_match_count(test_es_client, query, 'mock-corpus', 100, highlight_specs)
        assert match_count == freq

def test_total_docs_and_tokens(test_app, test_es_client):
    """Test total document counter"""

    if not test_es_client:
        pytest.skip('No elastic search client')

    query = make_query()
    highlight_specs, aggregators = analyze.extract_data_for_term_frequency('mock-corpus', ['content'])
    doc_count, token_count = analyze.get_total_docs_and_tokens(test_es_client, query, 'mock-corpus', aggregators)
    assert doc_count == 3
    assert token_count == TOTAL_WORDS_IN_MOCK_CORPUS

def test_term_frequency(test_app, test_es_client):
    if not test_es_client:
        pytest.skip('No elastic search client')

    ## search in all fields
    query = make_query(query_text='Alice')
    match_count, doc_count, token_count = analyze.get_term_frequency(query, 'mock-corpus', 100)

    assert match_count == 2
    assert doc_count == 3
    assert token_count == None

    ## search in content (includes token count)
    query = make_query(query_text='Alice', search_in_fields=['content'])
    match_count, doc_count, token_count = analyze.get_term_frequency(query, 'mock-corpus', 100)

    assert match_count == 1
    assert doc_count == 3
    assert token_count == TOTAL_WORDS_IN_MOCK_CORPUS

def make_query(query_text=None, search_in_fields=None):
    query = {
        "query": {
            "bool": {
                "filter": []
            }
        }
    }

    if query_text:
        query['query']['bool']['must'] = {
            "simple_query_string": {
                "query": query_text,
                "lenient": True,
                "default_operator": "or"
            }
        }

        if search_in_fields:
            query['query']['bool']['must']['simple_query_string']['fields'] = search_in_fields  


    return query
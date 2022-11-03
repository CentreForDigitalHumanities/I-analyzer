import api.termvectors as termvectors
from es import search
import pytest

TITLE_WORDS = ['frankenstein', 'or', 'the', 'modern', 'prometheus']

def test_terms(termvectors_result):
    title_terms = termvectors.get_terms(termvectors_result, 'title')
    expected_terms = set(TITLE_WORDS)

    assert len(title_terms) == len(expected_terms)
    for term in expected_terms:
        assert term in title_terms

def test_tokens(termvectors_result):
    title_terms = termvectors.get_terms(termvectors_result, 'title')
    title_tokens = termvectors.get_tokens(title_terms, sort = True)

    assert len(title_tokens) == len(TITLE_WORDS)
    for token, expectation in zip(title_tokens, enumerate(TITLE_WORDS)):
        index, word = expectation
        assert token['position'] == index
        assert token['term'] == word
        assert token['ttf'] == 1 # title has no duplicate words

def test_find_matches(test_es_client, termvectors_result):
    if not test_es_client:
        pytest.skip('No elastic search client')

    title_terms = termvectors.get_terms(termvectors_result, 'title')
    title_tokens = termvectors.get_tokens(title_terms, sort = True)

    cases = [
        ('modern', 1),
        ('modern prometheus', 2),
        ('sdlkfjsdkgjd', 0),
        ('prometh*', 1),
        ('modern prometh*', 2),
        ('"modern prometheus"', 1),
        ('frankenstein "modern prometheus"', 2),
        ('frankenstein "mod* prometheus"', 1), # no wildcard support within exact match
        ('frankenstien~1', 1),
        ('fronkenstien~1', 0),
        ('fronkenstien~2', 1),
        ('fronkenstien~2 modern', 2),
    ]

    for query_text, expected_matches in cases:
        matches = list(termvectors.token_matches(title_tokens, query_text, 'ianalyzer-mock-corpus', 'title', test_es_client))
        assert len(matches) == expected_matches

QUERY_ANALYSIS_CASES = [
    {
        'query_text': 'rejoice',
        'components': ['rejoice'],
        'analyzed': [['rejoice']],
    }, {
        'query_text': 'evil forebodings',
        'components': ['evil', 'forebodings'],
        'analyzed': [['evil'], ['forebodings']],
    }, {
        'query_text': '"evil forebodings"',
        'components': ['evil forebodings'],
        'analyzed': [['evil', 'forebodings']]
    }, {
        'query_text': 'regarded with such "evil forebodings"',
        'components': ['regarded', 'with', 'such', 'evil forebodings'],
        'analyzed': [['regarded'], ['with'], ['such'], ['evil', 'forebodings']]
    }, {
        'query_text': 'evil + forebodings',
        'components': ['evil', '+', 'forebodings'],
        'analyzed': [['evil'], ['forebodings']]
    }, {
        'query_text':  'evil forebod*',
        'components': ['evil', 'forebod*'],
        'analyzed': [['evil'], ['forebod.*']]
    }, {
        'query_text': 'rejoice~1',
        'components': ['rejoice~1'],
        'analyzed': [['rejoice~1']]
    }, {
        'query_text': 'rejoice~1 to hear',
        'components': ['rejoice~1', 'to', 'hear'],
        'analyzed': [['rejoice~1'], ['to'], ['hear']]
    }
]

def test_query_components():
    for case in QUERY_ANALYSIS_CASES:
        components = termvectors.get_query_components(case['query_text'])
        assert sorted(components) == sorted(case['components']) # ignore order


def test_query_analysis(test_es_client):
    if not test_es_client:
        pytest.skip('No elastic search client')

    for case in QUERY_ANALYSIS_CASES:
        analyzed = termvectors.analyze_query(case['query_text'], 'ianalyzer-mock-corpus', 'content.clean', test_es_client)
        assert sorted(analyzed) == sorted(case['analyzed'])


@pytest.fixture
def termvectors_result(test_app, test_es_client):
    if not test_es_client:
        pytest.skip('No elastic search client')

    frankenstein_query = {
        'query': {
            'match': {
                'title': 'Frankenstein'
            }
        }
    }
    result = search.search('mock-corpus', frankenstein_query, test_es_client)
    hit = search.hits(result)[0]
    id = hit['_id']

    termvectors_result = test_es_client.termvectors(
        index='ianalyzer-mock-corpus',
        id=id,
        term_statistics=True,
        fields = ['title', 'content']

    )

    return termvectors_result

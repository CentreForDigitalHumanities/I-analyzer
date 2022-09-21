import api.analyze as analyze
from es import search
import pytest
import api.query as query
from datetime import datetime

def make_filtered_query():
        empty_query = {
            "query": {
                "bool": {
                    "filter": []
                }
            }
        }
        datefilter = query.make_date_filter(max_date = datetime(year = 1820, month=12, day=31))
        return query.add_filter(empty_query, datefilter)


def test_wordcloud(test_app, test_es_client):
    query = {
        "query": {
            "match_all": {}
        },
    }

    result = search.search(
        corpus = 'mock-corpus',
        query_model = query,
        size = 10
    )

    documents = search.hits(result)

    target_unfiltered = [
        { 'key': 'the', 'doc_count': 2 },
        { 'key': 'you', 'doc_count': 2 },
        { 'key': 'that', 'doc_count': 2 },
        { 'key': 'with', 'doc_count': 1 },
        { 'key': 'will', 'doc_count': 1 },
        { 'key': 'wife', 'doc_count': 1 },
        { 'key': 'which', 'doc_count': 1 },
        { 'key': 'was', 'doc_count': 1 },
        { 'key': 'want', 'doc_count': 1 },
        { 'key': 'very', 'doc_count': 1 },
        { 'key': 'universally', 'doc_count': 1 },
        { 'key': 'truth', 'doc_count': 1 },
        { 'key': 'tired', 'doc_count': 1 },
        { 'key': 'such', 'doc_count': 1 },
        { 'key': 'sitting', 'doc_count': 1 },
        { 'key': 'sister', 'doc_count': 1 },
        { 'key': 'single', 'doc_count': 1 },
        { 'key': 'rejoice', 'doc_count': 1 },
        { 'key': 'regarded', 'doc_count': 1 },
        { 'key': 'possession', 'doc_count': 1 },
        { 'key': 'nothing', 'doc_count': 1 },
        { 'key': 'must', 'doc_count': 1 },
        { 'key': 'man', 'doc_count': 1 },
        { 'key': 'her', 'doc_count': 1 },
        { 'key': 'hear', 'doc_count': 1 },
        { 'key': 'having', 'doc_count': 1 },
        { 'key': 'have', 'doc_count': 1 },
        { 'key': 'has', 'doc_count': 1 },
        { 'key': 'good', 'doc_count': 1 },
        { 'key': 'get', 'doc_count': 1 },
        { 'key': 'fortune', 'doc_count': 1 },
        { 'key': 'forebodings', 'doc_count': 1 },
        { 'key': 'evil', 'doc_count': 1 },
        { 'key': 'enterprise', 'doc_count': 1 },
        { 'key': 'disaster', 'doc_count': 1 },
        { 'key': 'commencement', 'doc_count': 1 },
        { 'key': 'beginning', 'doc_count': 1 },
        { 'key': 'bank', 'doc_count': 1 },
        { 'key': 'and', 'doc_count': 1 },
        { 'key': 'alice', 'doc_count': 1 },
        { 'key': 'acknowledged', 'doc_count': 1 },
        { 'key': 'accompanied', 'doc_count': 1 }
    ]

    output = analyze.make_wordcloud_data(documents, 'content', 'mock-corpus')
    for item in target_unfiltered:
        term = item['key']
        doc_count = item['doc_count']
        match = next(hit for hit in output if hit['key'] == term)
        assert match
        assert doc_count == match['doc_count']

def test_wordcloud_filtered(test_app, test_es_client):
    """Test the word cloud on a query with date filter"""

    filtered_query = make_filtered_query()

    target_filtered = [
        {'key': 'accompanied', 'doc_count': 1},
        {'key': 'acknowledged', 'doc_count': 1},
        {'key': 'commencement', 'doc_count': 1},
        {'key': 'disaster', 'doc_count': 1},
        {'key': 'enterprise', 'doc_count': 1},
        {'key': 'evil', 'doc_count': 1},
        {'key': 'forebodings', 'doc_count': 1},
        {'key': 'fortune', 'doc_count': 1},
        {'key': 'good', 'doc_count': 1},
        {'key': 'has', 'doc_count': 1},
        {'key': 'have', 'doc_count': 1},
        {'key': 'hear', 'doc_count': 1},
        {'key': 'man', 'doc_count': 1},
        {'key': 'must', 'doc_count': 1},
        {'key': 'possession', 'doc_count': 1},
        {'key': 'regarded', 'doc_count': 1},
        {'key': 'rejoice', 'doc_count': 1},
        {'key': 'single', 'doc_count': 1},
        {'key': 'such', 'doc_count': 1},
        {'key': 'the', 'doc_count': 1},
        {'key': 'truth', 'doc_count': 1},
        {'key': 'universally', 'doc_count': 1},
        {'key': 'want', 'doc_count': 1},
        {'key': 'which', 'doc_count': 1},
        {'key': 'wife', 'doc_count': 1},
        {'key': 'will', 'doc_count': 1},
        {'key': 'with', 'doc_count': 1},
        {'key': 'you', 'doc_count': 2}
    ]

    result = search.search(
        corpus = 'mock-corpus',
        query_model = filtered_query,
        size = 10,
        client = test_es_client
    )

    documents = search.hits(result)
    output = analyze.make_wordcloud_data(documents, 'content', 'mock-corpus')
    print(output)

    for item in target_filtered:
        term = item['key']
        doc_count = item['doc_count']
        match = next(hit for hit in output if hit['key'] == term)
        assert match
        assert doc_count == match['doc_count']

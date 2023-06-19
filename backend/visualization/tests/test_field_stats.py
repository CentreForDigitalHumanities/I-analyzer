from visualization.field_stats import *

def test_count(mock_corpus, test_es_client, select_small_mock_corpus, index_mock_corpus, mock_corpus_specs):
    total_docs = mock_corpus_specs['total_docs']

    for field in mock_corpus_specs['fields']:
        count = count_field(test_es_client, mock_corpus, field)
        assert count == total_docs

    assert count_total(test_es_client, mock_corpus) == total_docs

def test_report(mock_corpus, test_es_client, select_small_mock_corpus, index_mock_corpus, mock_corpus_specs):
    report = report_coverage(mock_corpus)

    assert report == {
        'date': 1.0,
        'title': 1.0,
        'content': 1.0,
        'genre': 1.0,
    }

import csv
from visualization.tests.test_term_frequency import make_query
from download import tasks
import pytest

def test_timeline_full_data(mock_corpus, select_small_mock_corpus, index_mock_corpus, mock_corpus_specs):
    min_year = mock_corpus_specs['min_date'].year
    max_year = mock_corpus_specs['max_date'].year
    search_fields = [mock_corpus_specs['content_field']]
    full_data_parameters = [{
        'es_query': make_query(query_text = 'the', search_in_fields=search_fields),
        'corpus_name': mock_corpus,
        'field_name': 'date',
        'bins': [
            {
                'start_date': '{}-01-01'.format(year),
                'end_date': '{}-12-31'.format(year),
                'size': 10,
            }
            for year in range(min_year, max_year + 2)
       ],
        'unit': 'year'
    }]

    group = tasks.term_frequency_full_data_tasks(full_data_parameters, 'date_term_frequency')
    results = group.apply().get()
    filename = tasks.make_term_frequency_csv(results, full_data_parameters)

    with open(filename) as f:
        reader = csv.DictReader(f)
        rows = list(row for row in reader)

        expected_frequency = 2
        total_expectations = {
            'Total documents': mock_corpus_specs['total_docs'],
            'Term frequency': expected_frequency, # 2 hits per document
            'Relative term frequency (by # documents)': expected_frequency
        }

        for column, expected_total in total_expectations.items():
            total = sum(float(row[column] or 0) for row in rows)
            assert total == expected_total


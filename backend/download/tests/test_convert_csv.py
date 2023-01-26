import os
import pytest
import csv
from download import convert_csv
from download.tests.test_csv_results import result_csv_with_highlights, term_frequency_file

def assert_content_matches(file_1, encoding_1, file_2, encoding_2):
    '''Assert that the content of a file is unchanged after saving it with different encoding'''
    with open(file_1, 'r', encoding=encoding_1) as f:
        contents_1 = f.read()

    with open(file_2, 'r', encoding=encoding_2) as f:
        contents_2 = f.read()

    assert contents_1 == contents_2

@pytest.mark.parametrize('target_encoding', ['utf-8', 'utf-16'])
def test_encoding_conversion_results(csv_directory, mock_corpus, select_multilingual_mock_corpus, all_results_csv, target_encoding):
    converted = convert_csv.convert_csv(csv_directory, all_results_csv, 'search_results', encoding = target_encoding, )
    converted_path = os.path.join(csv_directory, converted)
    assert_content_matches(all_results_csv, 'utf-8', converted_path, target_encoding)

def test_conversion_with_highlights(csv_directory, result_csv_with_highlights):
    target_encoding = 'utf-16'
    converted = convert_csv.convert_csv(csv_directory, result_csv_with_highlights, 'search_results', encoding = target_encoding)
    converted_path = os.path.join(csv_directory, converted)

    assert_content_matches(result_csv_with_highlights, 'utf-8', converted_path, target_encoding)

@pytest.mark.parametrize('target_encoding', ['utf-8', 'utf-16'])
def test_encoding_conversion_term_frequency(csv_directory, term_frequency_file, target_encoding):
    converted = convert_csv.convert_csv(csv_directory, term_frequency_file, 'date_term_frequency', encoding = target_encoding)
    converted_path = os.path.join(csv_directory, converted)

    assert_content_matches(term_frequency_file, 'utf-8', converted_path, target_encoding)

wide_format_expected_data = [
    {
        'date': '1800',
        'Term frequency (test)': '3',
        'Relative term frequency (by # documents) (test)': '1.5',
        'Total documents': '2',
        'Relative term frequency (by # words) (test)': '0.3',
        'Total word count': '10',
        'Term frequency (test2)': '1',
        'Relative term frequency (by # documents) (test2)': '0.5',
        'Relative term frequency (by # words) (test2)': '0.1',
    }, {
        'date': '1801',
        'Term frequency (test)': '5',
        'Relative term frequency (by # documents) (test)': '1.25',
        'Total documents': '4',
        'Relative term frequency (by # words) (test)': '0.25',
        'Total word count': '20',
        'Term frequency (test2)': '3',
        'Relative term frequency (by # documents) (test2)': '0.75',
        'Relative term frequency (by # words) (test2)': '0.15',
    }
]

def test_wide_format(csv_directory, term_frequency_file):
    converted = convert_csv.convert_csv(csv_directory, term_frequency_file, 'date_term_frequency', format='wide')
    converted_path = os.path.join(csv_directory, converted)

    with open(converted_path, 'r') as f:
        reader = csv.DictReader(f)
        assert set(reader.fieldnames) == set(wide_format_expected_data[0].keys())

        for expected_row in wide_format_expected_data:
            row = next(reader)

            for column in expected_row:
                assert expected_row[column] == row[column]

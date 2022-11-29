from mock_corpora.mock_corpus_specs import CORPUS_SPECS
from es import download as es_download
from api import create_csv, convert_csv, tasks, download as api_download
from addcorpus.load_corpus import load_corpus
import csv
from ianalyzer.models import Download
import pytest
from flask import jsonify
from es.search import hits
import os

match_all = {
    "query": {
        "match_all": {}
    }
}
def test_no_donwnload_limit(any_indexed_mock_corpus):
    results, total = es_download.scroll(any_indexed_mock_corpus, match_all)
    docs_in_corpus = CORPUS_SPECS[any_indexed_mock_corpus]['total_docs']
    assert total == docs_in_corpus
    assert len(results) == docs_in_corpus

def test_download_limit(any_indexed_mock_corpus):
    limit = 2
    results, total = es_download.scroll(any_indexed_mock_corpus, match_all, download_size=limit)
    docs_in_corpus = CORPUS_SPECS[any_indexed_mock_corpus]['total_docs']
    assert total == docs_in_corpus
    assert len(results) == min(limit, docs_in_corpus)

def test_download_log(mock_user):
    assert mock_user.downloads == []

    parameters = {
        'es_query': match_all,
        'size': 2
    }
    id = api_download.store_download_started('search_results', 'mock-corpus', parameters, mock_user.id)
    download = Download.query.get(id)

    found_file = api_download.get_result_filename(id)
    assert found_file == None
    assert download.status == 'working'

    filename = 'result.csv'
    api_download.store_download_completed(id, filename)
    found_file = api_download.get_result_filename(id)
    assert found_file == filename
    assert download.status == 'done'
    assert mock_user.downloads == [download]

    # different download, mark as failed
    parameters = {
        'es_query': match_all,
        'size': 3
    }
    id = api_download.store_download_started('search_results', 'mock-corpus', parameters, mock_user.id)
    download_2 = Download.query.get(id)

    api_download.store_download_failed(id)
    assert download_2.status == 'error'
    assert mock_user.downloads == [download, download_2]


def test_download_serialization(mock_user):
    parameters = {
        'es_query': match_all,
        'size': 2
    }
    id = api_download.store_download_started('search_results', 'mock-corpus', parameters, mock_user.id)
    download = Download.query.get(id)
    api_download.store_download_completed(id, 'result.csv')

    serialised = download.serialize()
    response = jsonify(serialised)
    assert response

@pytest.fixture
def mock_es_result():
    return {
        "took": 42,
        "timed_out": "false",
        "hits": {
            "total": {
                "value": 3,
                "relation": "eq"
            },
            "max_score": 4.22,
            "hits": [
                {   "_index" : "parliament-netherlands",
                    "_type" : "_doc",
                    "_id": "nl.proc.ob.d.h-ek-19992000-552-587.1.19.1",
                    "_score" :  4.22,
                    "_source": {
                        "speech_id" : "nl.proc.ob.d.h-ek-19992000-552-587.1.19.1",
                        "speaker" : "Staatssecretaris Adelmund",
                        "speaker_id" : "nl.m.02500",
                        "role" : "Government",
                        "party" : "null",
                        "party_id" : "null",
                        "page" : "552-587",
                        "column" : "null",
                        "speech": "very long field"
                    },
                    "highlight" : {
                        "speech" : [
                            "Het gaat om een driehoek waarin <em>testen</em> en toetsen een",
                            "om de highlights te <em>testen</em>"
                        ]
                    }
                }
            ]
        }
    }

@pytest.fixture
def mock_route():
    return "parliament-netherlands_query=test"

@pytest.fixture
def mock_csv_fields():
    return ['speech']

@pytest.fixture()
def result_csv_with_highlights(test_app, mock_es_result, mock_route, mock_csv_fields):
    return create_csv.search_results_csv(hits(mock_es_result), mock_csv_fields, mock_route)

def test_create_csv(result_csv_with_highlights):
    counter = 0
    with open(result_csv_with_highlights) as f:
        csv_output = csv.DictReader(f, delimiter=';', quotechar='"')
        assert csv_output != None
        for row in csv_output:
            counter += 1
            assert 'speech' in row
        assert counter == 1

def test_format_route_to_filename():
    route = '/search/mock-corpus;query=test'
    request_json = { 'route': route }
    output = tasks.create_query(request_json)
    assert output == 'mock-corpus_query=test'

def all_results_csv(corpus):
    '''generate a results csv for a corpus based on a match_all query'''
    corpus_specs = CORPUS_SPECS[corpus]
    fields = corpus_specs['fields']

    request_json = {
        'corpus': corpus,
        'es_query': match_all,
        'fields': fields,
        'route': '/search/{};query=test'.format(corpus)
    }
    results = tasks.download_scroll(request_json)
    filename = tasks.make_csv(results, request_json)


    return filename, corpus_specs


def test_csv_fieldnames(indexed_mock_corpus):
    filename, corpus_specs = all_results_csv(indexed_mock_corpus)

    with open(filename) as csv_file:
        reader = csv.DictReader(csv_file, delimiter=';')
        assert set(reader.fieldnames) == set(corpus_specs['fields'] + ['query'])

def assert_result_csv_expectations(csv_path, expectations, delimiter=','):
    '''Check that a CSV contains the expected data. Parameters:

    - `csv_path`: path to csv file
    - `expectations`: list of dicts. Each item gives expectations for a row.
    '''
    with open(csv_path) as csv_file:
        reader = csv.DictReader(csv_file, delimiter=delimiter)
        rows = [row for row in reader]

        for i, expected_row in enumerate(expectations):
            for item in expected_row:
                assert rows[i][item] == expected_row[item]


def test_csv_contents(indexed_mock_corpus):
    '''Check the contents of the results csv for the basic mock corpus.'''

    filename, corpus_specs = all_results_csv(indexed_mock_corpus)

    expected = [{
        'date': '1818-01-01',
        'genre': "Science fiction",
        'title': "Frankenstein, or, the Modern Prometheus",
        'content': "You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings.",
    }, {
        'content': 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
    }]

    assert_result_csv_expectations(filename, expected, delimiter=';')

def test_csv_contents_multilingual(indexed_multilingual_mock_corpus):
    '''Check the contents of the multilingual corpus, which also contains some special characters. This hangs on the entire pipeline of

    - extracting data from a CSV source file
    - indexing in elasticsearch
    - querying elasticsearc
    - exporting results to csv

    and thus checks that none of these steps mess up diacritics.
    '''

    filename, corpus_specs = all_results_csv(indexed_multilingual_mock_corpus)

    expected = [{
        'language': 'Swedish',
        'content': 'Svenska är ett östnordiskt språk som talas av ungefär tio miljoner personer främst i Sverige där språket har en dominant ställning som huvudspråk, men även som det ena nationalspråket i Finland och som enda officiella språk på Åland. I övriga Finland talas det som modersmål framförallt i de finlandssvenska kustområdena i Österbotten, Åboland och Nyland. En liten minoritet svenskspråkiga finns även i Estland. Svenska är nära besläktat och i hög grad ömsesidigt begripligt med danska och norska. De andra nordiska språken, isländska och färöiska, är mindre ömsesidigt begripliga med svenska. Liksom de övriga nordiska språken härstammar svenskan från en gren av fornnordiska, vilket var det språk som talades av de germanska folken i Skandinavien.'
    }, {
        'language': 'German',
        'content': 'Das Deutsche ist eine plurizentrische Sprache, enthält also mehrere Standardvarietäten in verschiedenen Regionen. Ihr Sprachgebiet umfasst Deutschland, Österreich, die Deutschschweiz, Liechtenstein, Luxemburg, Ostbelgien, Südtirol, das Elsass und Lothringen sowie Nordschleswig. Außerdem ist Deutsch eine Minderheitensprache in einigen europäischen und außereuropäischen Ländern, z. B. in Rumänien und Südafrika sowie Nationalsprache im afrikanischen Namibia. Deutsch ist die meistgesprochene Muttersprache in der Europäischen Union (EU).'
    }]

    assert_result_csv_expectations(filename, expected, delimiter=';')



def test_csv_encoding(indexed_multilingual_mock_corpus):
    '''Assert that the results csv file matches utf-8 encoding'''

    filename, corpus_specs = all_results_csv(indexed_multilingual_mock_corpus)

    with open(filename, 'rb') as f:
        binary_contents = f.read()

    expected_sentence = 'Svenska är ett östnordiskt språk som talas av ungefär tio miljoner personer främst i Sverige där språket har en dominant ställning som huvudspråk'
    bytes = str.encode(expected_sentence, 'utf-8')

    assert bytes in binary_contents


mock_queries = ['test', 'test2']

mock_timeline_result = [
    {
        'query': 'test',
        'key': '1800-01-01',
        'key_as_string': '1800-01-01',
        'match_count': 3,
        'total_doc_count': 2,
        'token_count': 10
    }, {
        'query': 'test',
        'key': '1801-01-01',
        'key_as_string': '1801-01-01',
        'match_count': 5,
        'total_doc_count': 4,
        'token_count': 20
    }, {
        'query': 'test2',
        'key': '1800-01-01',
        'key_as_string': '1800-01-01',
        'match_count': 1,
        'total_doc_count': 2,
        'token_count': 10
    }, {
        'query': 'test2',
        'key': '1801-01-01',
        'key_as_string': '1801-01-01',
        'match_count': 3,
        'total_doc_count': 4,
        'token_count': 20
    }
]

mock_timeline_expected_data = [
    {
        'Query': 'test',
        'date': '1800',
        'Term frequency': '3',
        'Relative term frequency (by # documents)': '1.5',
        'Total documents': '2',
        'Relative term frequency (by # words)': '0.3',
        'Total word count': '10'
    }, {
        'Query': 'test',
        'date': '1801',
        'Term frequency': '5',
        'Relative term frequency (by # documents)': '1.25',
        'Total documents': '4',
        'Relative term frequency (by # words)': '0.25',
        'Total word count': '20'
    }, {
        'Query': 'test2',
        'date': '1800',
        'Term frequency': '1',
        'Relative term frequency (by # documents)': '0.5',
        'Total documents': '2',
        'Relative term frequency (by # words)': '0.1',
        'Total word count': '10'
    }, {
        'Query': 'test2',
        'date': '1801',
        'Term frequency': '3',
        'Relative term frequency (by # documents)': '0.75',
        'Total documents': '4',
        'Relative term frequency (by # words)': '0.15',
        'Total word count': '20'
    }
]

@pytest.fixture()
def term_frequency_file(indexed_mock_corpus):
    filename = create_csv.term_frequency_csv(mock_queries, mock_timeline_result, 'date', unit = 'year')
    return filename


def test_timeline_csv(term_frequency_file):
    assert_result_csv_expectations(term_frequency_file, mock_timeline_expected_data, delimiter=',')


def test_date_format():
    cases = [
        ('test', None, 'test'), # unchanged
        ('1800-01-01', 'year', '1800'),
        ('1800-01-01', 'month', 'January 1800'),
        ('1800-01-01', 'week', '1800-01-01'),
        ('1800-01-01', 'day', '1800-01-01'),
    ]

    for value, unit, expected in cases:
        assert create_csv.format_field_value(value, unit) == expected

@pytest.fixture()
def csv_directory(test_app):
    return test_app.config['CSV_FILES_PATH']

def assert_content_matches(file_1, encoding_1, file_2, encoding_2):
    '''Assert that the content of a file is unchanged after saving it with different encoding'''
    with open(file_1, 'r', encoding=encoding_1) as f:
        contents_1 = f.read()

    with open(file_2, 'r', encoding=encoding_2) as f:
        contents_2 = f.read()

    assert contents_1 == contents_2

@pytest.mark.parametrize('target_encoding', ['utf-8', 'utf-16'])
def test_encoding_conversion_results(csv_directory, indexed_multilingual_mock_corpus, target_encoding):
    filename, corpus_specs = all_results_csv(indexed_multilingual_mock_corpus)
    converted = convert_csv.convert_csv(csv_directory, filename, 'search_results', encoding = target_encoding, )
    converted_path = os.path.join(csv_directory, converted)
    assert_content_matches(filename, 'utf-8', converted_path, target_encoding)

@pytest.mark.parametrize('target_encoding', ['utf-8', 'utf-16'])
def test_encoding_conversion_term_frequency(csv_directory, term_frequency_file, target_encoding):
    converted = convert_csv.convert_csv(csv_directory, term_frequency_file, 'date_term_frequency', encoding = target_encoding)
    converted_path = os.path.join(csv_directory, converted)

    assert_content_matches(term_frequency_file, 'utf-8', converted_path, target_encoding)

def test_conversion_with_highlights(csv_directory, result_csv_with_highlights):
    target_encoding = 'utf-16'
    converted = convert_csv.convert_csv(csv_directory, result_csv_with_highlights, 'search_results', encoding = target_encoding)
    converted_path = os.path.join(csv_directory, converted)

    assert_content_matches(result_csv_with_highlights, 'utf-8', converted_path, target_encoding)

wide_format_expected_data = [
    {
        'date': '1800',
        'Term frequency (test)': '3',
        'Relative term frequency (by # documents) (test)': '1.5',
        'Total documents (test)': '2',
        'Relative term frequency (by # words) (test)': '0.3',
        'Total word count (test)': '10',
        'Term frequency (test2)': '1',
        'Relative term frequency (by # documents) (test2)': '0.5',
        'Total documents (test2)': '2',
        'Relative term frequency (by # words) (test2)': '0.1',
        'Total word count (test2)': '10'
    }, {
        'date': '1801',
        'Term frequency (test)': '5',
        'Relative term frequency (by # documents) (test)': '1.25',
        'Total documents (test)': '4',
        'Relative term frequency (by # words) (test)': '0.25',
        'Total word count (test)': '20',
        'Term frequency (test2)': '3',
        'Relative term frequency (by # documents) (test2)': '0.75',
        'Total documents (test2)': '4',
        'Relative term frequency (by # words) (test2)': '0.15',
        'Total word count (test2)': '20'
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


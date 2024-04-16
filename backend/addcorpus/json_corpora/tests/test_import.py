from datetime import date
from addcorpus.json_corpora.import_json import import_json_corpus, _parse_field


def test_import(db, json_corpus_data):
    corpus = import_json_corpus(json_corpus_data)

    assert corpus.name == 'example'
    assert corpus.ready_to_index()

    config = corpus.configuration

    assert config.title == 'Example'
    assert config.description == 'Example corpus'
    assert config.languages == ['en']
    assert config.category == 'book'
    assert config.min_date == date(1500, 1, 1)
    assert config.max_date == date(1700, 12, 31)
    assert config.source_data_delimiter == ','
    assert config.es_index == 'test-example'

    assert len(config.fields.all()) == 2

    character_field = config.fields.get(name='character')
    assert character_field.display_name == 'Character'
    assert character_field.display_type == 'keyword'

    line_field = config.fields.get(name='line')
    assert line_field.display_name == 'Line'
    assert line_field.display_type == 'text_content'


def test_parse_content_field(content_field_json):
    field = _parse_field(content_field_json)
    assert field.name == 'content'
    assert field.display_name == 'Content'
    assert field.display_type == 'text_content'
    assert field.description == 'Bla bla bla'
    assert field.search_filter == {}
    assert field.results_overview == True
    assert field.csv_core == True
    assert field.search_field_core == True
    assert field.visualizations == ['wordcloud']
    assert field.es_mapping['type'] == 'text'
    assert field.es_mapping['fields'].keys() == {'length', 'clean', 'stemmed'}
    assert field.hidden == False
    assert field.sortable == False
    assert field.searchable == True
    assert field.downloadable == True
    assert field.language == 'en'
    assert field.extract_column == 'content'


def test_parse_keyword_field(keyword_field_json):
    field = _parse_field(keyword_field_json)
    assert field.name == 'author'
    assert field.display_type == 'keyword'
    assert field.search_filter['name'] == 'MultipleChoiceFilter'
    assert field.search_field_core == False
    assert field.visualizations == ['resultscount', 'termfrequency']
    assert field.es_mapping['type'] == 'keyword'
    assert field.es_mapping['fields'].keys() == {'text'}
    assert field.hidden == False
    assert field.sortable == False
    assert field.searchable == True
    assert field.language == ''


def test_parse_int_field(int_field_json):
    field = _parse_field(int_field_json)
    assert field.name == 'year'
    assert field.display_type == 'integer'
    assert field.search_filter['name'] == 'RangeFilter'
    assert field.results_overview == False
    assert field.csv_core == False
    assert field.search_field_core == False
    assert field.visualizations == ['resultscount', 'termfrequency']
    assert field.visualization_sort == 'key'
    assert field.es_mapping['type'] == 'integer'
    assert field.hidden == False
    assert field.sortable == True
    assert field.searchable == False


def test_parse_float_field(float_field_json):
    field = _parse_field(float_field_json)
    assert field.name == 'ocr_confidence'
    assert field.display_type == 'float'
    assert field.search_filter == {}
    assert field.results_overview == False
    assert field.csv_core == False
    assert field.search_field_core == False
    assert field.visualizations == []
    assert field.es_mapping['type'] == 'float'
    assert field.hidden == False
    assert field.sortable == False
    assert field.searchable == False
    assert field.downloadable == True


def test_parse_date_field(date_field_json):
    field = _parse_field(date_field_json)
    assert field.name == 'date'
    assert field.display_type == 'date'
    assert field.search_filter['name'] == 'DateFilter'
    assert field.results_overview == True
    assert field.csv_core == True
    assert field.search_field_core == False
    assert field.visualizations == ['resultscount', 'termfrequency']
    assert field.es_mapping['type'] == 'date'
    assert field.hidden == False
    assert field.sortable == True
    assert field.searchable == False


def test_parse_boolean_field(boolean_field_json):
    field = _parse_field(boolean_field_json)
    assert field.name == 'author_known'
    assert field.display_type == 'boolean'
    assert field.search_filter['name'] == 'BooleanFilter'
    assert field.results_overview == False
    assert field.csv_core == False
    assert field.search_field_core == False
    assert field.visualizations == ['resultscount', 'termfrequency']
    assert field.es_mapping['type'] == 'boolean'
    assert field.hidden == False
    assert field.sortable == False
    assert field.searchable == False


def test_parse_geo_field(geo_field_json):
    field = _parse_field(geo_field_json)
    assert field.name == 'location'
    assert field.display_type == 'keyword'
    assert field.search_filter == {}
    assert field.results_overview == False
    assert field.csv_core == False
    assert field.search_field_core == False
    assert field.visualizations == []
    assert field.es_mapping['type'] == 'geo_point'
    assert field.hidden == False
    assert field.sortable == False
    assert field.searchable == False


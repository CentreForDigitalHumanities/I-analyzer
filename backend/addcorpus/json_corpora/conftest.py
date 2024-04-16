import pytest

@pytest.fixture()
def content_field_json():
    return {
        'name': 'content',
        'display_name': 'Content',
        'description': 'Bla bla bla',
        'type': 'text_content',
        'language': 'en',
        'options': {
            'search': True,
            'filter': 'none',
            'preview': True,
            'visualize': True,
            'sort': False,
            'hidden': False
        },
        'extract': {'column': 'content'}
    }

@pytest.fixture()
def keyword_field_json():
    return {
        'name': 'author',
        'display_name': 'Author',
        'description': 'Author of the text',
        'type': 'text_metadata',
        'options': {
            'search': True,
            'filter': 'show',
            'preview': True,
            'visualize': True,
            'sort': False,
            'hidden': False
        },
        'extract': {'column': 'author'}
    }

@pytest.fixture()
def int_field_json():
    return {
        'name': 'year',
        'display_name': 'Year',
        'description': 'Year in which the text was written',
        'type': 'integer',
        'options': {
            'search': False,
            'filter': 'show',
            'preview': False,
            'visualize': True,
            'sort': True,
            'hidden': False
        },
        'extract': {'column': 'year'}
    }

@pytest.fixture()
def float_field_json():
    return {
        'name': 'ocr_confidence',
        'display_name': 'OCR confidence',
        'description': 'Confidence level of optical character recognition output',
        'type': 'float',
        'options': {
            'search': False,
            'filter': 'hide',
            'preview': False,
            'visualize': False,
            'sort': False,
            'hidden': False
        },
        'extract': {'column': 'ocr'}
    }

@pytest.fixture()
def date_field_json():
    return {
        'name': 'date',
        'display_name': 'Date',
        'description': 'Date on which the text was written',
        'type': 'date',
        'options': {
            'search': False,
            'filter': 'show',
            'preview': True,
            'visualize': True,
            'sort': True,
            'hidden': False
        },
        'extract': {'column': 'date'}
    }

@pytest.fixture()
def boolean_field_json():
    return {
        'name': 'author_known',
        'display_name': 'Author known',
        'description': 'Whether the author of the text is known',
        'type': 'boolean',
        'options': {
            'search': False,
            'filter': 'show',
            'preview': False,
            'visualize': True,
            'sort': False,
            'hidden': False
        },
        'extract': {'column': 'author_known'}
    }

@pytest.fixture()
def geo_field_json():
    return {
        'name': 'location',
        'display_name': 'Location',
        'description': 'Location where the text was published',
        'type': 'geo_point',
        'options': {
            'search': False,
            'filter': 'none',
            'preview': False,
            'visualize': False,
            'sort': False,
            'hidden': False
        },
        'extract': {'column': 'location'}
    }

@pytest.fixture(
    params=['content', 'keyword', 'int', 'float', 'date', 'boolean', 'geo']
)
def any_field_json(
    request, content_field_json, keyword_field_json, int_field_json, float_field_json,
    date_field_json, boolean_field_json, geo_field_json
):
    field_type = request.param
    funcs = {
        'content': content_field_json,
        'keyword': keyword_field_json,
        'int': int_field_json,
        'float': float_field_json,
        'date': date_field_json,
        'boolean': boolean_field_json,
        'geo': geo_field_json,
    }
    return funcs[field_type]

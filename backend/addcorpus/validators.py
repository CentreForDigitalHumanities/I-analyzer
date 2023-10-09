from django.core.exceptions import ValidationError
from langcodes import tag_is_valid
import mimetypes
import warnings
import os

from addcorpus.constants import MappingType, VisualizationType, FORBIDDEN_FIELD_NAMES
from addcorpus.filters import VALID_MAPPINGS as VALID_SEARCH_FILTER_MAPPINGS

def primary_mapping_type(es_mapping):
    return es_mapping.get('type', None)

def supports_full_text_search(es_mapping):
    is_text = primary_mapping_type(es_mapping) == MappingType.TEXT.value
    has_text_multifield = 'text' in es_mapping.get('fields', {})
    return is_text or has_text_multifield

def supports_aggregation(es_mapping):
    return primary_mapping_type(es_mapping) != MappingType.TEXT.value

def validate_language_code(value):
    '''
    verify that a value is a valid ISO-639 code
    '''

    if not tag_is_valid(value) or value == '':
        raise ValidationError(f'{value} is not a valid ISO-639 language tag')

def validate_mimetype(value):
    '''
    verify that a value is a valid MIME type
    '''

    if not value in mimetypes.types_map.values():
        raise ValidationError(f'{value} is not a valid MIME type')

def validate_search_filter(value):
    '''validate the search filter JSON'''

    if value:
        name = value.get('name', None)
        if not name in VALID_SEARCH_FILTER_MAPPINGS:
            raise ValidationError(f'Unknown search filter type: {name}')

def validate_es_mapping(value):
    '''validate that the field mapping specifies a mapping type'''

    mapping_type = primary_mapping_type(value)

    if not mapping_type:
        raise ValidationError('No mapping type specified')

    valid_types = [t.value for t in list(MappingType)]
    if mapping_type not in valid_types:
        raise ValidationError(f'Invalid mapping type: {mapping_type}')

def validate_search_filter_with_mapping(es_mapping, search_filter_dict):
    '''
    validate that the search filter is appropriate for the mapping type
    '''

    filter_type = search_filter_dict.get('name')
    mapping_type = primary_mapping_type(es_mapping)

    valid_mappings = VALID_SEARCH_FILTER_MAPPINGS[filter_type]
    if not mapping_type in valid_mappings:
        raise ValidationError(f'{filter_type} cannot be used with {mapping_type} mapping')


def validate_visualizations_with_mapping(es_mapping, visualizations):
    '''
    validate that the specified visualisations are compatible with the field mapping
    '''

    if not supports_full_text_search(es_mapping):
        if VisualizationType.NGRAM.value in visualizations:
            raise ValidationError(f'ngram visualisation requires a text mapping')

        if VisualizationType.WORDCLOUD.value in visualizations:
            warnings.warn(
                'A field uses a wordcloud visualisation but does not tokenise data. '
                'This is technically possible, but suggests the mapping type is inappropriate.',
            )

    use_aggregations = [vt.value for vt in (VisualizationType.RESULTS_COUNT, VisualizationType.TERM_FREQUENCY)]
    uses_aggregations = lambda vis: vis in use_aggregations

    if any(map(uses_aggregations, visualizations)) and not supports_aggregation(es_mapping):
        vis = next(filter(uses_aggregations, visualizations))
        raise ValidationError(f'{vis} visualisation cannot be used on text mapping')


def validate_name_is_not_a_route_parameter(value):
    '''
    reject names that are also used as query parameters in frontend routes.

    This would create serious bugs in the frontend as those parameters will also
    be interpreted as filter settings for the field.
    '''

    if value in FORBIDDEN_FIELD_NAMES:
        raise ValidationError(
            f'{value} cannot be used as a field name, because it is also a route parameter'
        )

def mapping_can_be_searched(es_mapping):
    '''
    Verify if a mapping is appropriate for searching
    '''

    if supports_full_text_search(es_mapping):
        return True

    if primary_mapping_type(es_mapping) == MappingType.KEYWORD.value:
        warnings.warn(
            'It is strongly discouraged to use text search for keyword fields without'
            'text analysis. Consider adding a text multifield or using a filter instead.'
        )
        return True

    return False

def validate_searchable_field_has_full_text_search(es_mapping, searchable):
    mapping_type = primary_mapping_type(es_mapping)
    validate_implication(
        searchable, es_mapping,
        message=f'Text search is not supported for mapping type {mapping_type}',
        conclusion_predicate=mapping_can_be_searched,
    )

def identity(obj):
    return obj

def validate_implication(premise_value, conclusion_value, message, premise_predicate = identity, conclusion_predicate = identity):
    '''
    shorthand for a lot of "if A then B" validations.
    '''

    if premise_predicate(premise_value) and not conclusion_predicate(conclusion_value):
        raise ValidationError(message)


def validate_filename_extension(filename, allowed_extensions):
    _, extension = os.path.splitext(filename)
    if not extension in allowed_extensions:
        raise ValidationError(f'Extension {extension} is not allowed')

def validate_markdown_filename_extension(filename):
    allowed = ['.md', '.markdown']
    validate_filename_extension(filename, allowed)

def validate_image_filename_extension(filename):
    allowed = ['.jpeg', '.jpg', '.png', '.JPG']
    validate_filename_extension(filename, allowed)

def any_date_fields(fields):
    is_date = lambda field: primary_mapping_type(field.es_mapping) == 'date'
    return any(map(is_date, fields))

def visualisations_require_date_field(visualisations):
    return visualisations and 'ngram' in visualisations

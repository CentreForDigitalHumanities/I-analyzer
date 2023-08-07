from django.core.exceptions import ValidationError
from langcodes import tag_is_valid

def validate_language_code(value):
    '''
    verify that a value is a valid ISO-639 code
    '''

    if not tag_is_valid(value) or value == '':
        raise ValidationError(f'{value} is not a valid ISO-639 language tag')

import functools
import os
import re
from copy import copy
from flask import current_app

from addcorpus.extract import Backup, Constant, HTML, ExternalFile, Combined
from addcorpus.corpus import Field, XMLCorpus
from addcorpus.es_mappings import keyword_mapping

from corpora.peaceportal.peaceportal import PeacePortal, categorize_material, clean_newline_characters, clean_commentary, join_commentaries, get_text_in_language

AGE_FILTER = r'ge\s(\d{2})'

PLACEHOLDER_EXTRACTOR = Constant('This is a placeholder extractor. We should be asmahed of this code wizardry.')

def join_non_empty(data, join_on=' '):
    if not any(data):
        return None
    return join_on.join([n for n in data if n is not None])

def combine_names(data):
    own, parents = data
    if not own:
        return None
    return f'{own}{", child of "+parents if parents else ""}'


class Safed(XMLCorpus, PeacePortal):
    data_directory = current_app.config['PEACEPORTAL_SAFED_DATA']
    es_index = current_app.config['PEACEPORTAL_SAFED_ES_INDEX']
    es_alias = current_app.config['PEACEPORTAL_ALIAS']
    delimiter = ';'
    encoding='utf-8-sig'

    def sources(self, start, end):
        full_path = os.path.join(self.data_directory, 'safed_data.csv')
        yield full_path, {}

    def __init__(self):
        self.source_database.extractor = Constant(
            value='Funerary inscriptions from Safed Cemetery'
        )

        self._id.extractor = PLACEHOLDER_EXTRACTOR

        self.year.extractor = PLACEHOLDER_EXTRACTOR

        self.age.extractor = PLACEHOLDER_EXTRACTOR

        self.dates_of_death.extractor = PLACEHOLDER_EXTRACTOR

        self.comments.extractor = PLACEHOLDER_EXTRACTOR

        self.settlement.extractor = Constant(
            value='Safed (Tzfat)'
        )

        self.country.extractor = Constant(
            value='Israel'
        )

        self.location_details.extractor = PLACEHOLDER_EXTRACTOR

        self.names.extractor = PLACEHOLDER_EXTRACTOR

        self.fields = self.fields + extra_fields()

def filter_notes(input_string, filter_criterion, contains=False):
    ''' get specific values from the notes, based on a regular expression
    regular expression should have a group () delimiter to identify the target value '''
    match = re.search(filter_criterion, input_string)
    if match and contains:
        return int(match.group(1))
    return None

def extra_fields():
    return [
        year_hebrew,
        month,
        month_hebrew,
        day,
        day_hebrew,
        first_name,
        middle_name,
        family_name,
        first_name_hebrew,
        middle_name_hebrew,
        family_name_hebrew,
        parent_first_name,
        parent_middle_name,
        parent_first_name_hebrew,
        parent_middle_name_hebrew
    ]

year_hebrew = Field(
    name='year_hebrew',
    display_name='Year of Death in the Hebrew calendar',
    es_mapping={'type': 'keyword'},
    extractor=PLACEHOLDER_EXTRACTOR
)
month = Field(
    name='month',
    display_name='Month of death',
    es_mapping={'type': 'integer'},
    extractor=PLACEHOLDER_EXTRACTOR
)
month_hebrew = Field(
    name='month_hebrew',
    display_name='Month of death in Hebrew celandar',
    es_mapping={'type': 'keyword'},
    extractor=PLACEHOLDER_EXTRACTOR
)
day = Field(
    name='day',
    display_name='Day of death',
    es_mapping={'type': 'integer'},
    extractor=PLACEHOLDER_EXTRACTOR
)
day_hebrew = Field(
    name='day_hebrew',
    display_name='Day of death in the Hebrew calendar',
    es_mapping={'type': 'keyword'},
    extractor=PLACEHOLDER_EXTRACTOR
)
first_name = Field(
    name='first_name',
    display_name='First name',
    es_mapping=keyword_mapping(True),
    extractor=PLACEHOLDER_EXTRACTOR
)
middle_name = Field(
    name='middle_name',
    display_name='Middle name',
    es_mapping=keyword_mapping(True),
    extractor=PLACEHOLDER_EXTRACTOR
)
family_name = Field(
    name='family_name',
    display_name='Family name',
    es_mapping=keyword_mapping(True),
    extractor=PLACEHOLDER_EXTRACTOR
)
first_name_hebrew = Field(
    name='first_name_hebrew',
    display_name='First name in Hebrew',
    es_mapping=keyword_mapping(True),
    extractor=PLACEHOLDER_EXTRACTOR
)
middle_name_hebrew = Field(
    name='middle_name_hebrew',
    display_name='Middle name in Hebrew',
    es_mapping=keyword_mapping(True),
    extractor=PLACEHOLDER_EXTRACTOR
)
family_name_hebrew = Field(
    name='family_name_hebrew',
    display_name='Family name in Hebrew',
    es_mapping=keyword_mapping(True),
    extractor=PLACEHOLDER_EXTRACTOR
)
parent_first_name = Field(
    name='parent_first_name',
    display_name='First name of parent',
    es_mapping=keyword_mapping(True),
    extractor=PLACEHOLDER_EXTRACTOR
)
parent_middle_name = Field(
    name='parent_middle_name',
    display_name='Middle name of parent',
    es_mapping=keyword_mapping(True),
    extractor=PLACEHOLDER_EXTRACTOR
)
parent_first_name_hebrew = Field(
    name='parent_first_name_hebrew',
    display_name='First name of parent in Hebrew',
    es_mapping=keyword_mapping(True),
    extractor=PLACEHOLDER_EXTRACTOR
)
parent_middle_name_hebrew = Field(
    name='parent_middle_name_hebrew',
    display_name='Middle name of parent in Hebrew',
    es_mapping=keyword_mapping(True),
    extractor=PLACEHOLDER_EXTRACTOR
)

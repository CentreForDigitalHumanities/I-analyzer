import os
import os.path as op
import logging
from datetime import datetime

from addcorpus.corpus import XMLCorpus, Field
from addcorpus.extract import XML, Constant
from addcorpus.filters import MultipleChoiceFilter, RangeFilter


class PeacePortal(XMLCorpus):
    '''
    Base class for corpora in the PEACE portal.

    This supplies the frontend with the information it needs.
    Child corpora should only provide extractors for each field.
    Consequently, create indices (with alias 'peaceportal') from
    the corpora specific definitions, and point the application
    to this base corpus.
    '''

    title = "PEACE Portal"
    description = "A collection of inscriptions on Jewish burial sites"
    # store min_year as int, since datetime does not support BCE dates
    min_year = -530
    max_date = datetime(year=1948, month=12, day=31)
    visualize = []
    es_index = 'peaceportal'
    # fields below are required by code but not actually used
    min_date = datetime(year=746, month=1, day=1)
    image = 'bogus'
    data_directory = 'bogus'

    # Data overrides from .common.XMLCorpus
    tag_toplevel = ''
    tag_entry = 'TEI'

    # New data members
    non_xml_msg = 'Skipping non-XML file {}'
    non_match_msg = 'Skipping XML file with nonmatching name {}'
    # overwrite below in child class if you need to extract the (converted) transcription
    # from external files. See README.
    external_file_folder = '.'

    def sources(self, start, end):
        logger = logging.getLogger(__name__)
        for directory, _, filenames in os.walk(self.data_directory):
            for filename in filenames:
                name, extension = op.splitext(filename)
                full_path = op.join(directory, filename)

                if extension != '.xml':
                    logger.debug(self.non_xml_msg.format(full_path))
                    continue

                yield full_path, {
                    'external_file': os.path.join(self.external_file_folder, filename)
                }


    source_database = Field(
        name='source_database',
        display_name='Source database',
        description='The database a record originates from.',
        es_mapping={'type': 'keyword'},
        search_filter=MultipleChoiceFilter(
            description='Search only within these databases.',
            option_count=2,
        ),
        csv_core=True
    )

    _id = Field(
        name='id',
        display_name='ID',
        description='ID of the inscription entry.',
        csv_core=True,
        es_mapping={'type': 'keyword'},
        search_field_core=True
    )

    url = Field(
        name='url',
        display_name='URL',
        description='URL of the inscription entry.',
        es_mapping={'type': 'keyword'},
        search_field_core=True
    )

    year = Field(
        name='year',
        display_name='Year',
        description='Year of origin of the inscription.',
        es_mapping={'type': 'integer'},
        search_filter=RangeFilter(
            description='Restrict the years from which search results will be returned.',
            lower=min_year,
            upper=max_date.year,
        ),
        csv_core=True,
        sortable=True,
        visualization_type='term_frequency',
        visualization_sort='key',
        results_overview=True
    )

    transcription = Field(
        name='transcription',
        es_mapping={'type': 'text'},
        display_name='Transcription',
        description='Text content of the inscription.',
        search_field_core=True,
        results_overview=True,
        display_type='text_content'
    )

    # A string with all the names occuring in the source
    names = Field(
        name='names',
        es_mapping={'type': 'text'},
        display_name='Names',
        description='Names of the buried persons.',
        search_field_core=True
    )

    # Should be an array with potentially multiple values from these: 'M', 'F', or None.
    sex = Field(
        name='sex',
        display_name='Sex',
        description='Gender(s) of the buried person(s). None if the sex is unknown.',
        es_mapping={'type': 'keyword'},
        search_filter=MultipleChoiceFilter(
            description='Search only within these genders.',
            option_count=3,
        ),
        csv_core=True
    )

    country = Field(
        name='country',
        display_name='Country',
        description='Country where the inscription was found.',
        es_mapping={'type': 'keyword'},
        search_filter=MultipleChoiceFilter(
            description='Search only within these countries.',
            option_count=5
        ),
        visualization_type='term_frequency',
        results_overview=True
    )

    provenance = Field(
        name='provenance',
        display_name='Provenance',
        description='Description of the location where the inscription was found.',
        es_mapping={'type': 'keyword'},
        search_filter=MultipleChoiceFilter(
            description='Search only within these provenances.',
            option_count=29
        ),
        visualization_type='term_frequency',
        results_overview=True
    )

    material = Field(
        name='material',
        display_name='Material',
        description='Type of material the inscription is written on.',
        es_mapping={'type': 'keyword'},
        search_filter=MultipleChoiceFilter(
            description='Search only within these material types.',
            option_count=39
        ),
        visualization_type='term_frequency'
    )

    material_details = Field(
        name='material_details',
        display_name='Material details',
        description='Details about the material the inscription is written on.',
        es_mapping={'type': 'text'},
        search_field_core=True
    )

    language = Field(
        name='language',
        display_name='Language',
        description='Language written on the inscription.',
        es_mapping={'type': 'keyword'},
        search_filter=MultipleChoiceFilter(
            description='Search only within these languages.',
            option_count=10
        ),
        csv_core=True,
        visualization_type='term_frequency'
    )

    commentary = Field(
        name='commentary',
        es_mapping={'type': 'text'},
        display_name='Commentary',
        description='Extra comments, questions or remarks on this inscription.',
        search_field_core=True,
    )

    fields = [
        _id,
        url,
        year,
        transcription,
        names,
        sex,
        country,
        provenance,
        material,
        material_details,
        language,
        commentary,
        source_database
    ]


def normalize_language(text):
    ltext = text.lower()
    if ltext in ['grc']: return 'Greek'
    if ltext in ['he', 'heb']: return 'Hebrew'
    if ltext in ['arc']: return 'Aramaic'
    if ltext in ['la']: return 'Latin'

def categorize_material(text):
    '''
    Helper function to (significantly) reduce the material field to a set of categories.
    The Epidat corpus in particular has mainly descriptions of the material.
    Returns a list of categories, i.e. those that appear in `text`.
    '''
    if not text: return ['Unknown']

    categories = ['Sandstein', 'Kalkstein', 'Stein', 'Granit', 'Kunststein',
                  'Lavatuff', 'Marmor', 'Kalk', 'Syenit', 'Labrador', 'Basalt', 'Beton',
                  'Glas', 'Labrador', 'Rosenquarz', 'Gabbro', 'Diorit',
                  # below from FIJI and IIS
                  'Limestone', 'Stone', 'Clay', 'Plaster', 'Glass', 'Kurkar', 'Granite',
                  'Marble', 'Metal', 'Bone', 'Lead' ]
    result = []
    ltext = text.lower()

    for c in categories:
        if c.lower() in ltext:
            result.append(c)

    if len(result) == 0:
        # reduce unknown, other and ? to unknown
        # 'schrifttafel' removes some clutter from Epidat
        if 'unknown' in ltext or 'other' in ltext or '?' in ltext or 'schrifttafel':
            result.append('Unknown')
        else:
            result.append(text)

    return result

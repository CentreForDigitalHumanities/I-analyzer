from glob import glob
import datetime
from langdetect import detect
from langdetect.lang_detect_exception import LangDetectException

from django.conf import settings

from addcorpus.corpus import ParentCorpusDefinition, FieldDefinition
from addcorpus.extract import XML
from addcorpus.es_mappings import date_estimate_mapping, date_mapping, \
    int_mapping, keyword_mapping, main_content_mapping, text_mapping
from addcorpus.es_settings import es_settings
from addcorpus.extract import Constant
from addcorpus.filters import DateFilter, MultipleChoiceFilter, RangeFilter


class PeacePortal(ParentCorpusDefinition):
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
    max_date = datetime.datetime(year=1950, month=12, day=31)
    visualize = []
    es_index = getattr(settings, 'PEACEPORTAL_ALIAS', 'peaceportal')
    es_alias = getattr(settings, 'PEACEPORTAL_ALIAS', 'peaceportal')
    scan_image_type = 'image/png'
    # fields below are required by code but not actually used
    min_date = datetime.datetime(year=746, month=1, day=1)
    image = 'bogus.jpg'
    category = 'inscription'
    data_directory = 'bogus'

    # Data overrides from .common.XMLCorpus
    tag_entry = 'TEI'

    # New data members
    non_xml_msg = 'Skipping non-XML file {}'
    non_match_msg = 'Skipping XML file with nonmatching name {}'
    # overwrite below in child class if you need to extract the (converted) transcription
    # from external files. See README.
    # el stands for modern Greek (1500-)
    languages = ['en', 'de', 'nl', 'he', 'la', 'el']

    @property
    def es_settings(self):
        return es_settings(self.languages, stopword_analysis=True,
                           stemming_analysis=True)

    def sources(self, start, end):
        for filename in sorted(glob('{}/**/*.xml'.format(self.data_directory),
                                    recursive=True)):
            metadata = self.add_metadata(filename)
            yield filename, metadata

    def add_metadata(self, filename):
        return {}

    def request_media(self, document):
        images = document['fieldValues']['images']
        if not images:
            images = []
        return {'media': images}

    source_database = FieldDefinition(
        name='source_database',
        display_name='Source database',
        description='The database a record originates from.',
        es_mapping=keyword_mapping(),
        search_filter=MultipleChoiceFilter(
            description='Search only within these databases.',
            option_count=4,
        ),
        csv_core=True
    )

    _id = FieldDefinition(
        name='id',
        display_name='ID',
        description='ID of the inscription entry.',
        csv_core=True,
        es_mapping=keyword_mapping(),
        search_field_core=True
    )

    url = FieldDefinition(
        name='url',
        display_name='URL',
        description='URL of the inscription entry.',
        es_mapping=keyword_mapping(),
        search_field_core=True
    )

    year = FieldDefinition(
        name='year',
        display_name='Year',
        description='Year of origin of the inscription.',
        es_mapping=int_mapping(),
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

    not_before = FieldDefinition(
        name='not_before',
        display_name='Not before',
        description='Inscription is dated not earlier than this year.',
        es_mapping=date_mapping(),
        hidden=True
    )

    not_after = FieldDefinition(
        name='not_after',
        display_name='Not after',
        description='Inscription is dated not later than this year.',
        es_mapping=date_mapping(),
        hidden=True
    )

    date = FieldDefinition(
        name='date',
        display_name='Estimated date range',
        description='The estimated date of the description range',
        es_mapping=date_estimate_mapping(),
        search_filter=DateFilter(
            description='Restrict the dates from which search results will be returned.',
            lower=min_date,
            upper=max_date,
        )
    )

    transcription = FieldDefinition(
        name='transcription',
        es_mapping=main_content_mapping(),
        display_name='Transcription',
        description='Text content of the inscription.',
        search_field_core=True,
        results_overview=True,
        display_type='text_content'
    )

    transcription_german = FieldDefinition(
        name='transcription_de',
        es_mapping=main_content_mapping(
            stopword_analysis=True, stemming_analysis=True, language='de'),
        language='de',
        hidden=True
    )

    transcription_english = FieldDefinition(
        name='transcription_en',
        es_mapping=main_content_mapping(
            stopword_analysis=True, stemming_analysis=True, language='en'),
        language='en',
        hidden=True
    )

    transcription_hebrew = FieldDefinition(
        name='transcription_he',  # no stemmers available
        es_mapping=main_content_mapping(stopword_analysis=True, language='he'),
        language='he',
        hidden=True
    )

    transcription_latin = FieldDefinition(
        name='transcription_la',
        es_mapping={'type': 'text'},  # no stopwords / stemmers available
        language='la',
        hidden=True
    )

    transcription_greek = FieldDefinition(
        name='transcription_el',
        es_mapping=main_content_mapping(
            stopword_analysis=True, stemming_analysis=True, language='el'),
        language='el',
        hidden=True
    )

    transcription_dutch = FieldDefinition(
        name='transcription_nl',
        es_mapping=main_content_mapping(
            stopword_analysis=True, stemming_analysis=True, language='nl'),
        language='nl',
        hidden=True
    )

    age = FieldDefinition(
        name='age',
        display_name='Age',
        description='Age of the buried person(s)',
        es_mapping=int_mapping(),
        search_filter=RangeFilter(
            description='Filter by age of the buried persons.',
            lower=0,
            upper=100,
        ),
        extractor=Constant(
            value=None
        )
    )

    # A string with all the names occuring in the source
    names = FieldDefinition(
        name='names',
        es_mapping=text_mapping(),
        display_name='Names',
        description='Names of the buried persons.',
        search_field_core=True
    )

    # Should be an array with potentially multiple values from these: 'M', 'F', or None.
    sex = FieldDefinition(
        name='sex',
        display_name='Sex',
        description='Gender(s) of the buried person(s). None if the sex is unknown.',
        es_mapping=keyword_mapping(),
        search_filter=MultipleChoiceFilter(
            description='Search only within these genders.',
            option_count=3,
        ),
        csv_core=True
    )

    country = FieldDefinition(
        name='country',
        display_name='Country',
        description='Country where the inscription was found.',
        es_mapping=keyword_mapping(True),
        search_filter=MultipleChoiceFilter(
            description='Search only within these countries.',
            option_count=5
        ),
        visualization_type='term_frequency',
        results_overview=True
    )

    settlement = FieldDefinition(
        name='settlement',
        display_name='Settlement',
        description='The settlement where the inscription was found.',
        es_mapping=keyword_mapping(True),
        search_filter=MultipleChoiceFilter(
            description='Search only within these settlements.',
            option_count=29
        ),
        visualization_type='term_frequency'
    )

    region = FieldDefinition(
        name='region',
        display_name='Region',
        description='The region where the inscription was found.',
        es_mapping=keyword_mapping(True),
        search_filter=MultipleChoiceFilter(
            description='Search only within these regions.',
            option_count=29
        ),
        visualization_type='term_frequency'
    )

    location_details = FieldDefinition(
        name='location_details',
        display_name='Location details',
        description='Details about the location of the inscription',
        es_mapping=text_mapping()
    )

    material = FieldDefinition(
        name='material',
        display_name='Material',
        description='Type of material the inscription is written on.',
        es_mapping=keyword_mapping(),
        search_filter=MultipleChoiceFilter(
            description='Search only within these material types.',
            option_count=39
        ),
        visualization_type='term_frequency'
    )

    material_details = FieldDefinition(
        name='material_details',
        display_name='Material details',
        description='Details about the material the inscription is written on.',
        es_mapping=text_mapping(),
        search_field_core=True
    )

    language = FieldDefinition(
        name='language',
        display_name='Language',
        description='Language of the inscription.',
        es_mapping=keyword_mapping(),
        search_filter=MultipleChoiceFilter(
            description='Search only within these languages.',
            option_count=10
        ),
        csv_core=True,
        visualization_type='term_frequency'
    )

    language_code = FieldDefinition(
        name='language_code',
        display_name='Language code',
        description='ISO 639 code for the language of the inscription.',
        es_mapping=keyword_mapping()
    )

    bibliography = FieldDefinition(
        name='bibliography',
        es_mapping=keyword_mapping(),
        display_name='Bibliography',
        description='Reference(s) to who edited and published this funerary inscription.'
    )

    comments = FieldDefinition(
        name='comments',
        es_mapping=text_mapping(),
        display_name='Commentary',
        description='Extra comments, questions or remarks on this inscription.',
        search_field_core=True,
    )

    images = FieldDefinition(
        name='images',
        es_mapping=keyword_mapping(),
        display_name='Images',
        description='Links to image(s) of the inscription.',
        hidden=True
    )

    coordinates = FieldDefinition(
        name='coordinates',
        es_mapping=keyword_mapping(),
        display_name='Coordinates',
        description='GIS coordinates for the inscription.'
    )

    iconography = FieldDefinition(
        name='iconography',
        es_mapping=text_mapping(),
        display_name='Iconography',
        description='Description of the icons used in the inscription.',
        search_field_core=True
    )

    dates_of_death = FieldDefinition(
        name='dates_of_death',
        es_mapping=keyword_mapping(),
        display_name='Date of death',
    )

    def __init__(self):
        self.fields = [
            self._id,
            self.url,
            self.year,
            self.not_before,
            self.not_after,
            self.date,
            self.source_database,
            self.transcription,
            self.names,
            self.sex,
            self.dates_of_death,
            self.age,
            self.country,
            self.region,
            self.settlement,
            self.location_details,
            self.language,
            self.language_code,
            self.iconography,
            self.images,
            self.coordinates,
            self.material,
            self.material_details,
            self.bibliography,
            self.comments,
            self.transcription_german,
            self.transcription_hebrew,
            self.transcription_latin,
            self.transcription_greek,
            self.transcription_english,
            self.transcription_dutch
        ]


def clean_newline_characters(text):
    '''
    Remove all spaces surrounding newlines in `text`.
    Also removes multiple newline characters in a row.
    '''
    if not text:
        return
    parts = text.split('\n')
    cleaned = []
    for part in parts:
        if not '\n' in part:
            stripped = part.strip()
            if stripped:
                cleaned.append(part.strip())
    return '\n'.join(cleaned)


def clean_commentary(commentary):
    '''
    Clean a commentary by removing all whitespaces characters between words,
    except for one space.
    '''
    return ' '.join(commentary.split())


def join_commentaries(commentaries):
    '''
    Helper function to join the result of a Combined extractor
    into one string, separating items by a newline
    '''
    results = []
    for comm in commentaries:
        if comm:
            results.append(comm)
    return "\n".join(results)


def categorize_material(text):
    '''
    Helper function to (significantly) reduce the material field to a set of categories.
    The Epidat corpus in particular has mainly descriptions of the material.
    Returns a list of categories, i.e. those that appear in `text`.
    '''
    if not text:
        return ['Unknown']

    categories = ['Sandstein', 'Kalkstein', 'Stein', 'Granit', 'Kunststein',
                  'Lavatuff', 'Marmor', 'Kalk', 'Syenit', 'Labrador', 'Basalt', 'Beton',
                  'Glas', 'Rosenquarz', 'Gabbro', 'Diorit', 'Bronze',
                  # below from FIJI and IIS
                  'Limestone', 'Stone', 'Clay', 'Plaster', 'Glass', 'Kurkar', 'Granite',
                  'Marble', 'Metal', 'Bone', 'Lead']
    result = []
    ltext = text.lower()

    for c in categories:
        if c.lower() in ltext:
            result.append(translate_category(c))

    if len(result) == 0:
        # reduce unknown, other and ? to Unknown
        # 'schrifttafel' removes some clutter from Epidat
        if 'unknown' in ltext or 'other' in ltext or '?' in ltext or 'schrifttafel':
            result.append('Unknown')
        else:
            result.append(text)

    return result


def translate_category(category):
    '''
    Helper function to translate non-English categories of material into English
    '''
    pairs = {
        'Sandstein': 'Sandstone',
        'Kalkstein': 'Limestone',
        'Stein': 'Stone',
        'Granit': 'Granite',
        'Kunststein': 'Artificial stone',
        'Lavatuff': 'Tufa',
        'Marmor': 'Marble',
        'Kalk': 'Limestone',
        'Syenit': 'Syenite',
        'Labrador': 'Labradorite',
        'Beton': 'Concrete',
        'Glas': 'Glass',
        'Rosenquarz': 'Rose quartz',
        'Diorit': 'Diorite'
    }

    for original, translation in pairs.items():
        if category == original:
            return translation
    return category


def get_text_in_language(_input):
    '''
    Get all the lines from a transcription that are in a certain language
    (according to the `langdetect` package). Note that `transcription` will
    be split on newlines to create lines that will be fed to langdetect one by one.
    All lines that are in `language_code` will be collected and returned as one string,
    i.e. they will be joined with a space (no newlines!).

    Parameters:
        _input -- A tuple or list with (transcription, language_code). Will typically be the output
        of a Combined extractor, i.e. one for the transcript and a Constant extractor with the language code.
        For a list of language codes detected by langdetect, see https://pypi.org/project/langdetect/
    '''
    results = []
    if len(_input) != 2 or not _input[0]:
        return results
    lines = _input[0].split('\n')
    language_code = _input[1]

    for line in lines:
        if not line:
            continue
        detected_code = None
        try:
            # note that Aramaic is detected as Hebrew
            detected_code = detect(line)
        except LangDetectException:
            # sometimes langdetect isn't happy with some stuff like
            # very short strings with mainly numbers in it
            pass
        if detected_code and detected_code == language_code:
            results.append(line)
    return ' '.join(results)


def transform_to_date(input, margin):
    try:
        datetime.date.fromisoformat(input)
        return input
    except:
        if not input:
            return None
        if int(input) < 1:
            raise Exception(
                'Years smaller than 1 cannot be transformed to dates')
        if len(input) < 4:
            input = zero_pad_year(input)
        if margin == 'upper':
            return '{}-12-31'.format(input)
        elif margin == 'lower':
            return '{}-01-01'.format(input)
        else:
            raise Exception("margin argument must be 'upper' or 'lower'")


def zero_pad_year(input):
    return ('0' * (4 - len(str(input)))) + str(input)


def transform_to_date_range(earliest, latest):
    if not earliest:
        earliest = PeacePortal.min_date
    if not latest:
        latest = PeacePortal.max_date
    return {
        'gte': earliest,
        'lte': latest
    }


def not_after_extractor():
    return XML(
        tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc',
             'history', 'origin', 'date'],
        toplevel=False,
        attribute='notAfter',
        transform=lambda x: transform_to_date(x, 'upper')
    )


def not_before_extractor():
    return XML(
        tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc',
             'history', 'origin', 'date'],
        toplevel=False,
        attribute='notBefore',
        transform=lambda x: transform_to_date(x, 'lower')
    )

from addcorpus.python_corpora.corpus import FieldDefinition
from addcorpus.es_mappings import date_estimate_mapping, geo_mapping, int_mapping, keyword_mapping, main_content_mapping, text_mapping
from addcorpus.python_corpora.filters import DateFilter, MultipleChoiceFilter, RangeFilter


def id():
    return FieldDefinition(
        name='id',
        display_name='ID',
        description='ID of the inscription entry.',
        csv_core=True,
        es_mapping=keyword_mapping(),
        search_field_core=True
    )

def source_database():
    return FieldDefinition(
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

def url():
    return FieldDefinition(
        name='url',
        display_name='Source URL',
        display_type='url',
        description='URL of the inscription entry in the source database.',
        es_mapping=keyword_mapping(),
        search_field_core=True
    )


def year(min_year, max_year):
    return FieldDefinition(
        name="year",
        display_name="Year",
        description="Year of origin of the inscription.",
        es_mapping=int_mapping(),
        search_filter=RangeFilter(
            description="Restrict the years from which search results will be returned.",
            lower=min_year,
            upper=max_year,
        ),
        csv_core=True,
        sortable=True,
        visualizations=["resultscount"],
        visualization_sort="key",
        results_overview=True,
    )


def date(min_date, max_date):
    return FieldDefinition(
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


def not_before():
    return FieldDefinition(
        name='not_before',
        display_name='Not before',
        description='Inscription is dated not earlier than this year.',
        es_mapping=int_mapping(),
        hidden=True
    )


def not_after():
    return FieldDefinition(
        name='not_after',
        display_name='Not after',
        description='Inscription is dated not later than this year.',
        es_mapping=int_mapping(),
        hidden=True
    )


def transcription():
    return FieldDefinition(
        name='transcription',
        es_mapping=main_content_mapping(),
        display_name='Transcription',
        description='Text content of the inscription.',
        search_field_core=True,
        results_overview=True,
        display_type='text_content'
    )


def transcription_german():
    return FieldDefinition(
        name='transcription_de',
        es_mapping=main_content_mapping(
            stopword_analysis=True, stemming_analysis=True, language='de'),
        language='de',
        hidden=True
    )


def transcription_english():
    return FieldDefinition(
        name='transcription_en',
        es_mapping=main_content_mapping(
            stopword_analysis=True, stemming_analysis=True, language='en'),
        language='en',
        hidden=True
    )


def transcription_hebrew():
    return FieldDefinition(
        name='transcription_he',  # no stemmers available
        es_mapping=main_content_mapping(stopword_analysis=True, language='he'),
        language='he',
        hidden=True
    )


def transcription_latin():
    return FieldDefinition(
        name='transcription_la',
        es_mapping={'type': 'text'},  # no stopwords / stemmers available
        language='la',
        hidden=True
    )


def transcription_greek():
    return FieldDefinition(
        name='transcription_el',
        es_mapping=main_content_mapping(
            stopword_analysis=True, stemming_analysis=True, language='el'),
        language='el',
        hidden=True
    )


def transcription_dutch():
    return FieldDefinition(
        name='transcription_nl',
        es_mapping=main_content_mapping(
            stopword_analysis=True, stemming_analysis=True, language='nl'),
        language='nl',
        hidden=True
    )


def age():
    return FieldDefinition(
        name='age',
        display_name='Age',
        description='Age of the buried person(s)',
        es_mapping=int_mapping(),
        search_filter=RangeFilter(
            description='Filter by age of the buried persons.',
            lower=0,
            upper=100,
        )
    )


def names():
    ''' A string with all the names occuring in the source '''
    return FieldDefinition(
        name='names',
        es_mapping=text_mapping(),
        display_name='Names',
        description='Names of the buried persons.',
        search_field_core=True
    )

    # Should be an array with potentially multiple values from these: 'M', 'F', or None.


def sex():
    return FieldDefinition(
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


def country():
    return FieldDefinition(
        name="country",
        display_name="Country",
        description="Country where the inscription was found.",
        es_mapping=keyword_mapping(True),
        search_filter=MultipleChoiceFilter(
            description="Search only within these countries.", option_count=5
        ),
        visualizations=["resultscount"],
        results_overview=True,
    )


def settlement():
    return FieldDefinition(
        name="settlement",
        display_name="Settlement",
        description="The settlement where the inscription was found.",
        es_mapping=keyword_mapping(True),
        search_filter=MultipleChoiceFilter(
            description="Search only within these settlements.", option_count=29
        ),
        visualizations=["resultscount"],
    )


def region():
    return FieldDefinition(
        name="region",
        display_name="Region",
        description="The region where the inscription was found.",
        es_mapping=keyword_mapping(True),
        search_filter=MultipleChoiceFilter(
            description="Search only within these regions.", option_count=29
        ),
        visualizations=["resultscount"],
    )


def location_details():
    return FieldDefinition(
        name='location_details',
        display_name='Location details',
        description='Details about the location of the inscription',
        es_mapping=text_mapping()
    )


def material():
    return FieldDefinition(
        name="material",
        display_name="Material",
        description="Type of material the inscription is written on.",
        es_mapping=keyword_mapping(),
        search_filter=MultipleChoiceFilter(
            description="Search only within these material types.", option_count=39
        ),
        visualization_type="resultscount",
    )


def material_details():
    return FieldDefinition(
        name='material_details',
        display_name='Material details',
        description='Details about the material the inscription is written on.',
        es_mapping=text_mapping(),
        search_field_core=True
    )


def language():
    return FieldDefinition(
        name="language",
        display_name="Language",
        description="Language of the inscription.",
        es_mapping=keyword_mapping(),
        search_filter=MultipleChoiceFilter(
            description="Search only within these languages.", option_count=10
        ),
        csv_core=True,
        visualizations=["resultscount"],
    )


def language_code():
    return FieldDefinition(
        name='language_code',
        display_name='Language code',
        description='ISO 639 code for the language of the inscription.',
        es_mapping=keyword_mapping()
    )


def bibliography():
    return FieldDefinition(
        name='bibliography',
        es_mapping=keyword_mapping(),
        display_name='Bibliography',
        description='Reference(s) to who edited and published this funerary inscription.'
    )


def comments():
    return FieldDefinition(
        name='comments',
        es_mapping=text_mapping(),
        display_name='Commentary',
        description='Extra comments, questions or remarks on this inscription.',
        search_field_core=True,
    )


def images():
    return FieldDefinition(
        name='images',
        es_mapping=keyword_mapping(),
        display_name='Images',
        description='Links to image(s) of the inscription.',
        hidden=True
    )


def coordinates():
    return FieldDefinition(
        name='coordinates',
        es_mapping=geo_mapping(),
        display_name='Coordinates',
        description='GIS coordinates of the inscription.'
    )


def iconography():
    return FieldDefinition(
        name='iconography',
        es_mapping=text_mapping(),
        display_name='Iconography',
        description='Description of the icons used in the inscription.',
        search_field_core=True
    )


def dates_of_death():
    return FieldDefinition(
        name='dates_of_death',
        es_mapping=keyword_mapping(),
        display_name='Date of death',
    )

from addcorpus.corpus import Field
from addcorpus.filters import DateFilter, MultipleChoiceFilter, RangeFilter
from corpora.parliament.utils.constants import MIN_DATE, MAX_DATE, BASIC_KEYWORD_MAPPING, BASIC_TEXT_MAPPING

# For every field `foo` in the Parliament corpora, this file should have a function `foo()`
# which creates a default instance of the field. It does not include an extractor, since that
# depends on the corpus.

# Corpora that include a `foo` field should initialise it with `foo()` and then modify attributes as needed.

def book_id():
    """Unique ID of the book in which the speech was recorded"""
    return Field(
        name='book_id',
        display_name='Book ID',
        description='Unique identifier of the book in which the speech was recorded',
        es_mapping=BASIC_KEYWORD_MAPPING,
    )

def book_label():
    """Label of the book in which the speech was recorded"""
    return Field(
        name='book_label',
        display_name='Book label',
        description='Label of the book in which the speech was recorded',
        es_mapping=BASIC_TEXT_MAPPING,
    )

def chamber():
    "human-readable name of chamber (commons, senate, etc)"
    return Field(
        name='chamber',
        display_name='Chamber',
        description='Chamber in which the debate took place',
        es_mapping={'type': 'keyword'},
        search_filter = MultipleChoiceFilter(
            description='Search only in debates from the selected chamber(s)',
            option_count=2
        ),
        visualizations = ['histogram']
    )

def country():
    "Country in which the debate took place"
    return Field(
        name='country',
        display_name='Country',
        description='Country in which the debate took place',
        es_mapping=BASIC_KEYWORD_MAPPING,
    )

def date():
    "The date on which the debate took place."
    return Field(
        name='date',
        display_name='Date',
        description='The date on which the debate took place.',
        es_mapping={'type': 'date', 'format': 'yyyy-MM-dd'},
        results_overview=True,
        search_filter=DateFilter(
            MIN_DATE,
            MAX_DATE,
            description='Search only within this time range.'
        ),
        visualizations=['timeline'],
        primary_sort=True,
    )

def date_is_estimate():
    """Wether the date field is an estimate. Boolean value."""
    return Field(
        name='date_is_estimate',
        display_name='Date is estimate',
        description='Whether the recorded date is an estimate',
        es_mapping={'type':'boolean'}
    )


def era():
    return Field(
        name='era',
        display_name='Era',
        description='The parliamentary era in which the speech or debate was held'
    )


def chamber():
    "human-readable name of house (commons, senate, etc)"
    return Field(
        name='chamber',
        display_name='Chamber',
        description='Chamber in which the debate took place',
        es_mapping=BASIC_KEYWORD_MAPPING,
        search_filter = MultipleChoiceFilter(
            description='Search only in debates from the selected chamber(s)',
            option_count=2
        ),
        visualizations = ['histogram']
    )

def debate_type():
    "Type of debate in which the speech occurred"
    return Field(
        name='debate_type',
        display_name='Debate type',
        description='Type of debate in which the speech occurred',
        es_mapping=BASIC_KEYWORD_MAPPING,
    )

def debate_title():
    "Title of the debate in which the speech was held"
    return Field(
        name='debate_title',
        display_name='Debate title',
        description='Title of the debate in which the speech was held',
        es_mapping=BASIC_TEXT_MAPPING,
        search_field_core=True,
    )

def debate_id():
    "unique ID for the debate"
    return Field(
        name='debate_id',
        display_name='Debate ID',
        description='Unique identifier of the debate in which the speech was held',
        es_mapping=BASIC_KEYWORD_MAPPING,
    )

def legislature():
    ""
    return Field(
        name='legislature',
        display_name='Legislature',
        description='Title of individuals elected to parliament',
        es_mapping={'type': 'keyword'},
    )

def topic():
    "if debates are divided into topics, they are specified here"
    return Field(
        name='topic',
        display_name='Topic',
        description='Topic of the debate in which the speech was held',
        es_mapping=BASIC_TEXT_MAPPING,
        search_field_core=True,
    )

def subtopic():
    "further division of topics into subtopics"
    return Field(
        name='subtopic',
        display_name='Subtopic',
        description='Subtopic of the debate in which the speech was held',
        es_mapping=BASIC_TEXT_MAPPING,
    )

def session():
    """
    in which session the debate or speech occurred
    there may be several sessions within a given date
    """
    return Field(
        name='session',
        display_name='Session',
        description='Session in which the debate or speech occurred',
        es_mapping=BASIC_KEYWORD_MAPPING,
    )



def speech():
    """
    speech is a multifield with subfields clean (lowercase, stopwords, no numbers) and stemmed (as clean, but also stemmed)
    stopword and stemmer filter need to be defined for each language
    """
    return Field(
        name='speech',
        display_name='Speech',
        description='The transcribed speech',
        # each index has its own definition of the 'clean' and 'stemmed' analyzer, based on language
        es_mapping = {
            "type" : "text",
            "fields": {
                "clean": {
                    "type": "text",
                    "analyzer": "clean",
                    "term_vector": "with_positions_offsets"
                },
                "stemmed": {
                    "type": "text",
                    "analyzer": "stemmed",
                    "term_vector": "with_positions_offsets",
                },
                "length": {
                    "type":     "token_count",
                    "analyzer": "standard"
                }
            }
        },
        results_overview=True,
        search_field_core=True,
        display_type='text_content',
        visualizations=['wordcloud', 'ngram']
    )

def speech_id():
    "unique (corpus-level) ID for the speech"
    return Field(
        name='id',
        display_name='Speech ID',
        description='Unique identifier of the speech',
        es_mapping=BASIC_KEYWORD_MAPPING,
    )

def speaker():
    "name of the speaker"
    return Field(
        name='speaker',
        display_name='Speaker',
        description='The speaker of the transcribed speech',
        es_mapping={
            'type': 'keyword',
            'fields': {
                'text': { 'type': 'text' },
                'length': {
                    'type': 'token_count',
                    'analyzer': 'standard',
                }
            }
        },
        results_overview=True,
        search_field_core=True,
        visualizations=['histogram']
    )

def speech_type():
    "type of speech, e.g. question, answer, interjection, point of order"
    return Field(
        name='speech_type',
        display_name='Speech type',
        description='The type of speech',
        es_mapping=BASIC_KEYWORD_MAPPING,
    )

def speaker_id():
    "unique (corpus level) ID for the speaker"
    return Field(
        name='speaker_id',
        display_name='Speaker ID',
        description='Unique identifier of the speaker',
        es_mapping=BASIC_KEYWORD_MAPPING,
    )

def speaker_constituency():
    "Constituency represented by the speaker"
    return Field(
        name='speaker_constituency',
        display_name='Speaker constituency',
        description='Constituency represented by the speaker',
        es_mapping=BASIC_KEYWORD_MAPPING,
        visualizations=['histogram']
    )

def speaker_birthplace():
    """Birthplace of the speaker (string)"""
    return Field(
        name='speaker_birthplace',
        display_name='Speaker place of birth',
        description='Birthplace of the speaker',
        es_mapping=BASIC_KEYWORD_MAPPING,
    )

def speaker_birth_country():
    """Birth country of the speaker (string)"""
    return Field(
        name='speaker_birth_country',
        display_name='Speaker country of birth',
        description='Country in which the speaker was born',
        es_mapping=BASIC_KEYWORD_MAPPING,
    )

def speaker_birth_year():
    """Year in which the speaker was born (int)"""
    return Field(
        name='speaker_birth_year',
        display_name='Speaker year of birth',
        description='Year in which the speaker was born',
        es_mapping={'type': 'integer'}
    )

def speaker_death_year():
    """Year in which the speaker died (int)"""
    return Field(
        name='speaker_death_year',
        display_name='Speaker year of death',
        description='Year in which the speaker died',
        es_mapping={'type': 'integer'},
    )

def speaker_gender():
    """Gender of the speaker."""
    return Field(
        name='speaker_gender',
        display_name='Speaker gender',
        description='Gender of the speaker',
        es_mapping=BASIC_KEYWORD_MAPPING,
        visualizations=['histogram'],
    )

def speaker_profession():
    """Profession of the speaker."""
    return Field(
        name='speaker_profession',
        display_name='Speaker profession',
        description='Profession of the speaker',
        es_mapping=BASIC_KEYWORD_MAPPING,
    )

def speaker_aristocracy():
    """Whether the speaker is a member of the aristocracy"""
    return Field(
        name='speaker_aristocracy',
        display_name='Speaker aristocracy',
        description='Aristocratic title of the speaker',
        es_mapping=BASIC_KEYWORD_MAPPING,
    )

def speaker_academic_title():
    """Academic title of the speaker"""
    return Field(
        name='speaker_academic_title',
        display_name='Speaker academic title',
        description='Academic title of the speaker',
        es_mapping=BASIC_KEYWORD_MAPPING,
    )


def role():
    "role of the speaker (speaker, chair, MP, etc...)"
    return Field(
        name='role',
        display_name='Role',
        description='Role of the speaker in the debate',
        es_mapping=BASIC_KEYWORD_MAPPING,
        search_filter=MultipleChoiceFilter(
            description='Search for speeches by speakers with the selected roles',
            option_count=10
        ),
        visualizations=['histogram'],
    )

def role_long():
    """Expanded description of the value for `role`."""
    return Field(
        name='role_long',
        display_name='Role (long)',
        description='Expanded description of role of the speaker in the debate',
        es_mapping=BASIC_TEXT_MAPPING,
    )

def party():
    "name of the political party of the speaker"
    return Field(
        name='party',
        display_name='Party',
        description='Political party that the speaker belongs to',
        es_mapping=BASIC_KEYWORD_MAPPING,
        search_filter= MultipleChoiceFilter(
            description='Search in speeches from the selected parties',
            option_count=50
        ),
        visualizations=['histogram']
    )

def party_id():
    "unique ID of the party"
    return Field(
        name='party_id',
        display_name='Party ID',
        description='Unique identifier of the political party the speaker belongs to',
        es_mapping=BASIC_KEYWORD_MAPPING,
    )

def party_full():
    "human-readable name of the party"
    return Field(
        name='party_full',
        display_name='Party (full name)',
        description='Full name of the political party that the speaker belongs to',
        es_mapping=BASIC_TEXT_MAPPING,
    )

def page():
    "page number or range (string)"
    return Field(
        name='page',
        display_name='Page(s)',
        description='Page(s) of the speech in the original document',
        es_mapping=BASIC_KEYWORD_MAPPING,
        searchable=False,
    )

def page_source():
    "page number in source document (can contain letters)"
    return Field(
        name='page_source',
        display_name='Source page number',
        description='Page number in source document',
        es_mapping={'type': 'keyword'}
    )

def column():
    "column number or range (used in UK data) (string)"
    return Field(
        name='column',
        display_name='Column(s)',
        description='Column(s) of the speech in the original document',
        es_mapping=BASIC_KEYWORD_MAPPING,
        searchable=False,
    )

def url():
    """url of the source file"""
    return Field(
        name='url',
        display_name='Source url',
        description='URL to source file of this speech',
        es_mapping=BASIC_KEYWORD_MAPPING,
        searchable=False,
    )


def sequence():
    "integer index of the speech in a debate"
    return Field(
        name='sequence',
        display_name='Sequence',
        description='Index of the sequence of speeches in a debate',
        es_mapping={'type': 'integer'},
        sortable=True,
        searchable=False,
    )

def url():
    "url to source from which the data is extracted"
    return Field(
        name='url',
        display_name='URL',
        description='URL to source file of this speech',
        es_mapping={'type':'keyword'}
    )

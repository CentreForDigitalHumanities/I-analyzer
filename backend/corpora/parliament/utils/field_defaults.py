from addcorpus.corpus import Field
from addcorpus.filters import DateFilter, MultipleChoiceFilter, RangeFilter
from corpora.parliament.utils.constants import MIN_DATE, MAX_DATE

# For every field `foo` in the Parliament corpora, this file should have a function `foo()`
# which creates a default instance of the field. It does not include an extractor, since that
# depends on the corpus.

# Corpora that include a `foo` field should initialise it with `foo()` and then modify attributes as needed.

def country():
    return Field(
        name='country',
        display_name='Country',
        description='Country in which the debate took place',
        es_mapping={'type': 'keyword'},
    )

def date():
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
        visualizations=['timeline']
    )

def house():
    "human-readable name of house (commons, senate, etc)"
    return Field(
        name='house',
        display_name='House',
        description='House in which the debate took place',
        es_mapping={'type': 'keyword'},
        search_filter = MultipleChoiceFilter(
            description='Search only in debates from the selected houses',
            option_count=2
        ),
        visualizations = ['histogram']
    )

def debate_title():
    return Field(
        name='debate_title',
        display_name='Title of debate',
        description='Title of the debate in which the speech was held',
        es_mapping={'type': 'text'},
    )

def debate_id():
    "unique ID for the debate"
    return Field(
        name='debate_id',
        display_name='Debate ID',
        description='Unique identifier of the debate in which the speech was held',
        es_mapping={'type': 'keyword'},
    )

def topic():
    "if debates are divided into topics, they are specified here"
    return Field(
        name='topic',
        display_name='Topic',
        description='Topic of the debate in which the speech was held',
        es_mapping={'type': 'text'},
    )

def subtopic():
    "further division of topics into subtopics"
    return Field(
        name='subtopic',
        display_name='Subtopic',
        description='Subtopic of the debate in which the speech was held',
        es_mapping={'type': 'text'},
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
        es_mapping={'type': 'keyword'},
    )

def speaker():
    "name of the speaker"
    return Field(
        name='speaker',
        display_name='Speaker',
        description='The speaker of the transcribed speech',
        es_mapping={'type': 'keyword'},
    )

def speech_type():
    "type of speech, e.g. question, answer, interjection, point of order"
    return Field(
        name='speech_type',
        display_name='Speech Type',
        description='The type of speech',
        es_mapping={'type': 'keyword'},
    )

def speaker_id():
    "unique (corpus_level) ID for the speaker"
    return Field(
        name='speaker_id',
        display_name='Speaker ID',
        description='Unique identifier of the speaker',
        es_mapping={'type': 'keyword'},
    )

def speaker_constituency():
    return Field(
        name='speaker_constituency',
        display_name='Speaker Constituency',
        description='Constituency represented by the speaker',
        es_mapping={'type': 'keyword'},
    )

def role():
    "role of the speaker (speaker, chair, MP, etc...)"
    return Field(
        name='role',
        display_name='Role',
        description='Role of the speaker in the debate',
        es_mapping={'type': 'keyword'},
        search_filter=MultipleChoiceFilter(
            description='Search for speeches by speakers with the selected roles',
            option_count=10
        )
    )

def party():
    "name of the political party of the speaker"
    return Field(
        name='party',
        display_name='Party',
        description='Political party that the speaker belongs to',
        es_mapping={'type': 'keyword'},
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
        es_mapping={'type': 'keyword'},
    )

def party_full():
    "human-readable name of the party"
    return Field(
        name='party_full',
        display_name='Party (full name)',
        description='Full name of the political party that the speaker belongs to',
        es_mapping={'type': 'keyword'},
    )

def page():
    "page number"
    return Field(
        name='page',
        display_name='Page(s)',
        description='Page(s) of the speech in the original document',
        es_mapping={'type': 'keyword'}
    )

def column():
    "column number (used in UK data)"
    return Field(
        name='column',
        display_name='Column',
        description='Column(s) of the speech in the original document',
        es_mapping={'type': 'keyword'}
    )

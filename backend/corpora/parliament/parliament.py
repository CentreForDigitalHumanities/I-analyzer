from datetime import datetime
import logging
import os
import os.path as op

from flask import current_app

from addcorpus.corpus import Corpus, Field
from addcorpus.extract import XML, Constant
from addcorpus.filters import DateFilter, MultipleChoiceFilter, RangeFilter

MIN_DATE = datetime(year=1800, month=1, day=1)
MAX_DATE = datetime(year=2021, month=12, day=31)

class Parliament(Corpus):
    '''
    Base class for speeches in the People & Parliament project.

    This supplies the frontend with the information it needs.
    Child corpora should only provide extractors for each field.
    Create indices (with alias 'peopleparliament') from
    the corpora specific definitions, and point the application
    to this base corpus.
    '''

    title = "People and Parliament"
    description = "Minutes from European parliaments"
    # store min_year as int, since datetime does not support BCE dates
    visualize = []
    es_index = current_app.config['PP_ALIAS']
    # scan_image_type = 'image/png'
    # fields below are required by code but not actually used
    min_date = MIN_DATE
    max_date = MAX_DATE
    image = 'parliament.jpeg'
    data_directory = 'bogus'

    # overwrite below in child class if you need to extract the (converted) transcription
    # from external files. See README.
    external_file_folder = '.'

    def sources(self, start, end):
        logger = logging.getLogger(__name__)
        for directory, _, filenames in os.walk(self.data_directory):
            for filename in filenames:
                name, extension = op.splitext(filename)
                full_path = op.join(directory, filename)
                yield full_path, {
                    'filename': filename
                }

    def _country():
        return Field(
            name='country',
            display_name='Country',
            description='Country in which the debate took place',
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Search only in debates from selected countries',
                option_count=10
            )
        )
    
    country = _country()

    def _date():
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
    
    date = _date()

    def _house():
        "human-readable name of house (commons, senate, etc)"
        return Field(
            name='house',
            display_name='House',
            description='House in which the debate took place',
            es_mapping={'type': 'keyword'},
            visualizations=['histogram'],
        )
    
    house = _house()

    def _debate_title():
        return Field(
            name='debate_title',
            display_name='Title of debate',
            description='Title of the debate in which the speech was held',
            es_mapping={'type': 'text'},
        )
    
    debate_title = _debate_title()

    def _debate_id():
        "unique ID for the debate"
        return Field(
            name='debate_id',
            display_name='Debate ID',
            description='Unique identifier of the debate in which the speech was held',
            es_mapping={'type': 'keyword'},
        )
    
    debate_id = _debate_id()

    def _topic():
        "if debates are divided into topics, they are specified here"
        return Field(
            name='topic',
            display_name='Topic',
            description='Topic of the debate in which the speech was held',
            es_mapping={'type': 'text'},
        )
    
    topic = _topic()

    def _subtopic():
        "further division of topics into subtopics"
        return Field(
            name='subtopic',
            display_name='Subtopic',
            description='Subtopic of the debate in which the speech was held',
            es_mapping={'type': 'text'},
        )
    
    subtopic = _subtopic()

    def _speech():
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
    
    speech = _speech()

    def _speech_id():
        "unique (corpus-level) ID for the speech"
        return Field(
            name='id',
            display_name='Speech ID',
            description='Unique identifier of the speech',
            es_mapping={'type': 'keyword'},
        )
    
    speech_id = _speech_id()

    def _speaker():
        "name of the speaker"
        return Field(
            name='speaker',
            display_name='Speaker',
            description='The speaker of the transcribed speech',
            es_mapping={'type': 'keyword'},
        )
    
    speaker = _speaker()

    def _speech_type():
        "type of speech, e.g. question, answer, interjection, point of order"
        return Field(
            name='speech_type',
            display_name='Speech Type',
            description='The type of speech',
            es_mapping={'type': 'keyword'},
        )
    
    speech_type = _speech_type()

    def _speaker_id():
        "unique (corpus_level) ID for the speaker"
        return Field(
            name='speaker_id',
            display_name='Speaker ID',
            description='Unique identifier of the speaker',
            es_mapping={'type': 'keyword'},
        )
    
    speaker_id = _speaker_id()

    def _speaker_constituency():
        return Field(
            name='speaker_constituency',
            display_name='Speaker Constituency',
            description='Constituency represented by the speaker',
            es_mapping={'type': 'keyword'},
        )
    
    speaker_constituency = _speaker_constituency()

    def _role():
        "role of the speaker (speaker, chair, MP, etc...)"
        return Field(
            name='role',
            display_name='Role',
            description='Role of the speaker in the debate',
            es_mapping={'type': 'keyword'},
        )

    role = _role()

    def _party():
        "name of the political party of the speaker"
        return Field(
            name='party',
            display_name='Party',
            description='Political party that the speaker belongs to',
            es_mapping={'type': 'keyword'},
        )
    
    party = _party()

    def _party_id():
        "unique ID of the party"
        return Field(
            name='party_id',
            display_name='Party ID',
            description='Unique identifier of the political party the speaker belongs to',
            es_mapping={'type': 'keyword'},
        )
    
    party_id = _party_id()

    def _party_full():
        # human-readable name of the party
        return Field(
            name='party_full',
            display_name='Party (full name)',
            description='Full name of the political party that the speaker belongs to',
            es_mapping={'type': 'keyword'},
        )
    
    party_full = _party_full()

    def _page():
        # page number
        return Field(
            name='page',
            display_name='Page(s)',
            description='Page(s) of the speech in the original document',
            es_mapping={'type': 'keyword'}
        )
    
    page = _page()

    def _column():
        # column number
        return Field(
            name='column',
            display_name='Column',
            description='Column(s) of the speech in the original document',
            es_mapping={'type': 'keyword'}
        )
    
    column = _column()


    fields = [
        country, date,
        debate_title, debate_id,
        topic, subtopic, house, 
        speech, speech_id,
        speaker, speaker_id,
        speech_type,
        role,
        party, party_id, party_full,
        page, column,
    ]

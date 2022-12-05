from datetime import datetime
from flask import current_app
import os
from glob import glob

from addcorpus.corpus import Corpus, CSVCorpus, XMLCorpus
from addcorpus.extract import Constant, CSV
from corpora.parliament.parliament import Parliament
import corpora.parliament.utils.field_defaults as field_defaults
import corpora.parliament.utils.formatting as formatting

class ParliamentIrelandOld(CSVCorpus):
    '''
    Class for extracting 1919-2013 Irish debates.

    Only used for data extraction, use the `ParliamentIreland` class in the application.
    '''

    data_directory = current_app.config['PP_IRELAND_DATA']

    field_entry = 'speechID'
    delimiter = '\t'

    def sources(self, start, end):
        for tsv_file in glob('{}/**/*.tab'.format(self.data_directory)):
            yield tsv_file, {}

    country = field_defaults.country()
    country.extractor = Constant('Ireland')

    chamber = field_defaults.chamber()
    chamber.extractor = Constant('Dáil')

    date = field_defaults.date()
    date.extractor = CSV('date')

    party = field_defaults.party()
    party.extractor = CSV('party_name')

    party_id = field_defaults.party_id()
    party_id.extractor = CSV('partyID')

    speaker = field_defaults.speaker()
    speaker.extractor = CSV('member_name')

    speaker_id = field_defaults.speaker_id()
    speaker_id.extractor = CSV('memberID')

    speaker_constituency = field_defaults.speaker_constituency()
    speaker_constituency.extractor = CSV('const_name')

    speech = field_defaults.speech()
    speech.extractor = CSV(
        'speech',
        multiple=True,
        transform = lambda rows : '\n'.join(rows)
    )

    speech_id = field_defaults.speech_id()
    speech_id.extractor = CSV('speechID')

    topic = field_defaults.topic()
    topic.extractor = CSV('title')

    sequence = field_defaults.sequence()
    sequence.extractor = CSV(
        'speechID',
        transform = formatting.extract_integer_value
    )

    fields = [
        country,
        chamber,
        date,
        party, party_id,
        speaker, speaker_id, speaker_constituency,
        speech, speech_id,
        sequence,
        topic,
    ]


class ParliamentIrelandNew(XMLCorpus):
    '''
    Class for extracting 2014-2020 Irish debates.

    Only used for data extraction, use the `ParliamentIreland` class in the application.
    '''

    data_directory = current_app.config['PP_IRELAND_DATA']

    def sources(self, start, end):
        return []

    country = field_defaults.country()
    country.extractor = Constant('Ireland')

    chamber = field_defaults.chamber()

    date = field_defaults.date()

    party = field_defaults.party()

    party_id = field_defaults.party_id()

    speaker = field_defaults.speaker()

    speaker_id = field_defaults.speaker_id()

    speaker_constituency = field_defaults.speaker_constituency()

    speech = field_defaults.speech()

    speech_id = field_defaults.speech_id()

    topic = field_defaults.topic()

    sequence = field_defaults.sequence()

    fields = [
        country,
        chamber,
        date,
        party, party_id,
        speaker, speaker_id, speaker_constituency,
        speech, speech_id,
        sequence,
        topic,
    ]


class ParliamentIreland(Parliament, Corpus):
    '''
    Class for 1919-2020 Irish debates.
    '''

    title = 'People & Parliament (Ireland)'
    description = 'Speeches from the Dáil Éireann and Seanad Éireann'
    min_date = datetime(year=1913, month=1, day=1)
    max_date = datetime(year=2020, month=12, day=31)
    data_directory = current_app.config['PP_IRELAND_DATA']
    es_index = current_app.config['PP_IRELAND_INDEX']
    image = 'ireland.png'
    description_page = 'ireland.md'
    language = None # corpus uses multiple languages, so we will not be using language-specific analyzers
    es_settings = {'index': {'number_of_replicas': 0}} # do not include analyzers in es_settings

    @property
    def subcorpora(self):
        return [
            ParliamentIrelandOld(),
            ParliamentIrelandNew(),
        ]

    def sources(self, start, end):
        for i, subcorpus in enumerate(self.subcorpora):
            for source in subcorpus.sources(start, end):
                filename, metadata = source
                metadata['subcorpus'] = i
                yield filename, metadata

    def source2dicts(self, source):
        filename, metadata = source

        subcorpus_index = metadata['subcorpus']
        subcorpus = self.subcorpora[subcorpus_index]

        return subcorpus.source2dicts(source)

    country = field_defaults.country()
    chamber = field_defaults.chamber()
    date = field_defaults.date()
    party = field_defaults.party()
    party_id = field_defaults.party_id()
    speaker = field_defaults.speaker()
    speaker_id = field_defaults.speaker_id()
    speaker_constituency = field_defaults.speaker_constituency()
    speech = field_defaults.speech()
    speech_id = field_defaults.speech_id()
    topic = field_defaults.topic()
    sequence = field_defaults.sequence()

    fields = [
        country,
        chamber,
        date,
        party, party_id,
        speaker, speaker_id, speaker_constituency,
        speech, speech_id,
        sequence,
        topic,
    ]

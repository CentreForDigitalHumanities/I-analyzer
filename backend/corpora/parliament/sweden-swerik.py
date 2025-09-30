from datetime import date
import os
import glob
from django.conf import settings
from ianalyzer_readers.readers.xml import XMLReader
from ianalyzer_readers.extract import Constant, XML
from ianalyzer_readers.xml_tag import Tag

from corpora.parliament.parliament import Parliament
from corpora.parliament.utils import field_defaults


class ParliamentSwedenSwerik(Parliament, XMLReader):
    title = 'People & Parliament (Sweden, Swerik dataset)'
    description = 'Speeches from the Riksdag. This corpus is based on the Swedish' \
        'Parliament Corpus published by the Swerik project.'
    min_date = date(1867, 1, 1)
    max_date = date(2000, 12, 31)
    languages = ['sv']

    data_directory = settings.PP_SWEDEN_SWERIK_DATA
    es_index = getattr(settings, 'PP_SWEDEN_SWERIK_INDEX', 'parliament-sweden-swerik')

    tag_toplevel = Tag('TEI')
    tag_entry = Tag(lambda tag: tag.name == 'u' and tag.get('who') != 'unknown')

    def sources(self, **kwargs):
        records_path = os.path.join(self.data_directory, 'records', 'data')
        for path in glob.glob(records_path + '/*/*.xml'):
            yield path

    country = field_defaults.country()
    country.extractor = Constant('Sweden')

    date = field_defaults.date()
    date.extractor = XML(
        Tag('text'),
        Tag('front', recursive=False),
        Tag('docDate'),
        attribute='when',
        toplevel=True,
    )

    debate_id = field_defaults.debate_id()
    debate_id.extractor = XML(
        toplevel=True,
        attribute='xml:id',
    )

    speaker_id = field_defaults.speaker_id()
    speaker_id.extractor = XML(attribute='who')

    speech = field_defaults.speech(language='sv')
    speech.extractor = XML(flatten=True)

    speech_id = field_defaults.speech_id()
    speech_id.extractor = XML(attribute='xml:id')

    def __init__(self):
        self.fields = [
            self.country,
            self.date,
            self.debate_id,
            self.speaker_id,
            self.speech,
            self.speech_id,
        ]

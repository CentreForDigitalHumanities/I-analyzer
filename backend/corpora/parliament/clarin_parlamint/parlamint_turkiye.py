import logging
from datetime import datetime
from glob import glob
from os.path import join
from bs4 import BeautifulSoup



from django.conf import settings

from addcorpus.python_corpora.corpus import XMLCorpusDefinition
from addcorpus.python_corpora.extract import XML, Constant, Combined, Choice, Order, Metadata
from corpora.utils.constants import document_context
from corpora.parliament.parliament import Parliament
from corpora.parliament.utils.parlamint_v4 import extract_all_party_data, extract_people_data, person_attribute_extractor
import corpora.parliament.utils.field_defaults as field_defaults


from ianalyzer_readers.xml_tag import Tag, FindParentTag, PreviousTag, TransformTag

logger = logging.getLogger('indexing')


def get_persons_metadata(directory):
    with open(join(directory, 'ParlaMint-TR-listPerson.xml'), 'rb') as f:
        soup = BeautifulSoup(f.read(), 'xml')
    return extract_people_data(soup)

def get_orgs_metadata(directory):
    with open(join(directory, 'ParlaMint-TR-listOrg.xml'), 'rb') as f:
        soup = BeautifulSoup(f.read(), 'xml')
    return extract_all_party_data(soup)



class ParlamintTurkiye(Parliament, XMLCorpusDefinition):
    '''
    Corpus definition for indexing Turkish parliamentary data from the ParlaMint dataset.
    '''

    title = "ParlaMint Türkiye"
    description = "Speeches and debates from Türkiye's parliament."
    min_date = datetime(year=2011, month=6, day=1)
    max_date = datetime(year=2022, month=12, day=31)
    data_directory = settings.PARLAMINT_TURKIYE_DATA
    es_index = getattr(settings, 'PARLAMINT_TURKIYE_ES_INDEX', 'parlamint-turkiye')
    image = 'turkiye.jpg'
    # description_page = 'parlamint_turkiye.md'

    tag_toplevel = Tag('TEI')
    tag_entry = Tag('u')
    languages = ['tr']

    category = 'parliament'
    document_context = document_context()

    def sources(self, start, end):
        # First collect metadata that is applicable to the whole dataset, like people and parties
        persons_metadata = get_persons_metadata(self.data_directory)
        orgs_metadata = get_orgs_metadata(self.data_directory)
        metadata = {
            'persons': persons_metadata,
            'organisations': orgs_metadata
        }

        ## Then collect metadata that is applicable to the current file and find the paths to each xml file
        for year in range(start.year, end.year):
            for xml_file in glob('{}/{}/*.xml'.format(self.data_directory, year)):
                yield xml_file, metadata
                ##### Keep looking at NL for metadata harvest tips

    country = field_defaults.country()
    country.extractor = Constant(
        value='Türkiye'
    )

    date = field_defaults.date()
    date.extractor = XML(
            Tag('teiHeader'),
            Tag('fileDesc'),
            Tag('sourceDesc'),
            Tag('bibl'),
            Tag('date'),
            toplevel=True
    )

    debate_id = field_defaults.debate_id()
    debate_id.extractor = XML(
            attribute='xml:id',
            toplevel=True,
    )

    speech = field_defaults.speech(language='tr')
    speech.extractor = XML(
            Tag('seg'),
            multiple=True,
            flatten=True,
            transform='\n'.join)

    speech_id = field_defaults.speech_id()
    speech_id.extractor = XML(
        attribute='xml:id'
    )

    sequence = field_defaults.sequence()
    sequence.extractor = Order(transform=lambda value: value + 1)

    speaker = field_defaults.speaker()
    speaker.extractor = person_attribute_extractor('name')

    speaker_id = field_defaults.speaker_id()
    speaker_id.extractor = person_attribute_extractor('id')

    def __init__(self):
        self.fields = [
            self.debate_id,
            self.country,
            self.date,
            self.speech,
            self.speech_id,
            self.sequence,
            self.speaker,

        ]



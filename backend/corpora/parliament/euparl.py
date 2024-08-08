from datetime import datetime
import os
from typing import Tuple, Union

from django.conf import settings
from rdflib import Graph, Namespace
from rdflib.namespace import DCTERMS, FOAF
from ianalyzer_readers.readers.rdf import RDFReader
from ianalyzer_readers.extract import Backup, Combined, RDF

from corpora.parliament.parliament import Parliament
import corpora.parliament.utils.field_defaults as field_defaults

MP_METADATA = 'MembersOfParliament_background.ttl'

# Namespaces of Linked Politics (NB: the links themselves are dead)
LP_EU = Namespace('http://purl.org/linkedpolitics/eu/plenary/')
LPV_EU = Namespace('http://purl.org/linkedpolitics/vocabulary/eu/plenary/')
LP = Namespace('http://purl.org/linkedpolitics/')
LPV = Namespace('http://purl.org/linkedpolitics/vocabulary/')

def get_identifier(input):
    return input.split('/')[-1]

def get_party(input: Tuple[str, str]) -> Union[str, None]:
    ''' parse the MembersOfParliament external file and return the first political function
        which meets the following conditions:
    - the function should be a EUParty (only those have acronyms)
    - the begin / end date should surround the speech's date

    Parameters:
        input: a tuple of date and EU member node, result of Combined extractor

    Returns:
        a string of the party acronym or `None`
    '''
    g = Graph()
    g.parse(os.path.join(settings.PP_EUPARL_DATA, MP_METADATA))
    date, person = input
    functions = list(g.objects(person, LPV.politicalFunction))
    for node in functions:
        institution = list(g.objects(node, LPV.institution))
        if not institution:
            continue
        party = list(g.objects(institution[0], LPV.acronym))
        if party:
            date_start = list(g.objects(node, LPV.beginning))[0].value
            date_end = list(g.objects(node, LPV.end))[0].value
            if date_start < date < date_end:
                return party[0].value
    return None

def get_speech_index(input):
    ''' find index of speech in array of debate parts '''
    speech, speeches = input
    if not speech:
        return None
    return speeches.index(speech) + 1

def get_uri(input):
    ''' convert input from URIRef to string '''
    try:
        return input.n3().strip('<>')
    except:
        return input

class ParliamentEurope(Parliament, RDFReader):
    """
    Speeches of the European parliament, (originally in or translated to English),
    provided as Linked Open Data by the "Talk of Europe" project
    """
    title = 'People & Parliament (European Parliament)'
    description = "Speeches from the European Parliament (EP)"
    min_date = datetime(year=1999, month=7, day=20)
    max_data = datetime(year=2017, month=7, day=6)
    data_directory = settings.PP_EUPARL_DATA
    es_index = getattr(settings, 'PP_EUPARL_INDEX', 'parliament-euparl')
    languages = ['en']
    description_page = 'euparl.md'
    image = 'euparl.jpeg'

    def sources(self, **kwargs):
        yield os.path.join(self.data_directory, 'EUParl.ttl')

    def document_subjects(self, graph: Graph):
        return graph.subjects(object=LPV_EU.Speech)

    debate_id = field_defaults.debate_id()
    debate_id.extractor = RDF(
        DCTERMS.isPartOf,
        transform=get_identifier
    )

    debate_title = field_defaults.debate_title()
    debate_title.extractor = RDF(
        DCTERMS.isPartOf,
        DCTERMS.title
    )

    date = field_defaults.date()
    date.extractor = RDF(
        DCTERMS.date,
        transform=lambda x: x.strftime('%Y-%m-%d')
    )

    party = field_defaults.party()
    party.extractor = Combined(
        RDF(DCTERMS.date),
        RDF(LPV.speaker),
        transform=get_party
    )

    sequence = field_defaults.sequence()
    sequence.extractor = (
        Combined(
            RDF(
                None
            ),
            RDF(
                DCTERMS.isPartOf,
                DCTERMS.hasPart,
                multiple=True
            ),
            transform=get_speech_index
        )
    )

    source_language = field_defaults.language()
    source_language.name = 'source_language'
    source_language.display_name = 'Source language'
    source_language.description = 'Original language of the speech'
    source_language.search_filter.description = 'Search only in speeches in the selected source languages',
    source_language.extractor = RDF(
        DCTERMS.language
    )

    speaker = field_defaults.speaker()
    speaker.extractor = RDF(
        LPV.speaker,
        FOAF.name
    )

    speech = field_defaults.speech(language='en')
    speech.extractor = Backup(
        RDF(
            LPV.spokenText,
        ),
        RDF(
            LPV.translatedText,
        )
    )

    speech_id = field_defaults.speech_id()
    speech_id.extractor = RDF(
        None,
        transform=get_identifier
    )

    url = field_defaults.url()
    url.extractor = Backup(
        RDF(
            LPV.videoURI,
            transform=get_uri
        ),
        RDF(
            None,
            transform=get_uri
        )
    )

    def __init__(self):
        self.fields = [
            self.date,
            self.debate_id,
            self.debate_title,
            self.party,
            self.sequence,
            self.source_language,
            self.speaker,
            self.speech, self.speech_id,
            self.url
        ]

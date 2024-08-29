from datetime import datetime
import os
from typing import Tuple, Union

from django.conf import settings
from rdflib import Graph, Namespace, URIRef
from rdflib.namespace import DCTERMS, FOAF, RDFS, RDF as RDFNS
from ianalyzer_readers.readers.rdf import RDFReader
from ianalyzer_readers.extract import Backup, Combined, Metadata, RDF

from addcorpus.es_mappings import keyword_mapping
from addcorpus.python_corpora.corpus import FieldDefinition
from corpora.parliament.parliament import Parliament
import corpora.parliament.utils.field_defaults as field_defaults

EVENTS_METADATA = 'Events_and_structure.ttl'
MP_METADATA = 'MembersOfParliament_background.ttl'
SPEECHES = 'English.ttl'

# Namespaces of Linked Politics (NB: the purl links resolve to dead sites)
LP_EU = Namespace('http://purl.org/linkedpolitics/eu/plenary/')
LPV_EU = Namespace('http://purl.org/linkedpolitics/vocabulary/eu/plenary/')
LP = Namespace('http://purl.org/linkedpolitics/')
LPV = Namespace('http://purl.org/linkedpolitics/vocabulary/')

def add_speaker_metadata(filename: str) -> dict:
    ''' Parse all relevant metadata out of MembersOfParliament ttl to dict'''
    speaker_dict = {}
    speaker_graph = Graph()
    speaker_graph.parse(filename)
    speaker_subjects = speaker_graph.subjects(object=LPV.MemberOfParliament)
    for speaker in speaker_subjects:
        try:
            name = speaker_graph.value(speaker, FOAF.name).value
        except:
            continue
        country_node = speaker_graph.value(speaker, LPV.countryOfRepresentation)
        country_name = speaker_graph.value(country_node, RDFS.label).value
        party_list = []
        speaker_functions = speaker_graph.objects(speaker, LPV.politicalFunction)
        for function in speaker_functions:
            function_type = speaker_graph.value(function, LPV.institution)
            if speaker_graph.value(function_type, RDFNS.type) == LPV.EUParty:
                party_labels = list(speaker_graph.objects(function_type, RDFS.label))
                party_acronym = min(party_labels, key=len)
                party_name = max(party_labels, key=len)
                date_start = speaker_graph.value(function, LPV.beginning)
                date_end = speaker_graph.value(function, LPV.end)
                party_list.append({
                    'party_acronym': party_acronym,
                    'party_name': party_name,
                    'date_start': date_start.value,
                    'date_end': date_end.value
                })
        speaker_dict.update({speaker: {
            'name': name,
            'country': country_name,
            'parties': party_list
            }
        })
    return speaker_dict

def get_identifier(input: str) -> str:
    return input.split('/')[-1]

def get_speaker(input: Tuple[URIRef, dict]) -> str:
    (speaker, speaker_dict) = input
    return speaker_dict.get(speaker).get('name')

def get_speaker_country(input: Tuple[URIRef, dict]) -> str:
    (speaker, speaker_dict) = input
    return speaker_dict.get(speaker).get('country')

def get_speaker_party(input: Tuple[str, datetime, dict]) -> str:
    ''' look up the which EU party the speaker was part of at the date of their speech '''
    (speaker, date, party_data) = input
    party_list = party_data.get(speaker).get('parties')
    return next((f"{p['party_name']} ({p['party_acronym']})" for p in party_list if (date >= p['date_start'] and date <= p['date_end'])))

def get_speech_index(input: Tuple[str, list]) -> int:
    ''' find index of speech in array of debate parts '''
    speech, speeches = input
    if not speech:
        return None
    return speeches.index(speech) + 1

def get_speech_text(input: str) -> str:
    ''' remove leading language information, e.g., `(IT)`'''
    return input.split(') ')[-1]

def get_uri(input: Union[URIRef, str]) -> str:
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
       metadata = {'speakers': add_speaker_metadata(os.path.join(self.data_directory, MP_METADATA))}
       yield os.path.join(self.data_directory, SPEECHES), metadata

    def document_subjects(self, graph: Graph):
        return graph.subjects(object=LPV_EU.Speech)

    def parse_graph_from_filename(self, filename: str) -> Graph:
        ''' we combine the graphs in place, to keep memory load low '''
        graph = Graph()
        graph.parse(filename)
        graph.parse(os.path.join(self.data_directory, EVENTS_METADATA))
        return graph

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
        RDF(LPV.speaker),
        RDF(DCTERMS.date),
        Metadata('speakers'),
        transform=get_speaker_party
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
    speaker.extractor = Combined(
        RDF(LPV.speaker),
        Metadata('speakers'),
        transform=get_speaker
    )

    speaker_country = FieldDefinition(
        name='speaker_country',
        display_name='Represented country',
        description='The EU country the speaker represents',
        es_mapping=keyword_mapping(),
        extractor=Combined(
            RDF(LPV.speaker),
            Metadata('speakers'),
            transform=get_speaker_country
        )
    )

    speech = field_defaults.speech(language='en')
    speech.extractor = Backup(
        RDF(
            LPV.spokenText,
        ),
        RDF(
            LPV.translatedText,
        ),
        transform=get_speech_text
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
            self.speaker_country,
            self.speech, self.speech_id,
            self.url
        ]

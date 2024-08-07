from datetime import datetime
import os
import re

from django.conf import settings
from rdflib import Graph, Namespace, URIRef
from rdflib.namespace import DCTERMS, FOAF, RDF
from ianalyzer_readers.readers.rdf import RDFReader
from ianalyzer_readers.extract import Backup, Combined, RDF as RDFExtractor

from corpora.parliament.parliament import Parliament
import corpora.parliament.utils.field_defaults as field_defaults

# Namespaces of Linked Politics (NB: the links themselves are dead)
lp_eu_vocab = Namespace('http://purl.org/linkedpolitics/eu/plenary/')
lp_eu_speech = Namespace('http://purl.org/linkedpolitics/vocabulary/eu/plenary/')
lp = Namespace('http://purl.org/linkedpolitics/vocabulary/')


def get_speech_index(input):
    speech, speeches = input
    if not speech:
        return None
    return speeches.index(speech)


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
        return graph.subjects(object=lp_eu_speech.Speech)

    debate_id = field_defaults.debate_id()
    debate_id.extractor = RDFExtractor(
        DCTERMS.isPartOf
    )

    debate_title = field_defaults.debate_title()
    debate_title.extractor = RDFExtractor(
        DCTERMS.isPartOf,
        DCTERMS.title
    )

    date = field_defaults.date()
    date.extractor = RDFExtractor(
        DCTERMS.date
    )

    speaker = field_defaults.speaker()
    speaker.extractor = RDFExtractor(
        lp.speaker,
        FOAF.name
    )

    sequence = field_defaults.sequence()
    sequence.extractor = (
        Combined(
            RDFExtractor(
                None
            ),
            RDFExtractor(
                DCTERMS.isPartOf,
                DCTERMS.hasPart,
                multiple=True
            ),
            transform=get_speech_index
        )
    )

    source_language = field_defaults.language()
    source_language.display_name = 'Source language'
    source_language.description = 'Original language of the speech'
    source_language.search_filter.description = 'Search only in speeches in the selected source languages',
    source_language.extractor = RDFExtractor(
        DCTERMS.language
    )

    speech = field_defaults.speech(language='en')
    speech.extractor = Backup(
        RDFExtractor(
            lp.spokenText,
        ),
        RDFExtractor(
            lp.translatedText,
        )
    )

    speech_id = field_defaults.speech_id()
    speech_id.extractor = RDFExtractor(
        None,
        transform=lambda x: x.split('/')[-1]
    )

    url = field_defaults.url()
    url.extractor = Backup(
        RDFExtractor(
            lp.videoURI
        ),
        RDFExtractor(
            None
        )
    )

    def __init__(self):
        self.fields = [
            self.date,
            self.debate_id,
            self.debate_title,
            self.sequence,
            self.speaker,
            self.speech, self.speech_id,
            self.url
        ]

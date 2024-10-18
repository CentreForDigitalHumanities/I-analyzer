from datetime import datetime
from glob import glob
import logging
from bs4 import BeautifulSoup
from os.path import join
from django.conf import settings
from ianalyzer_readers.xml_tag import Tag, FindParentTag, PreviousTag, TransformTag

import bs4
from addcorpus.python_corpora.corpus import XMLCorpusDefinition
from addcorpus.python_corpora.extract import XML, Constant, Combined, Choice, Order
from corpora.parliament.utils.parlamint import (
    extract_all_party_data,
    extract_people_data,
    extract_role_data,
    ner_keyword_field,
    party_attribute_extractor,
    person_attribute_extractor,
    speech_ner,
)
from corpora.utils.formatting import format_page_numbers
from corpora.parliament.parliament import Parliament
from corpora.utils.constants import document_context
import corpora.parliament.utils.field_defaults as field_defaults
import re

logger = logging.getLogger('indexing')

def load_nl_recent_metadata(directory):
    with open(join(directory, 'ParlaMint-NL.xml'), 'rb') as f:
        soup = BeautifulSoup(f.read(), 'xml')
    return soup


def format_role(role):
    if role == 'mp':
        return role.upper()
    else:
        return role.title() if type(role) == str else role


def format_house(house):
    if house == 'senate':
        return 'Eerste Kamer'
    if house == 'commons':
        return 'Tweede Kamer'
    if house == 'other':
        return 'Other'
    return house

def format_house_recent(url):
    ''' given a string of either eerstekamer.nl or tweedekamer.nl,
    return a string "Eerste Kamer" or "Tweede Kamer" '''
    try:
        split_string = url.split('.')[-2]
    except:
        return None
    if split_string=='eerstekamer':
        return 'Eerste Kamer'
    else:
        return 'Tweede Kamer'


def format_pages(pages):
    topic_start, topic_end, prev_break, last_break = pages
    if prev_break:
        if last_break:
            return format_page_numbers([prev_break, last_break])
        return str(prev_break)

    if topic_start and topic_end:
        return format_page_numbers([topic_start, topic_end])

def format_party(data):
    name, id = data
    if name:
        return name
    if id and id.startswith('nl.p.'):
        id = id[5:]
    return id

def get_party_full(speech_node):
    party_ref = speech_node.attrs.get(':party-ref')
    if not party_ref:
        return []
    parents = list(speech_node.parents)
    party_node = parents[-1].find('organization', attrs={'pm:ref':party_ref})
    return [party_node]

def get_source(meta_node):
    if type(meta_node) == bs4.element.Tag:
        is_link = lambda node: 'pm:linktype' in node.attrs and node['pm:linktype'] == 'pdf'
        link_node = meta_node.find(is_link)
        return link_node
    return ''

def get_sequence_recent(id):
    pattern = r'u(\d+)$'
    match = re.search(pattern, id)
    if match:
        return int(match.group(1))


class ParliamentNetherlandsNew(Parliament, XMLCorpusDefinition):

    tag_toplevel = Tag("TEI")
    tag_entry = Tag("u")
    languages = ["nl"]

    category = "parliament"
    document_context = document_context()

    def sources(self, start: datetime, end: datetime):
        soup = load_nl_recent_metadata(self.data_directory_recent)
        role_data = extract_role_data(soup)
        party_data = extract_all_party_data(soup)
        person_data = extract_people_data(soup)
        metadata = {
            "roles": role_data,
            "parties": party_data,
            "persons": person_data,
        }
        for year in range(start.year, end.year):
            for xml_file in glob(
                "{}/{}/*.xml".format(self.data_directory_recent, year)
            ):
                yield xml_file, metadata

    country = field_defaults.country()
    country.extractor = Constant(value="Netherlands")

    date = field_defaults.date()
    date.extractor = XML(
        Tag("teiHeader"),
        Tag("fileDesc"),
        Tag("sourceDesc"),
        Tag("bibl"),
        Tag("date"),
        toplevel=True,
    )

    chamber = field_defaults.chamber()
    chamber.extractor = XML(
        Tag("teiHeader"),
        Tag("fileDesc"),
        Tag("sourceDesc"),
        Tag("bibl"),
        Tag("idno"),
        toplevel=True,
        transform=format_house_recent,
    )
    chamber.language = "nl"

    debate_title = field_defaults.debate_title()
    debate_title.extractor = XML(
        Tag("teiHeader"),
        Tag("fileDesc"),
        Tag("titleStmt"),
        Tag("title"),
        multiple=True,
        toplevel=True,
        transform=lambda titles: titles[-2] if len(titles) else titles,
    )
    debate_title.language = "nl"

    debate_id = field_defaults.debate_id()
    debate_id.extractor = XML(
        attribute="xml:id",
        toplevel=True,
    )

    topic = field_defaults.topic()
    topic.extractor = XML(
        Tag("note"),
        toplevel=True,
    )
    topic.language = "nl"

    speech = field_defaults.speech(language="nl")
    speech.extractor = XML(
        Tag("seg"),
        multiple=True,
        flatten=True,
    )

    speech_id = field_defaults.speech_id()
    speech_id.extractor = XML(attribute="xml:id")

    speaker = field_defaults.speaker()
    speaker.extractor = person_attribute_extractor("name")

    speaker_id = field_defaults.speaker_id()
    speaker_id.extractor = XML(attribute="who")

    speaker_gender = field_defaults.speaker_gender()
    speaker_gender.extractor = person_attribute_extractor("gender")

    role = field_defaults.parliamentary_role()
    role.extractor = XML(attribute="ana", transform=lambda x: x[1:].title())

    party = field_defaults.party()
    party.extractor = party_attribute_extractor("name")
    party.language = "nl"

    party_id = field_defaults.party_id()
    party_id.extractor = person_attribute_extractor("party_id")

    party_full = field_defaults.party_full()
    party_full.extractor = party_attribute_extractor("full_name")
    party_full.language = "nl"

    sequence = field_defaults.sequence()
    sequence.extractor = Order(transform=lambda value: value + 1)

    source_archive = field_defaults.source_archive()
    source_archive.extractor = Constant(value="ParlaMINT")


class ParliamentNetherlandsOld(Parliament, XMLCorpusDefinition):
    """
    Class for indexing Dutch parliamentary data from the Political Mashup archive
    """

    tag_toplevel = Tag("root")
    tag_entry = Tag("speech")

    def sources(self, start, end):
        logger = logging.getLogger(__name__)

        # old data
        for xml_file in glob("{}/*.xml".format(self.data_directory)):
            period_match = re.search(r"[0-9]{8}", xml_file)
            if period_match:
                period = period_match.group(0)
                start_year = int(period[:4])

                if start_year >= start.year and start_year < end.year:
                    yield xml_file
            else:
                message = "File {} is not indexed, because the filename has no recognisable date".format(
                    xml_file
                )
                logger.warning(msg=message)

    country = field_defaults.country()
    country.extractor = Constant(value="Netherlands")

    date = field_defaults.date()
    date.extractor = XML(
        Tag("meta"),
        Tag("dc:date"),
        toplevel=True,
    )

    chamber = field_defaults.chamber()
    chamber.extractor = XML(
        Tag("meta"),
        Tag("dc:subject"),
        Tag("pm:house"),
        attribute="pm:house",
        toplevel=True,
        transform=format_house,
    )
    chamber.language = "nl"

    debate_title = field_defaults.debate_title()
    debate_title.extractor = XML(
        Tag("meta"),
        Tag("dc:title"),
        toplevel=True,
    )
    debate_title.language = "nl"

    debate_id = field_defaults.debate_id()
    debate_id.extractor = XML(
        Tag("meta"),
        Tag("dc:identifier"),
        toplevel=True,
    )

    topic = field_defaults.topic()
    topic.extractor = XML(
        FindParentTag("topic"),
        attribute="title",
    )
    topic.language = "nl"

    speech = field_defaults.speech(language="nl")
    speech.extractor = XML(
        Tag("p"),
        multiple=True,
        flatten=True,
    )

    speech_id = field_defaults.speech_id()
    speech_id.extractor = XML(attribute="id")

    speaker = field_defaults.speaker()
    speaker.extractor = Combined(
        XML(attribute="function"),
        XML(attribute="speaker"),
        transform=" ".join,
    )

    speaker_id = field_defaults.speaker_id()
    speaker_id.extractor = XML(attribute="member-ref")

    role = field_defaults.parliamentary_role()
    role.extractor = XML(
        attribute="role",
        transform=format_role,
    )

    party = field_defaults.party()
    party.extractor = Combined(
        XML(attribute="party"),
        XML(attribute="party-ref"),
        transform=format_party,
    )
    party.language = "nl"

    party_id = field_defaults.party_id()
    party_id.extractor = XML(attribute="party-ref")

    party_full = field_defaults.party_full()
    party_full.extractor = XML(
        TransformTag(get_party_full),
        attribute="pm:name",
    )
    party_full.language = "nl"

    page = field_defaults.page()
    page.extractor = Combined(
        XML(FindParentTag("topic"), attribute="source-start-page"),
        XML(FindParentTag("topic"), attribute="source-end-page"),
        XML(
            PreviousTag("pagebreak"),
            attribute="originalpagenr",
        ),
        XML(
            Tag("stage-direction"),
            Tag("pagebreak"),
            attribute="originalpagenr",
            multiple=True,
            transform=lambda pages: pages[-1] if pages else pages,
        ),
        transform=format_pages,
    )

    url = field_defaults.url()
    url.extractor = XML(
        Tag("meta"),
        Tag("dc:source"),
        Tag("pm:link"),
        toplevel=True,
        attribute="pm:source",
    )

    sequence = field_defaults.sequence()
    sequence.extractor = Order(transform=lambda value: value + 1)

    source_archive = field_defaults.source_archive()
    source_archive.extractor = Constant(value="PoliticalMashup")

    speech_ner = speech_ner()
    ner_person = ner_keyword_field("person")
    ner_location = ner_keyword_field("location")
    ner_organization = ner_keyword_field("organization")
    ner_misc = ner_keyword_field("misc")


class ParliamentNetherlands(Parliament, XMLCorpusDefinition):
    """
    Class for indexing Dutch parliamentary data
    """

    title = "People & Parliament (Netherlands)"
    description = "Speeches from the Eerste Kamer and Tweede Kamer"
    min_date = datetime(year=1815, month=1, day=1)
    max_date = datetime(year=2022, month=12, day=31)
    data_directory = settings.PP_NL_DATA
    data_directory_recent = settings.PP_NL_RECENT_DATA
    word_model_path = getattr(settings, "PP_NL_WM", None)

    es_index = getattr(settings, "PP_NL_INDEX", "parliament-netherlands")
    image = "netherlands.jpg"
    description_page = "netherlands.md"
    citation_page = "netherlands.md"

    @property
    def subcorpora(self):
        return [
            ParliamentNetherlandsOld(),
            ParliamentNetherlandsNew(),
        ]

    def sources(self, start, end):
        for i, subcorpus in enumerate(self.subcorpora):
            for source in subcorpus.sources(start, end):
                filename, metadata = source
                metadata["subcorpus"] = i
                yield filename, metadata

    def source2dicts(self, source):
        filename, metadata = source

        subcorpus_index = metadata["subcorpus"]
        subcorpus = self.subcorpora[subcorpus_index]

        docs = subcorpus.source2dicts(source)
        for doc in docs:
            yield {field.name: doc.get(field.name, None) for field in self.fields}

    chamber = field_defaults.chamber()
    country = field_defaults.country()

    date = field_defaults.date()
    date.search_filter.lower = min_date
    date.search_filter.upper = max_date

    debate_title = field_defaults.debate_title()
    debate_id = field_defaults.debate_id()
    speech = field_defaults.speech(language="nl")
    speech_id = field_defaults.speech_id()
    topic = field_defaults.topic()
    speaker = field_defaults.speaker()
    speaker_id = field_defaults.speaker_id()
    speaker_gender = field_defaults.speaker_gender()
    role = field_defaults.parliamentary_role()
    page = field_defaults.page()
    party = field_defaults.party()
    party_id = field_defaults.party_id()
    party_full = field_defaults.party_full()
    sequence = field_defaults.sequence()
    source_archive = field_defaults.source_archive()
    url = field_defaults.url()

    def __init__(self):
        self.fields = [
            self.chamber,
            self.country,
            self.date,
            self.debate_title,
            self.debate_id,
            self.page,
            self.party,
            self.party_id,
            self.party_full,
            self.role,
            self.sequence,
            self.source_archive,
            self.speaker,
            self.speaker_id,
            self.speaker_gender,
            self.speech,
            self.speech_id,
            self.topic,
            self.url,
        ]

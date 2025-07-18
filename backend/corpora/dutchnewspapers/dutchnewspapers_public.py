'''
Collect corpus-specific information, that is, data structures and file
locations.
'''
import logging
import re
from datetime import datetime
from os.path import join, split, splitext
import os

from django.conf import settings
from ianalyzer_readers.extract import Metadata, XML
from ianalyzer_readers.xml_tag import Tag, SiblingTag

from addcorpus.es_settings import es_settings
from addcorpus.python_corpora.corpus import (
    XMLCorpusDefinition,
    consolidate_start_end_years,
)
from addcorpus.python_corpora.load_corpus import corpus_dir
from corpora.utils.constants import document_context
from corpora.dutchnewspapers.field_definitions import (
    article_category,
    article_title,
    circulation,
    content,
    date,
    identifier,
    issue_number,
    language,
    newspaper_title,
    ocr_confidence,
    publication_place,
    publisher,
    source,
    temporal,
    url,
    version_of,
)


class DutchNewspapersPublic(XMLCorpusDefinition):
    '''
    The public portion of KB newspapers

    Note for django settings: unlike other corpora, this one cannot have any
    variation in the key: it MUST be `'dutchnewspapers-public'`
    '''

    title = "Dutch Newspapers (public)"
    description = "Collection of Dutch newspapers in the public domain, digitised by the Koninklijke Bibliotheek."
    min_date = datetime(year=1600, month=1, day=1)
    max_date = datetime(year=1876, month=12, day=31)
    data_directory = settings.DUTCHNEWSPAPERS_DATA
    es_index = getattr(settings, 'DUTCHNEWSPAPERS_ES_INDEX', 'dutchnewspapers-public')
    image = 'dutchnewspapers.jpg'
    languages = ['nl']
    category = 'periodical'
    description_page = 'description_public.md'
    citation_page = 'citation_public.md'
    word_model_path = getattr(settings, "DUTCHNEWSPAPERS_WM", None)

    @property
    def es_settings(self):
        return es_settings(self.languages[:1], stopword_analysis=True, stemming_analysis=True)

    tag_toplevel = Tag('text')
    tag_entry = Tag('p')
    external_file_tag_toplevel = Tag('DIDL')

    # New data members
    definition_pattern = re.compile(r'didl')
    page_pattern = re.compile(r'.*_(\d+)_alto')
    article_pattern = re.compile(r'.*_(\d+)_articletext')

    filename_pattern = re.compile(r'[a-zA-z]+_(\d+)_(\d+)')

    non_xml_msg = 'Skipping non-XML file {}'
    non_match_msg = 'Skipping XML file with nonmatching name {}'

    def sources(self, start=min_date, end=max_date):
        logger = logging.getLogger(__name__)
        consolidate_start_end_years(start, end, self.min_date, self.max_date)
        year_matcher = re.compile(r'[0-9]{4}')
        for directory, subdirs, filenames in os.walk(self.data_directory):
            _body, tail = split(directory)
            if tail.startswith("."):
                # don't go through directories from snapshots
                subdirs[:] = []
                continue
            elif year_matcher.match(tail) and (int(tail) > end.year or int(tail) < start.year):
                # don't walk further if the year is not within the limits specified by the user
                subdirs[:] = []
                continue
            definition_file = next((join(directory, filename) for filename in filenames if
                                self.definition_pattern.search(filename)), None)
            if not definition_file:
                continue
            meta_dict = self._metadata_from_xml(definition_file, tags=[
                    "title",
                    "date",
                    "publisher",
                    {"tag": "spatial", "save_as":"distribution"},
                    "source",
                    "issuenumber",
                    "language",
                    "isVersionOf",
                    "temporal",
                    {"tag": "spatial", "attribute": {'type': 'dcx:creation'}, "save_as":"pub_place"}
            ])
            logger.debug(meta_dict)
            for filename in filenames:
                if filename != '.DS_Store':
                    name, extension = splitext(filename)
                    full_path = join(directory, filename)
                    if extension != '.xml':
                        logger.debug(self.non_xml_msg.format(full_path))
                        continue
                    # def_match = self.definition_pattern.match(name)
                    article_match = self.article_pattern.match(name)
                    if article_match:
                        parts = name.split("_")
                        record_id = parts[1] + \
                          ":a" + parts[2]
                        meta_dict.update({
                            'external_file': definition_file,
                            'id': record_id
                        })
                        yield full_path, meta_dict

    titlefile = join(corpus_dir('dutchnewspapers-public'), 'newspaper_titles.txt')
    with open(titlefile, encoding='utf-8') as f:
        papers = f.readlines()
    paper_count = len(papers)

    distribution = {
        'Landelijk': 'National',
        'Nederlands-Indië / Indonesië': 'Dutch East Indies/Indonesia',
        'Nederlandse Antillen': 'Netherlands Antilles',
        'Regionaal/lokaal': 'Regional/local',
        'Suriname': 'Surinam',
        'Verenigde Staten': 'United States of America',
        'onbekend': 'unknown',
    }

    document_context = document_context(
        ['newspaper_title', 'issue_number'],
        None,
        None,
        'issue'
    )

    article_category = article_category()
    article_category.extractor = (
        XML(
            lambda metadata: Tag("recordIdentifier", string=metadata["id"]),
            SiblingTag("subject"),
            external_file=True,
        ),
    )

    article_title = article_title()
    article_title.extractor = XML(Tag("title"), flatten=True, toplevel=True)

    circulation = circulation()
    circulation.extractor = Metadata("spatial")

    content = content()
    content.extractor = XML(
        Tag("p"),
        multiple=True,
        flatten=True,
        toplevel=True,
        transform="\n".join,
    )

    date = date(min_date, max_date)
    date.extractor = Metadata("date")

    identifier = identifier()
    identifier.extractor = Metadata("id")

    issue_number = issue_number()
    issue_number.extractor = Metadata("issuenumber")

    language = language()
    language.extractor = Metadata("language")

    newspaper_title = newspaper_title(len(papers))
    newspaper_title.extractor = Metadata("title")

    ocr_confidence = ocr_confidence()
    ocr_confidence.extractor = (
        XML(
            Tag("OCRConfidencelevel"),
            external_file=True,
            transform=lambda x: float(x) * 100,
        ),
    )

    publication_place = publication_place()
    publication_place.extractor = Metadata("pub_place")

    publisher = publisher()
    publisher.extractor = Metadata("publisher")

    source = source()
    source.extractor = Metadata("source")

    temporal = temporal()
    temporal.extractor = Metadata("temporal")

    url = url()
    url.extractor = (
        XML(
            lambda metadata: Tag("recordIdentifier", string=metadata["id"]),
            SiblingTag("identifier"),
            external_file=True,
        ),
    )

    version_of = version_of()
    version_of.extractor = Metadata("isVersionOf")

    @property
    def fields(self):
        return [
            self.date,
            self.article_category,
            self.circulation,
            self.ocr_confidence,
            self.language,
            self.newspaper_title,
            self.temporal,
            self.content,
            self.article_title,
            self.publisher,
            self.publication_place,
            self.identifier,
            self.issue_number,
            self.source,
            self.url,
            self.version_of,
        ]

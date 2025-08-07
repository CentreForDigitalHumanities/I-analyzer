'''
Collect corpus-specific information, that is, data structures and file
locations.
'''
import logging
import re
from datetime import datetime
from os.path import join, split, splitext
import os
from ianalyzer_readers.xml_tag import Tag, SiblingTag

from django.conf import settings

from addcorpus.python_corpora.corpus import XMLCorpusDefinition, FieldDefinition, consolidate_start_end_years
from addcorpus.python_corpora import filters
from ianalyzer_readers.extract import Metadata, XML
from addcorpus.python_corpora.load_corpus import corpus_dir

from corpora.utils.constants import document_context
from addcorpus.es_mappings import keyword_mapping, main_content_mapping
from addcorpus.es_settings import es_settings

from ianalyzer_readers.xml_tag import Tag, SiblingTag


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
    article_patterns = [
        re.compile(r'.*_(\d+)_text'),  # text for KRANTEN corpus
        re.compile(r'.*_(\d+)_articletext')  # articletext for DDD corpus
    ]
    filename_pattern = re.compile(r'[a-zA-z]+_(\d+)_(\d+)')

    non_xml_msg = 'Skipping non-XML file {}'
    non_match_msg = 'Skipping XML file with nonmatching name {}'

    def update_body(self, doc=None):
        if not doc:
            return True
        url = "http://resolver.kb.nl/resolve?urn={}:{}:mpeg21:{}".format(*doc['_id'].split(":"))
        return {
            "doc": {
                "url" : url
            }
        }


    def sources(self, start=min_date, end=max_date):
        logger = logging.getLogger(__name__)
        consolidate_start_end_years(start, end, self.min_date, self.max_date)
        for directory, subdirs, filenames in os.walk(self.data_directory):
            _body, tail = split(directory)
            if tail.startswith("."):
                # don't go through directories from snapshots
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
                    {"tag": "spatial", "save_as":"spatial"},
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
                        record_id = parts[0] +':' + parts[1] + \
                          ":mpeg21:a" + parts[2]
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

    @property
    def fields(self):
        return [
            FieldDefinition(
                name="url",
                display_name="Delpher URL",
                description="Link to record on Delpher",
                display_type="url",
                es_mapping=keyword_mapping(),
                extractor=XML(
                    lambda metadata: Tag("recordIdentifier", string=metadata["id"]),
                    SiblingTag("identifier"),
                    external_file=True,
                ),
            ),
            FieldDefinition(
                name="date",
                display_name="Date",
                description="Publication date.",
                es_mapping={"type": "date", "format": "yyyy-MM-dd"},
                results_overview=True,
                csv_core=True,
                visualizations=["resultscount", "termfrequency"],
                search_filter=filters.DateFilter(
                    self.min_date,
                    self.max_date,
                    description=(
                        "Accept only articles with publication date in this range."
                    ),
                ),
                extractor=Metadata("date"),
            ),
            FieldDefinition(
                name="ocr",
                display_name="OCR confidence",
                description="OCR confidence level.",
                es_mapping={"type": "float"},
                search_filter=filters.RangeFilter(
                    0,
                    100,
                    description=(
                        "Accept only articles for which the Opitical Character Recognition confidence "
                        "indicator is in this range."
                    ),
                ),
                extractor=XML(
                    Tag("OCRConfidencelevel"),
                    external_file=True,
                    transform=lambda x: float(x) * 100,
                ),
                sortable=True,
            ),
            FieldDefinition(
                name="newspaper_title",
                display_name="Newspaper title",
                description="Title of the newspaper",
                results_overview=True,
                es_mapping={"type": "keyword"},
                visualizations=["resultscount", "termfrequency"],
                search_filter=filters.MultipleChoiceFilter(
                    description="Accept only articles in these newspapers.",
                    option_count=len(self.papers),
                ),
                extractor=Metadata("title"),
            ),
            FieldDefinition(
                name="version_of",
                display_name="Version of",
                description="The newspaper is a version of this newspaper.",
                es_mapping={"type": "keyword"},
                extractor=Metadata("isVersionOf"),
            ),
            FieldDefinition(
                name="issue_number",
                display_name="Issue number",
                description="Issue number of the newspaper",
                csv_core=True,
                es_mapping={"type": "integer"},
                extractor=Metadata("issuenumber"),
            ),
            FieldDefinition(
                name="category",
                display_name="Category",
                description="Whether the item is an article, advertisment, etc.",
                csv_core=True,
                es_mapping={"type": "keyword"},
                extractor=XML(
                    lambda metadata: Tag("recordIdentifier", string=metadata["id"]),
                    SiblingTag("subject"),
                    external_file=True,
                ),
                search_filter=filters.MultipleChoiceFilter(
                    description="Accept only articles in these categories.",
                    option_count=2,
                ),
            ),
            FieldDefinition(
                name="circulation",
                display_name="Circulation",
                description="The area in which the newspaper was distributed.",
                es_mapping={"type": "keyword"},
                csv_core=True,
                extractor=Metadata("spatial"),
                search_filter=filters.MultipleChoiceFilter(
                    description="Accept only articles appearing in specific areas.",
                    option_count=7,
                ),
            ),
            FieldDefinition(
                name="publisher",
                display_name="Publisher",
                description="Publisher",
                es_mapping=keyword_mapping(),
                extractor=Metadata("publisher"),
            ),
            FieldDefinition(
                name="language",
                display_name="Language",
                description="language",
                es_mapping={"type": "keyword"},
                extractor=Metadata("language"),
            ),
            FieldDefinition(
                name="article_title",
                display_name="Article title",
                description="Article title",
                results_overview=True,
                search_field_core=True,
                searchable=True,
                extractor=XML(Tag("title"), flatten=True, toplevel=True),
            ),
            FieldDefinition(
                name="id",
                display_name="ID",
                description="Unique identifier of the entry.",
                extractor=Metadata("id"),
            ),
            FieldDefinition(
                name="source",
                display_name="Source",
                description="Library or archive which keeps the hard copy of this newspaper.",
                es_mapping={"type": "keyword"},
                extractor=Metadata("source"),
            ),
            FieldDefinition(
                name="pub_place",
                display_name="Publication Place",
                description="Where the newspaper was published",
                es_mapping={"type": "keyword"},
                extractor=Metadata("pub_place"),
            ),
            FieldDefinition(
                name="temporal",
                display_name="Edition",
                description="Newspaper edition for the given date",
                results_overview=True,
                csv_core=True,
                es_mapping={"type": "keyword"},
                visualizations=["resultscount", "termfrequency"],
                search_filter=filters.MultipleChoiceFilter(
                    description="Accept only articles in newspapers which appeared as a given edition.",
                    option_count=3,
                ),
                extractor=Metadata("temporal"),
            ),
            FieldDefinition(
                name="content",
                display_name="Content",
                display_type="text_content",
                description="Text content.",
                es_mapping=main_content_mapping(True, True, True, "nl"),
                results_overview=True,
                search_field_core=True,
                extractor=XML(
                    Tag("p"),
                    multiple=True,
                    flatten=True,
                    toplevel=True,
                    transform="\n".join,
                ),
                visualizations=["wordcloud", "ngram"],
                language="nl",
            ),
        ]

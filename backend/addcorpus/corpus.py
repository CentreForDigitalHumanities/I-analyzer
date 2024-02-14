'''
Module contains the base classes from which corpora can derive;
'''

from ianalyzer_readers.extractors import extract
import itertools
import bs4
import csv
import sys
from datetime import datetime
from os.path import isdir

from django.conf import settings

from ianalyzer_readers.readers.core import Reader, Field
from ianalyzer_readers.readers.xml import XMLReader
from ianalyzer_readers.readers.csv import CSVReader
from ianalyzer_readers.readers.html import HTMLReader
from ianalyzer_readers.readers.xlsx import XLSXReader

import logging

logger = logging.getLogger('indexing')


class CorpusDefinition(Reader):
    '''
    Subclasses of this class define corpora and their documents by specifying:

    - How to obtain its source files.
    - What attributes its documents have.
    - How to extract said attributes from the source files.
    - What each attribute looks like in terms of the search form.
    '''

    @property
    def title(self):
        '''
        Title of the corpus
        '''
        raise NotImplementedError('CorpusDefinition missing title')

    @property
    def description(self):
        '''
        Short description of the corpus
        '''
        raise NotImplementedError('CorpusDefinition missing description')

    @property
    def min_date(self):
        '''
        Minimum timestamp for data files.
        '''
        raise NotImplementedError('CorpusDefinition missing min_date')

    @property
    def max_date(self):
        '''
        Maximum timestamp for data files.
        '''
        raise NotImplementedError('CorpusDefinition missing max_date')

    '''
    Language(s) used in the corpus

    Should be a list of strings. Each language should
    correspond to an ISO-639 code.
    '''
    languages = ['']

    @property
    def category(self):
        '''
        Type of documents in the corpus

        See addcorpus.constants.CATEGORIES for options
        '''
        raise NotImplementedError('CorpusDefinition missing category')

    @property
    def es_index(self):
        '''
        ElasticSearch index name.
        '''
        raise NotImplementedError('CorpusDefinition es_index')

    '''
    Elasticsearch alias. Defaults to None.
    '''
    es_alias = None

    '''
    Dictionary containing ElasticSearch settings for the corpus' index.
    Can be overridden, usually to set analysers for fields. By default contains the
    setting to ensure `number_of_replicas` is zero on index creation (this is better
    while creating an index). Should you choose to overwrite this, consider  using
    the `addcorpus.es_settings` module.
    '''
    es_settings = {'index': {'number_of_replicas': 0}}

    '''
    A dictionary that specifies how documents can be grouped into a "context". For example,
    parliamentary speeches may be grouped into debates. The dictionary has two keys:
    - `'context_fields'`: a list of the `name`s of the fields that can be used to
    group documents. The context of a document is the set of documents that match
    its value for all the listed fields.
    - `'sort_field'`: the `name` of the field by which documents can be sorted
    within their respective group. The field should be marked as `sortable`. If `None`,
    no sorting will be applied.
    - `'sort_direction'`: direction of sorting to be applied, can be `'asc'` or `'desc'`
    - `'context_display_name'`: The display name for the context used in the interface. If
    `None`, use the displayName of the first context field.
    '''
    document_context = {
        'context_fields': None,
        'sort_field': None,
        'context_display_name': None
    }

    @property
    def image(self):
        '''
        Name of the corpus image. Should be relative path from a directory 'images'
        in the same directory as the corpus definition file.
        '''
        raise NotImplementedError('CorpusDefinition missing image')

    '''
    MIME type of scanned documents (images)
    '''
    scan_image_type = None

    '''
    path where word models are stored
    '''
    word_model_path = None

    @property
    def word_models_present(self):
        '''
        if word models are present for this corpus
        '''
        return self.word_model_path != None and isdir(self.word_model_path)

    @property
    def new_highlight(self):
        '''
        if the corpus has been re-indexed using the top-level term vector 'with_positions_offsets'
        for the main content field, needed for the updated highlighter
        TODO: remove this property and its references when all corpora are reindexed using the
        current definitions (with the top-level term vector for speech)
        '''
        try:
            highlight_corpora = settings.NEW_HIGHLIGHT_CORPORA
        except:
            return False
        return self.title in highlight_corpora

    '''
    Allow the downloading of source images
    '''
    allow_image_download = False

    '''
    filename of markdown document with a comprehensive description
    '''
    description_page = None

    def update_body(self, **kwargs):
        ''' given one document in the index, give an instruction
        of how to update the index
        (based on script or partial data)
        '''
        return None

    def update_script(self, **kwargs):
        ''' return a (generator of a) Elasticsearch
        update_by_query script
        '''
        return None

    def update_query(self, **kwargs):
        ''' given the min date and max date of the
        time period for which the update should be performed,
        return a query restricting the result set
        Default is a match_all query.
        '''
        return {
            "query": {
                "match_all": {}
            }
        }

    def request_media(self, document, corpus_name):
        '''
        Get a dictionary with
        'media': list of urls from where media associated with a document can be fetched,
        'info': information for file download

        Arguments:
        - `document`: dict representation of document. Field values are stored in `fieldValues`
        - `corpus_name`: name of the corpus in settings. Needed to create urls with the proper corpus name.
        '''
        return {'media': None, 'info': None}

    def es_mapping(self):
        '''
        Create the ElasticSearch mapping for the fields of this corpus. May be
        passed to the body of an ElasticSearch index creation request.
        '''
        return {
            'properties': {
                field.name: field.es_mapping
                for field in self.fields
                if field.es_mapping and field.indexed
            }
        }

    def sources(self, start=datetime.min, end=datetime.max):
        '''
        Obtain source files for the corpus, relevant to the given timespan.

        Specifically, returns an iterator of tuples that each contain a string
        filename and a dictionary of associated metadata. The latter is usually
        empty or contains only a timestamp; but any data that is to be
        extracted without reading the file itself can be specified there.
        '''
        super().sources(start=start, end=end)

class ParentCorpusDefinition(CorpusDefinition):
    ''' A class from which other corpus definitions can inherit.
    This class is in charge of setting fields, usually without defining an extractor.
    The subclassed CorpusDefinitions will set extractors on the fields -
    this way, CorpusDefinitions can share the same mappings and filters,
    while the logic to collect sources and populate the fields can be different.
    The ParentCorpusDefinition can also be used to allow cross-corpus search and filtering.
    '''
    # define fields property so it can be set in __init__
    @property
    def fields(self):
        return self._fields

    @fields.setter
    def fields(self, value):
        self._fields = value

    def __init__(self):
        ''' Specify a list of fields which all subclasses share
            A subclass of ParentCorpusDefinition will provide extractors for the fields,
            and potentially prune down the list of fields to those which have an extractor
        '''
        self.fields = []

class XMLCorpusDefinition(CorpusDefinition, XMLReader):
    '''
    An XMLCorpus is any corpus that extracts its data from XML sources.
    '''

class HTMLCorpusDefinition(CorpusDefinition, HTMLReader):
    '''
    An HTMLCorpus is any corpus that extracts its data from HTML sources.
    '''

class CSVCorpusDefinition(CorpusDefinition, CSVReader):
    '''
    An CSVCorpus is any corpus that extracts its data from CSV sources.
    '''

class XLSXCorpusDefinition(CorpusDefinition, XLSXReader):
    '''
    An CSVCorpus is any corpus that extracts its data from an XLSX spreadsheet.
    '''

class JSONCorpusDefinition(CorpusDefinition):
    '''
    Corpus definition for json encoded data.
    '''

    def source2dicts(self, source, *nargs, **kwargs):
        self._reject_extractors(extract.XML, extract.CSV)

        field_dict = {
           field.name: field.extractor.apply(source, *nargs, **kwargs)
            for field in self.fields
        }

        yield field_dict

# Fields ######################################################################

class FieldDefinition(Field):
    '''
    Fields may hold the following data:
    - a short hand name (name)
    - the name shown shown to the user (display name)
    - what kind of data they contain, e.g. text, keywords... (display type)
    - an explanation of the field (description)
    - whether they are added to the Elasticsearch index (indexed)
    - whether they are hidden from the frontend (hidden)
    - whether they appear in the overview of results (results_overview)
    - whether they appear in the preselection of csv fields (csv_core)
    - whether they appear in the preselection of search fields (search_field_core)
    - whether they are associated with a visualization type (visualizations)
        options: resultscount, termfrequency, wordcloud, ngram
    - how the visualization's x-axis should be sorted (visualization_sort)
    - the mapping of the field in Elasticsearch (es_mapping)
    - definitions for if the field is also used as search filter (search_filter)
    - how to extract data from the source documents (extractor)
    - whether you can sort by this field (sortable)
    - whether you can search this field (searchable)
    - whether this field is required

    In short, this is how all things related to the informational structure of
    each particular corpus is stored.
    '''

    def __init__(self,
                 name=None,
                 display_name=None,
                 display_type=None,
                 description='',
                 indexed=True,
                 hidden=False,
                 results_overview=False,
                 csv_core=False,
                 search_field_core=False,
                 visualizations=[],
                 visualization_sort=None,
                 es_mapping={'type': 'text'},
                 language=None,
                 search_filter=None,
                 extractor=extract.Constant(None),
                 sortable=None,
                 primary_sort=False,
                 searchable=None,
                 downloadable=True,
                 required=False,
                 **kwargs
                 ):

        super().__init__(
            name=name,
            extractor=extractor,
            required=required,
            skip=not indexed,
        )

        mapping_type = es_mapping['type']

        self.display_name = display_name or name
        self.display_type = display_type or mapping_type
        self.description = description
        self.search_filter = search_filter
        self.results_overview = results_overview
        self.csv_core = csv_core
        self.search_field_core = search_field_core
        self.visualizations = visualizations
        self.visualization_sort = visualization_sort
        self.es_mapping = es_mapping
        self.language = language
        self.hidden = not indexed or hidden

        self.sortable = sortable if sortable != None else \
            not hidden and indexed and \
            mapping_type in ['integer', 'float', 'date']

        self.primary_sort = primary_sort

        # Fields are searchable if they are not hidden and if they are mapped as 'text'.
        # Keyword fields without a filter are also searchable.
        self.searchable = searchable if searchable != None else \
            not hidden and indexed and \
            ((mapping_type == 'text') or
             (mapping_type == 'keyword' and self.search_filter == None))
        # Add back reference to field in filter
        self.downloadable = downloadable

        if self.search_filter:
            self.search_filter.field = self


# Helper functions ############################################################


def string_contains(target):
    '''
    Return a predicate that performs a case-insensitive search for the target
    string and returns whether it was found.
    '''
    def f(string):
        return bool(target.lower() in string.lower() if string else False)
    return f


def until(year):
    '''
    Returns a predicate to determine from metadata whether its 'date' field
    represents a date before or on the given year.
    '''
    def f(metadata):
        date = metadata.get('date')
        return date and date.year <= year
    return f


def after(year):
    '''
    Returns a predicate to determine from metadata whether its 'date' field
    represents a date after the given year.
    '''
    def f(metadata):
        date = metadata.get('date')
        return date and date.year > year
    return f


def consolidate_start_end_years(start, end, min_date, max_date):
    ''' given a start and end date provided by the user, make sure
    - that start is not before end
    - that start is not before min_date (corpus variable)
    - that end is not after max_date (corpus variable)
    '''
    if isinstance(start, int):
        start = datetime(year=start, month=1, day=1)
    if isinstance(end, int):
        end = datetime(year=end, month=12, day=31)
    if start > end:
        tmp = start
        start = end
        end = tmp
    if start < min_date:
        start = min_date
    if end > max_date:
        end = max_date


def transform_to_date_range(earliest, latest):
    if not earliest:
        earliest = '0001-01-01'
    if not latest:
        latest = datetime.today().isoformat()[:10]
    return {
        'gte': earliest,
        'lte': latest
    }

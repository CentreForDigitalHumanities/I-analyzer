'''
Module contains the base classes from which corpora can derive;
'''

from . import extract
import itertools
import bs4
import csv
import sys
from datetime import datetime
from os.path import isdir

from django.conf import settings

import logging

logger = logging.getLogger('indexing')


class CorpusDefinition(object):
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
    def data_directory(self):
        '''
        Path to source data directory.
        '''
        raise NotImplementedError('CorpusDefinition missing data_directory')

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
        raise NotImplementedError('CorpusDefinition missing category')

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

    @property
    def fields(self):
        '''
        Each corpus should implement a list of fields, that is, instances of
        the `Field` class, containing information about each attribute.
        MUST include a field with `name='id'`.
        '''
        raise NotImplementedError('CorpusDefinition missing fields')


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
        raise NotImplementedError('CorpusDefinition missing sources')

    def source2dicts(self, sources):
        '''
        Generate an iterator of document dictionaries from a given source file.

        The dictionaries are created from this corpus' `Field`s.
        '''
        raise NotImplementedError('CorpusDefinition missing source2dicts')

    def documents(self, sources=None):
        '''
        Generate an iterator of document dictionaries directly from the source
        files. The source files are generated by self.sources(); however, if
        `sources` is specified, those source/metadata tuples are used instead.
        '''
        sources = sources or self.sources()
        return (document
                for source in sources
                for document in self.source2dicts(
                    source
                )
                )

    def _reject_extractors(self, *inapplicable_extractors):
        '''
        Raise errors if any fields use extractors that are not applicable
        for the corpus.
        '''
        for field in self.fields:
            if isinstance(field.extractor, inapplicable_extractors):
                raise RuntimeError(
                    "Specified extractor method cannot be used with this type of data")
    
class ParentCorpusDefinition(CorpusDefinition):
    ''' A class from which other corpus definitions can inherit.
    This class is in charge of setting fields, usually without defining an extractor.
    The subclassed CorpusDefinitions will set extractors on the fields -
    this way, CorpusDefinitions can share the same mappings and filters,
    while the logic to collect sources and populate the fields can be different.
    The ParentCorpusDefinition can also be used to allow cross-corpus search and filtering.
    '''
    #define fields property so it can be set in __init__
    @property
    def fields(self):
        return self._fields

    @fields.setter
    def fields(self, value):
        self._fields = value

    def __init__(self):
        ''' Specify a list of fields which all subclasses share
            A subclass of ParentCorpusDefinition will provide extractors for the fields,
            and potentially prune done the list of fields to those which have an extractor
        '''
        self.fields = []


class XMLCorpusDefinition(CorpusDefinition):
    '''
    An XMLCorpus is any corpus that extracts its data from XML sources.
    '''


    '''
    The top-level tag in the source documents.

    Can be:
    - None
    - A string with the name of the tag
    - A dictionary that gives the named arguments to soup.find_all()
    - A bound method that takes the metadata of the document as input and outputs one of the above.
    '''
    tag_toplevel = None

    '''
    The tag that corresponds to a single document entry.

    Can be:
    - None
    - A string with the name of the tag
    - A dictionary that gives the named arguments to soup.find_all()
    - A bound method that takes the metadata of the document as input and outputs one of the above.
    '''
    tag_entry = None

    def source2dicts(self, source):
        '''
        Generate document dictionaries from a given XML file. This is the
        default implementation for XML layouts; may be subclassed if more
        '''
        # Make sure that extractors are sensible
        self._reject_extractors(extract.CSV)

        # extract information from external xml files first, if applicable
        metadata = {}
        if isinstance(source, str):
            # no metadata
            filename = source
            soup = self.soup_from_xml(filename)
        elif isinstance(source, bytes):
            soup = self.soup_from_data(source)
            filename = soup.find('RecordID')
        else:
            filename = source[0]
            soup = self.soup_from_xml(filename)
            metadata = source[1] or None
            soup = self.soup_from_xml(filename)
        if metadata and 'external_file' in metadata:
            external_fields = [field for field in self.fields if
                               isinstance(field.extractor, extract.XML) and
                               field.extractor.external_file]
            regular_fields = [field for field in self.fields if
                              field not in external_fields]
            external_soup = self.soup_from_xml(metadata['external_file'])
        else:
            regular_fields = self.fields
            external_dict = {}
            external_fields = None
        required_fields = [
            field.name for field in self.fields if field.required]
        # Extract fields from the soup
        tag = self.get_tag_requirements(self.tag_entry, metadata)
        bowl = self.bowl_from_soup(soup, metadata=metadata)
        if bowl:
            spoonfuls = bowl.find_all(**tag) if tag else [bowl]
            for i, spoon in enumerate(spoonfuls):
                regular_field_dict = {field.name: field.extractor.apply(
                    # The extractor is put to work by simply throwing at it
                    # any and all information it might need
                    soup_top=bowl,
                    soup_entry=spoon,
                    metadata=metadata,
                    index=i,
                ) for field in regular_fields if field.indexed}
                external_dict = {}
                if external_fields:
                    metadata.update(regular_field_dict)
                    external_dict = self.external_source2dict(
                        external_soup, external_fields, metadata)

                # yield the union of external fields and document fields
                full_dict = dict(itertools.chain(
                    external_dict.items(), regular_field_dict.items()))

                # check if required fields are filled
                if all((full_dict[field_name]
                        for field_name in required_fields)):
                    yield full_dict
        else:
            logger.warning(
                'Top-level tag not found in `{}`'.format(filename))

    def get_tag_requirements(self, specification, metadata):
        '''
        Get the requirements for a tag given the specification.

        The specification can be:
        - None
        - A string with the name of the tag
        - A dict with the named arguments to soup.find() / soup.find_all()
        - A callable that takes the document metadata as input and outputs one of the above.

        Output is either None or a dict with the arguments for soup.find() / soup.find_all()
        '''

        if callable(specification):
            condition = specification(metadata)
        else:
            condition = specification

        if condition is None:
            return None
        elif type(condition) == str:
            return {'name': condition}
        elif type(condition) == dict:
            return condition
        else:
            raise TypeError('Tag must be a string or dict')

    def external_source2dict(self, soup, external_fields, metadata):
        '''
        given an external xml file with metadata,
        return a dictionary with tags which were found in that metadata
        wrt to the current source.
        '''
        external_dict = {}
        for field in external_fields:
            bowl = self.bowl_from_soup(
                soup, field.extractor.external_file['xml_tag_toplevel'])
            spoon = None
            if field.extractor.secondary_tag:
                # find a specific subtree in the xml tree identified by matching a secondary tag
                try:
                    spoon = bowl.find(
                        field.extractor.secondary_tag['tag'],
                        string=metadata[field.extractor.secondary_tag['match']]).parent
                except:
                    logging.debug('tag {} not found in metadata'.format(
                        field.extractor.secondary_tag
                    ))
            if not spoon:
                spoon = field.extractor.external_file['xml_tag_entry']
            if bowl:
                external_dict[field.name] = field.extractor.apply(
                    soup_top=bowl,
                    soup_entry=spoon,
                    metadata=metadata
                )
            else:
                logger.warning(
                    'Top-level tag not found in `{}`'.format(bowl))
        return external_dict

    def soup_from_xml(self, filename):
        '''
        Returns beatifulsoup soup object for a given xml file
        '''
        # Loading XML
        logger.info('Reading XML file {} ...'.format(filename))
        with open(filename, 'rb') as f:
            data = f.read()
        logger.info('Loaded {} into memory...'.format(filename))
        return self.soup_from_data(data)

    def soup_from_data(self, data):
        '''
        Parses content of a xml file
        '''
        return bs4.BeautifulSoup(data, 'lxml-xml')

    def bowl_from_soup(self, soup, toplevel_tag=None, entry_tag=None, metadata = {}):
        '''
        Returns bowl (subset of soup) of soup object. Bowl contains everything within the toplevel tag.
        If no such tag is present, it contains the entire soup.
        '''
        if toplevel_tag == None:
            toplevel_tag = self.get_tag_requirements(self.tag_toplevel, metadata)

        return soup.find(**toplevel_tag) if toplevel_tag else soup

    def metadata_from_xml(self, filename, tags):
        '''
        Given a filename of an xml with metadata, and a range of tags to extract,
        return a dictionary of all the contents of the requested tags.
        A tag can either be a string, or a dictionary:
        {
            "tag": "tag_to_extract",
            "attribute": attribute to additionally filter on, optional
            "save_as": key to use in output dictionary, optional
        }
        '''
        out_dict = {}
        soup = self.soup_from_xml(filename)
        for tag in tags:
            if isinstance(tag, str):
                tag_info = soup.find(tag)
                if not tag_info:
                    continue
                out_dict[tag] = tag_info.text
            else:
                candidates = soup.find_all(tag['tag'])
                if 'attribute' in tag:
                    right_tag = next((candidate for candidate in candidates if
                                      candidate.attrs == tag['attribute']), None)
                elif 'list' in tag:
                    if 'subtag' in tag:
                        right_tag = [candidate.find(
                            tag['subtag']) for candidate in candidates]
                    else:
                        right_tag = candidates
                elif 'subtag' in tag:
                    right_tag = next((candidate.find(tag['subtag']) for candidate in candidates if
                                      candidate.find(tag['subtag'])), None)
                else:
                    right_tag = next((candidate for candidate in candidates if
                                      candidate.attrs == {}), None)
                if not right_tag:
                    continue
                if 'save_as' in tag:
                    out_tag = tag['save_as']
                else:
                    out_tag = tag['tag']
                if 'list' in tag:
                    out_dict[out_tag] = [t.text for t in right_tag]
                else:
                    out_dict[out_tag] = right_tag.text
        return out_dict


class HTMLCorpusDefinition(XMLCorpusDefinition):
    '''
    An HTMLCorpus is any corpus that extracts its data from HTML sources.
    '''

    def source2dicts(self, source):
        '''
        Generate a document dictionaries from a given HTML file. This is the
        default implementation for HTML layouts; may be subclassed if more
        '''
        (filename, metadata) = source

        self._reject_extractors(extract.CSV)

        # Loading HTML
        logger.info('Reading HTML file {} ...'.format(filename))
        with open(filename, 'rb') as f:
            data = f.read()
        # Parsing HTML
        soup = bs4.BeautifulSoup(data, 'html.parser')
        logger.info('Loaded {} into memory ...'.format(filename))

        # Extract fields from soup
        tag0 = self.tag_toplevel
        tag = self.tag_entry

        bowl = soup.find(tag0) if tag0 else soup

        # if there is a entry level tag, with html this is not always the case
        if bowl and tag:
            # Note that this is non-recursive: will only find direct descendants of the top-level tag
            for i, spoon in enumerate(bowl.find_all(tag)):
                # yield
                yield {
                    field.name: field.extractor.apply(
                        # The extractor is put to work by simply throwing at it
                        # any and all information it might need
                        soup_top=bowl,
                        soup_entry=spoon,
                        metadata=metadata,
                        index=i
                    ) for field in self.fields if field.indexed
                }
        else:
            # yield all page content
            yield {
                field.name: field.extractor.apply(
                    # The extractor is put to work by simply throwing at it
                    # any and all information it might need
                    soup_top='',
                    soup_entry=soup,
                    metadata=metadata,
                ) for field in self.fields if field.indexed
            }


class CSVCorpusDefinition(CorpusDefinition):
    '''
    An CSVCorpus is any corpus that extracts its data from CSV sources.
    '''

    '''
    If applicable, the field that identifies entries. Subsequent rows with the same
    value for this field are treated as a single document. If left blank, each row
    is treated as a document.
    '''
    field_entry = None

    '''
    Specifies a required field, for example the main content. Rows with
    an empty value for `required_field` will be skipped.
    '''
    required_field = None

    '''
    The delimiter for the CSV reader.
    '''
    delimiter = ','

    '''
    Number of lines to skip before reading the header
    '''
    skip_lines = 0

    def source2dicts(self, source):
        # make sure the field size is as big as the system permits
        csv.field_size_limit(sys.maxsize)
        self._reject_extractors(extract.XML, extract.FilterAttribute)

        if isinstance(source, str):
            filename = source
            metadata = {}
        if isinstance(source, bytes):
            raise NotImplementedError()
        else:
            filename, metadata = source

        with open(filename, 'r') as f:
            logger.info('Reading CSV file {}...'.format(filename))

            # skip first n lines
            for _ in range(self.skip_lines):
                next(f)

            reader = csv.DictReader(f, delimiter=self.delimiter)
            document_id = None
            rows = []
            index = 0
            for row in reader:
                is_new_document = True

                if self.required_field and not row.get(self.required_field):  # skip row if required_field is empty
                    continue


                if self.field_entry:
                    identifier = row[self.field_entry]
                    if identifier == document_id:
                        is_new_document = False
                    else:
                        document_id = identifier

                if is_new_document and rows:
                    yield self.document_from_rows(rows, metadata, index)
                    rows = [row]
                    index += 1
                else:
                    rows.append(row)

            yield self.document_from_rows(rows, metadata, index)

    def document_from_rows(self, rows, metadata, row_index):
        doc = {
            field.name: field.extractor.apply(
                # The extractor is put to work by simply throwing at it
                # any and all information it might need
                rows=rows, metadata = metadata, index=row_index
            )
            for field in self.fields if field.indexed
        }

        return doc



# Fields ######################################################################

class FieldDefinition(object):
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

        mapping_type = es_mapping['type']

        self.name = name
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
        self.indexed = indexed
        self.hidden = not indexed or hidden
        self.extractor = extractor
        self.required = required

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

'''
Module contains the base classes from which corpora can derive;
'''

from . import extract
from zipfile import ZipExtFile
import itertools
import inspect
import json
import bs4
import csv
import sys
from datetime import datetime, timedelta
import logging
logger = logging.getLogger('indexing')


class Corpus(object):
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
        Path to source data directory.
        '''
        raise NotImplementedError()

    @property
    def description(self):
        '''
        Minimum timestamp for data files.
        '''
        raise NotImplementedError()

    @property
    def data_directory(self):
        '''
        Path to source data directory.
        '''
        raise NotImplementedError()

    @property
    def min_date(self):
        '''
        Minimum timestamp for data files.
        '''
        raise NotImplementedError()

    @property
    def max_date(self):
        '''
        Maximum timestamp for data files.
        '''
        raise NotImplementedError()

    @property
    def es_index(self):
        '''
        ElasticSearch index name.
        '''
        raise NotImplementedError()

    @property
    def es_alias(self):
        '''
        Elasticsearch alias. Defaults to None.
        '''
        return None

    @property
    def es_settings(self):
        '''
        Dictionary containing ElasticSearch settings for the corpus' index.
        Can be overridden in case we want, e.g., "AND" instead of "OR" for
        combining query terms. By default contains the setting to ensure `number_of_replicas`
        is zero on index creation (this is better while creating an index). Should you choose
        to overwrite this, consider copying this setting.
        '''
        return {'index': {'number_of_replicas': 0}}

    @property
    def fields(self):
        '''
        Each corpus should implement a list of fields, that is, instances of
        the `Field` class, containing information about each attribute.
        MUST include a field with `name='id'`.
        '''
        raise NotImplementedError()

    @property
    def document_context(self):
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

        return {
            'context_fields': None,
            'sort_field': None,
            'context_display_name': None
        }

    @property
    def image(self):
        '''
        Absolute url to static image.
        '''
        raise NotImplementedError()

    # @property
    def scan_image_type(self):
        '''
        Filetype of scanned documents (images)
        '''
        if self.scan_image_type is None:
            return None
        else:
            return self.scan_image_type

    def word_models_present(self):
        '''
        if word models are present for this corpus
        '''
        if self.word_models_present is None:
            return False
        else:
            return self.word_models_present

    def allow_image_download(self):
        '''
        Allow the downloading of source images
        '''
        if self.allow_image_download is None:
            return False
        else:
            return self.allow_image_download

    def description_page(self):
        '''
        URL to markdown document with a comprehensive description
        '''
        return None

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

    def request_media(self, document):
        '''
        Get a dictionary with
        'media': list of urls from where media associated with a document can be fetched,
        'info': information for file download
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

    def json(self):
        '''
        Corpora should be able to produce JSON, so that the fields they define
        can be used by other codebases, while retaining the Python class as the
        single source of truth.
        '''
        corpus_dict = self.serialize()
        json_dict = json.dumps(corpus_dict)
        return json_dict

    def serialize(self):
        """
        Convert corpus object to a JSON-friendly dict format.
        """
        corpus_dict = {}

        # gather attribute names
        # exclude:
        # - methods not implemented in Corpus class
        # - hidden attributes
        # - attributes listed in `exclude`
        # - bound methods
        exclude = ['data_directory', 'es_settings']
        corpus_attribute_names = [
            a for a in dir(self)
            if a in dir(Corpus) and not a.startswith('_') and a not in exclude and not inspect.ismethod(self.__getattribute__(a))
        ]

        # collect values
        corpus_attributes = [(a, getattr(self, a)) for a in corpus_attribute_names ]

        for ca in corpus_attributes:
            if ca[0] == 'fields':
                field_list = []
                for field in self.fields:
                    field_list.append(field.serialize())
                corpus_dict[ca[0]] = field_list
            elif type(ca[1]) == datetime:
                timedict = {'year': ca[1].year,
                            'month': ca[1].month,
                            'day': ca[1].day,
                            'hour': ca[1].hour,
                            'minute': ca[1].minute}
                corpus_dict[ca[0]] = timedict
            else:
                corpus_dict[ca[0]] = ca[1]
        return corpus_dict

    def sources(self, start=datetime.min, end=datetime.max):
        '''
        Obtain source files for the corpus, relevant to the given timespan.

        Specifically, returns an iterator of tuples that each contain a string
        filename and a dictionary of associated metadata. The latter is usually
        empty or contains only a timestamp; but any data that is to be
        extracted without reading the file itself can be specified there.
        '''
        raise NotImplementedError()

    def source2dicts(self, sources):
        '''
        Generate an iterator of document dictionaries from a given source file.

        The dictionaries are created from this corpus' `Field`s.
        '''
        raise NotImplementedError()

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


class XMLCorpus(Corpus):
    '''
    An XMLCorpus is any corpus that extracts its data from XML sources.
    '''

    @property
    def tag_toplevel(self):
        '''
        The top-level tag in the source documents.
        '''

    @property
    def tag_entry(self):
        '''
        The tag that corresponds to a single document entry.
        '''

    def source2dicts(self, source):
        '''
        Generate document dictionaries from a given XML file. This is the
        default implementation for XML layouts; may be subclassed if more
        '''
        # Make sure that extractors are sensible
        for field in self.fields:
            if not isinstance(field.extractor, (
                extract.Choice,
                extract.Combined,
                extract.XML,
                extract.Metadata,
                extract.Constant,
                extract.ExternalFile,
                extract.Backup,
            )):
                raise RuntimeError(
                    "Specified extractor method cannot be used with an XML corpus")
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
        # Extract fields from the soup
        tag = self.tag_entry
        bowl = self.bowl_from_soup(soup)
        if bowl:
            for spoon in bowl.find_all(tag):
                regular_field_dict = {field.name: field.extractor.apply(
                    # The extractor is put to work by simply throwing at it
                    # any and all information it might need
                    soup_top=bowl,
                    soup_entry=spoon,
                    metadata=metadata
                ) for field in regular_fields if field.indexed}
                external_dict = {}
                if external_fields:
                    metadata.update(regular_field_dict)
                    external_dict = self.external_source2dict(
                        external_soup, external_fields, metadata)
                # yield the union of external fields and document fields
                yield dict(itertools.chain(external_dict.items(), regular_field_dict.items()))
        else:
            logger.warning(
                'Top-level tag not found in `{}`'.format(filename))

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
                spoon = bowl.find(
                    field.extractor.secondary_tag['tag'],
                    string=metadata[field.extractor.secondary_tag['match']]).parent
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

    def bowl_from_soup(self, soup, toplevel_tag=None, entry_tag=None):
        '''
        Returns bowl (subset of soup) of soup object. Bowl contains everything within the toplevel tag.
        If no such tag is present, it contains the entire soup.
        '''
        if toplevel_tag == None:
            toplevel_tag = self.tag_toplevel
        if entry_tag == None:
            entry_tag = self.tag_entry

        return soup.find(toplevel_tag) if toplevel_tag else soup

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


class HTMLCorpus(XMLCorpus):
    '''
    An HTMLCorpus is any corpus that extracts its data from HTML sources.
    '''

    def source2dicts(self, source):
        '''
        Generate a document dictionaries from a given HTML file. This is the
        default implementation for HTML layouts; may be subclassed if more
        '''
        (filename, metadata) = source

        # Make sure that extractors are sensible
        for field in self.fields:
            if not isinstance(field.extractor, (
                extract.Choice,
                extract.Combined,
                extract.HTML,
                extract.Metadata,
                extract.Constant,
                extract.Backup,
            )):
                raise RuntimeError(
                    "Specified extractor method cannot be used with an HTML corpus")

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
            for spoon in bowl.find_all(tag):
                # yield
                yield {
                    field.name: field.extractor.apply(
                        # The extractor is put to work by simply throwing at it
                        # any and all information it might need
                        soup_top=bowl,
                        soup_entry=spoon,
                        metadata=metadata
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
                    metadata=metadata
                ) for field in self.fields if field.indexed
            }


class CSVCorpus(Corpus):
    '''
    An CSVCorpus is any corpus that extracts its data from CSV sources.
    '''

    @property
    def field_entry(self):
        '''
        If applicable, the field that identifies entries. Subsequent rows with the same
        value for this field are treated as a single document. If left blank, each row
        is treated as a document.
        '''

    @property
    def required_field(self):
        '''
        Specifies a required field, for example the main content. Rows with
        an empty value for `required_field` will be skipped.
        '''

    def source2dicts(self, source):
        # make sure the field size is as big as the system permits
        csv.field_size_limit(sys.maxsize)
        for field in self.fields:
            if not isinstance(field.extractor, (
                extract.Choice,
                extract.Combined,
                extract.CSV,
                extract.Constant,
                extract.Backup,
            )):
                raise RuntimeError(
                    "Specified extractor method cannot be used with a CSV corpus")

        if isinstance(source, str):
            filename = source
        if isinstance(source, bytes):
            raise NotImplementedError()
        else:
            filename = source[0]

        with open(filename, 'r') as f:
            logger.info('Reading CSV file {}...'.format(filename))
            reader = csv.DictReader(f)
            document_id = None
            rows = []
            for row in reader:
                is_new_document = True

                if self.required_field and not row[self.required_field]:  # skip row if required_field is empty
                    continue


                if self.field_entry:
                    identifier = row[self.field_entry]
                    if identifier == document_id:
                        is_new_document = False
                    else:
                        document_id = identifier

                if is_new_document and rows:
                    yield self.document_from_rows(rows)
                    rows = [row]
                else:
                    rows.append(row)

            yield self.document_from_rows(rows)

    def document_from_rows(self, rows):
        doc = {
            field.name: field.extractor.apply(
                # The extractor is put to work by simply throwing at it
                # any and all information it might need
                rows=rows,
            )
            for field in self.fields if field.indexed
        }

        return doc



# Fields ######################################################################

class Field(object):
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
        options: resultscount, termfrequency, wordcloud, relatedwords, ngram
    - how the visualization's x-axis should be sorted (visualization_sort)
    - the mapping of the field in Elasticsearch (es_mapping)
    - definitions for if the field is also used as search filter (search_filter)
    - how to extract data from the source documents (extractor)
    - whether you can sort by this field (sortable)
    - whether you can search this field (searchable)

    In short, this is how all things related to the informational structure of
    each particular corpus is stored.
    '''

    def __init__(self,
                 name=None,
                 display_name=None,
                 display_type=None,
                 description=None,
                 indexed=True,
                 hidden=False,
                 results_overview=False,
                 csv_core=False,
                 search_field_core=False,
                 visualizations=None,
                 visualization_sort=None,
                 es_mapping={'type': 'text'},
                 search_filter=None,
                 extractor=extract.Constant(None),
                 sortable=None,
                 primary_sort=False,
                 searchable=None,
                 downloadable=True,
                 **kwargs
                 ):

        self.name = name
        self.display_name = display_name
        self.display_type = display_type
        self.description = description
        self.search_filter = search_filter
        self.results_overview = results_overview
        self.csv_core = csv_core
        self.search_field_core = search_field_core
        self.visualizations = visualizations
        self.visualization_sort = visualization_sort
        self.es_mapping = es_mapping
        self.indexed = indexed
        self.hidden = not indexed or hidden
        self.extractor = extractor

        self.sortable = sortable if sortable != None else \
            not hidden and indexed and \
            es_mapping['type'] in ['integer', 'float', 'date']

        self.primary_sort = primary_sort

        # Fields are searchable if they are not hidden and if they are mapped as 'text'.
        # Keyword fields without a filter are also searchable.
        self.searchable = searchable if searchable != None else \
            not hidden and indexed and \
            ((self.es_mapping['type'] == 'text') or
             (self.es_mapping['type'] == 'keyword' and self.search_filter == None))
        # Add back reference to field in filter
        self.downloadable = downloadable

        if self.search_filter:
            self.search_filter.field = self

    def serialize(self):
        """
        Convert Field object to a JSON-friendly dict format.
        """
        field_dict = {}
        for key, value in self.__dict__.items():
            if key == 'search_filter' and value != None:
                filter_name = str(type(value)).split(
                    sep='.')[-1][:-2]
                search_dict = {'name': filter_name}
                for search_key, search_value in value.__dict__.items():
                    if search_key == 'search_filter' or search_key != 'field':
                        search_dict[search_key] = search_value
                field_dict['search_filter'] = search_dict
            elif key != 'extractor':
                field_dict[key] = value

        return field_dict


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

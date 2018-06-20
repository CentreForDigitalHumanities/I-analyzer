'''
Module contains the base classes from which corpora can derive;
'''

from datetime import datetime, timedelta
import logging; logger = logging.getLogger(__name__)

import bs4
import json
import inspect

from ianalyzer import extract


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
    def es_doctype(self):
        '''
        ElasticSearch document type name.
        '''
        raise NotImplementedError()



    @property
    def es_settings(self):
        '''
        Dictionary containing ElasticSearch settings for the corpus' index.
        '''
        raise NotImplementedError()


    @property
    def fields(self):
        '''
        Each corpus should implement a list of fields, that is, instances of
        the `Field` class, containing information about each attribute.
        MUST include a field with `name='id'`.
        '''
        raise NotImplementedError()



    def es_mapping(self):
        '''
        Create the ElasticSearch mapping for the fields of this corpus. May be
        passed to the body of an ElasticSearch index creation request.
        '''
        result = {
            'mappings' : {
                self.es_doctype : {
                    'properties': {
                        field.name : field.es_mapping
                        for field in self.fields
                            if field.es_mapping and field.indexed
                    }
                }
            }
        }

        if self.es_settings:
            result['settings'] = self.es_settings

        return result

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
        corpus_dict = {}
        # inspect.getmembers returns tuples for every Class attribute:
        # tuple[0] attribute name; tuple[1] attribute content
        # the following suppresses all private attributes and bound methods,
        # and attributes which are not implemented in the Corpus class
        corpus_attributes = [
            a for a in inspect.getmembers(self)
            if not a[0].startswith('__') and not inspect.ismethod(a[1])
            and a[0] in dir(Corpus)
            ]
        for ca in corpus_attributes:
            if ca[0]=='data_directory':
                continue
            elif ca[0]=='fields':
                field_list = []
                for field in self.fields:
                    field_dict = {}
                    for key, value in field.__dict__.items():
                        if key == 'search_filter' and value != None:
                            filter_name = str(type(value)).split(sep = '.')[-1][:-2]
                            search_dict = {'name': filter_name}
                            for search_key, search_value in value.__dict__.items():
                                if search_key =='search_filter' or search_key != 'field':
                                    search_dict[search_key] = search_value
                            field_dict['search_filter'] = search_dict
                        elif key != 'extractor':
                            field_dict[key] = value
                    field_list.append(field_dict)
                corpus_dict[ca[0]] = field_list
            elif type(ca[1])==datetime:
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



    def source2dicts(self, filename, metadata={}):
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

        if any(isinstance(s, list) for s in sources):
            print('Multiple sources per document')
        else:
            return (document
                for filename, metadata in sources
                    for document in self.source2dicts(
                        filename=filename,
                        metadata=metadata,
                    )
            )



class XMLCorpus(Corpus):
    '''
    An XMLCorpus is any corpus that extracts its data from XML sources.
    '''

    @property
    def xml_tag_toplevel(self):
        '''
        The top-level tag in the XML source documents.
        '''
        raise NotImplementedError()



    @property
    def xml_tag_entry(self):
        '''
        The XML tag that corresponds to a single document entry.
        '''
        raise NotImplementedError()



    def source2dicts(self, filename, metadata={}):
        '''
        Generate a document dictionaries from a given XML file. This is the
        default implementation for XML layouts; may be subclassed if more
        '''

        # Make sure that extractors are sensible
        for field in self.fields:
            if not isinstance(field.extractor, (
                    extract.Choice,
                    extract.Combined,
                    extract.XML,
                    extract.Metadata,
                    extract.Constant
                )):
                raise RuntimeError("Specified extractor method cannot be used with an XML corpus")


        # Loading XML
        logger.info('Reading XML file {} ...'.format(filename))
        with open(filename, 'rb') as f:
            data = f.read()

        # Parsing XML
        soup = bs4.BeautifulSoup(data, 'lxml-xml')

        logger.info('Loaded {} into memory ...'.format(filename))

        # Extract fields from soup
        tag0 = self.xml_tag_toplevel
        tag  = self.xml_tag_entry
        bowl = soup.find(tag0) if tag0 else soup
        if bowl:
            for spoon in bowl.find_all(tag): # Note that this is non-recursive: will only find direct descendants of the top-level tag
                yield {
                    field.name : field.extractor.apply(
                        # The extractor is put to work by simply throwing at it
                        # any and all information it might need
                        soup_top=bowl,
                        soup_entry=spoon,
                        metadata=metadata
                    ) for field in self.fields if field.indexed
                }
        else:
            logger.warning('Top-level tag not found in `{}`'.format(filename))



# Fields ######################################################################


class Field(object):
    '''
    Fields hold data about the name of their columns in CSV files, how the
    corresponding content is to be extracted from the source, how they are
    described in user interfaces, whether the field lends itself to term
    frequency queries, whether it has prominent information
    for the user interface,
    what ElasticSearch filters are associated
    with them, how they are mapped in the index, etcetera.

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
            term_frequency=False,
            prominent_field=False,
            es_mapping={ 'type' : 'text' },
            search_filter=None,
            extractor=extract.Constant(None),
            sortable=None,
            **kwargs
            ):

        self.name = name
        self.display_name = display_name
        self.display_type = display_type
        self.description = description
        self.search_filter = search_filter
        self.term_frequency = term_frequency
        self.prominent_field = prominent_field
        self.es_mapping = es_mapping
        self.indexed = indexed
        self.hidden = not indexed or hidden
        self.extractor = extractor
        
        # We need fields which can be easily mapped to an actual sortable
        # field in Elastic Search. Sorting on XML, or combined fields
        # is also possible but requires that this behavior is defined when
        # performing a sorted search.
        self.sortable = sortable if sortable != None else indexed and not hidden and \
            not (isinstance(extractor, (
                    extract.Choice,
                    extract.Combined,
                    extract.XML,
                    extract.Constant
                )))

        # Add back reference to field in filter
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

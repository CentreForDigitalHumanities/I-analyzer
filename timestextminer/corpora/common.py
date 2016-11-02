'''
Functions and classes common to all corpora.
'''

from .. import extractor


class Field(object):
    '''
    Fields hold data about the name of their columns in CSV files, how the
    corresponding content is to be extracted from BeautifulSoup, how they are
    described in user interfaces, what ElasticSearch filters are associated
    with them, how they are mapped in the index, etcetera.
    
    In short, this is how all things related to the informational structure of
    each particular corpus is stored.
    '''


    def __init__(self,
            name=None, description=None,
            indexed=True, hidden=False,
            mapping=None, filter_=None, extractor=[], **kwargs
        ):

        self.name = name
        self.description = description
        
        self.filter_ = filter_ #...and query only those that don't have a filter?
 
        self.mapping = mapping
 
        self.indexed = indexed
        self.hidden = not indexed or hidden
        self.extractors = (
            [extractor] if callable(extractor) else list(extractor)
        )


    def extractor(self, metadata):
        '''
        Select the appropriate function to extract the data for this field from
        the source file, based on the provided metadata about said source file.
        '''

        for entry in self.extractors:
            try:
                is_appropriate, extractor = entry
            except (ValueError, TypeError): # If it wasn't a tuple, the entry
                return entry # is supposedly an always-appropriate extractor
            else:
                if is_appropriate is None or is_appropriate(**metadata):
                    return extractor
        return extractor.const(None) # when no appropriate extractor is available


    @property
    def filterclass(self):
        return self.filter_ and self.filter_.__class__.__name__



# XML parsing #################################################################

def xml2dicts(fields, tag_top, tag_entry, xmlfile, metadata={}):
    '''
    Generate a document dictionaries from a given XML file, based on a list of 
    `Field`s that know how to extract information from BeautifulSoup.
    '''

    # Loading XML
    logger.debug('Reading XML file {} ...'.format(xmlfile))
    with open(xmlfile, 'rb') as f:
        data = f.read()
        
    # Parsing XML
    logger.debug('Parsing XML file {} ...'.format(xmlfile))
    soup = bs4.BeautifulSoup(data, 'lxml-xml')

    # Extract fields from soup
    soup_bowl = soup.find(tag_top)
    if toplevel:
        for soup_spoon in soup_bowl.find_all(tag_entry):
            yield {
                field.name :
                (field.extractor(metadata))(soup_bowl, soup_spoon, **metadata)
                for field in fields if field.indexed
            }



# Helper functions ############################################################

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

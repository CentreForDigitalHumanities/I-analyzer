'''
Fields hold data about under what name to appear in CSV fields, how the
corresponding content is to be extracted from BeautifulSoup, etcetera.
'''

import extractor
from datetime import datetime

class Field(object):

    def __init__(self,
            name=None, description=None,
            indexed=True, hidden=False,
            mapping=None, options=None,
            sieve=None, extractor=[]
        ):

        self.name = name or self.__class__.__name__.lower()
        self.description = description
        self.sieve = sieve #...and query only those that don't have a filter?
        self.options = options
        self.mapping = mapping
        self.indexed = indexed
        self.hidden = not indexed or hidden
        self.extractors = (
            list(extractor)
                if hasattr(extractor, '__iter__') and
                not (isinstance(extractor, tuple) and len(extractor) > 2) else
            [extractor]
        )


    @property
    def sieve_class(self):
        return self.sieve and self.sieve.__class__.__name__


    def extractor(self, **meta):
        '''
        Select the appropriate extractor function based on given metadata.
        '''

        for x in self.extractors:
            try:
                applicability, extract = x
            except (ValueError, TypeError):
                return x
            else:
                if applicability is None or applicability(**meta):
                    return extract
        return extractor.const(None)




# Filters #####################################################################

class Sieve(object):
    pass

class DateSieve(Sieve):
    
    def __init__(self, lower, upper, description=None):
        self.lower = lower
        self.upper = upper


    def represent(self, value):
        '''
        Fill out this filter template and return it as a tuple that represents
        the ElasticSearch query language. May raise a SieveError.
        '''
        
        try:
            fmt = '%Y-%m-%d'
            daterange = value.split(':')
            lower = datetime.strptime(daterange[0], fmt)
            upper = datetime.strptime(daterange[1], fmt)
        except (ValueError, IndexError):
            raise RuntimeError('Date arguments not recognised.')
        
        if not (self.lower <= lower <= self.upper)\
                or not (self.lower <= upper <= self.upper):
            raise RuntimeError('Date arguments not within acceptable range.')
        
        return 'must', {
            'range' : {
                'date' : {
                    'gte' : lower,
                    'lte' : upper
                }
            }
        }

class RangeSieve(Sieve):
    
    def __init__(self, lower, upper, description=None):
        self.lower = lower
        self.upper = upper


    def represent(self, value):
        try:
            nrange = value.split(':')
            lower = float(nrange[0])
            upper = float(nrange[1])
        except (ValueError, IndexError):
            raise RuntimeError('Number arguments not recognised.')
        
        if not (self.lower <= lower <= self.upper)\
                or not (self.lower <= upper <= self.upper):
            raise RuntimeError('N arguments not within acceptable range.')
        
        return 'must', {
            'range' : {
                'ocr' : {
                    'gte' : lower,
                    'lte' : upper
                }
            }
        }

'''
Define filters to be presented to the user and passed through to ElasticSearch.
'''

from datetime import datetime

class Filter(object):
    pass


class DateFilter(Filter):
    
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


class RangeFilter(Filter):
    
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

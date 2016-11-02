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
        self.description = description

    def es(self, *nargs, **kwargs):
        '''
        Fill out this filter template and return it as a tuple that represents
        the ElasticSearch query language.
        '''
        
        try:
            fmt = '%Y-%m-%d'
            daterange = nargs[0].split(':')
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
    
    def __init__(self, fieldname, lower, upper, description=None):
        self.fieldname = fieldname
        self.lower = lower
        self.upper = upper
        self.description = description

    def es(self, *nargs, **kwargs):
        try:
            nrange = nargs[0].split(':')
            lower = float(nrange[0])
            upper = float(nrange[1])
        except (ValueError, IndexError):
            raise RuntimeError('Number arguments not recognised.')
        
        if not (self.lower <= lower <= self.upper)\
                or not (self.lower <= upper <= self.upper):
            raise RuntimeError('N arguments not within acceptable range.')
        
        return 'must', {
            'range' : {
                self.fieldname : {
                    'gte' : lower,
                    'lte' : upper
                }
            }
        }



class MultipleChoiceFilter(Filter):
    
    def __init__(self, fieldname, options, description=None):
        self.fieldname = fieldname
        self.options = options
        self.description = description


    def es(self, *nargs, **kwargs):
        
        selected = [
            category for category in kwargs.keys()
            if category in self.options
        ]
        
        return 'should', {
            'terms' : {
                self.fieldname : selected,
                #'execution' : 'or'
            }
        }

'''
Define filters - constraints on the search - to be presented to the user and
passed through to ElasticSearch.
'''

from datetime import datetime
from addcorpus.utils import serialize_datetime

class Filter(object):
    '''
    A filter is the interface between the form that is presented to users and
    the ElasticSearch filter that is sent to the client.
    '''
    # TODO Far as I can tell, this is a specific implementation of a problem
    # with which WTForms deals in general. Therefore, this should be embedded
    # in WTForms.


    def __init__(self, description=None):
        self.field = None # Must be filled after initialising
        self.description = description

    def serialize(self):
        name = str(type(self)).split(sep='.')[-1][:-2]
        search_dict = {'name': name}
        for key, value in self.__dict__.items():
            if key == 'search_filter' or key != 'field':
                if type(value) == datetime:
                    search_dict[key] = serialize_datetime(value)
                else:
                    search_dict[key] = value
        return search_dict

class DateFilter(Filter):
    '''
    Filter for datetime values: produces two datepickers for min and max date.
    '''

    def __init__(self, lower, upper, *nargs, **kwargs):
        self.lower = lower
        self.upper = upper
        super().__init__(*nargs, **kwargs)


class RangeFilter(Filter):
    '''
    Filter for numerical values: produces a slider between two values.
    '''

    def __init__(self, lower, upper, *nargs, **kwargs):
        self.lower = lower
        self.upper = upper
        super().__init__(*nargs, **kwargs)


class MultipleChoiceFilter(Filter):
    '''
    Filter for keyword values: produces a set of buttons.
    '''

    def __init__(self, option_count=10, *nargs, **kwargs):
        self.option_count = option_count
        # option_count defines how many buckets are retrieved
        # for filters and visualizations on front end
        super().__init__(*nargs, **kwargs)


class BooleanFilter(Filter):
    '''
    Filter for boolean values: produces a drop-down menu.
    ''' #TODO checkbox?

    def __init__(self, true, false, *nargs, **kwargs):
        self.true = true
        self.false = false
        super().__init__(*nargs, **kwargs)

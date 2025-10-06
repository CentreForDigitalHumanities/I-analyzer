'''
Define filters - constraints on the search - to be presented to the user and
passed through to ElasticSearch.
'''

from datetime import datetime, date
from addcorpus.constants import MappingType

class Filter(object):
    '''
    A filter is the interface between the form that is presented to users and
    the ElasticSearch filter that is sent to the client.
    '''

    mapping_types = tuple()
    '''accepted mapping types for this filter'''

    def __init__(self, description=None):
        self.field = None # Must be filled after initialising
        self.description = description

    def serialize(self):
        name = str(type(self)).split(sep='.')[-1][:-2]
        search_dict = {'name': name}
        for key, value in self.__dict__.items():
            if key == 'search_filter' or key != 'field':
                if isinstance(value, datetime) or isinstance(value, date):
                    search_dict[key] = value.isoformat()
                else:
                    search_dict[key] = value
        return search_dict

class DateFilter(Filter):
    '''
    Filter for datetime values: produces two datepickers for min and max date.
    '''

    mapping_types = (MappingType.DATE, MappingType.DATE_RANGE,)

    def __init__(self, lower=None, upper=None, *nargs, **kwargs):
        self.lower = lower
        self.upper = upper
        super().__init__(*nargs, **kwargs)


class RangeFilter(Filter):
    '''
    Filter for numerical values: produces a slider between two values.
    '''

    mapping_types = (MappingType.INTEGER, MappingType.FLOAT)

    def __init__(self, lower=None, upper=None, *nargs, **kwargs):
        self.lower = lower
        self.upper = upper
        super().__init__(*nargs, **kwargs)


class MultipleChoiceFilter(Filter):
    '''
    Filter for keyword values: produces a set of buttons.
    '''

    mapping_types = (MappingType.KEYWORD,)
    # note: the multiple choice filter is imlemented as a terms query
    # which is also valid for integer/float/boolean/date,
    # but those should be rejected so the appropriate filter is used instead

    def __init__(self, option_count=10, *nargs, **kwargs):
        self.option_count = option_count
        # option_count defines how many buckets are retrieved
        # for filters and visualizations on front end
        super().__init__(*nargs, **kwargs)


class BooleanFilter(Filter):
    '''
    Filter for boolean values: produces a drop-down menu.
    '''

    mapping_types = (MappingType.BOOLEAN,)

    def __init__(self, true, false, *nargs, **kwargs):
        self.true = true
        self.false = false
        super().__init__(*nargs, **kwargs)

VALID_MAPPINGS = {
    f.__name__: tuple(mt.value for mt in f.mapping_types)
    for f in
    [DateFilter, RangeFilter, MultipleChoiceFilter, BooleanFilter]
}

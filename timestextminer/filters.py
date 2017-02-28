'''
Define filters - constraints on the search - to be presented to the user and
passed through to ElasticSearch.
'''

from datetime import datetime

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



    @property
    def prefix(self):
        '''
        Obtain a string that may associate POST-data with this filter.
        The convention I use is that a filter is enabled by posting the prefix
        suffixed by a question mark; and it is given an argument by posting
        the value with the prefix, or with the prefix plus a colon and a
        keyword.
        ''' #TODO too ad-hoc
        return 'filter:' + self.field.name



    def elasticsearch(self, form):
        '''
        Construct the filter in the ElasticSearch DSL language, from a
        dictionary that represents POSTed data.
        '''
        raise NotImplementedError()
        
        
        
    def html(self):
        '''
        Construct raw HTML code that represents the form element that defines
        this filter.
        '''
        raise NotImplementedError()




class DateFilter(Filter):
    '''
    Filter for datetime values: produces two datepickers for min and max date.
    '''
    
    def __init__(self, lower, upper, *nargs, **kwargs):
        self.lower = lower
        self.upper = upper
        super().__init__(*nargs, **kwargs)



    def html(self):
        lower = self.lower.strftime('%Y-%m-%d')
        upper = self.upper.strftime('%Y-%m-%d')
        return (
            '<div class="daterange">'
                '<div class="from"></div>'
                '<div class="to"></div>'
                '<input type="text" hidden '
                    'name="' + self.prefix + '" '
                    'value="' + lower + ':' + upper + '" '
                    'data-lower="' + lower + '" '
                    'data-upper="' + upper + '">'
            '</div>'
        )
        
        
        
    def elasticsearch(self, form):
        
        # Check if this filter is enabled
        if not form.get(self.prefix + '?'):
            return None

        # Read and check filter arguments
        try:
            fmt = '%Y-%m-%d'
            daterange = form.get(self.prefix).split(':')
            lower = datetime.strptime(daterange[0], fmt)
            upper = datetime.strptime(daterange[1], fmt)
        except (ValueError, IndexError):
            raise RuntimeError('Date arguments not recognised.')
        
        if not (self.lower <= lower <= self.upper)\
        or not (self.lower <= upper <= self.upper):
            raise RuntimeError('Date arguments not within acceptable range.')
        
        # Return ES DSL subquery
        return {
            'range' : {
                self.field.name : {
                    'gte' : lower.strftime('%Y-%m-%d'),
                    'lte' : upper.strftime('%Y-%m-%d'),
                    'format': 'yyyy-MM-dd'
                }
            }
        }



class RangeFilter(Filter):
    '''
    Filter for numerical values: produces a slider between two values.
    '''
    
    def __init__(self, lower, upper, *nargs, **kwargs):
        self.lower = lower
        self.upper = upper
        super().__init__(*nargs, **kwargs)



    def html(self):
        return (
            '<div class="range">'
                '<div class="slider"></div>'
                '<input type="text" readonly style="border:0"'
                    'name="' + self.prefix + '" '
                    'value="' + str(self.lower) + ':' + str(self.upper) + '" '
                    'data-lower="' + str(self.lower) + '" '
                    'data-upper="' + str(self.upper) + '">'
            '</div>'
        )


    def elasticsearch(self, form):
        
        # Check if this filter is enabled
        if not form.get(self.prefix + '?'):
            return None

        # Read and check filter arguments
        try:
            nrange = form.get(self.prefix).split(':')
            lower = float(nrange[0])
            upper = float(nrange[1])
        except (ValueError, IndexError):
            raise RuntimeError('Number arguments not recognised.')
        
        if not (self.lower <= lower <= self.upper)\
        or not (self.lower <= upper <= self.upper):
            raise RuntimeError('N arguments not within acceptable range.')
        
        # Return ES DSL subquery
        return {
            'range' : {
                self.field.name : {
                    'gte' : lower,
                    'lte' : upper
                }
            }
        }



class MultipleChoiceFilter(Filter):
    '''
    Filter for keyword values: produces a set of buttons.
    '''
    
    def __init__(self, options, *nargs, **kwargs):
        self.options = options
        super().__init__(*nargs, **kwargs)


    def html(self):
        options = (
            (
                '<input type="checkbox" '
                    'name="' + self.prefix + ':' + option + '" '
                    'id="'   + self.prefix + ':' + option + '"> '
                '<label '
                    'for="'  + self.prefix + ':' + option + '" '
                    'style="margin-top:2px;margin-bottom:2px;margin-right:-1px">' + option + ''
                '</label>'
            )
            for option in self.options
        )
        
        return (
            '<div class="mc">' + ''.join(options) + '</div>'
        )

    def elasticsearch(self, form):
        prefix = self.prefix
        
        # Check if this filter is enabled
        if not form.get(prefix + '?'):
            return None

        # Read filter arguments
        args = (
            key[(len(prefix)+1):]
            for key in form.keys()
                if key.startswith(prefix + ':')
        )
                
        # Return ES DSL subquery
        return {
            'terms' : {
                self.field.name : [
                    category
                    for category in args
                        if category in self.options
                ]
            }
        }


class BooleanFilter(Filter):
    '''
    Filter for boolean values: produces a drop-down menu.
    ''' #TODO checkbox?
    
    def __init__(self, true, false, *nargs, **kwargs):
        self.true = true
        self.false = false
        super().__init__(*nargs, **kwargs)


    def html(self):
        return (
            '<div class="select">'
                '<select name="' + self.prefix + '">'
                    '<option value="1">' + self.true + '</option>'
                    '<option value="">' + self.false + '</option>'
                '</select>'
            '</div>'
        )



    def elasticsearch(self, form):
        
        # Check if this filter is enabled
        if not form.get(self.prefix + '?'):
            return None
        
        # Return ES DSL subquery
        return {
            'term' : {
                self.field.name : bool(form.get(self.prefix))
            }
        }

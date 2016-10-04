'''
Fields hold data about under what name to appear in CSV fields, how the
corresponding content is to be extracted from BeautifulSoup, etcetera.
'''

import extractor


class Field(object):

    def __init__(self, name=None, querent=None, description=None, extractor=[]):

        self.name = name or self.__class__.__name__.lower()
        self.description = description
        self.querent = querent
        self.extractors = (
            list(extractor)
                if hasattr(extractor, '__iter__') and
                not (isinstance(extractor, tuple) and len(extractor) > 2) else
            [extractor]
        )


    def extractor(self, **metadata):
        '''
        Select the appropriate extractor function based on given metadata.
        '''

        for x in self.extractors:
            try:
                applicability, extract = x
            except ValueError:
                return x
            else:
                if applicability is None or applicability(**metadata):
                    return extract
        return extractor.const(value=None)




# Filters #####################################################################

class Filter(object):
    def match(self, constraint):
        return lambda x: True

class MinMaxFilter(Filter):

    def match(self, constraint):

        if not constraint:
            return lambda x: True
        try:
            constraint_ = constraint.split('-')
            minimum = float(constraint_[0])
            maximum = float(constraint_[1])
        except (ValueError, KeyError):
            return lambda x: True

        def check(value):
            try:
                return minimum <= float(value) <= maximum
            except ValueError:
                return False

        return check

class SubstringFilter(Filter):
    pass

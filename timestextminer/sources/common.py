'''
Fields hold data about under what name to appear in CSV fields, how the
corresponding content is to be extracted from BeautifulSoup, etcetera.
'''

from .. import extractor

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

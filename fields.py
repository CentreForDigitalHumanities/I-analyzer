'''
Fields hold data about under what name to appear in CSV fields, how the
corresponding content is to be extracted from BeautifulSoup, etcetera.
'''

import re
import html


# Generic fields ##################################################################

class BaseField(object):
    def __init__(self, name=None, filter=None):
        self.name = name or self.__class__.__name__.lower()
        self.filter = filter

    def from_soup(self, bowl, spoon):
        raise NotImplementedError()



class SimpleField(BaseField):
    '''
    A straightforward field that simply extracts the string content from some
    tag in the XML.
    '''

    def __init__(self, tag, recursive=False, toplevel=False, **kwargs):
        self.tag = tag
        self.recursive = recursive
        self.toplevel = toplevel
        super().__init__(**kwargs)
        

    def _node(self, bowl, spoon):
        source = bowl if self.toplevel else spoon
        return source.find(self.tag, recursive=self.recursive)


    def from_soup(self, bowl, spoon):
        node = self._node(bowl, spoon)
        return node.string if node else None



class FlatField(SimpleField):
    '''
    Extracts string content from tag and all subtags.
    '''

    regex1 = re.compile('(?<=\S)\n(?=\S)| +')
    regex2 = re.compile('\n+')

    def from_soup(self, bowl, spoon):
        node = self._node(bowl, spoon)
        if node:
            return html.unescape(
                regex2.sub('\n',
                    regex1.sub(' ', node.get_text())
                ).strip()
            )



class CompositeField(SimpleField):
    '''
    Extracts string content from all tags of the given type.
    '''

    def from_soup(self, bowl, spoon):
        source = bowl if self.toplevel else spoon
        return ' + '.join(node.string
            for node in (
                source.find_all(self.tag, recursive=self.recursive) or ()
            )
        )



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



# Default field definitions ###################################################

default = [
    SimpleField(name='journal',         tag='jn', toplevel=True),
    SimpleField(name='issue',           tag='is', toplevel=True),
    SimpleField(name='date',            tag='da', toplevel=True),
    SimpleField(name='IP',              tag='ip', toplevel=True),
    SimpleField(name='page',            tag='pa'),
    SimpleField(name='id',              tag='id'),
    SimpleField(name='category',        tag='ct'),
    SimpleField(name='ocr-quality',     tag='ocr', filter=MinMaxFilter()),
    SimpleField(name='author',          tag='au'),
    SimpleField(name='heading',         tag='ti'),
    SimpleField(name='title',           tag='ta'),
    SimpleField(name='PC',              tag='pc'),
    SimpleField(name='SC',              tag='sc'),
    FlatField(name='preamble',          tag='text.preamble'),
    FlatField(name='content',           tag='text.cr'),
    CompositeField(name='illustration', tag='il'),
]
'''
Functions that allow for the extraction of data from an XML file as
read by BeautifulSoup.
'''

import functools
import re
import html
import bs4

def extractor(method=None):
    '''
    A wrapper to turn a function taking a BeautifulSoup source and a metadata
    dictionary into a function that takes a top-level BeautifulSoup object and
    another for the BeautifulSoup tag and any other metadata. 
    ''' #TODO make this so explanation makes sense

    # Wrapper function called with optional arguments
    if method is None:
        return functools.partial(extractor)

    @functools.wraps(method)
    def decorator(tag=None, toplevel=False, multiple=False, recursive=False,
            transform=None, *nargs, **kwargs):

        
        def slurp(bowl, spoon, **meta):
            nonlocal tag

            if not tag:
                return method(source=None, meta=meta, *nargs, **kwargs)

            soup = bowl if toplevel else spoon
            
            tag_ = tag
            if isinstance(tag, list):
                for i in range(0, len(tag)-1):
                    if tag[i] == '..':
                        soup = soup.parent
                    else:
                        soup = soup.find(tag[i], recursive=recursive)
                    if not soup:
                        return None
                tag_ = tag[-1]

            if multiple:
                soup = soup.find_all(tag_, recursive=recursive)
            else:
                soup = soup.find(tag_, recursive=recursive)

            if soup:
                result = method(source=soup, meta=meta, *nargs, **kwargs)
                if transform:
                    result = transform(result)
                return result
            else:
                return None

        return slurp

    return decorator



@extractor
def string(source, meta, *n, **kw):
    if isinstance(source, bs4.element.Tag):
        return source.string
    else:
        return [node.string for node in source]


@extractor
def attr(source, attr=None, *n, **kw):
    if isinstance(source, bs4.element.Tag):
        return source.attrs.get(attr)
    else:
        return [node.attrs.get(attr) for node in source if node.attrs.get(attr) is not None]



@extractor
def flatten(source, meta, *n, **kw):

    if isinstance(source, bs4.element.Tag):
        text = source.get_text()
    else:
        text = '\n\n'.join(node.get_text() for node in source)

    return html.unescape(
        _regex2.sub('\n',
            _regex1.sub(' ', text)
        ).strip()
    )

_regex1 = re.compile('(?<=\S)\n(?=\S)| +')
_regex2 = re.compile('\n+')



def const(value, *n, **kw):
    def extract(bowl, spoon, **meta):
        return value
    return extract

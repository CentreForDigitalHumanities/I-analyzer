import functools
import re
import html

def extractor(method=None, **wkwargs):
    '''
    '''

    # Wrapper function called with optional arguments
    if method is None:
        return functools.partial(extractor, **wkwargs)

    @functools.wraps(method)
    def decorator(path, toplevel=False, multiple=False, *nargs, **kwargs):

        def sip(bowl, spoon):
            soup = bowl if toplevel else spoon
            if multiple:
                source = soup.select(path)
            else:
                source = soup
                for p in path.split('>'):
                    source = source.find(p.strip(), recursive=False)

            if source:
                return method(source, multiple, *nargs, **kwargs)
            else:
                return None

        return sip

    return decorator



@extractor
def stringify(source, multiple):
    if multiple:
        return ', '.join(node.string for node in source)
    else:
        return source.string



@extractor
def flatten(source, multiple):
    regex1 = re.compile('(?<=\S)\n(?=\S)| +')
    regex2 = re.compile('\n+')

    return html.unescape(
        regex2.sub('\n',
            regex1.sub(' ', source.get_text())
        ).strip()
    )



@extractor
def const(value=None, *args):
    return value
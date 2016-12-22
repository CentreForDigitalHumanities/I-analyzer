'''
An extractor function is a function that takes the top-level BeautifulSoup tag,
the BeautifulSoup tag of the entry that is under scrutiny (and possibly
some metadata as keyword arguments) and extracts from it some desired data.

This module contains functions that facilitate the creation of such functions.
'''

import functools
import re
import html
import bs4
import logging

_regex1 = re.compile('(?<=\S)\n(?=\S)| +')
_regex2 = re.compile('\n+')



def const(value):
    '''
    Create an extractor function that extracts the same constant value on any
    input.
    '''
    
    def extract(soup_top, soup_entry, **metadata):
        return value
    return extract



def meta(key, transform):
    '''
    Create an extractor function that extracts the metadata for the given key.
    '''
    
    def extract(soup_top, soup_entry, **metadata):
        result = metadata.get(key)
        try:
            return transform(result) if transform else result
        except ValueError:
            if not result:
                return None
            else:
                logging.critical('Metadata value {v} for key {k} could not be converted by the transformation function.'.format(v=result, k=key))        
        
    return extract



def create_extractor(method=None):
    '''
    Helper function: wraps boilerplate code around any function that operates
    on a BeautifulSoup element, a metadata dictionary and optional keyword
    arguments. This function is then transformed into a function that upon
    calling with relevant information, creates an extractor function in which
    the original function is applied to the appropriate BeautifulSoup node(s).
    '''
    
    if method is None:
        return functools.partial(create_extractor)

    @functools.wraps(method)
    def decorator(
            tag=None, toplevel=False, recursive=False,
            multiple=False, transform=None, 
            **kwargs):
        
        # Create extractor function
        def extract(soup_top, soup_entry, **metadata):
            if not tag:
                result = method(None, metadata, **kwargs)
            else:
                # Select the appropriate starting soup element
                soup = soup_top if toplevel else soup_entry
                        
                # If the tag was a path, walk through it before continuing
                tag_ = tag
                if isinstance(tag, list):
                    for i in range(0, len(tag)-1):
                        if tag[i] == '..':
                            soup = soup.parent
                        elif tag[i] == '.':
                            pass
                        else:
                            soup = soup.find(tag[i], recursive=recursive)
                        if not soup:
                            return None
                    tag_ = tag[-1]

                # Find (all) relevant BeautifulSoup element(s)
                if multiple:
                    soup = soup.find_all(tag_, recursive=recursive)
                else:
                    soup = soup.find(tag_, recursive=recursive)

                # Apply function that we were wrapping
                result = method(soup, metadata, **kwargs) if soup else None

            # Final transformation
            try:
                return transform(result) if transform else result
            except (ValueError, TypeError):
                if result == '':
                    return None
                else:
                    logging.critical('Value "{v}", extracted from tag "{t}" could not be converted by the transformation function.'.format(v=result, t=str(tag)))

        # Obtain created extractor function
        return extract
        
    return decorator


@create_extractor
def string(soup, metadata):
    '''
    When combined with the `create_extractor` wrapper, `string` is a function
    that takes arguments `tag`, `toplevel`, `recursive`, `multiple`,
    `transform` and `attr`, and creates an extractor function.
    
    This extractor function finds (a) node(s) and and outputs its direct
    text contents.
    '''

    if isinstance(soup, bs4.element.Tag):
        return soup.string
    else:
        return [ node.string for node in soup ]



@create_extractor
def attr(soup, metadata, attr=None):
    '''
    When combined with the `create_extractor` wrapper, `attr` is a function
    that takes arguments `tag`, `toplevel`, `recursive`, `multiple`,
    `transform` and `attr`, and creates an extractor function.
    
    This extractor function finds (a) node(s) and and outputs the content of
    the attribute with the name `attr`.
    '''

    if isinstance(soup, bs4.element.Tag):
        return soup.attrs.get(attr)
    else:
        return [
            node.attrs.get(attr)
            for node in soup if node.attrs.get(attr) is not None
        ]



@create_extractor
def flatten(soup, metadata):
    '''
    When combined with the `create_extractor` wrapper, `flatten` is a function
    that takes arguments `tag`, `toplevel`, `recursive`, `multiple` and
    `transform` and creates an extractor function.
    
    This extractor function finds (a) node(s) and outputs its text content, 
    disregarding any underlying XML structure.
    '''

    if isinstance(soup, bs4.element.Tag):
        text = soup.get_text()
    else:
        text = '\n\n'.join(node.get_text() for node in soup)

    return html.unescape(
        _regex2.sub('\n',
            _regex1.sub(' ', text)
        ).strip()
    )

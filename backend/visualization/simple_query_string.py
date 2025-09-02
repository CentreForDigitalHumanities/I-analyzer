'''
Utilities for Simple Query String syntax
'''

from typing import List, Tuple, Optional

def collect_terms(query_text: str) -> List[str]:
    '''
    Return all terms in a simple query string.
    '''

    components = []
    in_qoutes, outside_qoutes = _extract_phrase_term(query_text)

    while in_qoutes != None:
        components.append(in_qoutes)
        in_qoutes, outside_qoutes = _extract_phrase_term(outside_qoutes)

    components += outside_qoutes.split()

    return components

def _extract_phrase_term(query_text: str) -> Tuple[Optional[str], str]:
    '''
    Extract the first phrase term from a simple query string.

    Returns a tuple with the first phrase term (if any), and the query string with the
    phrase term removed.
    '''
    if query_text.find('"') != -1:
        starting_quote = query_text.find('"')
        ending_quote = query_text.find('"', starting_quote + 1)

        if ending_quote != -1:
            in_quotes = query_text[starting_quote + 1 : ending_quote]
            outside_quotes = query_text[:starting_quote] + query_text[ending_quote + 1:]
            return in_quotes, outside_quotes

    return (None, query_text)


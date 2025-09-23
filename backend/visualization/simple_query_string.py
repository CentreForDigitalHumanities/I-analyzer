'''
Utilities for Simple Query String syntax
'''

from typing import List, Tuple, Optional
import re

def collect_terms(query_text: str) -> List[str]:
    '''
    Return all terms in a simple query string.

    Splits a query into terms, which may be either phrase terms or single terms. Operators
    are not included.

    Returns a list of strings, each of which is a single term. These still include
    decorators like fuzzy search, negation, or quotation marks for phrase terms. Order
    may not match the query.
    '''

    if '(' in query_text and ')' in query_text:
        in_group, outside_group = _extract_group(query_text, '(', ')', False)
        if in_group:
            return collect_terms(in_group) + collect_terms(outside_group)

    if match := re.search(r'\"~\d', query_text):
        closing = match.group(0)
        phrase, outside_phrase = _extract_group(query_text, '"', closing, True)
        if phrase:
            return [phrase] + collect_terms(outside_phrase)

    if '"' in query_text:
        in_qoutes, outside_qoutes = _extract_group(query_text, '"', '"', True)
        if in_qoutes:
            return [in_qoutes] + collect_terms(outside_qoutes)

    terms = list(filter(_is_term, query_text.split()))
    return terms


def _is_term(query_part: str) -> bool:
    '''
    Whether a query section is a term (and not an operator)
    '''
    return query_part not in ['+', '|']


def _extract_group(
    query_text: str, opening: str, closing: str, keep_bounds: bool,
) -> Tuple[Optional[str], str]:
    '''
    Split a group from the rest of the query. Used to extract sections in parentheses
    or quotes.

    Parameters:
        query_text: query text
        opening: opening character(s)
        closing: closing character(s)
        keep_bounds: whether to include the opening/closing characters or strip them

    Returns:
        A tuple with the extracted group (`None` if there is none), and the query
        with the group removed. If `keep_bounds` is true, the extracted group will
        include the opening/closing characters.
    '''

    bounds = _find_group(query_text, opening, closing)

    if bounds:
        opens_at, closes_at = bounds
        if keep_bounds:
            in_group = query_text[opens_at : closes_at  + len(closing)]
        else:
            in_group = query_text[opens_at + len(opening) : closes_at]
        outside_group = query_text[:opens_at] + query_text[closes_at + len(closing):]
        return in_group, outside_group

    return (None, query_text)


def _find_group(query_text: str, opening: str, closing: str) -> Optional[Tuple[int, int]]:
    '''
    Find start/end index for a group.
    '''
    opens_at = query_text.find(opening)

    if opens_at == -1:
        return

    nesting = 0
    for i in range(opens_at + len(opening), len(query_text)):
        substring = query_text[i:]
        if substring.startswith(closing):
            if not nesting:
                return (opens_at, i)
            else:
                nesting -= 1
        elif substring.startswith(opening):
            nesting += 1



def is_prefix(term: str) -> bool:
    return term.endswith('*')

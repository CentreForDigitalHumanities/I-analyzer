'''
Utilities for Simple Query String syntax
'''

def get_query_components(query_text: str):
    """Split a query into loose 'components' for matching:
    each component either a single word or a phrase (which was placed in quotation marks)"""

    components = []
    in_qoutes, outside_qoutes = extract_quoted(query_text)

    while in_qoutes != None:
        components.append(in_qoutes)
        in_qoutes, outside_qoutes = extract_quoted(outside_qoutes)

    components += outside_qoutes.split()

    return components

def extract_quoted(query_text):
    if query_text.find('"') != -1:
        starting_quote = query_text.find('"')
        ending_quote = query_text.find('"', starting_quote + 1)

        if ending_quote != -1:
            in_quotes = query_text[starting_quote + 1 : ending_quote]
            outside_quotes = query_text[:starting_quote] + query_text[ending_quote + 1:]
            return in_quotes, outside_quotes

    return (None, query_text)


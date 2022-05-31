from ianalyzer.factories.elasticsearch import elasticsearch

def get_terms(termvector_result, field):
    termvectors = termvector_result['term_vectors']
    if field in termvectors:
        terms = termvectors[field]['terms']
        return terms

def get_tokens(terms, sort=True):
    all_tokens = [token for term in terms for token in list_tokens(term, terms[term])]
    
    if sort:
        sorted_tokens = sorted(all_tokens, key=lambda token: token['position'])
        return sorted_tokens
    
    return all_tokens

def list_tokens(term, details):
    ttf = details['ttf'] if 'ttf' in details else None
    positions = [token['position'] for token in details['tokens']]

    return [ {
        'position': position,
        'term': term,
        'ttf': ttf
        }
        for position in positions
    ]

def token_matches(tokens, query_text, index, field, es_client = None):
    analyzed_query = analyze_query(query_text, index, field, es_client)

    for i in range(len(tokens)):
        for component in analyzed_query:
            if len(component) + i <= len(tokens):
                if all(tokens[i + j]['term'] == component[j] for j in range(len(component))):
                    start = i
                    stop = i + len(component)
                    content = ' '.join([tokens[ind]['term'] for ind in range(start, stop)])
                    yield start, stop, content


def analyze_query(query_text, index, field, es_client = None):
    if not es_client:
        es_client = elasticsearch(index)
    
    components = get_query_components(query_text)
    analyzed_components = [analyze_query_component(component, index, field, es_client) for component in components]

    nonempty = list(filter(None, analyzed_components))

    return nonempty

def analyze_query_component(component_text, index, field, es_client):
    analyzed = es_client.indices.analyze(
        index = index,
        body={
            'text': component_text,
            'field': field,
        },
    )

    return [token['token'] for token in analyzed['tokens']]


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

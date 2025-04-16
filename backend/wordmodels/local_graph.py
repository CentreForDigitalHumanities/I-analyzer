from addcorpus.python_corpora.load_corpus import load_corpus_definition
from wordmodels.utils import load_word_models
from wordmodels.similarity import find_n_most_similar, term_similarity


def local_graph_data(corpus_name: str, query_term: str):
    corpus = load_corpus_definition(corpus_name)
    wm_list = load_word_models(corpus)

    return [
        {
            'start_year': wm['start_year'],
            'end_year': wm['end_year'],
            'data': local_graph_in_timeframe(wm, query_term)
        }
        for wm in wm_list
    ]


def local_graph_in_timeframe(wm, query_term: str):
    nodes = _graph_nodes(wm, query_term)
    links = _graph_links(wm, nodes)

    return {
        'nodes': nodes,
        'links': links
    }


def _graph_nodes(wm, query_term):
    neighbours = find_n_most_similar(wm, query_term, 5)
    query_node = {
        'term': query_term,
        'index': 0,
        'similarity': 1,
    }
    neighbour_nodes = (
        {
            'term': item['key'],
            'index': i + 1,
            'similarity': item['similarity'],
        }
        for (i, item) in enumerate(neighbours)
    )
    return [query_node, *neighbour_nodes]


def _graph_links(wm, nodes):
    return []

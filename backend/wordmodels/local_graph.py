from itertools import chain
from typing import List

from addcorpus.python_corpora.load_corpus import load_corpus_definition
from wordmodels.utils import load_word_models, word_in_model
from wordmodels.similarity import find_n_most_similar, term_similarity

def local_graph_data(corpus_name: str, query_term: str):
    corpus = load_corpus_definition(corpus_name)
    wm_list = load_word_models(corpus)

    times = timeframes(wm_list)

    data_per_timeframe = (
        graph_data_for_timeframe(wm, query_term)
        for wm in wm_list
    )

    node_data, link_data = zip(*data_per_timeframe)
    nodes = list(chain(*node_data))
    links = list(chain(*link_data))

    return {
        'graph': _graph_vega_doc(times, nodes, links),
        'table': _graph_table_data(nodes, links)
    }


def graph_data_for_timeframe(wm, query_term: str):
    nodes = _graph_nodes(wm, query_term)
    links = _graph_links(wm, nodes)

    return nodes, links


def _format_time(wm):
    start_year = wm['start_year']
    end_year = wm['end_year']
    return f'{start_year}-{end_year}'


def _graph_nodes(wm, query_term):
    if not word_in_model(query_term, wm):
        return []

    neighbours = find_n_most_similar(wm, query_term, 10)
    query_node = {
        'term': query_term,
        'index': 0,
        'timeframe': _format_time(wm),
        'similarity': 1,
        'group': 1,
    }
    neighbour_nodes = (
        {
            'term': item['key'],
            'index': i + 1,
            'timeframe': _format_time(wm),
            'similarity': item['similarity'],
            'group': 2,
        }
        for (i, item) in enumerate(neighbours)
    )
    return [query_node, *neighbour_nodes]


def _graph_links(wm, nodes):
    if not len(nodes):
        return []

    threshold = min(
        node['similarity'] for node in nodes
    )

    links = []

    for n1 in nodes:
        for n2 in nodes:
            i1 = n1['index']
            i2 = n2['index']
            if i1 != i2:
                term1 = n1['term']
                term2 = n2['term']
                similarity = term_similarity(wm, term1, term2)
                if similarity and similarity >= threshold:
                    links.append({
                        'source': i1,
                        'target': i2,
                        'value': similarity,
                        'timeframe': _format_time(wm),
                    })

    return links


def timeframes(models) -> List[str]:
    sorted_models = sorted(models, key=lambda wm: wm['start_year'])
    return [
        _format_time(wm) for wm in sorted_models
    ]


def _graph_vega_doc(timeframes, nodes, links):

    return {
        "$schema": "https://vega.github.io/schema/vega/v5.json",
        "description": "A node-link diagram of neighbouring words",
        "width": 700,
        "height": 500,
        "padding": 0,
        "autosize": "none",

        "signals": [
            { "name": "cx", "update": "width / 2" },
            { "name": "cy", "update": "height / 2" },
            {
                'name': 'timeframe',
                'value': timeframes[0],
                'bind': {
                    'input': 'select',
                    'name': 'time frame',
                    'options': timeframes,
                },
            },
            { "name": "linkDistance", "value": 150,
                "bind": {
                    "input": "range",
                    "min": 20,
                    "max": 300,
                    "step": 1,
                    'name': 'link distance'
                }
            },
            { "name": "static", "value": True,
                "bind": {"input": "checkbox"} },
            {
                "description": "State variable for active node fix status.",
                "name": "fix", "value": False,
                "on": [
                    {
                        "events": "text:pointerout[!event.buttons], window:pointerup",
                        "update": "false"
                    },
                    {
                        "events": "text:pointerover",
                        "update": "fix || true"
                    },
                    {
                        "events": "[text:pointerdown, window:pointerup] > window:pointermove!",
                        "update": "xy()",
                        "force": True
                    }
                ]
            },
            {
            "description": "Graph node most recently interacted with.",
            "name": "node", "value": None,
            "on": [
                    {
                        "events": "text:pointerover",
                        "update": "fix === true ? item() : node"
                    }
                ]
            },
            {
                "description": "Flag to restart Force simulation upon data changes.",
                "name": "restart", "value": False,
                "on": [
                    {"events": {"signal": "fix"}, "update": "fix && fix.length"}
                ]
            }
        ],

        "data": [
            {
                "name": "node-data",
                "values": nodes,
                "format": {"type": "json"},
                'transform': [
                    {
                        'type': 'filter',
                        'expr': 'datum.timeframe === timeframe',
                    }
                ]
            },
            {
                "name": "link-data",
                "values": links,
                "format": {"type": "json"},
                'transform': [
                    {
                        'type': 'filter',
                        'expr': 'datum.timeframe === timeframe',
                    }
                ]
            }
        ],

        "scales": [
            {
                'name': 'link-color',
                'type': 'linear',
                'domain': {"data": "link-data", "field": "value"},
                'range': {'scheme': 'greys'},
            },
            {
                'name': 'text-weight',
                'type': 'ordinal',
                'domain': [1,2],
                'range': ['bold', 'normal'],
            }
        ],

        "marks": [
            {
                "name": "nodes",
                "type": "text",
                "zindex": 1,

                "from": {"data": "node-data"},
                "on": [
                    {
                        "trigger": "fix",
                        "modify": "node",
                        "values": "fix === true ? {fx: node.x, fy: node.y} : {fx: fix[0], fy: fix[1]}"
                    },
                    {
                        "trigger": "!fix",
                        "modify": "node", "values": "{fx: null, fy: null}"
                    }
                ],
                "encode": {
                    "enter": {
                        "fontSize": {"value": 15},
                        "fill": {"value": "black"},
                        "text": {"field": "term"},
                        "baseline": {"value": "middle"},
                        "align": {"value": "center"},
                        'fontWeight': {
                            'scale': 'text-weight', 'field': 'group'
                        },
                    },
                    "update": {
                        "cursor": {"value": "pointer"}
                    },
                },
                "transform": [
                    {
                        "type": "force",
                        "iterations": 300,
                        "restart": {"signal": "restart"},
                        "static": {"signal": "static"},
                        "signal": "force",
                        "forces": [
                            {"force": "center", "x": {"signal": "cx"}, "y": {"signal": "cy"}},
                            {"force": "collide", "radius": 30},
                            {"force": "nbody", "strength": -30},
                            {"force": "link", "links": "link-data", "distance": {"signal": "linkDistance"}}
                        ]
                    }
                ]
            },
            {
                "type": "path",
                "from": {"data": "link-data"},
                "interactive": False,
                "encode": {
                    "update": {
                        "stroke": {'scale': 'link-color', 'field': 'value'},
                        "strokeWidth": {'value': 0.5},
                    }
                },
                "transform": [
                    {
                        "type": "linkpath",
                        "require": {"signal": "force"},
                        "shape": "line",
                        "sourceX": "datum.source.x", "sourceY": "datum.source.y",
                        "targetX": "datum.target.x", "targetY": "datum.target.y"
                    }
                ]
            },
        ]
    }

def _graph_table_data(nodes, links):
    find_term = lambda i: next(node for node in nodes if node['index'] == i)['term']

    return [
        {
            'timeframe': link['timeframe'],
            'term1': find_term(link['source']),
            'term2': find_term(link['target']),
            'similarity': round(link['value'], 4),
        }
        for link in links
    ]

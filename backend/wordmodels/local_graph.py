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
            'graph': _graph_vega_doc(
                *local_graph_in_timeframe(wm, query_term)
            )
        }
        for wm in wm_list
    ]


def local_graph_in_timeframe(wm, query_term: str):
    nodes = _graph_nodes(wm, query_term)
    links = _graph_links(wm, nodes)

    return nodes, links


def _graph_nodes(wm, query_term):
    neighbours = find_n_most_similar(wm, query_term, 10)
    query_node = {
        'term': query_term,
        'index': 0,
        'group': 1,
        'similarity': 1,
    }
    neighbour_nodes = (
        {
            'term': item['key'],
            'index': i + 1,
            'group': 2,
            'similarity': item['similarity'],
        }
        for (i, item) in enumerate(neighbours)
    )
    return [query_node, *neighbour_nodes]


def _graph_links(wm, nodes):
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
                        'value': similarity
                    })

    return links


def _graph_vega_doc(nodes, links):
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
            { "name": "nodeCharge", "value": -30,
                "bind": {"input": "range", "min":-100, "max": 10, "step": 1} },
            { "name": "linkDistance", "value": 150,
                "bind": {"input": "range", "min": 20, "max": 300, "step": 1} },
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
                "format": {"type": "json"}
            },
            {
                "name": "link-data",
                "values": links,
                "format": {"type": "json"}
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
                            {"force": "nbody", "strength": "nodeCharge"},
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

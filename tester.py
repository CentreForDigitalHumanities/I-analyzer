import json
import sys
from timestextminer import factories

client = factories.elasticsearch()

def create(docs):
    client.indices.delete(index='test')
    client.indices.create(
        index='test',
        body={
            'mappings' : {
                'test-type' : {
                    'properties': {
                        'text' : {
                            'type' : 'text',
                        },
                        'date': {
                            'type': 'date',
                            'format': 'yyyy-MM-dd'
                        },
                        'category': {
                            'type': 'keyword'
                        }
                    }
                }
            }
        }
    )
    for i,d in enumerate(docs):
        client.create(index='test', doc_type='test-type', id=i, body=d, refresh=True)


def search(q):
    print(''.join('=' for _ in range(80)))
    json.dump(q, sys.stdout, indent=2)
    print(''.join('-' for _ in range(80)))
    result = client.search(index='test', doc_type='test-type', body=q )
    json.dump(result, sys.stdout, indent=2)
    print()


create([
    {
        'text': 'Hello world!',
        'date' : '1950-01-01',
        'category' : ['A']
    },
    {
        'text': 'Lorem ipsum dolor sit amet.',
        'date' : '1975-01-01',
        'category' : ['A','B']
    },
    {
        'text' : 'Hello everyone...',
        'date' : '2000-01-01',
        'category' : ['B']
    }
])


search({
    'query': {
        'match_all': {}
    }
})

search({
    'query': {
        'simple_query_string' : {
            'query' : 'hello'
        }
    }
})

search({
    'query': {
        'range': {
            'date': {
                'gt' : '1970',
                'lt' : '1980',
                'format': 'yyyy'
            }
        }
    }
})

search({
    "query": {
        "constant_score" : {
            "filter" : {
                "terms" : {
                    "category" : ["B"]
                }
            }
        }
    }
})

search({
    "query": {
        "bool" : {
            'must' : {
                'simple_query_string' : {
                    'query' : 'hello'
                }
            },
            "filter" : {
                "terms" : {
                    "category" : ["A"]
                }
            }
        }
    }
})

import os
import json
from jsonschema import validate as validate_schema

here = os.path.dirname(os.path.abspath(__file__))
schemas_dir = os.path.join(here, '../schemas')

def corpus_schema():
    path = os.path.join(schemas_dir, 'corpus.schema.json')
    with open(path) as f:
        return json.load(f)

def validate(instance):
    '''
    Validate a JSON corpus instance

    Currently, this just checks that it conforms to corpus.schema.json
    '''

    schema = corpus_schema()
    validate_schema(instance, schema)

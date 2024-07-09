import os
import json
from jsonschema import validate as validate_schema

from addcorpus.json_corpora.utils import get_path

here = os.path.dirname(os.path.abspath(__file__))
schemas_dir = os.path.join(here, '../schemas')


def corpus_schema():
    path = os.path.join(schemas_dir, 'corpus.schema.json')
    with open(path) as f:
        return json.load(f)


def validate(instance, *subpath: str):
    '''
    Validate a JSON corpus instance, optionally a subpath

    Currently, this just checks that it conforms to corpus.schema.json
    '''
    schema = corpus_schema()
    if subpath:
        schema = get_path(schema, *subpath)
    validate_schema(instance, schema)

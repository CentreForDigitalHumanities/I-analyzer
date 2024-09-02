import os
import pytest
import json

from addcorpus.json_corpora.validate import validate

here = os.path.abspath(os.path.dirname(__file__))

@pytest.fixture
def goodreads_definition():
    path = os.path.join(here, '..', 'goodreads.json')
    with open(path) as f:
        return json.load(f)

def test_goodreads_json(goodreads_definition):
    validate(goodreads_definition)

from addcorpus.json_corpora.validate import validate


def test_validate(json_corpus_definition):
    validate(json_corpus_definition)


def test_validate_subschema(json_corpus_definition):
    source_data = json_corpus_definition['source_data']
    validate(source_data, 'properties', 'source_data')

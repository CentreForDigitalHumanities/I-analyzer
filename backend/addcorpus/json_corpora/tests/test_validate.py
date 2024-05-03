from addcorpus.json_corpora.validate import validate


def test_validate(json_corpus_data):
    validate(json_corpus_data)


def test_validate_subschema(json_corpus_data):
    source_data = json_corpus_data['source_data']
    validate(source_data, 'properties', 'source_data')

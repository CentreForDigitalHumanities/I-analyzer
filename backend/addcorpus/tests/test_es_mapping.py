from addcorpus.es_mappings import main_content_mapping

def test_main_content_mapping():
    minimal_mapping = main_content_mapping(
        token_counts=False,
        stopword_analysis=False,
        stemming_analysis=False,
        language=None
    )
    assert 'fields' not in minimal_mapping

    maximal_mapping = main_content_mapping(
        token_counts=True,
        stopword_analysis=True,
        stemming_analysis=True,
        language='en'
    )

    assert maximal_mapping['fields'].keys() == {'length', 'clean', 'stemmed'}

    missing_language_mapping = main_content_mapping(
        token_counts=True,
        stopword_analysis=True,
        stemming_analysis=True,
        language='enm'
    )

    assert missing_language_mapping['fields'].keys() == {'length'}


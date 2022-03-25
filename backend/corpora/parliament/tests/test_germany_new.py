from addcorpus.load_corpus import load_corpus
import os
from datetime import datetime

target_docs = [
    {
        'country': 'Germany',
        'date': '1949-09-22',
        'debate_id': '7',
        'electoral_term': '1',
        'speaker': 'Gebhard Seelos',
        'speaker_id': '11002141',
        'speaker_aristocracy': '',
        'speaker_academic_title': 'Dr.',
        'speaker_birth_country': 'Deutschland',
        'speaker_birthplace': 'München',
        'speaker_birth_year': '1901',
        'speaker_death_year': '1984',
        'speaker_gender': 'male',
        'speaker_profession': 'Dipl.-Volkswirt, Jurist, Diplomat, Staatsrat a. D.',
        'role': 'Member of Parliament',
        'role_long': None,
        'party': 'BP',
        'party_full': 'Bayernpartei',
        'party_id': '2',
        'speech': 'Baracken sind etwas Vorübergehendes; sie halten aber immer länger, als eigentlich geplant.',
        'id': '94',
    }
]

def test_germany_new(test_app):
    corpus = load_corpus('parliament-germany-new')

    # Assert that indeed we are drawing sources from the testing folder
    assert os.path.join(os.path.dirname(__file__), 'data', 'germany-new') == os.path.abspath(corpus.data_directory)

    # Obtain our mock source CSV
    sources = corpus.sources(
        start=datetime(1970,1,1),
        end=datetime(2022,1,1)
    )
    docs = corpus.documents(sources)

    for target in target_docs:
        doc = next(docs)

        for key in target:
            assert key in doc
            print(key)
            assert doc[key] == target[key]
from addcorpus.load_corpus import load_corpus
import os
from datetime import datetime

target_docs = [
    {
        'country': 'Netherlands',
        'date': '2000-01-18',
        'house': 'Eerste Kamer',
        'debate_title': 'Presentie en opening (dinsdag 18 januari 2000)',
        'debate_id': 'nl.proc.ob.d.h-ek-19992000-493-493',
        'topic': 'Presentie en opening',
        'speech': '\n'.join([
            'Ik deel aan de Kamer mede, dat zijn ingekomen berichten van verhindering van de leden:',
            'Kohnstamm, wegens ziekte;',
            'Boorsma, wegens verblijf buitenslands.',
        ]),
        'id': 'nl.proc.ob.d.h-ek-19992000-493-493.1.5.1',
        'speaker': 'De voorzitter Jurgens',
        'speaker_id': 'nl.m.01992',
        'role': 'Chair',
        'party': None,
        'party_id': None,
        'party_full': None,
        'page': '493',
        'url': 'https://zoek.officielebekendmakingen.nl/h-ek-19992000-493-493.pdf'
    }
]

def test_netherlands(test_app):
    nl_corpus = load_corpus('parliament-netherlands')

    # Assert that indeed we are drawing sources from the testing folder
    assert os.path.join(os.path.dirname(__file__), 'data', 'netherlands') == os.path.abspath(nl_corpus.data_directory)

    # Obtain our mock source XML
    sources = nl_corpus.sources(
        start=nl_corpus.min_date,
        end=nl_corpus.max_date
    )
    docs = nl_corpus.documents(sources)

    for target in target_docs:
        doc = next(docs)

        for key in target:
            assert key in doc
            assert doc[key] == target[key]

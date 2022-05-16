from addcorpus.load_corpus import load_corpus
import os
from datetime import datetime

target_docs = [
    {
        'country': 'Netherlands',
        'date': '2000-01-18',
        'chamber': 'Eerste Kamer',
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
        'url': 'https://zoek.officielebekendmakingen.nl/h-ek-19992000-493-493.pdf',
        'sequence': 1,
    }
]

target_docs_recent = [
    {
        'country': 'Netherlands',
        'date': '2017-01-31',
        'chamber': 'Tweede Kamer',
        'debate_title': 'Report of the meeting of the Dutch Lower House, Meeting 46, Session 23 (2017-01-31)',
        'debate_id': 'ParlaMint-NL_2017-01-31-tweedekamer-23',
        'topic': 'Rapport "Welvaart in kaart"',
        'speech': 'Ik heet de minister van Economische Zaken van harte welkom.',
        'id': 'ParlaMint-NL_2017-01-31-tweedekamer-23.u1',
        'speaker_id': '#KhadijaArib',
        'speaker': 'Khadija Arib',
        'role': 'Chair',
        'party': 'PvdA',
        'party_id': '#party.PvdA',
        'party_full': 'Partij van de Arbeid',
    }
]

def test_netherlands(test_app):
    nl_corpus = load_corpus('parliament-netherlands')

    # Assert that indeed we are drawing sources from the testing folder
    assert os.path.join(os.path.dirname(__file__), 'data', 'netherlands') == os.path.abspath(nl_corpus.data_directory)

    # Obtain our mock source XML
    sources = nl_corpus.sources(
        start=nl_corpus.min_date,
        end=datetime(2015, 1, 1)
    )
    docs = nl_corpus.documents(sources)

    for target in target_docs:
        doc = next(docs)

        for key in target:
            assert key in doc
            assert doc[key] == target[key]

def test_netherlands_recent(test_app):
    nl_corpus = load_corpus('parliament-netherlands')

    # Assert that indeed we are drawing sources from the testing folder
    test_folder = os.path.join(os.path.dirname(__file__), 'data', 'netherlands-recent')
    assert test_folder == os.path.abspath(nl_corpus.data_directory_recent)

    # Obtain our mock source XML
    sources = nl_corpus.sources(
        start=datetime(2015, 1, 1),
        end=nl_corpus.max_date
    )
    docs = nl_corpus.documents(sources)

    for target in target_docs_recent:
        doc = next(docs)

        for key in target:
            assert key in doc
            assert doc[key] == target[key]

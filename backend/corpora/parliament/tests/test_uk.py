from addcorpus.load_corpus import load_corpus
import os
from datetime import datetime

target_docs = [
    {
        'country': 'United Kingdom',
        'date': '1939-07-26',
        'house': 'House of Commons',
        'debate_title': 'Motor Passenger Vehicles',
        'debate_id': '311003',
        'topic': None,
        'speech': "1. asked the Minister of Transport whether, especially in view of the recent omnibus accident near Whitby, in which three Hull persons were killed and 37 injured, he will inquire into the inspection of the brakes and mechanical efficiency generally when this class of vehicle is licensed to carry passengers.",
        'id': '1839045',
        'speaker': 'Lieut.-Commander Kenworthy',
        'speech_type': None,
        'speaker_id': None,
        'role': None,
        'party': None,
        'party_id': None,
        'party_full': None,
        'page': None,
        'column': '1561',
    },
    {
        'country': 'United Kingdom',
        'date': '1939-07-26',
        'house': 'House of Commons',
        'debate_title': 'Motor Passenger Vehicles',
        'debate_id': '311003',
        'topic': None,
        'speech': ' '.join([
            'I have been asked to reply.',
            'Two years ago a circular was sent by the Ministry of Transport to licensing authorities setting out the constructional requirements for motor omnibus and motor coaches recommended by a Departmental Committee which had considered the subject.',
            'These recommendations have it is believed been generally observed by manufacturers in the construction of new vehicles, and have been imposed by many licensing authorities as conditions precedent to the issue of licences to ply for hire.',
            'My hon.',
            'Friend has at present no power either to insist on the adoption of these requirements by licensing authorities or to control their methods of inspecting vehicles presented for licensing.',
            ]),
        'id': '1839046',
        'speaker': 'Mr. Whiteley (Lord Of The Treasury)',
        'speech_type': None,
        'speaker_id': None,
        'role': None,
        'party': None,
        'party_id': None,
        'party_full': None,
        'page': None,
        'column': '1561',
    }
]

def test_uk(test_app):
    uk_corpus = load_corpus('parliament-uk')

    # Assert that indeed we are drawing sources from the testing folder
    assert os.path.join(os.path.dirname(__file__), 'uk') == os.path.abspath(uk_corpus.data_directory)

    # Obtain our mock source CSV
    sources = uk_corpus.sources(
        start=datetime(1970,1,1),
        end=datetime(1970,1,1)
    )
    docs = uk_corpus.documents(sources)

    for target in target_docs:
        doc = next(docs)

        for key in target:
            assert doc[key] == target[key]

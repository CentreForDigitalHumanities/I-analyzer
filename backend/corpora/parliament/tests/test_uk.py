from addcorpus.load_corpus import load_corpus
import os
from datetime import datetime

target_docs = [
    {
        'country': 'United Kingdom',
        'date': '1872-02-06',
        'house': 'House of Commons',
        'debate_title': 'NEW WRITS DURING THE RECESS.',
        'speech': "acquainted the House, —that he had issued Warrants for New Writs, for Truro, v. Hon. John Cranch Walker Vivian, Under Secretary to the Eight hon. Edward Cardwell; for Plymouth, Sir Robert Porrett Collier, knight, one of the Justices of the Court of Common Pleas; Dover, George Jessel, esquire, Solicitor General; York County (West Riding, Northern Division), Sir Francis Crossley, baronet, deceased; Limerick City, Francis William Russell, esquire, deceased; Galway County, Eight hon. William Henry Gregory, Governor and Commander in Chief of the Island of Ceylon and its dependencies; Kerry, Eight hon. Valentine Augustus Browne, commonly called Viscount Castlerosse, now Earl of Kenmare.",
        'id': 'guldi_c19_365565',
        'speaker': 'Mr. SPEAKER',
        'sequence': '365565'
    },
    {
        'country': 'United Kingdom',
        'date': '2020-01-14',
        'house': 'House of Commons',
        'debate_title': 'House of Commons debate on 14/01/2020',
        'debate_id': 'debates2020-01-14c',
        'speech': "What steps his Department is taking to ensure that legal aid is accessible to people who need it.",
        'id': 'uk.org.publicwhip/debate/2020-01-14c.865.4',
        'speaker': 'Sarah Dines',
        'speaker_id': 'uk.org.publicwhip/person/25877',
        'speech_type': 'Start Question',
        'topic': 'The Secretary of State was asked—',
        'subtopic': 'Legal Aid Access',
        'sequence': '0'
    }
]

def test_uk(test_app):
    uk_corpus = load_corpus('parliament-uk')

    # Assert that indeed we are drawing sources from the testing folder
    assert os.path.join(os.path.dirname(__file__), 'data', 'uk') == os.path.abspath(uk_corpus.data_directory)

    # Obtain our mock source CSV
    sources = uk_corpus.sources(
        # UK corpus does not implement start/end values for indexing
        start=datetime(1970,1,1),
        end=datetime(1970,1,1)
    )
    docs = uk_corpus.documents(sources)

    for target in target_docs:
        doc = next(docs)

        for key in target:
            assert key in doc
            assert doc[key] == target[key]

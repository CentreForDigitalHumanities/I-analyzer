from addcorpus.load_corpus import load_corpus
import os
from datetime import datetime

target_docs = [
    {
        'date': '2015-02-02',
        'country': 'Canada',
        'debate_title': 'Government Orders',
        'debate_id': 'ca.proc.d.2015-02-02',
        'chamber': 'House of Commons',
        'party': 'New Democratic Party',
        'speaker': 'Jack Harris',
        'speaker_id': 'c846297d-8bc7-4e69-b6eb-31d0e19f7ec1',
        'speaker_constituency': 'St. John\'s East',
        'speech': 'Mr. Speaker, I suppose I could ask the member for Nanaimo—Alberni why the Government of Canada would put $280 million into last year\'s budget if it was intended to compensate for something that would happen in 2020.',
        'id': 'ca.proc.d.2015-02-02.16582.214',
        'topic': 'Business of Supply',
        'subtopic': 'Opposition Motion—Newfoundland and Labrador Fisheries Investment Fund',
    }
]

def test_canada(test_app):
    corpus = load_corpus('parliament-canada')

    # Assert that indeed we are drawing sources from the testing folder
    assert os.path.join(os.path.dirname(__file__), 'data', 'canada') == os.path.abspath(corpus.data_directory)

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
            assert doc[key] == target[key]

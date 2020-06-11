import re
import os
import os.path as op
import glob
import logging
from datetime import datetime

from flask import current_app

from addcorpus.extract import XML, Metadata, Combined
# SliderRangeFilter, BoxRangeFilter
from addcorpus.filters import MultipleChoiceFilter, RangeFilter
from addcorpus.corpus import XMLCorpus, Field


class GoodReads(XMLCorpus):
    """ Home-scraped XML corpus of GoodReads reviews. """

    # Data overrides from .common.Corpus (fields at bottom of class)
    title = "GoodReads reviews"
    description = "A collection of reviews from GoodReads.com"

    tag_entry = 'review'

    min_date=datetime(2007, 1, 1)
    max_date=datetime(2020, 12, 31)
    data_directory = current_app.config['GOODREADS_DATA']
    es_index = current_app.config['GOODREADS_ES_INDEX']
    es_doctype = current_app.config['GOODREADS_ES_DOCTYPE']
    image = current_app.config['GOODREADS_IMAGE']
    visualize = []

    # New data members
    non_xml_msg = 'Skipping non-XML file {}'
    non_match_msg = 'Skipping XML file with nonmatching name {}'

    def sources(self, start, end):
        for item in os.listdir(self.data_directory):
            path = os.path.join(self.data_directory, item)
            if os.path.isdir(path):
                book_title = item
                orig_dir = os.getcwd()
                os.chdir(os.path.join(path, 'XML'))
                for file in glob.glob("*.xml"):
                    full_path = os.path.join(path, 'XML', file)
                    yield full_path, {
                        'book_title': book_title
                    }
                os.chdir(orig_dir)

    fields = [
        Field(
            name='year',
            display_name='Year',
            description='Year the review was written.',
            extractor=XML(
                tag=['date'],
                toplevel=False,
                transform=lambda x: datetime.strptime(
                    x, '%b %d, %Y').strftime('%Y')
            ),
            es_mapping={'type': 'integer'},
            search_filter=RangeFilter(
                min_date.year,
                max_date.year,
                description=(
                    'Accept only book reviews written in this range.'
                )
            ),
            hidden=True
        ),
        Field(
            name='id',
            display_name='ID',
            description='ID of the review.',
            extractor=XML(
                tag=['id'],
                toplevel=False,
            ),
            es_mapping={'type': 'keyword'},
            csv_core=True,
        ),
        Field(
            name='url',
            display_name='URL',
            description='URL of the review.',
            extractor=XML(
                tag=['url'],
                toplevel=False,
            ),
            es_mapping={'type': 'keyword'},
        ),
        Field(
            name='text',
            display_name='Text',
            description='Fulltext of the review.',
            extractor=XML(
                tag=['text'],
                toplevel=False,
            ),
            es_mapping={'type': 'text'},
            display_type='text_content',
            csv_core=True,
            results_overview=True,
            searchable=True
        ),
        Field(
            name='language',
            display_name='Language',
            description='The language of the review.',
            extractor=XML(
                tag=['language'],
                toplevel=False,
            ),
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Accept only reviews written in these languages.',
                option_count=43
            ),
            results_overview=True,
            csv_core=True,
            visualization_type='term_frequency',
        ),
        Field(
            name='date',
            display_name='Date',
            description='Date the review was written.',
            extractor=XML(
                tag=['date'],
                toplevel=False,
                transform=lambda x: datetime.strptime(
                    x, '%b %d, %Y').strftime('%Y-%m-%d')
            ),
            es_mapping={'type': 'keyword'}
        ),
        Field(
            name='author',
            display_name='Author',
            description='Author of the review.',
            extractor=XML(
                tag=['author'],
                toplevel=False,
            ),
            es_mapping={'type': 'keyword'},
            csv_core=True,
        ),
        Field(
            name='author_gender',
            display_name='Author gender',
            description='Gender of the author. Was guessed based on name.',
            extractor=XML(
                tag=['author_gender'],
                toplevel=False,
            ),
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Accept only reviews made by authors of these genders. Note that gender was guessed based on username',
                option_count=6
            ),
            results_overview=True,
            csv_core=True,
            visualization_type='term_frequency',
        ),
        Field(
            name='rating_text',
            display_name='Goodreads rating',
            description='Rating in the Goodreads style, e.g. \'really liked it\'.',
            extractor=XML(
                tag=['rating'],
                toplevel=False,
            ),
            es_mapping={'type': 'keyword'},
        ),
        Field(
            name='rating_no',
            display_name='Rating',
            description='Rating as a number.',
            extractor=XML(
                tag=['rating_no'],
                toplevel=False,
            ),
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Accept only reviews with these ratings.',
                option_count=6
            ),
            results_overview=True,
            visualization_type='term_frequency',
            visualization_sort='key'
        ),
        Field(
            name='book_title',
            display_name='Book title',
            description='The title of the book reviews were made for. Encompasses all editions.',
            extractor=Metadata('book_title'),
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Accept only reviews made for these titles.',
                option_count=2
            ),
            csv_core=True,
        ),
        Field(
            name='edition_id',
            display_name='Edition ID',
            description='ID of the edition the review was made for.',
            extractor=XML(
                tag=['edition_id'],
                toplevel=False,
            ),
            es_mapping={'type': 'keyword'},
        ),
        Field(
            name='edition_language',
            display_name='Edition language',
            description='The language that the edition that the review is for was written in',
            extractor=XML(
                tag=['edition_language'],
                toplevel=False,
            ),
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Accept only editions written in these languages.',
                option_count=5
            ),
            results_overview=True,
            csv_core=True,
            visualization_type='term_frequency',
        ),
        Field(
            name='edition_publisher',
            display_name='Edition publisher',
            description='Publisher of the edition the review was written for',
            extractor=XML(
                tag=['edition_publisher'],
                toplevel=False,
            ),
            es_mapping={'type': 'keyword'},
        ),
        Field(
            name='edition_publishing_year',
            display_name='Edition publishing year',
            description='Year the edition the review was written for was published.',
            extractor=XML(
                tag=['edition_publishing_year'],
                toplevel=False,
            ),
            es_mapping={'type': 'keyword'},
        ),
    ]

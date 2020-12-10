import re
import os
import os.path as op
import glob
import logging
from datetime import datetime

from flask import current_app
import openpyxl

from addcorpus.extract import XML, Metadata, Combined
# SliderRangeFilter, BoxRangeFilter
from addcorpus.filters import MultipleChoiceFilter, RangeFilter
from addcorpus.corpus import XMLCorpus, Field


class GoodReads(XMLCorpus):
    """ Home-scraped XML corpus of GoodReads reviews. """

    # Data overrides from .common.Corpus (fields at bottom of class)
    title = "DIOPTRA-L"
    description = "Goodreads reviews of translated literary texts"

    tag_entry = 'review'

    min_date=datetime(2007, 1, 1)
    max_date=datetime(2020, 12, 31)
    data_directory = current_app.config['GOODREADS_DATA']
    es_index = current_app.config['GOODREADS_ES_INDEX']
    image = current_app.config['GOODREADS_IMAGE']
    description_page = current_app.config['GOODREADS_DESCRIPTION_PAGE']
    visualize = []

    # New data members
    non_xml_msg = 'Skipping non-XML file {}'
    non_match_msg = 'Skipping XML file with nonmatching name {}'

    def sources(self, start, end):
        for item in os.listdir(self.data_directory):
            path = os.path.join(self.data_directory, item)
            if os.path.isdir(path):
                book_title = item.replace('_', ' ')
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
            name='book_title',
            display_name='Book title',
            description='The title of the book reviews were made for. Encompasses all editions.',
            extractor=Metadata('book_title'),
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Accept only reviews made for these titles.',
                option_count=154
            ),
            csv_core=True
        ),
        Field(
            name='original_language',
            display_name='Original language',
            description='The original language the book reviews were made for was written in.',
            extractor=XML(
                tag=['original_language'],
                toplevel=False,
            ),
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Accept only reviews made for titles originally in this language(s).',
                option_count=8
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
                option_count=8
            ),
            results_overview=True,
            csv_core=True,
            visualization_type='term_frequency',
        ),
        # the following two fields are not actually in the metadata
        # if reindexing from scratch, either:
        # - modify the sources definition such that metadata will include genre and age info
        # - comment out the genre / age info fields prior to indexing, uncomment, run the update script
        Field(
            name='genre',
            display_name='Genre',
            description='The genre of the reviewed book',
            extractor=Metadata('book_genre'),
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Accept only reviews of books in this genre',
                option_count=8
            ),
            visualization_type='term_frequency'
        ),
        Field(
            name='age_category',
            display_name='Age category',
            description='The age category of the target audience of the reviewed book',
            extractor=Metadata('age_category'),
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Accept only reviews of books written for this age category',
                option_count=3
            ),
            visualization_type='term_frequency'
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
            searchable=True,
            visualization_type='wordcloud',
        ),
        Field(
            name='language',
            display_name='Review language',
            description='The language of the review.',
            extractor=XML(
                tag=['language'],
                toplevel=False,
            ),
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Accept only reviews written in these languages.',
                option_count=50
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
            display_name='Reviewer gender',
            description='Gender of the reviewer, guessed based on name.',
            extractor=XML(
                tag=['author_gender'],
                toplevel=False,
            ),
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Accept only reviews made by authors of these genders. Note that gender was guessed based on username',
                option_count=6
            ),
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

    def update_script(self):
        metafile = op.join(self.data_directory, "Reviews_metadata.xlsx")
        wb = openpyxl.load_workbook(filename=metafile)
        sheet = wb['Sheet1']
        for index, row in enumerate(sheet.values):
            if index==0:
                continue
            title = row[0]
            book_genre = row[2]
            age_category = row[3]
            title_cleaned = re.sub('[^\w .-]', '', title)
            update_body = {
                "script": {
                    "source": "ctx._source['book_genre']='{}'; ctx._source['age_category']='{}'".format(book_genre, age_category),
                    "lang": "painless"
                },
                "query": {
                   "bool": {
                        "must_not": {
                            "exists": {
                                "field": "book_genre"
                            }
                        },
                        "filter": {
                            "term": {
                                "book_title": "A game of thrones A song of ice and fire 1"
                            }
                        }
                   }
                }
            }
            yield update_body
            

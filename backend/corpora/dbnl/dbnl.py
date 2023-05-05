from datetime import datetime
import os
import re
from tqdm import tqdm

from django.conf import settings
from addcorpus.corpus import XMLCorpus, Field
from addcorpus.extract import Metadata, XML, Pass, Index
from corpora.dbnl.utils import *
from addcorpus.es_mappings import *
from addcorpus.filters import RangeFilter, MultipleChoiceFilter

class DBNL(XMLCorpus):
    title = 'DBNL'
    description = 'Digitale Bibliotheek voor de Nederlandse letteren'
    data_directory = settings.DBNL_DATA
    min_date = datetime(year=1200, month=1, day=1)
    max_date = datetime(year=2020, month=12, day=31)
    es_index = getattr(settings, 'DBNL_ES_INDEX', 'dbnl')
    image = 'dbnl-logo.jpeg'

    tag_toplevel = 'TEI.2'

    def tag_entry(self, metadata):
        return metadata['xml_entry_level']

    document_context = {
        'context_fields': ['title_id'],
        'sort_field': 'order_in_book',
        'context_display_name': 'book'
    }

    def sources(self, start = None, end = None):
        xml_dir = os.path.join(self.data_directory, 'xml_pd')
        csv_path = os.path.join(self.data_directory, 'titels_pd.csv')
        all_metadata = extract_metadata(csv_path)

        for filename in tqdm(os.listdir(xml_dir)):
            if filename.endswith('.xml'):
                id, *_ = re.split(r'_(?=\d+\.xml$)', filename, maxsplit=1)
                path = os.path.join(xml_dir, filename)
                entry_level = find_entry_level(path)
                metadata = {
                    'id': id,
                    'xml_entry_level': entry_level,
                    **all_metadata[id]
                }

                year = int(metadata['_jaar'])

                if between_years(year, start, end):
                    yield path, metadata

    title_field = Field(
        name='title',
        display_name='Title',
        description='Title of the book',
        results_overview=True,
        search_field_core=True,
        csv_core=True,
        extractor=Metadata('titel'),
        es_mapping=text_mapping(),
        visualizations=['wordcloud']
    )

    title_id = Field(
        name='title_id',
        display_name='Title ID',
        description='ID of the book',
        extractor = Metadata('id'),
        es_mapping=keyword_mapping()
    )

    id = Field(
        name='id',
        extractor=Combined(
            Metadata('id'),
            Index(transform=str),
            transform='_'.join,
        )
    )

    volumes = Field(
        name='volumes',
        display_name='Volumes',
        description='Number of volumes in which this book was published',
        extractor=Metadata('vols'),
        es_mapping=text_mapping(),
    )

    # text version of the year, can include things like 'ca. 1500', '14e eeuw'
    year_full = Field(
        name='year_full',
        display_name='Publication year',
        description='Year of publication in text format. May describe a range.',
        results_overview=True,
        csv_core=True,
        extractor=Metadata('jaar'),
        es_mapping=text_mapping(),
    )

    # version of the year that is always a number
    year_int = Field(
        name='year',
        display_name='Publication year (est.)',
        description='Year of publication as a number. May not be exact.',
        extractor=Metadata('_jaar'),
        es_mapping=int_mapping(),
        search_filter=RangeFilter(lower=1200, upper=2020),
        visualizations=['resultscount', 'termfrequency'],
        sortable=True,
    )

    edition = Field(
        name='edition',
        display_name='Edition',
        description='Edition of the book',
        extractor=Metadata('druk'),
        es_mapping=text_mapping(),
    )

    author = Field(
        name='author',
        display_name='Author',
        description='Name(s) of the author(s)',
        results_overview=True,
        search_field_core=True,
        csv_core=True,
        extractor=join_extracted(
            Combined(
                author_extractor('voornaam'),
                author_extractor('voorvoegsel'),
                author_extractor('achternaam'),
                transform=lambda values: [format_name(parts) for parts in zip(*values)]
            )
        ),
        es_mapping=keyword_mapping(enable_full_text_search=True),
        visualizations=['resultscount', 'termfrequency'],
    )

    author_id = Field(
        name='author_id',
        display_name='Author ID',
        description='ID(s) of the author(s)',
        extractor=author_single_value_extractor('pers_id'),
        es_mapping=keyword_mapping(),
    )

    author_year_of_birth = Field(
        name='author_year_of_birth',
        display_name='Author year of birth',
        description='Year in which the author(s) was(/were) born',
        extractor=author_single_value_extractor('jaar_geboren'),
        es_mapping=text_mapping(),
    )

    author_year_of_death = Field(
        name='author_year_of_death',
        display_name='Author year of death',
        description='Year in which the author(s) died',
        extractor=author_single_value_extractor('jaar_overlijden'),
        es_mapping=text_mapping(),
    )

    # the above fields are also given as proper dates in geb_datum / overl_datum
    # but implementing them as date fields requires support for multiple values

    author_place_of_birth = Field(
        name='author_place_of_birth',
        display_name='Author place of birth',
        description='Place the author(s) was(/were) born',
        extractor=author_single_value_extractor('geb_plaats'),
        es_mapping=keyword_mapping(),
    )

    author_place_of_death = Field(
        name='author_place_of_death',
        display_name='Author place of death',
        description='Place where the author(s) died',
        extractor=author_single_value_extractor('overl_plaats'),
        es_mapping=keyword_mapping(),
    )

    # gender is coded as a binary value (∈ ['1', '0'])
    # converted to a string to be more comparable with other corpora
    author_gender = Field(
        name='author_gender',
        display_name='Author gender',
        description='Gender of the author(s)',
        extractor=join_extracted(
            Pass(
                author_extractor('vrouw',),
                transform=lambda values: map(
                    lambda value: {'0': 'man', '1': 'vrouw'}.get(value, None),
                    values
                ),
            )
        ),
        es_mapping=keyword_mapping(),
        search_filter=MultipleChoiceFilter(),
        visualizations=['resultscount', 'termfrequency'],
    )

    url = Field(
        name='url',
        display_name='URL',
        description='Link to the book\'s page in DBNL',
        extractor=Metadata('url'),
        es_mapping=keyword_mapping(),
    )

    url_txt = Field(
        name = 'url_txt',
        display_name='URL (txt file)',
        description='Link to a .txt file with the book\'s contents',
        extractor=Metadata('text_url'),
        es_mapping=keyword_mapping(),
    )

    genre = Field(
        name='genre',
        display_name='Genre',
        description='Genre of the book',
        extractor=join_extracted(Metadata('genre')),
        es_mapping=keyword_mapping(),
        search_filter=MultipleChoiceFilter(),
        visualizations=['resultscount', 'termfrequency'],

    )

    language = Field(
        name='language',
        display_name='Language',
        description='Language in which the book is written',
        extractor=XML(
            'language',
            toplevel=True,
            recursive=True,
            multiple=True,
            transform=join_values,
        ),
        es_mapping=keyword_mapping(),
        search_filter=MultipleChoiceFilter(),
        visualizations=['resultscount', 'termfrequency'],
    )

    language_code = Field(
        name='language_code',
        display_name='Language code',
        description='ISO code of the text\'s language',
        extractor=Backup(
            XML(
                attribute='lang',
            ),
            XML(
                'language',
                attribute='id',
                toplevel=True,
                recursive=True,
            ),
        ),
        es_mapping=keyword_mapping(),
    )

    content = Field(
        name='content',
        display_name='Content',
        description='Content of this section',
        display_type='text_content',
        results_overview=True,
        search_field_core=True,
        csv_core=True,
        extractor=XML(
            tag=re.compile('^(p|l|head|row)$'),
            recursive=True,
            multiple=True,
            flatten=True,
        ),
        es_mapping=main_content_mapping(token_counts=True),
        visualizations=['wordcloud', 'ngram'],
    )

    order_in_book = Field(
        name='order_in_book',
        display_name='Order within book',
        description='Order of this section within the book',
        extractor=Index(),
        es_mapping=int_mapping(),
        sortable=True,
    )

    fields = [
        title_field,
        title_id,
        id,
        volumes,
        edition,
        year_full,
        year_int,
        author,
        author_id,
        author_year_of_birth,
        author_place_of_birth,
        author_year_of_death,
        author_place_of_death,
        author_gender,
        url,
        url_txt,
        genre,
        language,
        language_code,
        content,
        order_in_book,
    ]

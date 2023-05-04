from datetime import datetime
import os

from django.conf import settings
from addcorpus.corpus import XMLCorpus, Field
from addcorpus.extract import Metadata, XML, Pass, Index
from corpora.dbnl.utils import *

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

    def sources(self, start = None, end = None):
        xml_dir = os.path.join(self.data_directory, 'xml_pd')
        csv_path = os.path.join(self.data_directory, 'titels_pd.csv')
        all_metadata = extract_metadata(csv_path)

        for filename in os.listdir(xml_dir):
            if filename.endswith('.xml'):
                id, *_ = filename.split('_')
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
        display_type='text',
        description='Title of the book',
        extractor=Metadata('titel')
    )

    title_id = Field(
        name='title_id',
        display_name='Title ID',
        display_type='text',
        description='ID of the book',
        extractor = Metadata('id')
    )

    volumes = Field(
        name='volumes',
        extractor=Metadata('vols'),
    )

    # text version of the year, can include things like 'ca. 1500', '14e eeuw'
    year_full = Field(
        name='year_full',
        extractor=Metadata('jaar')
    )

    # version of the year that is always a number
    year_int = Field(
        name='year',
        extractor=Metadata('_jaar')
    )

    edition = Field(
        name='edition',
        extractor=Metadata('druk')
    )

    author = Field(
        name='author',
        extractor=join_extracted(
            Combined(
                author_extractor('voornaam'),
                author_extractor('voorvoegsel'),
                author_extractor('achternaam'),
                transform=lambda values: [format_name(parts) for parts in zip(*values)]
            )
        )
    )

    author_id = Field(
        name='author_id',
        extractor=author_single_value_extractor('pers_id')
    )

    author_year_of_birth = Field(
        name='author_year_of_birth',
        extractor=author_single_value_extractor('jaar_geboren')
    )

    author_year_of_death = Field(
        name='author_year_of_death',
        extractor=author_single_value_extractor('jaar_overlijden'),
    )

    # the above fields are also given as proper dates in geb_datum / overl_datum
    # but implementing them as date fields requires support for multiple values

    author_place_of_birth = Field(
        name='author_place_of_birth',
        extractor=author_single_value_extractor('geb_plaats'),
    )

    author_place_of_death = Field(
        name='author_place_of_death',
        extractor=author_single_value_extractor('overl_plaats')
    )

    # gender is coded as a binary value (∈ ['1', '0'])
    # converted to a string to be more comparable with other corpora
    author_gender = Field(
        name='author_gender',
        extractor=join_extracted(
            Pass(
                author_extractor('vrouw',),
                transform=lambda values: map(
                    lambda value: {'0': 'man', '1': 'vrouw'}.get(value, None),
                    values
                ),
            )
        )
    )

    url = Field(
        name='url',
        extractor=Metadata('url')
    )

    url_txt = Field(
        name = 'url_txt',
        extractor=Metadata('text_url')
    )

    genre = Field(
        name='genre',
        extractor=join_extracted(Metadata('genre'))
    )

    language = Field(
        name='language',
        extractor=XML(
            'language',
            toplevel=True,
            recursive=True,
        )
    )

    language_code = Field(
        name='language_code',
        extractor=XML(
            'language',
            attribute='id',
            toplevel=True,
            recursive=True,
        )
    )

    content = Field(
        name='content',
        extractor=XML(
            tag='p',
            multiple=True,
            flatten=True,
        )
    )

    order_in_book = Field(
        name='order_in_book',
        extractor=Index(),
    )

    fields = [
        title_field,
        title_id,
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

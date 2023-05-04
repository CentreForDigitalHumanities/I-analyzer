from datetime import datetime
import os
from bs4 import BeautifulSoup

from django.conf import settings
from addcorpus.corpus import XMLCorpus, Field
from addcorpus.extract import Metadata, XML
from corpora.dbnl.utils import *

def author_extractor(field, extract=dict.get, join=', '.join):
    '''
    Create an extractor for author metadata.

    Input:
    - field: the field of the author data
    - extract(author, field): function to extract the value for each author,
     based on the author dict and the field. Defaults to `dict.get`.
    - join(values): function to join the formatted values for each author
    '''

    return Metadata(
        'auteurs',
        transform=lambda authors: join(extract(author, field) for author in authors)
    )


def between_years(year, start_date, end_date):
    if start_date and year < start_date.year:
        return False

    if end_date and year > end_date.year:
        return False

    return True

def find_entry_level(xml_path):
    with open(xml_path) as xml_file:
        soup = BeautifulSoup(xml_file, 'lxml-xml')

        # potential levels of documents, in order of preference
        levels = [
            # { 'name': 'div', 'attrs': {'type': 'section'} },
            { 'name': 'div', 'attrs': {'type': 'chapter'} },
            { 'name': 'text' }
        ]

        level = next(level for level in levels if soup.find(**level))

    return level

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

    # ppn_o
    # bibliotheek
    # categorie

    author = Field(
        name='author',
        extractor=author_extractor(
            ['voornaam', 'voorvoegsel', 'achternaam'],
            extract=lambda author, keys: ' '.join(author[key] for key in keys if author[key]),
        )
    )

    author_id = Field(
        name='author_id',
        extractor=author_extractor('pers_id',),
    )

    author_year_of_birth = Field(
        name='author_year_of_birth',
        extractor=author_extractor('jaar_geboren'),
    )

    author_year_of_death = Field(
        name='author_year_of_death',
        extractor=author_extractor('jaar_overlijden'),
    )

    # these fields are given as proper dates in geb_datum / overl_datum
    # but implementing them as date fields requires support for multiple values

    author_place_of_birth = Field(
        name='author_place_of_birth',
        extractor=author_extractor('geb_plaats'),
    )

    author_place_of_death = Field(
        name='author_place_of_death',
        extractor=author_extractor('overl_plaats')
    )

    # gender is coded as a binary value (∈ ['1', '0'])
    # converted to a string to be more comparable with other corpora
    author_gender = Field(
        name='author_gender',
        extractor=author_extractor(
            'vrouw',
            # format=lambda value: {'0': 'man', '1': 'vrouw'}.get(value, None),
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
        extractor=Metadata(
            'genre',
            transform=', '.join,
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
        # author_gender,
        url,
        url_txt,
        # genre,
        content,
    ]

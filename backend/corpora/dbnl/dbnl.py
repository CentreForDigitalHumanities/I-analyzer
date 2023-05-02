from datetime import datetime
import os

from django.conf import settings
from addcorpus.corpus import XMLCorpus, Field
from addcorpus.extract import Metadata, XML
from corpora.dbnl.utils import *

def author_extractor(field, extract=dict.get, join=list):
    '''
    Create an extractor for author metadata.

    Input:
    - field: the field of the author data
    - extract(author, field): function to extract the value for each author,
     based on the author dict and the field. Defaults to `dict.get`.
    - join(values): function to join the extracted values for each author
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

class DBNL(XMLCorpus):
    title = 'DBNL'
    description = 'Digitale Bibliotheek voor de Nederlandse letteren'
    data_directory = settings.DBNL_DATA
    min_date = datetime(year=1200, month=1, day=1)
    max_date = datetime(year=2020, month=12, day=31)
    es_index = getattr(settings, 'DBNL_ES_INDEX', 'dbnl')
    image = 'dbnl-logo.jpeg'

    tag_toplevel = 'TEI.2'
    tag_entry = 'text'

    def sources(self, start = None, end = None):
        xml_dir = os.path.join(self.data_directory, 'xml_pd')
        csv_path = os.path.join(self.data_directory, 'titels_pd.csv')
        all_metadata = extract_metadata(csv_path)

        for filename in os.listdir(xml_dir):
            if filename.endswith('.xml'):
                id, *_ = filename.split('_')
                metadata = {'id': id, **all_metadata[id]}
                year = int(metadata['_jaar'])

                if between_years(year, start, end):
                    yield os.path.join(xml_dir, filename), metadata

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
            join=', '.join
        )
    )

    author_id = Field(
        name='author_id',
        extractor=author_extractor('pers_id',)
    )

    # jaar_geboren
    # jaar_overlijden
    # geb_datum
    # overl_datum
    # geb_plaats
    # overl_plaats
    # geb_plaats_code
    # geb_land_code
    # overl_plaats_code
    # overl_land_code
    # vrouw

    url = Field(
        name='url',
        extractor=Metadata('url')
    )

    url_txt = Field(
        name = 'url_txt',
        extractor=Metadata('text_url')
    )

    # genre

    fields = [
        title_field,
        title_id,
        volumes,
        edition,
        year_full,
        year_int,
        author,
        author_id,
        url,
        url_txt,
    ]

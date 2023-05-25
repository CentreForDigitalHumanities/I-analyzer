import os
from django.conf import settings
from addcorpus.corpus import CSVCorpus, Field
from addcorpus.extract import CSV, Combined, Pass
import corpora.dbnl.utils as utils

class DBNLMetadata(CSVCorpus):
    '''Helper corpus for extracting the DBNL metadata'''

    data_directory = settings.DBNL_DATA

    field_entry = 'ti_id'
    delimiter = '|'
    skip_lines = 1

    def sources(self, start=None, end=None):
        csv_path = os.path.join(self.data_directory, 'titels_pd.csv')
        yield csv_path, {}

    # fields that have a singular value
    _singular_fields = [
        ('title_id', 'ti_id'),
        ('title', 'titel'),
        ('volumes', 'vols'),
        ('year', '_jaar'),
        ('year_full', 'jaar'),
        ('edition', 'druk'),
        ('url', 'url'),
    ]

    # fields that should be extracted for each author
    # but have otherwise straightfoward extraction
    _simple_author_fields = [
        ('id', 'pers_id'),
        ('year_of_birth', 'jaar_geboren'),
        ('place_of_birth', 'geb_plaats'),
        ('year_of_death', 'jaar_overlijden'),
        ('place_of_death', 'overl_plaats')
    ]

    fields = [
        Field(name=name, extractor=CSV(column))
        for name, column in _singular_fields
    ] + [
        Field(
            name='genre',
            extractor=Pass(
                utils.filter_by(
                    CSV('genre', multiple=True),
                    CSV('genre', multiple=True, transform=utils.which_unique)
                ),
                transform=utils.join_values,
            )
        ),
        Field(
            name='periodical',
            extractor=CSV('achternaam', multiple=True,
                transform=utils.get_periodical
            )
        )
    ] + [
        Field(
            'author_' + name,
            extractor=utils.by_author(
                CSV(column, multiple=True),
            )
        )
        for name, column in _simple_author_fields
    ] + [
        Field(
            'author_name',
            extractor=utils.by_author(
                Combined(
                    CSV('voornaam', multiple=True),
                    CSV('voorvoegsel', multiple=True),
                    CSV('achternaam', multiple=True),
                    transform=lambda names: map(utils.format_name, zip(*names))
                ),
            )
        ),
        Field(
            'author_gender',
            extractor=utils.by_author(
                CSV('vrouw', multiple=True,
                    transform=lambda values: map(utils.format_gender, values)
                )
            )
        )
    ]


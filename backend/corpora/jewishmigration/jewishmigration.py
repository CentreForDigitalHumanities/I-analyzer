from datetime import datetime

from django.conf import settings
import requests

from addcorpus.corpus import ApiCorpusDefinition, FieldDefinition
from addcorpus.es_mappings import geo_mapping, keyword_mapping, text_mapping
import addcorpus.extract as extract


class JewishMigration(ApiCorpusDefinition):
    ''' Class for indexing Jewish Migration data '''
    title = "Modelling Jewish Migration"
    description = "Inscriptions and book entries documenting Jewish settlements in the Mediterranean"
    min_date = datetime(year=0, month=1, day=1)
    max_date = datetime(year=1900, month=12, day=31)
    data_directory = getattr(settings, 'JMIG_DATA', 'localhost:4242')

    es_index = getattr(settings, 'JMIG_INDEX', 'jewishmigration')
    # image = 'netherlands.jpg'
    description_page = 'jewish_migration.md'
    languages = ['en']

    category = 'collection'

    def sources(self, start, end):
        list_of_sources = requests.get(self.data_directory)
        for source in list_of_sources:
            yield source
    
    fields = [
        FieldDefinition(
            name='id',
            display_name='Identifier',
            description='Identifier of the resource',
            es_mapping=keyword_mapping,
            extractor=extract.JSON('id'),
            csv_core=True,
            sortable=True
        ),
        FieldDefinition(
            name='source',
            display_name='Source',
            description='Where evidence for migration was found',
            es_mapping=keyword_mapping,
            extractor=extract.JSON('source'),
        ),
        FieldDefinition(
            name='language',
            display_name='Language',
            description='Which language the source is in',
            es_mapping=keyword_mapping,
            extractor=extract.JSON('language'),
        ),
        FieldDefinition(
            name='script',
            display_name='Script',
            description='Which alphabet the source was written in',
            es_mapping=keyword_mapping,
            extractor=extract.JSON('script'),
        ),
        FieldDefinition(
            name='place',
            display_name='Place Name',
            description='In which place there was a settlement',
            es_mapping=keyword_mapping,
            extractor=extract.JSON('place_name'),
        ),
        FieldDefinition(
            name='area',
            display_name='Area',
            description='In which area there was a settlement',
            es_mapping=keyword_mapping,
            extractor=extract.JSON('area'),
        ),
        FieldDefinition(
            name='region',
            display_name='Region',
            description='In which region there was a settlement',
            es_mapping=keyword_mapping,
            extractor=extract.JSON('region'),
        ),
        FieldDefinition(
            name='coordinates',
            display_name='Geo-coordinates',
            description='Geo-coordinates of the settlement',
            es_mapping=geo_mapping,
            extractor=extract.JSON('coordinates'),
        ),
    ]
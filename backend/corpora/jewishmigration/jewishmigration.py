from datetime import datetime

from django.conf import settings
import requests

from addcorpus.corpus import ApiCorpusDefinition, FieldDefinition
from addcorpus.es_mappings import geo_mapping, int_mapping, keyword_mapping, main_content_mapping, text_mapping
import addcorpus.extract as extract


class JewishMigration(ApiCorpusDefinition):
    ''' Class for indexing Jewish Migration data '''
    title = "Modelling Jewish Migration"
    description = "Inscriptions and book entries documenting Jewish settlements in the Mediterranean"
    min_date = datetime(year=1800, month=1, day=1)
    max_date = datetime(year=1, month=12, day=31)
    data_directory = getattr(settings, 'JMIG_DATA', 'localhost:4242')

    es_index = getattr(settings, 'JMIG_INDEX', 'jewishmigration')
    image = 'jewish_inscriptions.jpg'
    description_page = 'jewish_migration.md'
    languages = ['en']

    category = 'inscription'

    def sources(self, start, end):
        list_of_sources = requests.get(self.data_directory)
        for source in list_of_sources:
            yield source
    
    fields = [
        FieldDefinition(
            name='id',
            display_name='Identifier',
            description='Identifier of the resource',
            es_mapping=keyword_mapping(),
            extractor=extract.JSON('id'),
            csv_core=True,
            sortable=True
        ),
        FieldDefinition(
            name='source',
            display_name='Source',
            description='Where evidence for migration was found',
            es_mapping=keyword_mapping(),
            extractor=extract.JSON('source'),
        ),
        FieldDefinition(
            name='language',
            display_name='Language',
            description='Which language the source is in',
            es_mapping=keyword_mapping(),
            extractor=extract.JSON('language'),
        ),
        FieldDefinition(
            name='script',
            display_name='Script',
            description='Which alphabet the source was written in',
            es_mapping=keyword_mapping(),
            extractor=extract.JSON('script'),
        ),
        FieldDefinition(
            name='place',
            display_name='Place Name',
            description='In which place there was a settlement',
            es_mapping=keyword_mapping(True),
            extractor=extract.JSON('place_name'),
        ),
        FieldDefinition(
            name='area',
            display_name='Area',
            description='In which area there was a settlement',
            es_mapping=keyword_mapping(True),
            extractor=extract.JSON('area'),
        ),
        FieldDefinition(
            name='region',
            display_name='Region',
            description='In which region there was a settlement',
            es_mapping=keyword_mapping(True),
            extractor=extract.JSON('region'),
        ),
        FieldDefinition(
            name='coordinates',
            display_name='Geo-coordinates',
            description='Geo-coordinates of the settlement',
            es_mapping=geo_mapping(),
            extractor=extract.JSON('coordinates'),
        ),
        FieldDefinition(
            name='site_type',
            display_name='Site Type',
            description='Type of site where evidence for settlement was found',
            es_mapping=keyword_mapping(),
            extractor=extract.JSON('site_type')
        ),
        FieldDefinition(
            name='inscription_type',
            display_name='Inscription type',
            description='Type of inscription',
            es_mapping=keyword_mapping(),
            extractor=extract.JSON('inscription_type')
        ),
        FieldDefinition(
            name='period',
            display_name='Period',
            description='Period in which the inscription was made',
            es_mapping=keyword_mapping(),
            extractor=extract.JSON('period')
        ),
        FieldDefinition(
            name='centuries',
            display_name='Centuries',
            description='Centuries in which the inscription was made',
            es_mapping=keyword_mapping(),
            extractor=extract.JSON('centuries')
        ),
        FieldDefinition(
            name='inscription_count',
            display_name='Inscription count',
            description='Number of inscriptions',
            es_mapping=int_mapping(),
            extractor=extract.JSON('inscriptions_count')
        ),
        FieldDefinition(
            name='religious_profession',
            display_name='Religious profession',
            description='Religious profession of deceased',
            es_mapping=keyword_mapping(),
            extractor=extract.JSON('religious_profession')
        ),
        FieldDefinition(
            name='sex_dedicator',
            display_name='Gender dedicator',
            description='Gender of the dedicator',
            es_mapping=keyword_mapping(),
            extractor=extract.JSON('sex_dedicator')
        ),
        FieldDefinition(
            name='sex_deceased',
            display_name='Gender deceased',
            description='Gender of the deceased',
            es_mapping=keyword_mapping(),
            extractor=extract.JSON('sex_deceased')
        ),
        FieldDefinition(
            name='symbol',
            display_name='Symbol',
            description='Symbol in inscription',
            es_mapping=keyword_mapping(),
            extractor=extract.JSON('symbol')
        ),
        FieldDefinition(
            name='comments',
            display_name='Comments',
            description='Comments by collector',
            es_mapping=text_mapping(),
            extractor=extract.JSON('comments')
        ),
        FieldDefinition(
            name='inscription',
            display_name='Inscription',
            description='Text of the inscription',
            es_mapping=text_mapping(),
            extractor=extract.JSON('inscription')
        ),
        FieldDefinition(
            name='transcription',
            display_name='Transcription',
            description='Transcription of the inscription to English',
            es_mapping=main_content_mapping(),
            extractor=extract.JSON('transcription')
        )
    ]
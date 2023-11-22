from datetime import datetime
from langcodes import Language

from django.conf import settings
import requests

from addcorpus.corpus import JSONCorpusDefinition, FieldDefinition
from addcorpus.es_mappings import int_mapping, keyword_mapping, main_content_mapping, text_mapping
import addcorpus.extract as extract
from corpora.peaceportal.peaceportal import PeacePortal
from corpora.utils.exclude_fields import exclude_fields_without_extractor

class JewishMigration(PeacePortal, JSONCorpusDefinition):
    ''' Class for indexing Jewish Migration data '''
    title = "Modelling Jewish Migration"
    description = "Inscriptions and book entries documenting Jewish settlements in the Mediterranean"
    min_date = datetime(year=1, month=1, day=1)
    max_date = datetime(year=1800, month=12, day=31)
    data_directory = getattr(settings, 'JMIG_DATA', 'localhost:4242')

    es_index = getattr(settings, 'JMIG_INDEX', 'jewishmigration')
    image = 'jewish_inscriptions.jpg'
    description_page = 'jewish_migration.md'
    languages = ['en']

    category = 'inscription'

    def sources(self, start, end):
        response = requests.get(self.data_directory)
        list_of_sources = response.json()
        for source in list_of_sources:
            yield source
    
    def transform_language(language_string):
        ''' transform the language to an iso code 
        to do: include information about script?'''
        lang = Language(language_string)
        return lang.to_tag()

    
    def __init__(self):
        super().__init__()
        self._id.extractor = extract.JSON(key='identifier')
        self.source_database.extractor = extract.JSON(key='source')
        self.language.extractor = extract.JSON(key='language')
        self.language_code.extractor = extract.JSON(key='language', transform=self.transform_language)
        self.country.extractor = extract.JSON(key='area')
        self.region.extractor = extract.JSON(key='region')
        self.settlement.extractor = extract.JSON(key='place_name')
        self.coordinates.extractor = extract.JSON(key='coordinates')
        self.sex.extractor = extract.JSON(key='sex_deceased')
        self.iconography.extractor = extract.JSON(key='symbol')
        self.comments.extractor = extract.JSON(key='comments')
        self.transcription = extract.JSON(key='inscription')
        self.transcription_english = extract.JSON(key='transcription')
        self.fields = exclude_fields_without_extractor(self.fields)
        extra_fields = [
            FieldDefinition(
                name='script',
                display_name='Script',
                description='Which alphabet the source was written in',
                es_mapping=keyword_mapping(),
                extractor=extract.JSON(key='script'),
            ),
            FieldDefinition(
                name='site_type',
                display_name='Site Type',
                description='Type of site where evidence for settlement was found',
                es_mapping=keyword_mapping(),
                extractor=extract.JSON(key='site_type')
            ),
            FieldDefinition(
                name='inscription_type',
                display_name='Inscription type',
                description='Type of inscription',
                es_mapping=keyword_mapping(),
                extractor=extract.JSON(key='inscription_type')
            ),
            FieldDefinition(
                name='period',
                display_name='Period',
                description='Period in which the inscription was made',
                es_mapping=keyword_mapping(),
                extractor=extract.JSON(key='period')
            ),
            FieldDefinition(
                name='centuries',
                display_name='Centuries',
                description='Centuries in which the inscription was made',
                es_mapping=keyword_mapping(),
                extractor=extract.JSON(key='centuries')
            ),
            FieldDefinition(
                name='inscription_count',
                display_name='Inscription count',
                description='Number of inscriptions',
                es_mapping=int_mapping(),
                extractor=extract.JSON(key='inscriptions_count')
            ),
            FieldDefinition(
                name='religious_profession',
                display_name='Religious profession',
                description='Religious profession of deceased',
                es_mapping=keyword_mapping(),
                extractor=extract.JSON(key='religious_profession')
            ),
            FieldDefinition(
                name='sex_dedicator',
                display_name='Gender dedicator',
                description='Gender of the dedicator',
                es_mapping=keyword_mapping(),
                extractor=extract.JSON(key='sex_dedicator')
            )
        ]
        self.fields = [*exclude_fields_without_extractor(self.fields), *extra_fields]
        
        # TO DO: investigate if it's acceptable to call "inscription"=>"transcription"
        # FieldDefinition(
        #     name='inscription',
        #     display_name='Inscription',
        #     description='Text of the inscription',
        #     es_mapping=text_mapping(),
        #     extractor=extract.JSON(key='inscription')
        # ),
        # FieldDefinition(
        #     name='transcription',
        #     display_name='Transcription',
        #     description='Transcription of the inscription to English',
        #     es_mapping=main_content_mapping(),
        #     extractor=extract.JSON(key='transcription')
        # )

from datetime import datetime
from glob import glob

from django.conf import settings
from ianalyzer_readers.extract import CSV

from addcorpus.es_settings import es_settings
from addcorpus.python_corpora.corpus import CSVCorpusDefinition, FieldDefinition
from addcorpus.python_corpora.filters import MultipleChoiceFilter

from corpora.dutchnewspapers.field_definitions import (
    article_category,
    article_title,
    circulation,
    content,
    date,
    identifier,
    issue_number,
    language,
    newspaper_title,
    ocr_confidence,
    publication_place,
    publisher,
    source,
    temporal,
    url,
    version_of,
)

def extract_tag_category(data: str, category: str):
    tags = data.split(",")
    return next((tag.split(": ")[-1] for tag in tags if tag.startswith(category)), None)

def extract_sound_carrier(data: str):
    return extract_tag_category(data, "Carrier")

def extract_sound_quality(data: str):
    return extract_tag_category(data, "Quality")

def extract_sound_source(data: str):
    return extract_tag_category(data, "Source")

class TracesOfSound(CSVCorpusDefinition):
    '''
    Corpus with references to sound in Dutch newspapers (and ultimately, other sources)
    '''

    title = "Traces of Sound"
    description = "Collection of articiles from Dutch newspapers in the public domain with references to sound"
    min_date = datetime(year=1600, month=1, day=1)
    max_date = datetime(year=1876, month=12, day=31)
    data_directory = settings.TOS_DATA
    es_index = getattr(settings, 'TOS_ES_INDEX', 'traces-of-sound')
    languages = ['nl']
    category = 'periodical'
    description_page = 'traces_of_sound.md'

    @property
    def es_settings(self):
        return es_settings(self.languages[:1], stopword_analysis=True, stemming_analysis=True)
    
    def sources(self, start=min_date, end=max_date):
        for csv_file in glob(f"{self.data_directory}/*.csv"):
            yield csv_file, {}

    article_category = article_category()
    article_category.extractor = CSV('category')

    article_title = article_title()
    article_title.extractor = CSV('article_title')

    circulation = circulation()
    circulation.extractor = CSV('circulation')
    
    content = content()
    content.extractor = CSV('content')
    
    date = date(min_date, max_date)
    date.extractor = CSV('date')
    
    identifier = identifier()
    identifier.extractor = CSV('id')

    issue_number = issue_number()
    issue_number.extractor = CSV('issue_number')
    
    language = language()
    language.extractor = CSV('language')

    newspaper_title = newspaper_title(10)
    newspaper_title.extractor = CSV('newspaper_title')
    
    ocr_confidence = ocr_confidence()
    ocr_confidence.extractor = CSV('ocr')
    
    publication_place = publication_place()
    publication_place.extractor = CSV('publication_place')
    
    publisher = publisher()
    publisher.extractor = CSV('publisher')

    sound_carrier = FieldDefinition(
        name="sound_carrier",
        display_name="Sound carrier",
        description="The carrier of the sound.",
        es_mapping={"type": "keyword"},
        extractor=CSV('tags', transform=extract_sound_carrier),
        search_filter=MultipleChoiceFilter(
            description="Accept only articles with these sound carriers.",
            option_count=10,
        ),
    )

    sound_quality = FieldDefinition(
        name="sound_quality",
        display_name="Sound quality",
        description="The quality of the sound.",
        es_mapping={"type": "keyword"},
        extractor=CSV('tags', transform=extract_sound_quality),
        search_filter=MultipleChoiceFilter(
            description="Accept only articles with these sound qualities.",
            option_count=10,
        ),
    )

    sound_source = FieldDefinition(
        name="sound_source",
        display_name="Sound source",
        description="The source of the sound.",
        es_mapping={"type": "keyword"},
        extractor=CSV('tags', transform=extract_sound_source),
        search_filter=MultipleChoiceFilter(
            description="Accept only articles with these sound sources.",
            option_count=10,
        ),
    )
    
    source = source()
    source.extractor = CSV('source')

    temporal = temporal()
    temporal.extractor = CSV('temporal')
    
    url = url()
    url.extractor = CSV('url')
    
    version_of = version_of()
    version_of.extractor = CSV('version_of')

    @property
    def fields(self):
        return [
            self.date,
            self.sound_carrier,
            self.sound_quality,
            self.sound_source,
            self.article_category,
            self.circulation,
            self.ocr_confidence,
            self.language,
            self.newspaper_title,
            self.temporal,
            self.content,
            self.article_title,
            self.publisher,
            self.publication_place,
            self.identifier,
            self.issue_number,
            self.source,
            self.url,
            self.version_of,
        ]
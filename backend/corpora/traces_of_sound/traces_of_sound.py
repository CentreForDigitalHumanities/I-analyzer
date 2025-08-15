from glob import glob
from copy import copy

from django.conf import settings
from ianalyzer_readers.extract import CSV

from addcorpus.es_mappings import keyword_mapping
from addcorpus.es_settings import es_settings
from addcorpus.python_corpora.corpus import CSVCorpusDefinition, FieldDefinition
from addcorpus.python_corpora.filters import MultipleChoiceFilter
from corpora.dutchnewspapers.dutchnewspapers_public import DutchNewspapersPublic


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
    description = "Articles from Dutch newspapers in the public domain with references " \
        "to sound. This is an annotated collection from the 'Dutch Newspapers (public)' " \
        "corpus."
    min_date = DutchNewspapersPublic.min_date
    max_date = DutchNewspapersPublic.max_date
    data_directory = settings.TOS_DATA
    es_index = getattr(settings, 'TOS_ES_INDEX', 'traces-of-sound')
    languages = DutchNewspapersPublic.languages
    category = DutchNewspapersPublic.category
    description_page = 'traces_of_sound.md'

    @property
    def es_settings(self):
        return es_settings(self.languages[:1], stopword_analysis=True, stemming_analysis=True)

    def sources(self, **kwargs):
        for csv_file in glob(f"{self.data_directory}/*.csv"):
            yield csv_file

    sound_carrier = FieldDefinition(
        name="sound_carrier",
        display_name="Sound carrier",
        description="The carrier of the sound.",
        es_mapping=keyword_mapping(),
        extractor=CSV('tags', transform=extract_sound_carrier),
        search_filter=MultipleChoiceFilter(
            description="Accept only articles with these sound carriers.",
        ),
    )

    sound_quality = FieldDefinition(
        name="sound_quality",
        display_name="Sound quality",
        description="The quality of the sound.",
        es_mapping=keyword_mapping(),
        extractor=CSV('tags', transform=extract_sound_quality),
        search_filter=MultipleChoiceFilter(
            description="Accept only articles with these sound qualities.",
        ),
    )

    sound_source = FieldDefinition(
        name="sound_source",
        display_name="Sound source",
        description="The source of the sound.",
        es_mapping=keyword_mapping(),
        extractor=CSV('tags', transform=extract_sound_source),
        search_filter=MultipleChoiceFilter(
            description="Accept only articles with these sound sources.",
        ),
    )

    extra_fields = [sound_carrier, sound_quality, sound_source]

    @property
    def fields(self):
        base_fields = [
            self._copy_field(field) for field in DutchNewspapersPublic().fields
        ]
        return base_fields[:1] + self.extra_fields + base_fields[1:]


    def _copy_field(self, field: FieldDefinition) -> FieldDefinition:
        clone = copy(field)
        clone.extractor = CSV(field.name)
        return clone

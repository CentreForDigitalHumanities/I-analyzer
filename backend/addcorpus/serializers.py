from rest_framework import serializers
from addcorpus.models import Corpus, CorpusConfiguration, Field
from addcorpus.constants import CATEGORIES
from langcodes import Language, standardize_tag

class NonEmptyJSONField(serializers.JSONField):
    '''
    JSON field serialiser that converts empty dicts `{}`
    to `None`/null values
    '''

    def to_representation(self, value):
        data = super().to_representation(value)
        # do not return empty dicts
        if data:
            return data

class FieldSerializer(serializers.ModelSerializer):
    search_filter = NonEmptyJSONField()
    class Meta:
        model = Field
        fields = [
            'name',
            'display_name',
            'display_type',
            'description',
            'search_filter',
            'results_overview',
            'csv_core',
            'search_field_core',
            'visualizations',
            'visualization_sort',
            'es_mapping',
            'indexed',
            'hidden',
            'required',
            'sortable',
            'primary_sort',
            'searchable',
            'downloadable',
        ]


class LanguageField(serializers.CharField):
    def to_representation(self, value):
        if value:
            language = Language.make(standardize_tag(value))
            return language.display_name()
        else:
            return 'Unknown'

class PrettyChoiceField(serializers.ChoiceField):
    '''
    Variation on ChoiceField that serialises
    the display name rather than the internal name
    '''

    def to_representation(self, value):
        key = super().to_representation(value)
        return self.choices[key]

class CorpusConfigurationSerializer(serializers.ModelSerializer):
    fields = FieldSerializer(many=True, read_only=True)
    languages = serializers.ListField(child=LanguageField())
    category = PrettyChoiceField(choices=CATEGORIES)

    class Meta:
        model = CorpusConfiguration
        fields = [
            'allow_image_download',
            'category',
            'description_page',
            'citation_page',
            'description',
            'document_context',
            'es_alias',
            'es_index',
            'image',
            'languages',
            'min_date',
            'max_date',
            'scan_image_type',
            'title',
            'word_models_present',
            'fields',
        ]


class CorpusSerializer(serializers.ModelSerializer):
    configuration = CorpusConfigurationSerializer(read_only=True)

    class Meta:
        model = Corpus
        fields = ['id', 'name', 'configuration']

    def to_representation(self, instance: Corpus):
        # flatten representation: corpus configuration
        # data is moved to root dict
        data = super().to_representation(instance)
        conf_data = data.pop('configuration')
        data.update(conf_data)
        return data

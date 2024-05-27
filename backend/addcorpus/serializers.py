from rest_framework import serializers
from typing import Dict

from addcorpus.models import Corpus, CorpusConfiguration, Field, CorpusDocumentationPage
from addcorpus.constants import CATEGORIES
from langcodes import Language, standardize_tag
from addcorpus.documentation import render_documentation_context
from addcorpus.json_corpora.export_json import export_json_corpus
from addcorpus.json_corpora.import_json import import_json_corpus


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
            'searchable',
            'downloadable',
            'language',
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
    default_sort = NonEmptyJSONField()
    has_named_entities = serializers.ReadOnlyField()

    class Meta:
        model = CorpusConfiguration
        fields = [
            'allow_image_download',
            'category',
            'description',
            'document_context',
            'es_alias',
            'es_index',
            'languages',
            'min_date',
            'max_date',
            'scan_image_type',
            'title',
            'word_models_present',
            'default_sort',
            'language_field',
            'fields',
            'has_named_entities',
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

class DocumentationTemplateField(serializers.CharField):
    '''
    Serialiser for the contents of documentation pages.

    Pages are Templates written in markdown.
    '''

    def to_representation(self, value):
        content = super().to_representation(value)
        return render_documentation_context(content)


class CorpusConfigurationField(serializers.SlugRelatedField):
    '''
    Serialise a related corpus configuration as the corpus name.
    '''

    def __init__(self, **kwargs):
        super().__init__('corpus__name', **kwargs)

    def get_queryset(self):
        return CorpusConfiguration.objects.all()

    def to_representation(self, value: CorpusConfiguration) -> str:
        return value.corpus.name


class ChoiceOrderSerializer(serializers.ChoiceField):
    '''
    Variant on the ChoiceField that serialises to the index in the choices array.
    '''
    def __init__(self, choices, **kwargs):
        super().__init__(choices=choices, **kwargs)
        self.index = {value: i for i, (value, label) in enumerate(choices)}

    def to_internal_value(self, data):
        return self.choices[data]

    def to_representation(self, value):
        key = super().to_representation(value)
        return self.index[key]


class CorpusDocumentationPageSerializer(serializers.ModelSerializer):
    type = PrettyChoiceField(choices = CorpusDocumentationPage.PageType.choices)
    index = ChoiceOrderSerializer(
        read_only=True,
        source='type',
        choices=CorpusDocumentationPage.PageType.choices,
    )
    content = DocumentationTemplateField(read_only=True)
    content_template = serializers.CharField(source='content')
    corpus = CorpusConfigurationField(source='corpus_configuration')

    class Meta:
        model = CorpusDocumentationPage
        fields = ['id', 'corpus', 'type', 'content', 'content_template', 'index']


class JSONDefinitionField(serializers.Field):
    def get_attribute(self, instance: Corpus):
        return instance

    def to_representation(self, value: Corpus) -> Dict:
        return export_json_corpus(value)

    def to_internal_value(self, data: Dict) -> Dict:
        return import_json_corpus(data)


class CorpusJSONDefinitionSerializer(serializers.ModelSerializer):
    definition = JSONDefinitionField()

    class Meta:
        model = Corpus
        fields = ['id', 'active', 'definition']
        read_only_fields = ['id']

    def create(self, validated_data: Dict):
        definition_data = validated_data.get('definition')
        configuration_data = definition_data.pop('configuration')
        fields_data = configuration_data.pop('fields')

        corpus = Corpus.objects.create(**definition_data)
        configuration = CorpusConfiguration.objects.create(corpus=corpus, **configuration_data)
        for field_data in fields_data:
            Field.objects.create(corpus_configuration=configuration, **field_data)

        if validated_data.get('active') == True:
            corpus.active = True
            corpus.save()

        return corpus

    def update(self, instance: Corpus, validated_data: Dict):
        definition_data = validated_data.get('definition')
        configuration_data = definition_data.pop('configuration')
        fields_data = configuration_data.pop('fields')

        corpus = Corpus(pk=instance.pk, **definition_data)
        corpus.save()

        configuration, _ = CorpusConfiguration.objects.get_or_create(corpus=corpus)
        for attr in configuration_data:
            setattr(configuration, attr, configuration_data[attr])
        configuration.save()

        for field_data in fields_data:
            field, _ = Field.objects.get_or_create(
                corpus_configuration=configuration, name=field_data['name']
            )
            for attr in field_data:
                setattr(field, attr, field_data[attr])
            field.save()

        configuration.fields.exclude(name__in=(f['name'] for f in fields_data)).delete()

        if validated_data.get('active') == True:
            corpus.active = True
            corpus.save()

        return corpus

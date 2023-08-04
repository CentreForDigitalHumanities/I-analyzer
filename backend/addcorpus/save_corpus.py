from django.db import transaction
from addcorpus.corpus import CorpusDefinition, FieldDefinition
from addcorpus.models import Corpus, Field
from addcorpus.load_corpus import load_all_corpora
import sys

def _save_corpus_in_database(corpus_name, corpus_definition: CorpusDefinition):
    '''
    Save a corpus in the SQL database if it is not saved already.

    Parameters:
    - `corpus_name`: key of the corpus in settings.CORPORA
    - `corpus_definition`: a corpus object, output of `load_corpus`
    '''

    if Corpus.objects.filter(name=corpus_name).exists():
        corpus_db = Corpus.objects.get(name=corpus_name)
    else:
        corpus_db = Corpus(name=corpus_name)

    _copy_corpus_attributes(corpus_definition, corpus_db)
    corpus_db.active = True
    corpus_db.save()

    _save_corpus_fields_in_database(corpus_definition, corpus_db)

    corpus_db.full_clean()

def get_defined_attributes(object, attributes):
    get = lambda attr: object.__getattribute__(attr)
    has_attribute = lambda attr: attr in dir(object) and get(attr) != None

    return {
        attr: get(attr)
        for attr in attributes
        if has_attribute(attr)
    }

def _copy_corpus_attributes(corpus_definition: CorpusDefinition, corpus_db: Corpus):
    attributes_to_copy = [
        'description',
        'allow_image_download',
        'category',
        'description_page',
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
    ]

    defined = get_defined_attributes(corpus_definition, attributes_to_copy)

    for attr, value in defined.items():
        corpus_db.__setattr__(attr, value)

def _save_corpus_fields_in_database(corpus_definition: CorpusDefinition, corpus_db: Corpus):
    # clear all fields and re-parse
    corpus_db.fields.all().delete()

    for field in corpus_definition.fields:
        _save_field_in_database(field, corpus_db)

def _save_field_in_database(field_definition: FieldDefinition, corpus: Corpus):
    attributes_to_copy = [
        'name', 'display_name', 'display_type',
        'description', 'results_overview',
        'csv_core', 'search_field_core',
        'visualizations', 'visualization_sort',
        'es_mapping', 'indexed', 'hidden',
        'required', 'sortable', 'primary_sort',
        'searchable', 'downloadable'
    ]

    copy_attributes = get_defined_attributes(field_definition, attributes_to_copy)

    filter_definition = field_definition.search_filter.serialize() if field_definition.search_filter else {}

    field = Field(
        corpus=corpus,
        search_filter=filter_definition,
        **copy_attributes,
    )

    field.save()
    field.full_clean()
    return field

def _set_corpus_inactive(corpus_name):
    '''
    Set a corpus to inactive status, if it exists in the database
    '''

    exists = Corpus.objects.filter(name=corpus_name).exists()

    if exists:
        corpus = Corpus.objects.get(name=corpus_name)
        corpus.active = False
        corpus.save()

def _try_saving_corpus(corpus_name, corpus_definition, verbose = False, stdout=sys.stdout, stderr=sys.stderr):
    '''
    Try saving a corpus definition to the database.

    This will create a new Corpus object or update an existing one.
    Changes are rolled back on failure.
    '''

    try:
        with transaction.atomic():
            _save_corpus_in_database(corpus_name, corpus_definition)
        if verbose:
            print(f'Saved corpus: {corpus_name}',  file=stdout)
    except Exception as e:
        _set_corpus_inactive(corpus_name)
        print(f'Failed saving corpus: {corpus_name}', file=stderr)
        print(f'Error: {e}', file=stderr)


def load_and_save_all_corpora(verbose = False, stdout=sys.stdout, stderr=sys.stderr):
    '''
    load all python corpus definitions and save them to the database
    '''

    corpus_definitions = load_all_corpora(stderr=stderr)

    for corpus_name, corpus_definition in corpus_definitions.items():
        _try_saving_corpus(corpus_name, corpus_definition)

    not_included = Corpus.objects.exclude(name__in=corpus_definitions.keys())
    for corpus in not_included:
        _set_corpus_inactive(corpus.name)

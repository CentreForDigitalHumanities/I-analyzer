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
    corpus_db, _ = Corpus.objects.get_or_create(name=corpus_name)
    corpus_db.description = corpus_definition.description
    _save_corpus_fields_in_database(corpus_definition, corpus_db)
    corpus_db.save()

def _save_corpus_fields_in_database(corpus_definition: CorpusDefinition, corpus_db: Corpus):
    # clear all fields and re-parse
    corpus_db.fields.all().delete()

    fields = corpus_db.fields.all()

    for field in corpus_definition.fields:
        _save_field_in_database(field, corpus_db)

def _save_field_in_database(field_definition: FieldDefinition, corpus: Corpus):
    attributes_to_copy = [
        'name', 'display_name', 'description',
        'results_overview',
        'csv_core', 'search_field_core',
        'visualizations', 'visualization_sort',
        'es_mapping', 'indexed', 'hidden',
        'required', 'sortable', 'primary_sort',
        'searchable', 'downloadable'
    ]

    get = lambda attr: field_definition.__getattribute__(attr)
    has_attribute = lambda attr: attr in dir(field_definition) and get(attr) != None

    copy_attributes = {
        attr: get(attr)
        for attr in attributes_to_copy
        if has_attribute(attr)
    }

    filter_definition = field_definition.search_filter.serialize() if field_definition.search_filter else None

    field = Field(
        corpus=corpus,
        search_filter=filter_definition,
        **copy_attributes,
    )

    field.save()
    return field

def load_and_save_all_corpora(verbose = False, stdout=sys.stdout, stderr=sys.stderr):
    '''
    load all python corpus definitions and save them to the database
    '''

    corpus_definitions = load_all_corpora(stderr=stderr)

    for corpus_name, corpus_definition in corpus_definitions.items():
        try:
            _save_corpus_in_database(corpus_name, corpus_definition)
            if verbose:
                print(f'Saved corpus: {corpus_name}',  file=stdout)
        except Exception as e:
            print(f'Failed saving corpus: {corpus_name}', file=stderr)
            print(f'Error: {e}', file=stderr)

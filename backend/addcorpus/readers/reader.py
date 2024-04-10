import glob

from addcorpus.json_corpora.utils import get_path
from addcorpus.models import Corpus, Field
from addcorpus.python_corpora.load_corpus import load_corpus_definition
from ianalyzer_readers.extract import CSV
from ianalyzer_readers.readers.core import Field as ReaderField
from ianalyzer_readers.readers.core import Reader
from ianalyzer_readers.readers.csv import CSVReader


def make_reader_field(corpus_field: Field) -> ReaderField:
    col = get_path(corpus_field.extract_options, 'column')
    return ReaderField(
        name=corpus_field.name,
        extractor=CSV(column=col)
    )


def make_reader(corpus: Corpus, data_directory: str = None) -> Reader:
    '''
    From a corpus, returns a Reader object that allows source extraction

    For Python corpora, simply loads the definition class,
    for JSON based corpora, construct Reader from the database.
    '''
    if corpus.has_python_definition:
        return load_corpus_definition(corpus.name)

    reader = CSVReader()
    reader.delimiter = get_path(
        corpus.source_data, 'options', 'delimiter') or ','

    reader.fields = [make_reader_field(f)
                     for f in corpus.configuration.fields.all()]
    reader.sources = lambda _: glob.glob(f'{data_directory}/**/*.csv')

    return reader

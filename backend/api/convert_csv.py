import csv
import os
import pandas


def convert_csv(directory, filename, download_type, encoding='utf-8', format = None):
    '''Convert CSV to match encoding. Returns the filename (not the full path) of the converted file.'''
    if not conversion_needed(encoding, format):
        return filename

    dialect = choose_dialect(download_type)
    df = read_file(directory, filename, dialect=dialect)
    path_out, filename_out = output_path(directory, filename)
    write_output(path_out, df, encoding=encoding, dialect_name=dialect)
    return filename_out

def choose_dialect(download_type):
    csv.register_dialect('resultsDialect', delimiter=';', quotechar='"',
        quoting=csv.QUOTE_NONNUMERIC, skipinitialspace=True)
    dialects = {
        'search_results': 'resultsDialect',
        'date_term_frequency': 'excel',
        'aggregate_term_frequency': 'excel'
    }
    return dialects[download_type]

def conversion_needed(encoding, format):
    return encoding != 'utf-8' or format == 'wide'


def read_file(directory, filename, dialect='excel'):
    path = os.path.join(directory, filename)
    df = pandas.read_csv(path, dialect=dialect, dtype=str)
    return df

def output_path(directory, filename):
    name, ext = os.path.splitext(filename)
    output_name = name + '_converted' + '.' + ext
    return os.path.join(directory, output_name), output_name

def write_output(filename, df, encoding='utf-8', dialect_name='excel'):
    dialect = csv.get_dialect(dialect_name)

    df.to_csv(filename, index=False, encoding=encoding,
        sep=dialect.delimiter, quotechar=dialect.quotechar, quoting=dialect.quoting)



import csv
import os
import pandas


def convert_csv(directory, filename, download_type, encoding='utf-8', format = None):
    '''Convert CSV to match encoding. Returns the filename (not the full path) of the converted file.'''
    if not conversion_needed(encoding, format):
        return filename

    dialect = choose_dialect(download_type)
    df = read_file(directory, filename, dialect=dialect)
    df_formatted = set_long_wide_format(df, format)
    path_out, filename_out = output_path(directory, filename)
    write_output(path_out, df_formatted, encoding=encoding, format=format, dialect_name=dialect)
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

def write_output(filename, df, encoding='utf-8', format = None, dialect_name='excel'):
    dialect = csv.get_dialect(dialect_name)

    if format == 'wide':
        header =  [format_wide_format_column_name(column) for column in df.columns] # nicely format wide format columns
        include_index = True # show index after wide format reformatting, when the field value is used as the index
        index_label = df.index.name
    else:
        header = df.columns
        include_index = False
        index_label = None

    df.to_csv(filename, index=include_index, header=header, index_label=index_label, encoding=encoding,
        sep=dialect.delimiter, quotechar=dialect.quotechar, quoting=dialect.quoting)


def format_wide_format_column_name(column):
    '''Format the wide format columns for output'''

    quantity, query = column
    if quantity.startswith('Total'):
        # columns with totals (total docs, total words) are not dependent on the query
        # and should not include the query in the column name
        return quantity
    else:
        return '{} ({})'.format(quantity, query)

def set_long_wide_format(df, format):
    # check if wide format conversion is needed
    # i.e. specified format is wide, and the resutls include multiple queries (i.e. there is a query column)
    if format == 'wide' and df.columns[0] == 'Query':
        query_column = df.columns[0]
        field_column = df.columns[1] # the field values are being compared on
        value_columns = df.columns[2:]

        wide = pandas.pivot(df, index = field_column, columns=query_column, values = value_columns)
        no_duplicate_columns = drop_duplicate_total_columns(wide)
        return no_duplicate_columns

    return df

def drop_duplicate_total_columns(df):
    '''
    Merge the total documents and total words columns on a wide-format dataframe
    so they are not split up by query (as the value does not depend on the query)
    '''

    total_docs_columns = [col for col in df.columns if col[0] == 'Total documents']
    df.drop(columns = total_docs_columns[1:])

    total_words_columns = [col for col in df.columns if col[0] == 'Total word count']
    if total_words_columns:
        df.drop(columns = total_words_columns[1:])

    return df

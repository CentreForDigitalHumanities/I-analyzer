import csv
import os


def convert_csv(directory, filename, download_type, encoding='utf-8'):
    '''Convert CSV to match encoding. Returns the filename (not the full path) of the converted file.'''
    if not conversion_needed(encoding):
        return filename

    dialect = choose_dialect(download_type)
    fieldnames, rows = read_file(directory, filename, dialect=dialect)
    path_out, filename_out = output_path(directory, filename)
    write_output(path_out, fieldnames, rows, encoding=encoding, dialect=dialect)
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

def conversion_needed(encoding):
    return encoding != 'utf-8'


def read_file(directory, filename, dialect='excel'):
    path = os.path.join(directory, filename)
    with open(path) as csv_file:
        reader = csv.DictReader(csv_file, dialect=dialect)
        fieldnames = reader.fieldnames
        rows = [row for row in reader]

    return fieldnames, rows

def output_path(directory, filename):
    name, ext = os.path.splitext(filename)
    output_name = name + '_converted' + '.' + ext
    return os.path.join(directory, output_name), output_name

def write_output(filename, fieldnames, rows, encoding='utf-8', dialect='excel'):
    with open(filename, 'w', encoding=encoding) as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames, dialect=dialect)
        writer.writeheader()
        writer.writerows(rows)



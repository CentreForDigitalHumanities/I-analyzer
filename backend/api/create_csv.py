import csv
from bs4 import BeautifulSoup
import os

from flask import current_app


def write_file(filename, fieldnames, rows, dialect = 'excel'):
    filepath = os.path.join(current_app.config['CSV_FILES_PATH'], filename)

    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, dialect = dialect)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)

    return filepath


def create_filename(query):
    """
    name the file given the route of the search
    cut the file name to max length of 255 (including route and extension)
    """
    max_filename_length = 251-len(current_app.config['CSV_FILES_PATH'])
    filename = query[:min(max_filename_length, len(query))]
    filename += '.csv'
    return filename


def search_results_csv(results, fields, query):
    entries = []
    field_set = set(fields)
    field_set.update(['query'])
    for result in results:
        entry={'query': query}
        for field in fields:
            #this assures that old indices, which have their id on
            #the top level '_id' field, will fill in id here
            if field=="id" and "_id" in result:
                entry.update( {field: result['_id']} )
            if field in result['_source']:
                entry.update( {field:result['_source'][field]} )
        highlights = result.get('highlight')
        if 'context' in fields and highlights:
            hi_fields = highlights.keys()
            for hf in hi_fields:
                for index, hi in enumerate(highlights[hf]):
                    highlight_field_name = '{}_qic_{}'.format(hf, index+1)
                    field_set.update([highlight_field_name])
                    soup = BeautifulSoup(hi, 'html.parser')
                    entry.update({highlight_field_name: soup.get_text()})
        entries.append(entry)

    filename = create_filename(query)
    field_set.discard('context')
    csv.register_dialect('resultsDialect', delimiter=';', quotechar='"',
        quoting=csv.QUOTE_NONNUMERIC, skipinitialspace=True)
    fieldnames = sorted(field_set)
    filepath = write_file(filename, fieldnames, entries, dialect = 'resultsDialect')
    return filepath


def term_frequency_csv(queries, results_per_series, field_name, id = 0):
    query_column = ['Query'] if len(queries) > 1 else []
    fieldnames = query_column + [field_name, 'Term frequency']

    rows = term_frequency_csv_rows(queries, results_per_series, field_name)

    filename = 'term_frequency_{}.csv'.format(id)
    filepath = write_file(filename, fieldnames, rows)
    return filepath

def term_frequency_csv_rows(queries, results_per_series, field_name):
    for query, results in zip(queries, results_per_series):
        for result in results:
            field_value = result['key']
            match_count = result['match_count']
            row = {
                field_name: field_value,
                'Term frequency': match_count
            }
            if len(queries) > 1:
                row['Query'] = query
            yield row


import csv
from bs4 import BeautifulSoup
import os

from flask import current_app


def write_file(filename, fieldnames, rows):
    csv.register_dialect('myDialect', delimiter=';', quotechar='"',
        quoting=csv.QUOTE_NONNUMERIC, skipinitialspace=True)
    filepath = os.path.join(current_app.config['CSV_FILES_PATH'], filename)

    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, dialect='myDialect')
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
    fieldnames = sorted(field_set)
    filepath = write_file(filename, fieldnames, entries)
    return filepath


def timeline_term_frequency_csv(queries, results_per_series):
    return None


def histogram_term_frequency_csv(queries, results_per_series):
    return None


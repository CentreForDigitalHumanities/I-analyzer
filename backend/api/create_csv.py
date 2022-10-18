import csv
from datetime import datetime
from bs4 import BeautifulSoup
import os

from flask import current_app

from api.analyze import parse_datestring


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


def term_frequency_csv(queries, results_per_series, field_name, id = 0, unit = None):
    has_token_counts = results_per_series[0][0].get('token_count', None)
    query_column = ['Query'] if len(queries) > 1 else []
    freq_columns = ['Term frequency', 'Relative term frequency (by # documents)', 'Total documents']
    token_columns = ['Relative term frequency (by # words)', 'Total word count'] if has_token_counts else []
    fieldnames = query_column + [field_name] + freq_columns + token_columns

    rows = term_frequency_csv_rows(queries, results_per_series, field_name, unit)

    filename = 'term_frequency_{}.csv'.format(id)
    filepath = write_file(filename, fieldnames, rows)
    return filepath

def term_frequency_csv_rows(queries, results_per_series, field_name, unit):
    for query, results in zip(queries, results_per_series):
        for result in results:
            field_value = format_field_value(result['key'], unit)
            match_count = result['match_count']
            total_doc_count = result['total_doc_count']
            row = {
                field_name: field_value,
                'Term frequency': match_count,
                'Relative term frequency (by # documents)': match_count / total_doc_count,
                'Total documents': total_doc_count,
            }
            if result.get('token_count'):
                total_token_count = result['token_count']
                row['Total word count'] = total_token_count
                row['Relative term frequency (by # words)'] = match_count / total_token_count

            if len(queries) > 1:
                row['Query'] = query
            yield row

def format_field_value(value, unit):
    if not unit:
        return value
    else:
        date = parse_datestring(value)
        formats = {
            'year': '%Y',
            'month': '%B %Y',
            'week': '%Y-%m-%d',
            'day': '%Y-%m-%d'
        }
        return date.strftime(formats[unit])

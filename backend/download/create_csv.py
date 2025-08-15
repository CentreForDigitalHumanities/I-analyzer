import csv
import os
from typing import Dict, Iterable, List, Optional, Union

from bs4 import BeautifulSoup
from django.conf import settings

from addcorpus.models import Corpus
from tag.models import TaggedDocument
from users.models import CustomUser
from visualization.term_frequency import parse_datestring

QUERY_CONTEXT_INFIX = '_qic_'


def write_file(filename, fieldnames, rows, dialect='excel'):
    if not os.path.isdir(settings.CSV_FILES_PATH):
        os.mkdir(settings.CSV_FILES_PATH)

    filepath = os.path.join(settings.CSV_FILES_PATH, filename)

    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, dialect=dialect)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)

    return filepath


def create_filename(download_id):
    return f'{download_id}.csv'


def is_context_fieldname(fn: str) -> bool:
    return QUERY_CONTEXT_INFIX in fn


def sort_fieldnames(fns: Iterable[str]) -> List[str]:
    '''Sorts fieldnames.
    Retains input order, but puts all query context fields at the end (sorted)
    '''
    context_fieldnames = [fn for fn in fns if is_context_fieldname(fn)]
    reg_fieldnames = [fn for fn in fns if not is_context_fieldname(fn)]
    return reg_fieldnames + sorted(context_fieldnames)


def search_results_csv(
    results: Iterable[Dict],
    fields,
    query,
    download_id: str,
    corpus: Corpus,
    user: Optional[CustomUser],
    extra_columns: List[str] = []
) -> Union[os.PathLike, str]:
    '''Writes a CSV file for search results.
    Operates on either lists or generator containing results.
    '''
    field_set = set(fields)
    field_set.update(['query'])

    # create csv file
    filename = create_filename(download_id)
    field_set.discard('context')
    fieldnames = sort_fieldnames(field_set) + extra_columns

    entries = generate_rows(results, fields, query, field_set, corpus, user, extra_columns)

    filepath = write_file(filename, fieldnames, entries,
                          dialect='resultsDialect')
    return filepath


def generate_rows(results: Iterable[Dict], fields, query, field_set, corpus, user, extra_columns = []):
    ''' Yields rows of data to be written to the CSV file'''
    for result in results:
        entry = {'query': query}
        doc_id = result['_id']
        for field in fields:
            # this assures that old indices, which have their id on
            # the top level '_id' field, will fill in id here
            if field == "id" and "_id" in result:
                entry.update({field: doc_id})
            if field in result['_source']:
                entry.update({field: result['_source'][field]})
        highlights = result.get('highlight')
        if 'context' in extra_columns and highlights:
            hi_fields = highlights.keys()
            for hf in hi_fields:
                for index, hi in enumerate(highlights[hf]):
                    highlight_field_name = '{}{}{}'.format(
                        hf, QUERY_CONTEXT_INFIX, index + 1)
                    field_set.update([highlight_field_name])
                    soup = BeautifulSoup(hi, 'html.parser')
                    entry.update({highlight_field_name: soup.get_text()})
        if 'tags' in extra_columns:
            tags = ''
            if user:
                try:
                    tagged_doc = TaggedDocument.objects.get(
                        corpus=corpus, doc_id=doc_id
                    )
                    tags = tagged_doc.tags_to_str(user)
                except:
                    pass
            entry.update({'tags': tags})
        if 'document_link' in extra_columns:
            entry.update(
                {'document_link': f'{settings.BASE_URL}/{corpus.name}/{doc_id}'}
            )
        yield entry


def term_frequency_csv(queries, results, field_name, download_id, unit = None):
    has_token_counts = results[0].get('token_count', None) != None
    query_column = ['Query'] if len(queries) > 1 else []
    freq_columns = ['Term frequency', 'Relative term frequency (by # documents)', 'Total documents']
    token_columns = ['Relative term frequency (by # words)', 'Total word count'] if has_token_counts else []
    fieldnames = query_column + [field_name] + freq_columns + token_columns

    rows = term_frequency_csv_rows(queries, results, field_name, unit)

    filename = create_filename(download_id)
    filepath = write_file(filename, fieldnames, rows)
    return filepath

def term_frequency_csv_rows(queries, results, field_name, unit):
    for result in results:
        field_value = format_field_value(result['key'], unit)
        match_count = result['match_count']
        total_doc_count = result['total_doc_count']
        row = {
            field_name: field_value,
            'Term frequency': match_count,
            'Relative term frequency (by # documents)': match_count / total_doc_count if total_doc_count else None,
            'Total documents': total_doc_count,
        }
        if result.get('token_count'):
            total_token_count = result['token_count']
            row['Total word count'] = total_token_count
            row['Relative term frequency (by # words)'] = match_count / total_token_count if total_token_count else None

        if len(queries) > 1:
            row['Query'] = result['query']
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

def ngram_csv(results, log_id):
    rows = ngram_table(results)
    fieldnames = ['date', 'N-gram', 'Frequency']
    filename = create_filename(log_id)
    filepath = write_file(filename, fieldnames, rows)
    return filepath

def ngram_table(results):
    rows = []
    for index, time_point in enumerate(results['time_points']):
        for ngram in results['words']:
            rows.append({
                'date': time_point,
                'N-gram': ngram['label'],
                'Frequency': ngram['data'][index]
            })
    return rows

import csv
import os
from typing import Dict, Iterable, List, Optional, Union

from django.conf import settings

from addcorpus.models import Corpus
from tag.models import TaggedDocument, Tag
from users.models import CustomUser
from visualization.term_frequency import parse_datestring
from tag.filter import corpus_tags


DOCUMENT_URL_COL = 'document_link'


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
    # create csv file
    include_link = 'document_link' in extra_columns
    tags = _tags_to_include(user, corpus, extra_columns)

    filename = create_filename(download_id)
    fieldnames = _results_csv_fieldnames(fields, include_link, tags)
    entries = generate_rows(results, fields, query, corpus, include_link, tags)

    filepath = write_file(filename, fieldnames, entries,
                          dialect='resultsDialect')
    return filepath


def _tags_to_include(
        user: Optional[CustomUser], corpus: Corpus, extra_columns: List[str]
    ) -> List[Tag]:
    if 'tags' in extra_columns and user and not user.is_anonymous:
        return corpus_tags(user, corpus)
    return []


def _tag_column(tag: Tag) -> str:
    return f'tag: {tag.name}'


def _results_csv_fieldnames(
        fields: List[str], include_link: bool, tags: Optional[List[Tag]]
    ) -> List[str]:
    fields = ['query'] + fields
    if include_link:
        fields += [DOCUMENT_URL_COL]
    if tags:
        fields += list(map(_tag_column, tags))
    return fields


def generate_rows(
        results: Iterable[Dict],
        corpus_fields: List[str],
        query: str,
        corpus: Corpus,
        include_link: bool,
        tags: Optional[List[Tag]],
):
    ''' Yields rows of data to be written to the CSV file'''

    for result in results:
        entry = {'query': query}
        doc_id = result['_id']

        for field in corpus_fields:
            # this assures that old indices, which have their id on
            # the top level '_id' field, will fill in id here
            if field == "id" and "_id" in result:
                entry.update({field: doc_id})
            if field in result['_source']:
                entry.update({field: result['_source'][field]})
        # # code disabled because it updates the column set on the go; must be fixed
        # highlights = result.get('highlight')
        # if 'context' in extra_columns and highlights:
        #     hi_fields = highlights.keys()
        #     for hf in hi_fields:
        #         for index, hi in enumerate(highlights[hf]):
        #             highlight_field_name = '{}{}{}'.format(
        #                 hf, QUERY_CONTEXT_INFIX, index + 1)
        #             field_set.update([highlight_field_name])
        #             soup = BeautifulSoup(hi, 'html.parser')
        #             entry.update({highlight_field_name: soup.get_text()})
        if tags:
            entry.update(_tag_values(corpus, doc_id, tags))
        if include_link:
            entry.update(
                {DOCUMENT_URL_COL: f'{settings.BASE_URL}/document/{corpus.name}/{doc_id}'}
            )
        yield entry


def _tag_values(corpus: Corpus, id: str, tags: List[Tag]) -> Dict[str, any]:
    return {
        _tag_column(tag): TaggedDocument.objects.filter(
            corpus=corpus, doc_id=id, tags=tag).exists()
        for tag in tags
    }


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

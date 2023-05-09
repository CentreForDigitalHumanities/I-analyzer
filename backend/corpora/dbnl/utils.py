import csv
from functools import reduce
import re
from bs4 import BeautifulSoup
import os


from addcorpus.extract import Metadata, Pass

# === METADATA EXTRACTION ===

empty_to_none = lambda value : value if value != '' else None

# titles may show up in multiple rows to give info about multiple authors
# the following fields describe the author and should be grouped into a list of dicts
author_fields = {
    'pers_id',
    'voornaam',
    'voorvoegsel',
    'achternaam',
    'jaar_geboren',
    'geb_datum',
    'geb_plaats',
    'geb_plaats_code',
    'geb_land_code',
    'jaar_overlijden',
    'overl_datum',
    'overl_land_code',
    'overl_plaats',
    'overl_plaats_code',
    'vrouw',
}

# the following fields should be made into a list since they can have multiple values
# (but unlike with the author fields, no grouping of fields is necessary)
plural_fields = [
    'genre'
]

def formatted_items(row):
    '''
    Generate the items of a dictionary, while converting empty values to None

    Used to extract values from the metadata csv rows.
    '''
    return (
        (key, empty_to_none(value))
        for key, value in row.items()
    )

def extract_metadata(csv_path):
    '''
    Extract all metadata from a CSV file.

    Returns the metadata in a dict, with title IDs as keys.
    '''

    with open(csv_path) as csv_file:
        first_line = csv_file.readline()
        _, sep = first_line.strip().split('=')
        reader = csv.DictReader(csv_file, delimiter=sep)

        data = reduce(add_metadata_row, reader, {})

    return data

def add_metadata_row(data, row):
    '''
    Read a metadata csv row and add it to the data dict.
    '''

    id = row['ti_id']

    if id not in data:
        data[id] = data_from_row(row)
    else:
        data[id] = update_data_with_row(data[id], row)

    return data

def row_periodical(row):
    '''
    If the row's author field describes a periodical, return its name (None otherwise)
    '''

    prefix = '[tijdschrift]'
    name = row['achternaam']

    if name.startswith(prefix):
        return name[len(prefix):].strip()


def row_author_data(row):
    '''Dict with all the author metadata in a row'''
    return {
        key: value
        for key, value in formatted_items(row)
        if key in author_fields
    }

def data_from_row(row):
    '''Construct a new metadata item from a csv row.'''

    periodical = row_periodical(row)

    if not periodical:
        authors = [row_author_data(row)]
    else:
        authors = []

    plurals = {
        key: [value]
        for key, value in formatted_items(row)
        if key in plural_fields
    }
    rest = {
        key: value
        for key, value in formatted_items(row)
        if key not in author_fields and key not in plural_fields
    }

    return {
        'auteurs': authors,
        'periodical': periodical,
        **plurals,
        **rest
    }

def update_data_with_row(data, row):
    '''
    Update an existing metadata item with the data from a csv row

    If the row describes a new author or genre, append it.
    '''

    for key in plural_fields:
        if row[key] not in data[key]:
            data[key].append(empty_to_none(row[key]))

    periodical = row_periodical(row)
    if periodical:
        data['periodical'] = periodical
    else:
        author = row_author_data(row)
        if author not in data['auteurs']:
            data['auteurs'].append(author)

    return data

# === METADATA-ONLY RECORDS ===

class BlankXML:
    def __init__(self, data_directory):
        self.filename = os.path.join(data_directory, '_.xml')

    def __enter__(self):
        # create an xml that will generate one "spoonful", i.e. one document
        # but no actual content
        soup = BeautifulSoup('<TEI.2><div type="chapter"></div></TEI.2>', 'lxml-xml')
        with open(self.filename, 'w') as file:
            file.write(soup.prettify())

        return self.filename

    def __exit__(self, exc_type, exc_value, traceback):
        os.remove(self.filename)

# === UTILITY FUNCTIONS ===

def compose(*functions):
    '''
    Given a list of unary functions, returns a new function that is the composition of all

    e.g. compose(str.upper, ' '.join)(['a', 'b']) == 'A B'
    '''
    return lambda y: reduce(lambda x, func: func(x), reversed(functions), y)

def author_extractor(field):
    '''
    Create an extractor for one field in the author metadata
    '''

    return Metadata(
        'auteurs',
        transform=lambda authors: [author.get(field) for author in authors]
    )

def join_values(values):
    '''
    Join extracted values into a string with proper handling of None values.

    Input should be an iterable of strings or None.

    - If all values are '', None, or '?', return None
    - If some values are non-empty, convert empty values to '?' and join
    them into a single string.
    '''

    if values:
        formatted = [value or '?' for value in values]
        if any(value != '?' for value in formatted):
            return ', '.join(formatted)

def join_extracted(extractor):
    '''
    Apply an extractor that outputs an iterable, and return the results
    in a comma-joined string.
    '''
    return Pass(extractor, transform=join_values)

author_single_value_extractor = compose(join_extracted, author_extractor)

def between_years(year, start_date, end_date):
    if start_date and year < start_date.year:
        return False

    if end_date and year > end_date.year:
        return False

    return True

def format_name(parts):
    '''Format a person's name'''
    return ' '.join(filter(None, parts))

LINE_TAG = re.compile('^(p|l|head|row|item)$')
'''
Describes the tags for a single line in the content. Can be:

- <p> paragraphs
- <head> headers
- <l> line (used for poems/songs)
- <row> table rows (used for poems/songs)
- <item> list items
'''

def append_to_tag(soup, tag, padding):
    '''
    Insert a string at the end of each instance of a tag.
    '''

    for tag in soup.find_all(tag):
        tag.append(padding)

    return soup

tag_padder = lambda tag, padding: lambda soup: append_to_tag(soup, tag, padding)
'''
Unary shorthand: apply append_to_tag with a particular tag and padding string.
'''

def standardize_language_code(code):
    # ISO 639-1 -> 639-3
    replacements = {
        'fy': 'fry',
        'la': 'lat',
    }

    if code in replacements:
        return replacements[code]

    return code

def single_language_code(code):
    if code and '-' in code:
        primary, *rest = code.split('-')
        return primary
    return code

LANGUAGE_NAMES = {
    'nl': 'Dutch',
    'fr': 'French',
    'lat': 'Latin',
    'fry': 'Frisian',
    'en': 'English',
    'nds': 'Low German',
    'de': 'German',
    'af': 'Afrikaans',
    'rus': 'Russian',
    None: None,
}

def language_name(code):
    if not code:
        return None
    codes = code.split('-')
    standardized = map(standardize_language_code, codes)
    names = set(map(
        lambda code: LANGUAGE_NAMES.get(code, code),
        standardized
    ))
    return '/'.join(names)

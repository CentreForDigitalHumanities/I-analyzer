import csv
from functools import reduce

empty_to_none = lambda value : value if value != '' else None

# titles may be included in multiple rows to give info about multiple authors
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
    return (
        (key, empty_to_none(value))
        for key, value in row.items()
    )

def extract_metadata(csv_path):
    '''
    Extract all metadata from a CSV file.

    Returns the metdata per title ID
    '''

    with open(csv_path) as csv_file:
        first_line = csv_file.readline()
        _, sep = first_line.strip().split('=')
        reader = csv.DictReader(csv_file, delimiter=sep)

        data = reduce(add_metadata_row, reader, {})

    return data

def add_metadata_row(data, row):
    id = row['ti_id']

    if id not in data:
        data[id] = data_from_row(row)
    else:
        data[id] = update_data_with_row(data[id], row)

    return data

def row_author_data(row):
    return {
        key: value
        for key, value in formatted_items(row)
        if key in author_fields
    }

def data_from_row(row):
    author = row_author_data(row)
    plurals = {
        key: [empty_to_none(row[key])]
        for key in plural_fields
    }
    rest = {
        key: value
        for key, value in formatted_items(row)
        if key not in author_fields and key not in plural_fields
    }

    return {
        'auteurs': [author],
        **plurals,
        **rest
    }

def update_data_with_row(data, row):
    for key in plural_fields:
        if row[key] not in data[key]:
            data[key].append(empty_to_none(row[key]))

    author = row_author_data(row)
    if author not in data['auteurs']:
        data['auteurs'].append(author)

    return data

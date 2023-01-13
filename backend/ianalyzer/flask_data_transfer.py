import csv
import os
import base64
from django.contrib.auth.models import Group
from users.models import CustomUser
from django.db import connection

_here = os.path.abspath(os.path.dirname(__file__))

def adapt_password_encoding(flask_encoded):
    '''Adapt encoded password hash from flask to django format'''
    description, salt, hashed = flask_encoded.split('$', 3)
    alg, hash_alg, iteration = description.split(':', 3)
    raw_hash = base64.b16decode(hashed.strip().encode('ascii').upper())
    hashed = base64.b64encode(raw_hash).decode('ascii').strip()
    rest = '$'.join([iteration, salt, hashed])
    return f'{alg}_{hash_alg}${rest}'

flask_table_columns = {
    'user': [
        'id', 'username', 'password', 'email', 'active', 'authenticated',
        'download_limit', 'role_id', 'saml',
    ],
    'role': ['id', 'name', 'description'],
}

def extract_row_data(values, table):
    columns = flask_table_columns[table]
    return { col: value for col, value in zip(columns, values) }

def import_table_data(directory, table):
    '''
    Import a data file. `directory` is the directory of the
    flask data dump, `table` is the name of the table, which
    should also be the file. E.g. table `user` is imported from `user.txt`.
    Returns an empty list if the file does not exist.
    '''

    filepath = os.path.join(directory, f'{table}.txt')
    if not os.path.exists(filepath):
        return []

    with open(filepath) as userfile:
        reader = csv.reader(userfile, delimiter='\t')
        data = [extract_row_data(row, table) for row in reader]
    return data

def save_flask_group(row):
    'Save a Group based on a datarow from the flask SQL data'

    group = Group(id = row['id'], name = row['name'])
    group.save()

def save_flask_user(row):
    'Save a User based on a datarow from the flask SQL data'

    user = CustomUser(
        id = row['id'],
        username = row['username'],
        password = 'nonsense', #we will set the password below
        email = row['email'],
        download_limit = row['download_limit'],
        saml = row['saml'],
    )
    user.groups.add(row['role_id'])
    user.save()

    # now set the password hash
    with connection.cursor() as cursor:
        cursor.execute(
            'UPDATE users_customuser SET password = %s WHERE id = %s',
            [row['password'], row['id']]
        )


def import_and_save_groups(directory):
    '''
    Import role data from flask file and save as Groups.
    '''

    data = import_table_data(directory, 'role')
    for row in data:
        save_flask_group(row)

def import_and_save_users(directory):
    data = import_table_data(directory, 'user')
    for row in data:
        save_flask_user(row)

def import_and_save_all_data(directory):
    import_and_save_groups(directory)
    import_and_save_users(directory)

import csv
import os
import django.contrib.auth.hashers as hashers
import base64
from django.contrib.auth.models import Group
from users.models import CustomUser
from django.db import connection

_here = os.path.abspath(os.path.dirname(__file__))
legacy_test_data_dir = os.path.join(_here, 'legacy_test_data')

def adapt_password_encoding(flask_encoded):
    '''Adapt encoded password hash from flask to django format'''
    description, salt, hashed = flask_encoded.split('$', 3)
    alg, hash_alg, iteration = description.split(':', 3)
    raw_hash = base64.b16decode(hashed.strip().encode('ascii').upper())
    hashed = base64.b64encode(raw_hash).decode('ascii').strip()
    rest = '$'.join([iteration, salt, hashed])
    return f'{alg}_{hash_alg}${rest}'

legacy_table_columns = {
    'user': [
        'id', 'username', 'password', 'email', 'active', 'authenticated',
        'download_limit', 'role_id', 'saml'
    ],
    'role': ['id', 'name', 'description'],
}

def extract_row_data(values, table):
    columns = legacy_table_columns[table]
    return { col: value for col, value in zip(columns, values) }

def import_table_data(directory, table):
    '''
    Import a data file. `directory` is the directory of the
    legacy data dump, `table` is the name of the table, which
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

def save_legacy_group(row):
    'Save a Group based on a datarow from the legacy SQL data'

    group = Group(id = row['id'], name = row['name'])
    group.save()

def save_legacy_user(row):
    'Save a User based on a datarow from the legacy SQL data'

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
    Import role data from legacy file and save as Groups.
    '''

    data = import_table_data(directory, 'role')
    for row in data:
        save_legacy_group(row)

def import_and_save_users(directory):
    data = import_table_data(directory, 'user')
    for row in data:
        save_legacy_user(row)


def test_legacy_data_import():
    user_data = import_table_data(legacy_test_data_dir, 'user')

    assert len(user_data) == 1

    user = user_data[0]
    expected_user =  {
        'id': '1',
        'username': 'admin',
        'password': 'password',
        'email': 'admin@ianalyzer.nl',
        'active': '1',
        'authenticated': '1',
        'download_limit': '10000',
        'role_id': '2',
        'saml': '0'
    }

    for key in expected_user:
        if key == 'password':
            encoded = adapt_password_encoding(user['password'])
            assert hashers.check_password(expected_user['password'], encoded)
        else:
            assert user[key] == expected_user[key]

def test_roles_import():
    role_data = import_table_data(legacy_test_data_dir, 'role')

    assert len(role_data) == 2

    role = role_data[0]
    expected_role = {
        'id': '1',
        'name': 'basic',
        'description': 'corpora for public access'
    }

    assert role == expected_role

def test_save_groups(db):
    import_and_save_groups(legacy_test_data_dir)

    groups = Group.objects.all()
    assert len(groups) == 2

def test_save_legacy_user(db):
    import_and_save_groups(legacy_test_data_dir)
    import_and_save_users(legacy_test_data_dir)

    users = CustomUser.objects.all()

    assert len(users) == 1

    user = users[0]
    assert user.username == 'admin'
    assert user.email == 'admin@ianalyzer.nl'
    print(user.groups)
    print(Group.objects.filter(name='admin'))
    assert user.groups == Group.objects.filter(name='admin')

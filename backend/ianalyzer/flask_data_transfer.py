import csv
import os
import base64
from django.contrib.auth.models import Group
from users.models import CustomUser
from django.db import connection
from addcorpus.models import Corpus
from api.models import Query
from download.models import Download
import json
from django.conf import settings
import warnings
from allauth.account.models import EmailAddress


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
    'corpus': ['id', 'name', 'description'],
    'corpora_roles': ['role_id', 'corpus_id'],
    'query': [
        'id', 'query', 'started', 'completed', 'aborted', 'userID', 'transferred',
        'corpus_name', 'total_results',
    ],
    'download': [
        'id', 'started', 'completed', 'download_type', 'corpus_name', 'user_id', 'parameters',
        'filename'
    ]
}


def extract_row_data(values, table):
    columns = flask_table_columns[table]
    return {col: value for col, value in zip(columns, values)}


def import_table_data(directory, table):
    '''
    Import a data file. `directory` is the directory of the
    flask data dump, `table` is the name of the table, which
    should also be the file. E.g. table `user` is imported from `user.txt`.
    Returns an empty list if the file does not exist.
    '''

    filepath = os.path.join(directory, f'{table}.txt')
    if not os.path.exists(filepath):
        warnings.warn(
            f'Missing file {table}.txt to import data: skipping table migration',
            Warning)
        return []

    with open(filepath) as userfile:
        reader = csv.reader(userfile, delimiter='\t')
        data = [extract_row_data(row, table) for row in reader]
    return data


def save_flask_group(row):
    '''
    Save a Group based on a datarow from the flask SQL data

    The `Group` argument specifies the relevant model, in this case `Group`.
    Relevant during migrations - for unit testing this can be left blank,
    so it is imported directly from users.models.

    Other models can be included for compatiblity with other functions,
    they don't do anything.
    '''

    group = Group(id=row['id'], name=row['name'])
    group.save()


def save_flask_user(row):
    'Save a User based on a datarow from the flask SQL data'

    user = CustomUser(
        id=row['id'],
        username=row['username'],
        password='nonsense',  # we will set the password below
        email=row['email'],
        download_limit=row['download_limit'],
        saml=row['saml'],
    )
    user.save()

    group = Group.objects.get(id=row['role_id'])
    user.groups.add(group)

    if group.name == 'admin':
        user.is_staff = True
        user.is_superuser = True
        user.save()

    # now set the password hash
    password_hash = adapt_password_encoding(row['password'])
    with connection.cursor() as cursor:
        cursor.execute(
            'UPDATE users_customuser SET password = %s WHERE id = %s',
            [password_hash, row['id']]
        )

    # add an Allauth verified email address
    EmailAddress.objects.create(
        user=user, email=user.email, verified=True, primary=True)


def save_flask_corpus(row):
    corpus = Corpus(**row)
    corpus.save()


def save_flask_corpus_role(row):
    corpus = Corpus.objects.get(id=row['corpus_id'])
    group = Group.objects.get(id=row['role_id'])
    corpus.groups.add(group)


def null_to_none(value):
    '''return None if the value is `'\\N'`, i.e. null'''
    return value if value != '\\N' else None


def save_flask_query(row):
    query = Query(
        id=row['id'],
        query_json=json.loads(row['query']),
        corpus=Corpus.objects.get(name=row['corpus_name']),
        user=CustomUser.objects.get(id=row['userID']),
        completed=null_to_none(row['completed']),
        aborted=null_to_none(row['aborted']),
        transferred=null_to_none(row['transferred']),
        total_results=null_to_none(row['total_results'])
    )
    query.save()

    # started would be overridden on first save, so set it now
    query.started = row['started']
    query.save()


def save_flask_download(row):
    download = Download(
        id=row['id'],
        completed=null_to_none(row['completed']),
        download_type=row['download_type'],
        corpus=Corpus.objects.get(name=row['corpus_name']),
        user=CustomUser.objects.get(id=row['user_id']),
        parameters=json.loads(row['parameters']),
        filename=os.path.relpath(row['filename'], settings.CSV_FILES_PATH),
    )
    download.save()

    # started would be overridden on first save, so set it now
    download.started = row['started']
    download.save()


def import_and_save_table(directory, flask_table_name, save_function, **kwargs):
    for row in import_table_data(directory, flask_table_name):
        save_function(row, **kwargs)


def import_and_save_all_data(directory):

    if not os.path.isdir(directory):
        warnings.warn(
            f'Directory {directory} to import Flask data does not exist: skipping database migration',
            Warning
        )
        pass

    tables = [
        ('role', save_flask_group),
        ('user', save_flask_user),
        ('corpus', save_flask_corpus),
        ('corpora_roles', save_flask_corpus_role),
        ('query', save_flask_query),
        ('download', save_flask_download)
    ]

    for flask_table_name, save_function in tables:
        with warnings.catch_warnings():
            # ignore runtime warnings about time zones
            # (the imported does not include timezone info and django warns about that)
            warnings.simplefilter('ignore', RuntimeWarning)
            import_and_save_table(directory, flask_table_name, save_function)

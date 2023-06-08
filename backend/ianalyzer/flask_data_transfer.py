import csv
import os
import base64
from django.contrib.auth.models import Group
from users.models import CustomUser
from django.db import connection
from django.db.utils import IntegrityError
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
    return dict(zip(columns, values))


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
        password='',  # we will set the password below
        email=row['email'],
        download_limit=row['download_limit'],
        saml=null_to_none(row['saml']),
    )
    user.save()

    if not null_to_none(row['role_id']):
        group = Group.objects.get(name='basic')
    else:
        group = Group.objects.get(id=row['role_id'])

    user.groups.add(group)

    if group.name == 'admin':
        user.is_staff = True
        user.is_superuser = True
        user.save()

    # now set the password hash
    old_hash = null_to_none(row['password']) # for saml users, password can be null
    if old_hash:
        new_hash = adapt_password_encoding(old_hash)
        with connection.cursor() as cursor:
            cursor.execute(
                'UPDATE users_customuser SET password = %s WHERE id = %s',
                [new_hash, row['id']]
            )

    # add an Allauth verified email address
    allauth_email = EmailAddress.objects.filter(email=user.email).first()
    if not allauth_email:
        allauth_email = EmailAddress(email=user.email)
    else:
        print(f'duplicate user found for email: {user}')

    # set further details
    allauth_email.verified = row['active']
    allauth_email.primary = True
    allauth_email.user = user
    allauth_email.save()



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

def load_json_value(string_value):
    return json.loads(string_value.replace('\\\\', '\\'))

def save_flask_query(row):
    user_id = null_to_none(row['userID'])

    if not user_id:
        return

    corpus_name = row['corpus_name']
    if not Corpus.objects.filter(name=corpus_name):
        # some queries refer to corpus names that no longer exist
        return

    query = Query(
        id=row['id'],
        query_json=load_json_value(row['query']),
        corpus=Corpus.objects.get(name=corpus_name),
        user=CustomUser.objects.get(id=user_id),
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
        parameters=load_json_value(row['parameters']),
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

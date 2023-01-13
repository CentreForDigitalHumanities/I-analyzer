import os
import django.contrib.auth.hashers as hashers
from django.contrib.auth.models import Group
from users.models import CustomUser
from addcorpus.models import Corpus
from ianalyzer.flask_data_transfer import *

_here = os.path.abspath(os.path.dirname(__file__))
flask_test_data_dir = os.path.join(_here, 'flask_test_data')

def test_legacy_data_import():
    user_data = import_table_data(flask_test_data_dir, 'user')

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
    role_data = import_table_data(flask_test_data_dir, 'role')

    assert len(role_data) == 2

    role = role_data[0]
    expected_role = {
        'id': '1',
        'name': 'basic',
        'description': 'corpora for public access'
    }

    assert role == expected_role

def test_save_groups(db):
    import_and_save_table(flask_test_data_dir, 'role', save_flask_group)

    groups = Group.objects.all()
    assert len(groups) == 2

def test_save_legacy_user(db):
    import_and_save_table(flask_test_data_dir, 'role', save_flask_group)
    import_and_save_table(flask_test_data_dir, 'user', save_flask_user)

    users = CustomUser.objects.all()

    assert len(users) == 1
    user = users[0]
    assert user.username == 'admin'
    assert user.email == 'admin@ianalyzer.nl'
    assert list(user.groups.all()) == [Group.objects.get(name='admin')]

def test_save_corpora(db):
    import_and_save_table(flask_test_data_dir, 'role', save_flask_group)
    import_and_save_table(flask_test_data_dir, 'corpus', save_flask_corpus)
    import_and_save_table(flask_test_data_dir, 'corpora_roles', save_flask_corpus_role)

    corpora = Corpus.objects.all()
    assert len(corpora) == 13

    corpus = Corpus.objects.get(id = '13')
    assert corpus.name == 'parliament-ireland'
    assert corpus.description == 'Speeches from the Dáil Éireann and Seanad Éireann'
    assert list(corpus.groups.all()) == list(Group.objects.all())


import pytest
from users.models import CustomUser
from addcorpus.load_corpus import load_all_corpora

@pytest.fixture()
def mock_corpus():
    return 'media-mock-corpus'

@pytest.fixture()
def mock_corpus_user(db, mock_corpora_in_db):
    user = CustomUser.objects.create(username='mock-user', password='secret', is_superuser=True)
    return user

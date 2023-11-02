from django.utils import timezone
import pytest
from visualization.query import MATCH_ALL
from addcorpus.models import Corpus
from api.models import Query
from api.save_query import recent_queries


@pytest.fixture()
def saved_query(auth_user, db):
    corpus = Corpus.objects.get(name='small-mock-corpus')
    return Query.objects.create(
        query_json=MATCH_ALL,
        user=auth_user,
        corpus=corpus,
        completed=timezone.now(),
        transferred=10,
        total_results=10,
    )


def test_recent_queries(auth_user, saved_query):
    assert saved_query in recent_queries(auth_user)

    saved_query.started = timezone.datetime(2000, 1, 1, 0, 0, tzinfo=timezone.get_current_timezone())
    saved_query.completed = timezone.datetime(2000, 1, 1, 0, 0, tzinfo=timezone.get_current_timezone())
    saved_query.save()

    assert saved_query not in recent_queries(auth_user)


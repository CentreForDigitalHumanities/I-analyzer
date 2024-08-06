import os
from rest_framework.status import HTTP_201_CREATED

here = os.path.dirname(os.path.abspath(__file__))


def test_csv_upload(admin_client, json_mock_corpus):
    fp = os.path.join(here, 'files', 'example.csv')

    with open(fp, 'rb') as f:
        data = {'corpus': json_mock_corpus.pk, 'is_sample': True, 'file': f}
        res = admin_client.post('/api/corpus/datafiles/', data)
    assert res.status_code == HTTP_201_CREATED

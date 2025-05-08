import os

from rest_framework.status import HTTP_201_CREATED
from addcorpus.models import CorpusDataFile

here = os.path.dirname(os.path.abspath(__file__))


def test_csv_upload(admin_user, admin_client, json_mock_corpus):
    fp = os.path.join(here, 'files', 'example.csv')

    json_mock_corpus.owner = admin_user
    json_mock_corpus.save()

    # Test file upload
    with open(fp, 'rb') as f:
        data = {'corpus': json_mock_corpus.pk, 'is_sample': True, 'file': f}
        res = admin_client.post('/api/corpus/datafiles/', data)
    assert res.status_code == HTTP_201_CREATED
    file_pk = res.data.get('id')

    # Test file info
    data_file = CorpusDataFile.objects.get(pk=file_pk)
    assert data_file.n_rows == 10
    assert data_file.field_types == {
        'character': 'text',
        'line': 'text',
        'date-column': 'date',
        'FLOAT COLUMN': 'float',
        'int_column': 'integer',
        'bool column': 'boolean'
    }

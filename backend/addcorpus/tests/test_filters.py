from time import sleep

from addcorpus.es_mappings import date_mapping, date_estimate_mapping
from addcorpus.corpus import transform_to_date_range


def test_date_filter(es_client):
    ''' test that both a date and a date_range field can be queried in the same way'''
    date_name = 'mock-date-corpus'
    date_range_name = 'mock-date-range-corpus'
    es_client.indices.create(
        index=date_name,
        mappings={
            'properties': {
                'date': date_mapping()
            }
        }
    )
    es_client.indices.create(
        index=date_range_name,
        mappings={
            'properties': {
                'date': date_estimate_mapping()
            }
        }
    )
    es_client.create(index=date_name, id=1, document={
        'date': '1984-01-01'
    })
    es_client.create(index=date_range_name, id=1, document={
        'date': transform_to_date_range('1980-01-01', '1983-12-31')
    })
    sleep(1)
    response = es_client.search(index='mock-date*', query={
        'range': {
            'date': {
                'gte': '1900-12-31',
                'lte': '1985-01-01',
                'format': 'yyyy-MM-dd',
                'relation': 'within'
            }
        }
    })
    assert len(response['hits']['hits']) == 2
    es_client.indices.delete(
        index=[date_name, date_range_name]
    )

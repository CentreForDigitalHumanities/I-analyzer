from django.conf import settings

from ianalyzer.elasticsearch import client_from_config
from es.models import Index

def fetch_index_data():
    not_found = Index.objects.all()

    for server_name, conf in settings.SERVERS.items():
        client = client_from_config(conf)
        indices = client.indices.get(index='_all')

        for name, info in indices.items():
            index, created = Index.objects.get_or_create(
                name=name,
                server=server_name,
            )
            index.available = True
            index.save()

            not_found = not_found.exclude(id=index.id)

    not_found.update(available=False)

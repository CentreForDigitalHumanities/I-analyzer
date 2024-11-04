from django.conf import settings

from ianalyzer.elasticsearch import client_from_config
from es.models import Server, Index

def update_server_table_from_settings():
    '''
    Updates Server data based on project settings

    - Stores any configured servers that were not already in the database
    - If a stored server is absent in the settings, it is set to inactive
    - Servers in settings are set to active
    '''

    deactivate = Server.objects.exclude(name__in=settings.SERVERS.keys())
    deactivate.update(active=False)

    for name in settings.SERVERS.keys():
        server, _ = Server.objects.get_or_create(name=name)
        server.active = True
        server.save()


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

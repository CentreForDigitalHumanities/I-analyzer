from django.conf import settings
from django.db.models import QuerySet
from typing import Optional

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


def fetch_index_metadata(queryset: Optional[QuerySet[Server]] = None):
    '''
    Fetche index metadata from Elasticsearch and updates Index table accordingly.

    If a queryset is provided, the update is only ran for the selected servers. Otherwise,
    it will be ran for all servers.

    If a stored index is not found in index discovery, its `available` field is set to
    `False`. This also happens if the server is not active or the client cannot connect
    to it.
    '''

    queryset = queryset or Server.objects.all()

    for server in queryset:
        stored = Index.objects.filter(server=server)

        if server.active and server.can_connect():
            client = server.client()

            discovered = client.indices.get(index='_all')

            for name in discovered.keys():
                index, _created = Index.objects.get_or_create(
                    name=name,
                    server=server,
                )
                index.available = True
                index.save()

            not_discovered = stored.exclude(name__in=discovered.keys())
            not_discovered.update(available=False)
        else:
            stored.update(available=False)


def update_availability(index: Index):
    client = index.server.client()

    if index.server.active:
        try:
            response = client.indices.exists(index=index.name)
            available = response.body
        except:
            available = False
    else:
        available = False

    index.available = available
    index.save()


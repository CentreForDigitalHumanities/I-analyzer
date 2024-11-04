from django.conf import settings

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


def fetch_index_metadata():
    '''
    Fetches index metadata from Elasticsearch and updates Index table accordingly.

    If an index is stored in the table but not found in index discovery, its `available`
    field is set to `False`.
    '''
    not_found = Index.objects.all()

    for server in Server.objects.filter(active=True):
        client = server.client()
        indices = client.indices.get(index='_all')

        for name, info in indices.items():
            index, created = Index.objects.get_or_create(
                name=name,
                server=server,
            )
            index.available = True
            index.save()

            not_found = not_found.exclude(id=index.id)

    not_found.update(available=False)

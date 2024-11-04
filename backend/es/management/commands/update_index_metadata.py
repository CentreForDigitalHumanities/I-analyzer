from django.core.management.base import BaseCommand
from es import sync

class Command(BaseCommand):
    help = '''
    Updates metadata on Elasticsearch servers and indices that is stored in the database.

    It is recommended that this command is run as part of the startup routine of the
    server. You can also trigger it manually at runtime.
    '''

    requires_migrations_checks = True

    def handle(self, *args, **kwargs):
        self.stdout.write('Updating server data from project settings...')
        sync.update_server_table_from_settings()

        self.stdout.write('Fetching index metadata from Elasticsearch...')
        sync.fetch_index_metadata()

        self.stdout.write('Finished updating server and index metadata')

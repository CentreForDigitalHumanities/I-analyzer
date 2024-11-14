from django.db import models
from django.conf import settings
from typing import Optional, Dict, List
from datetime import datetime
from elasticsearch import Elasticsearch
import logging

from addcorpus import models as corpus_models
from ianalyzer.elasticsearch import client_from_config

logger = logging.getLogger()

class Server(models.Model):
    '''
    Represents an elasticsearch server that is configured in the project.

    The data in this model should not be edited directly, as it should be synchronised
    with the project settings. However, an inactive server may be deleted if it is no
    longer relevant.

    After updating the project settings, the Server model can be updated with the
    `update_index_metadata` command in django-admin.
    '''

    name = models.CharField(
        max_length=128,
        unique=True,
        help_text='name of the server in the project settings',
    )

    active = models.BooleanField(
        default=True,
        help_text='whether the server is currently included in project settings; '
            'servers can be set to inactive rather than deleted to prevent data loss',
    )

    def __str__(self):
        return self.name

    @property
    def configuration(self):
        '''
        Configuration of the server in project settings.
        '''
        if self.active:
            return settings.SERVERS[self.name]


    def client(self) -> Optional[Elasticsearch]:
        '''
        Elasticsearch client for the server
        '''
        config = self.configuration
        if config:
            return client_from_config(config)


    def can_connect(self) -> bool:
        '''
        Try to connect to the Elasticsearch server.

        Returns a boolean, indicating if the connection succeeds.
        '''
        client = self.client()
        if not client:
            return False
        try:
            client.info()
        except Exception as e:
            logging.error(e)
            return False
        return True


class Index(models.Model):
    '''
    Refers to an Elasticsearch index

    Indices may not currently be available on Elasticsearch; an item in the table just
    records a server and a name as a point of reference. The `available` field indicates
    whether this index is actually found on the server right now.

    To bring index metadata up to date, use the `update_index_metadata` command in
    django-admin, or the "update index metadata" action in the admin site.

    Indices may be marked unavailable because they have been deleted, because the server
    can't be accessed. Administrators may also create Index objects for an index does
    not exist yet, which can be referenced in an IndexTask.

    Note that to query the current list of indices in Elasticsearch, you will need to
    filter objects where `available == True`.

    Unavailable indices are not automatically deleted to prevent data loss, especially
    from temporary outages. But an Index may be freely deleted if you are not expecting
    to regain access to it (usually because it was deleted in Elasticsearch), and have
    no IndexJobs scheduled to create it.
    '''

    class Meta:
        verbose_name_plural = 'indices'

    name = models.CharField(
        max_length=corpus_models.MAX_LENGTH_NAME + 8,
        help_text='name of the index in elasticsearch'
    )
    server = models.ForeignKey(
        to=Server,
        related_name='indices',
        on_delete=models.CASCADE,
        help_text='server on which the index is found',
    )
    available = models.BooleanField(
        help_text='whether the index is currently available on elasticsearch',
        default=False,
    )

    def __str__(self):
        if self.server == 'default':
            return self.name
        else:
            return f'{self.name} ({self.server})'

    def settings(self) -> Optional[Dict]:
        '''
        Index settings in Elasticsearch

        This method makes a request to Elasticsearch to fetch index metadata.
        '''
        client = self.client()
        if client:
            response = client.indices.get_settings(index=self.name)
            return response[self.name]['settings']

    def mappings(self) -> Optional[Dict]:
        '''
        Configured mappings in Elasticsearch.

        This method makes a request to Elasticsearch to fetch index metadata.
        '''
        client = self.client()
        if client:
            response = client.indices.get_mapping(index=self.name)
            return response[self.name]['mappings']

    def aliases(self) -> Optional[List[str]]:
        '''
        Aliases assigned to the index.

        This method makes a request to Elasticsearch to fetch index metadata.
        '''
        client = self.client()
        if client:
            response = client.indices.get_alias(index=self.name)
            return list(response[self.name]['aliases'].keys())

    def creation_date(self) -> Optional[datetime]:
        '''
        Creation date of the index


        This method makes a request to Elasticsearch to fetch index metadata.
        '''
        settings = self.settings()
        if settings:
            timestamp = int(settings['index']['creation_date'])
            return datetime.fromtimestamp(timestamp/1000)

    def client(self):
        '''
        Returns an Elasticsearch client for the index
        '''
        if self.available:
            return self.server.client()

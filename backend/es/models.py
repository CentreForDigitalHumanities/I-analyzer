from django.db import models
from django.conf import settings
from typing import Optional, Dict, List
from datetime import datetime

from addcorpus import models as corpus_models
from ianalyzer.elasticsearch import client_from_config


class Index(models.Model):
    '''
    Represents an index that is discovered in Elasticsearch.
    '''

    class Meta:
        verbose_name_plural = 'indices'

    name = models.CharField(
        max_length=corpus_models.MAX_LENGTH_NAME + 8,
        help_text='name of the index in elasticsearch (including version number)'
    )
    server = models.CharField(
        default='default',
        help_text='key of the elasticsearch server in the project settings'
    )
    available = models.BooleanField(
        help_text='whether the index is currently available on elasticsearch',
        default=True,
    )

    def __str__(self):
        if self.server == 'default':
            return self.name
        else:
            return f'{self.name} ({self.server})'

    def settings(self) -> Optional[Dict]:
        client = self.client()
        if client:
            response = client.indices.get_settings(index=self.name)
            return response[self.name]['settings']

    def mappings(self) -> Optional[Dict]:
        client = self.client()
        if client:
            response = client.indices.get_mapping(index=self.name)
            return response[self.name]['mappings']

    def aliases(self) -> Optional[List[str]]:
        client = self.client()
        if client:
            response = client.indices.get_alias(index=self.name)
            return list(response[self.name]['aliases'].keys())

    def creation_date(self) -> Optional[datetime]:
        settings = self.settings()
        if settings:
            timestamp = int(settings['index']['creation_date'])
            return datetime.fromtimestamp(timestamp/1000)

    def client(self):
        if self.available:
            config = settings.SERVERS[self.server]
            return client_from_config(config)

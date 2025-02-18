from typing import Generator

from addcorpus.models import CorpusConfiguration
from ianalyzer.elasticsearch import client_from_config
from es.models import Server, Index


def get_current_index_name(corpus: CorpusConfiguration, client) -> str:
    """get the name of the current corpus' associated index"""
    alias = corpus.es_alias or corpus.es_index
    indices = client.indices.get(index=alias)
    return max(sorted(indices.keys()))


def indices_with_alias(server: Server, alias: str) -> Generator[Index, None, None]:
    client = client_from_config(server.configuration)
    if client.indices.exists_alias(name=alias):
        for index_name in client.indices.get_alias(name=alias):
            aliased_index, _ = Index.objects.get_or_create(
                server=server,
                name=index_name,
            )
            yield aliased_index

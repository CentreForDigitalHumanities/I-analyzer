'''
Utility functions for parsing and generating versioned index names.
'''

import re
from typing import Optional
from elastic_transport import ObjectApiResponse
from elasticsearch import Elasticsearch

def next_version_number(client: Elasticsearch, alias: str, base_name: str) -> int:
    '''
    Get version number for a new versioned index (e.g. `indexname-1`).

    Will be 1 if `alias` does not match any existing indices (either as the index name or
    an alias).

    If an alias exists, the version number of the existing index with
    the latest version number will be used to determine the new version
    number. Note that the latter relies on the existence of version numbers in
    the index names (e.g. `indexname-1`).

    Parameters
        client -- ES client
        alias -- The alias any versioned indices might be under.
        base_name -- The unversioned name currently being updated. This will be used to
            exclude indices starting with different names under the same alias.
    '''

    if not client.indices.exists(index=alias):
        return 1
    # get the indices aliased with `alias`
    indices = client.indices.get_alias(name=alias)
    highest_version = highest_version_in_result(indices, base_name)
    return highest_version + 1


def version_from_name(index_name: str, base_name: str) -> Optional[int]:
    '''
    Helper function to extract version number from an index name.

    Format of the index name should be `{base_name}-{version}`, e.g. `foo-5`.

    If the name does not match this pattern, e.g. `foo`, `foo-bar-5`, `foo-5.3`,
    `bar`, etc., this function will return `None`.
    '''

    match = re.match('{}-([0-9]+)$'.format(base_name), index_name)
    if match:
        return int(match.group(1))


def highest_version_in_result(indices: ObjectApiResponse, base_name: str) -> int:
    '''
    Extract the highest version number from the Elasticsearch response to an indices
    query.

    This assumes that versioned index names follow the pattern `{base_name}-{version}`,
    e.g. `mycorpus-3`. If an index doesn't match this pattern, it will be ignored.

    If the results do not contain any (versioned) indices, this will return 0.

    Parameters:
        indices -- the API response from Elasticsearch (not a list of names!), e.g. from
            `client.indices.get` or `client.indices.get_alias`.
        base_name -- The unversioned name currently being updated. This will be used to
            exclude indices starting with different names under the same alias.
    '''
    if type(indices) is list:
        raise RuntimeError('`indices` should not be list')
    versions = [version_from_name(index_name, base_name) for index_name in indices.keys()]
    try:
        return max([v for v in versions if v is not None])
    except:
        return 0

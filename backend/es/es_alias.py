#!/usr/bin/env python3

'''
Script to create, update and remove aliases from ES
'''
from ianalyzer.factories.elasticsearch import elasticsearch

import logging
logger = logging.getLogger('indexing')


def alias(corpus_name, corpus_definition, clean=False):
    client = elasticsearch(corpus_name)

    alias = corpus_definition.es_alias if corpus_definition.es_alias else corpus_definition.es_index
    indices = client.indices.get(index='{}_*'.format(corpus_definition.es_index))
    highest_version = get_highest_version_number(indices)

    actions = []
    for index_name, properties in indices.items():
        is_aliased = alias in properties['aliases'].keys()
        is_highest_version = extract_version(index_name) == highest_version

        if not is_highest_version and clean:
            logger.info('Removing index `{}`'.format(index_name))
            # note that removing an index automatically removes alias
            actions.append({'remove_index': {'index': index_name}})

        if not is_highest_version and is_aliased and not clean:
            logger.info('Removing alias `{}` for index `{}`'.format(alias, index_name))
            actions.append(
                {'remove': {'index': index_name, 'alias': alias}})

        if is_highest_version and not is_aliased:
            logger.info('Adding alias `{}` for index `{}`'.format(alias, index_name))
            actions.append(
                {'add': {'index': index_name, 'alias': alias }})
        elif is_highest_version and is_aliased:
            logger.info('Alias `{}` already exists for `{}`, skipping alias creation'.format(
                alias, index_name))

    if len(actions) > 0:
        client.indices.update_aliases(actions=actions)
    logger.info('Done updating aliases')


def get_new_version_number(client, alias, current_index = None):
    '''
    Get version number for a new versioned index (e.g. `indexname-1`).
    Will be 1 if an index with name `alias` exists,
    or neither an index nor an alias with name `alias` exists.
    If an alias exists, the version number of the existing index with
    the latest version number will be used to determine the new version
    number. Note that the latter relies on the existence of version numbers in
    the index names (e.g. `indexname-1`).

    Parameters
        client -- ES client
        alias -- The alias any versioned indices might be under.
        current_index -- The `es_index` (i.e. unversioned name) currently being updated.
            This will be used to exclude indices starting with different names under the same alias.
    '''
    if not client.indices.exists(index=alias):
        return 1
    # get the indices aliased with `alias`
    indices = client.indices.get(index='ianalyzer-test*')
    indices = client.indices.get_alias(name=alias)
    highest_version = get_highest_version_number(indices, current_index)
    return str(highest_version + 1)


def extract_version(index_name):
    '''
    Helper function to extract version number from an index name.
    Format of the index_name should be `index_name-<version>`, eg `indexname-5`.
    Returns -1 if no version number is found in `index_name`.
    '''
    _index = index_name.rfind('_')
    if _index == -1:
        return _index
    try:
        return int(index_name[_index + 1:])
    except:
        return None


def get_highest_version_number(indices, current_index=None):
    '''
    Get the version number of the index with the highest version number currently present in ES.
    Note that this relies on the existence of version numbers in the index names (e.g. `index_name-1`).

    Parameters:
        indices -- a dict with the ES response (not a list of names!)
        current_index -- The `es_index` (i.e. unversioned) currently being updated.
            This will be used to exclude indices starting with different names under the same alias.
    '''
    if type(indices) is list:
        raise RuntimeError('`indices` should not be list')
    highest_version = 0
    for index_name in indices.keys():
        if current_index and not index_name.startswith(current_index):
            # skip irrelevant indices
            continue
        version = extract_version(index_name)
        if version and version > highest_version:
            highest_version = version
    return highest_version

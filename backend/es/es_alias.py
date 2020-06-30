#!/usr/bin/env python3

'''
Script to create, update and remove aliases from ES
'''
from ianalyzer.factories.elasticsearch import elasticsearch

import logging
logger = logging.getLogger('indexing')


def alias(corpus_name, corpus_definition, clean=False):
    client = elasticsearch(corpus_name)

    indices = client.indices.get('{}_*'.format(corpus_definition.es_index))
    highest_version = get_highest_version_number(indices)

    actions = []
    for index_name, properties in indices.items():
        is_aliased = corpus_definition.es_index in properties['aliases'].keys()
        is_highest_version = extract_version(index_name) == highest_version

        if not is_highest_version and clean:
            logger.info('Removing index `{}`'.format(index_name))
            # note that removing an index automatically removes alias
            actions.append({'remove_index': {'index': index_name}})

        if not is_highest_version and is_aliased and not clean:
            logger.info('Removing alias `{}` for index `{}`'.format(
                corpus_definition.es_index, index_name))
            actions.append(
                {'remove': {'index': index_name, 'alias': corpus_definition.es_index}})

        if is_highest_version and not is_aliased:
            logger.info('Adding alias `{}` for index `{}`'.format(
                corpus_definition.es_index, index_name))
            actions.append(
                {'add': {'index': index_name, 'alias': corpus_definition.es_index}})
        elif is_highest_version and is_aliased:
            logger.info('Alias `{}` already exists for `{}`, skipping alias creation'.format(
                corpus_definition.es_index, index_name))

    if len(actions) > 0:
        client.indices.update_aliases({'actions': actions})
    logger.info('Done updating aliases')


def get_new_version_number(client, es_index):
    '''
    Get version number for a new index.
    Will be 1 if an index with name `es_index` exists,
    or neither an index nor an alias with name `es_index` exists.
    If an alias exists, the version number of the existing index with
    the latest version number will be used to determine the new version
    number. Note that this relies on the existence of version numbers in
    the index names (e.g. `index_name_1`).
    '''
    is_existing_index = False
    is_existing_alias = False
    if client.indices.exists(es_index):
        is_existing_alias = client.indices.exists_alias(name=es_index)
        is_existing_index = not is_existing_alias

    if is_existing_index or (not is_existing_index and not is_existing_alias):
        return 1

    # get the indices aliased with `es_index`
    indices = client.indices.get_alias(es_index)
    highest_version = get_highest_version_number(indices)
    return str(highest_version + 1)


def extract_version(index_name):
    '''
    Helper function to extract version number from an index name.
    Format of the index_name should be `index_name_<version>`, eg `index_name_5`.
    Returns -1 if no version number is found in `index_name`.
    '''
    _index = index_name.rfind('_')
    if _index == -1:
        return _index
    return int(index_name[_index + 1:])


def get_highest_version_number(indices):
    '''
    Get the version number of the index with the highest version number currently present in ES.
    Note that this relies on the existence of version numbers in the index names (e.g. `index_name_1`).

    Parameters:
        indices -- a dict with the ES response (not a list of names!)
    '''
    if type(indices) is list:
        raise RuntimeError('`indices` should not be list')
    highest_version = 0
    for index_name in indices.keys():
        version = extract_version(index_name)
        if version > highest_version:
            highest_version = version
    return highest_version

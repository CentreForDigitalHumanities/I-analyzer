def add_length_multifield(mapping):
    mapping['fields'] = {'length' : {
        "type": "token_count",
        "analyzer": "standard",
        }
    }
    return mapping

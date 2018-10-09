import logging

import requests

from flask import Blueprint, request, json
from flask_login import login_required, current_user

from . import config_fallback as config

logger = logging.getLogger(__name__)

es = Blueprint('es', __name__)


@es.route('/<server_name>/<corpus_name>/<document_type>/_search', methods=['POST'])
@login_required
def forward_es(server_name, corpus_name, document_type):
    """ Forward search requests to ES, if permitted. """
    if not server_name in config.SERVERS:
        abort(404)
    for role in current_user.roles:
        if role.name == corpus_name:
            break
    else:
        abort(404)
    server = config.SERVERS[server_name]
    host = server.host
    if server.port:
        host += ':{}'.format(server.port)
    address = '{}/{}/{}/_search'.format(host, corpus_name, document_type)
    es_response = requests.post(
        address,
        params=request.args,
        headers=request.headers,
        json=request.get_json(cache=False),
    )
    return es_response.raw, es_response.status_code, es_response.headers

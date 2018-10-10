import logging

import requests

from flask import Blueprint, request, json, abort, Response
from flask_login import login_required, current_user

from . import config_fallback as config

PASSTHROUGH_HEADERS = ('Content-Encoding', 'Content-Length')

logger = logging.getLogger(__name__)

es = Blueprint('es', __name__)


def get_es_host_or_404(server_name):
    """ Get the hostname of an ES server by name; abort if nonexistent. """
    if not server_name in config.SERVERS:
        abort(404)
    server = config.SERVERS[server_name]
    host = server['host']
    if server['port']:
        host += ':{}'.format(server['port'])
    return host


def require_role(corpus_name):
    """ Abort if the current user is not authorized for corpus_name. """
    for role in current_user.roles:
        if role.name == corpus_name:
            break
    else:
        abort(404)


def proxy_es(address):
    """ Forward the current request to ES, forward the response to wsgi. """
    es_response = requests.post(
        address,
        params=request.args,
        json=request.get_json(cache=False),
        stream=True,
    )
    return Response(
        es_response.raw.stream(),
        status=es_response.status_code,
        content_type=es_response.headers['Content-Type'],
        headers={
            key: es_response.headers[key]
            for key in PASSTHROUGH_HEADERS if key in es_response.headers
        },
    )


@es.route('/<server_name>')
def forward_head(server_name):
    """ This is a placeholder to make using url_for easy. """
    abort(404)


@es.route('/<server_name>/<corpus_name>/<document_type>/_search', methods=['POST'])
@login_required
def forward_search(server_name, corpus_name, document_type):
    """ Forward search requests to ES, if permitted. """
    require_role(corpus_name)
    host = get_es_host_or_404(server_name)
    address = 'http://{}/{}/{}/_search'.format(host, corpus_name, document_type)
    return proxy_es(address)

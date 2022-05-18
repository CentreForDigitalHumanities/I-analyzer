import logging

import requests
from requests.exceptions import Timeout, ConnectionError

from flask import current_app, request, json, abort, Response
from flask_login import login_required, current_user

from ianalyzer import config_fallback as config
from . import es

PASSTHROUGH_HEADERS = ('Content-Encoding', 'Content-Length')
TIMEOUT_SECONDS = 30

logger = logging.getLogger(__name__)


def ensure_http(hostname):
    """ If hostname does not include the http or https scheme, prepend https. """
    if hostname.startswith('http'):
        return hostname
    else:
        prefix = 'https:'
        if not hostname.startswith('/'):
            prefix += '//'
    return prefix + hostname


def get_es_host_or_404(server_name):
    """ Get the hostname of an ES server by name; abort if nonexistent. """
    if not server_name in config.SERVERS:
        abort(404)
    server = config.SERVERS[server_name]
    host = ensure_http(server['host'])
    if server['port']:
        host += ':{}'.format(server['port'])
    return host


def require_access(corpus_name):
    """ Abort if the current user is not authorized for corpus_name. """
    if not current_user.has_access(corpus_name):
        abort(401)  # Unauthorized


def proxy_es(address):
    """ Forward the current request to ES, forward the response to wsgi. """
    kwargs = {}
    if request.mimetype.count('json'):
        kwargs['json'] = request.get_json(cache=False)
    try:
        headers = {'Authorization': 'ApiKey VHd1TnQ0QUJFNW05a1FiQXp3bGQ6OXNuVlZmbjBSVXFvdW5yS2R3V0NGQQ=='}

        es_response = requests.request(
            request.method,
            address,
            headers=headers,
            params=request.args,
            stream=True,
            timeout=TIMEOUT_SECONDS,
            verify='/Applications/elasticsearch-8.0.0/config/certs/http_ca.crt',
            **kwargs
        )
    except ConnectionError:
        abort(503)  # Service unavailable
    except Timeout:
        abort(504)  # Gateway Timeout
    return Response(
        es_response.raw.stream(),
    )


@ es.route('/<server_name>', methods=['HEAD'])
@ login_required
def forward_head(server_name):
    """ Forward requests that check whether the ES server is still up. """
    host = get_es_host_or_404(server_name)
    return proxy_es(host)


@ es.route('/<server_name>/_search/scroll', methods=['POST'])
@ login_required
def forward_scroll(server_name):
    """ Forward scroll requests (needed for large downloads). """
    host = get_es_host_or_404(server_name)
    address = '{}/_search/scroll'.format(host)
    return proxy_es(address)


@ es.route('/<server_name>/<corpus_name>/_search', methods=['POST'])
@ login_required
def forward_search(server_name, corpus_name):
    """ Forward search requests to ES, if permitted. """
    require_access(corpus_name)
    print(request.get_data())
    host = get_es_host_or_404(server_name)
    address = '{}/{}/_search'.format(host, corpus_name)
    return proxy_es(address)

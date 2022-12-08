import logging
import json

import requests
from elastic_transport import ConnectionError, ConnectionTimeout

from flask import current_app, request, json, abort, Response
from flask_login import login_required, current_user

from ianalyzer import config_fallback as config
from ianalyzer.factories.elasticsearch import elasticsearch
from .search import get_index
from flask import Blueprint

es = Blueprint('es', __name__)
logger = logging.getLogger(__name__)


def require_access(corpus_name):
    """ Abort if the current user is not authorized for corpus_name. """
    if not current_user.has_access(corpus_name):
        abort(401)  # Unauthorized


@ es.route('/<corpus_name>/_search', methods=['POST'])
@ login_required
def forward_search(corpus_name):
    """ Forward search requests to ES, if permitted. """
    require_access(corpus_name)
    client = elasticsearch(corpus_name)
    index = get_index(corpus_name)
    try:
        results = client.search(
            index=index,
            body=json.loads(request.get_data()),
            track_total_hits=True,
            **request.args.to_dict()
        )
    except ConnectionError as e:
        logger.error(e)
        abort(503)  # Service unavailable
    except ConnectionTimeout as e:
        logger.error(e)
        abort(504)  # Gateway Timeout
    return Response(json.dumps(results.raw))

import logging

import requests

from flask import Blueprint, request, json
from flask_login import current_user

logger = logging.getLogger(__name__)

es = Blueprint('es', __name__)




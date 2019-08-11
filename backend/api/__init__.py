from flask import Blueprint
from flask_mail import Mail

api = Blueprint('api', __name__, template_folder='templates')

mail = Mail()

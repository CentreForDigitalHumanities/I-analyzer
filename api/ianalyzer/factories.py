'''
For creation of Flask and ElasticSearch objects.
'''
import os

from flask import Flask
from flask_mail import Mail
from flask_login import LoginManager
from flask_seasurf import SeaSurf

from api.api import api
from .models import db
from admin.admin import admin_instance
from .entry import entry, login_manager
from .es_forward import es

from ianalyzer import config_fallback as config


def flask_app(cfg=config):
    '''
    Create Flask instance, with given configuration and flask_admin, flask_login,
    and csrf (SeaSurf) instances.
    '''
    app = Flask(__name__)
    csrf = SeaSurf()
    csrf.exempt_urls('/es',)
    mail = Mail()

    app.config.from_object(cfg)
    app.register_blueprint(entry)
    app.register_blueprint(api, url_prefix='/api')
    app.register_blueprint(es, url_prefix='/es')

    db.init_app(app)
    login_manager.init_app(app)
    admin_instance.init_app(app)
    csrf.init_app(app)
    mail.init_app(app)

    return app



#!/usr/bin/env python3

import logging
from ianalyzer import config
from ianalyzer.web import blueprint, admin_instance, login_manager
from ianalyzer.factories import flask_app

if __name__ == '__main__':
    logging.basicConfig(level=config.LOG_LEVEL)
    application = flask_app(blueprint, admin_instance, login_manager, cfg=config)
    application.run()

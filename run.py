#!/usr/bin/env python3

import logging
from timestextminer import config
from timestextminer.web import blueprint, admin_instance, login_manager
from timestextminer.factories import flask_app

if __name__ == '__main__':
    logging.basicConfig(level=config.LOG_LEVEL)
    application = flask_app(blueprint, admin_instance, login_manager)
    application.run()

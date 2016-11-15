#!/usr/bin/env python3

import logging
from timestextminer import config
from timestextminer.web import blueprint
from timestextminer.factories import flask_app

if __name__ == '__main__':
    logging.basicConfig(filename=config.LOG, level=config.LOG_LEVEL)
    application = flask_app(blueprint=blueprint)
    application.run()

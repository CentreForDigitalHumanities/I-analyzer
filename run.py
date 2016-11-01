#!/usr/bin/env python3

from timestextminer.web import blueprint
from timestextminer.factories import flask_app

if __name__ == '__main__':
    application = flask_app(blueprint=blueprint)
    application.run()

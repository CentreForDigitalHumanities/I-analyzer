#!/usr/bin/env python3

import logging
from timestextminer import config, sqla
from timestextminer.web import blueprint, admin, login_manager
from timestextminer.factories import flask_app

from flask import Flask
from getpass import getpass
from werkzeug.security import generate_password_hash


def ctx():
    app = Flask('create-database')
    app.config.from_object(config)
    sqla.db.init_app(app)
    sqla.db.create_all(app=app)
    return app



def create_admin():
    with ctx().app_context():

        print('Please provide an administrator password: ')
        username = 'admin'
        password = getpass()

        user = sqla.User(username, generate_password_hash(password), privileges=0xFFFFFF)
        sqla.db.session.add(user)
        sqla.db.session.commit()
        
        print('Database created.')



if __name__ == '__main__':
    logging.basicConfig(level=config.LOG_LEVEL)
    create_admin()

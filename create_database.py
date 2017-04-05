#!/usr/bin/env python3

import logging
from ianalyzer import config, sqla
from ianalyzer.web import blueprint, admin, login_manager
from ianalyzer.factories import flask_app

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


        role_admin = sqla.Role('admin', 'Administrator role.')
        role_times = sqla.Role('times', 'Role for users who may access Times data.')

        print('Please provide an administrator password: ')
        username = 'admin'
        password = getpass()

        user = sqla.User(username, generate_password_hash(password))
        
        user.roles.append(role_admin)
        user.roles.append(role_times)
        
        sqla.db.session.add(user)
        sqla.db.session.add(role_admin)
        sqla.db.session.add(role_times)
        sqla.db.session.commit()
        
        print('Database created.')



if __name__ == '__main__':
    logging.basicConfig(level=config.LOG_LEVEL)
    create_admin()

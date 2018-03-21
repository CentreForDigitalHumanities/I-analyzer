#!/usr/bin/env python3

import logging
from datetime import datetime
import click

from flask import Flask
from werkzeug.security import generate_password_hash
from flask_migrate import Migrate

from ianalyzer import config
from ianalyzer.models import User, Role, db
from ianalyzer.web import blueprint, admin_instance, login_manager
from ianalyzer.factories import flask_app, elasticsearch
from ianalyzer import corpora
from es_index import perform_indexing


app = flask_app(blueprint, admin_instance, login_manager)

migrate = Migrate(app, db)


@app.cli.command()
@click.option('--name', '-n', help='Name of superuser', required=True)
@click.option('--pwd', prompt='Please enter password', hide_input=True,
              confirmation_prompt=True, help='Password for superuser.')
def admin(name, pwd):
    ''' Create a superuser with admin rights and access to all corpora.
    If an admin role does not exist yet, it will be created.
    If roles for the defined corpora do not exist yet, they will be created.
    '''
    if User.query.filter_by(username=name).all():
        logging.critical('Superuser with this name already exists.')
        return None

    user = User(name, generate_password_hash(pwd))

    role_admin = Role.query.filter_by(name='admin').all()[0]
    if not role_admin:
        role_admin = Role('admin', 'Administrator role.')
        db.session.add(role_admin)
    user.roles.append(role_admin)

    for corpus in list(config.CORPORA.keys()):
        role_corpus = Role.query.filter_by(name=corpus).all()
        if not role_corpus:
            role_corpus = Role(
                corpus,
                'Role for users who may access {0} data'.format(corpus)
            )
            db.session.add(role_corpus)
        else:
            role_corpus = role_corpus[0]
        user.roles.append(role_corpus)

    db.session.add(user)
    return db.session.commit()


@app.cli.command()
@click.option(
    '--corpus', '-c', help='Sets which corpus should be indexed' +
    'If not set, first corpus of CORPORA in config.py will be indexed'
)
@click.option(
    '--start', '-s',
    help='Set the date where indexing should start.' +
    'The input format is YYYY-MM-DD.' +
    'If not set, indexing will start from corpus minimum date.'
)
@click.option(
    '--end', '-e',
    help='Set the date where indexing should end' +
    'The input format is YYYY-MM-DD.' +
    'If not set, indexing will start from corpus maximum date.'
)
def es(corpus, start, end):
    if not corpus:
        corpus = list(config.CORPORA.keys())[0]
        this_corpus = corpora.DEFINITIONS[corpus]

    try:
        if start:
            start_index = datetime.strptime(start, '%Y-%m-%d')
        else:
            start_index = this_corpus.min_date

        if end:
            end_index = datetime.strptime(end, '%Y-%m-%d')
        else:
            end_index = this_corpus.max_date

    except Exception:
        logging.critical(
            'Incorrect data format '
            'Example call: flask es -c times -s 1785-01-01 -e 2010-12-31'
        )
        raise

    perform_indexing(corpus, this_corpus, start_index, end_index)


if __name__ == '__main__':
    logging.basicConfig(level=config.LOG_LEVEL)
    app.run()

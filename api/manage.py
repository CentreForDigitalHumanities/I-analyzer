#!/usr/bin/env python3

import logging
from datetime import datetime
import click

from flask import Flask
from werkzeug.security import generate_password_hash
from flask_migrate import Migrate

from ianalyzer import config
from ianalyzer.models import User, Role, db, Corpus
from ianalyzer.web import blueprint, admin_instance, login_manager, csrf
from ianalyzer.factories import flask_app, elasticsearch
from ianalyzer import corpora
from es_index import perform_indexing

app = flask_app(blueprint, admin_instance, login_manager, csrf)

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
    user = create_user(name, pwd)
    if user == None:
        logging.critical('Superuser with this name already exists.')
        return None

    append_role(user, 'admin', 'Administration role.')

    for corpus in list(config.CORPORA.keys()):
        append_corpus_role(user, corpus)

    return db.session.commit()



@app.cli.command()
@click.option('--corpora', '-c', help='Corpus to be accessible without login (can be defined multiple times)', multiple=True, required=False)
def guest(corpora):
    ''' Create a guest account and role without access to any corpus.
    '''
    user = create_user("guest")
    user.authenticated = True
    user.download_limit = 0
    if user == None:
        logging.critical('Guest user already exists.')
        return None

    append_role(user, 'guest', 'Guest access')

    existing_corpora = list(config.CORPORA.keys())

    for corpus in corpora:
        if corpus not in existing_corpora:
            logging.critical('Corpus {0} does not exist.'.format(corpus))
            return None
        append_corpus_role(user, corpus)

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

def create_user(name, password = None):
    if User.query.filter_by(username=name).first():
        return None

    password_hash = None if password == None else generate_password_hash(password)
    user = User(name, password_hash)
    db.session.add(user)
    return user

def append_role(user, name, description):
    role = Role.query.filter_by(name=name).first()
    if not role:
        role = Role(name, description)
        db.session.add(role)
    user.role = role
    return role

def append_corpus_role(user, corpus):
    role_corpus = Corpus.query.filter_by(name=corpus).first()
    if not role_corpus:
        role_corpus = Corpus(
            corpus,
            '{0} corpus'.format(corpus)
        )
        db.session.add(role_corpus)
    if role_corpus not in user.role.corpora:
        user.role.corpora.append(role_corpus)

if __name__ == '__main__':
    logging.basicConfig(level=config.LOG_LEVEL)
    app.run()

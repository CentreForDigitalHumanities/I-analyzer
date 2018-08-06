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
@click.option('--name', help='Name of superuser')
@click.option('--pwd', prompt='Please enter password',
              help='Password for superuser.')
def admin(name, pwd):
    ''' Create a superuser with admin rights and access to all corpora. '''
    if db.session.query(User).filter(username=name).count():
        logging.critical('Superuser with this name already exists.')
        return None

    user = User(name, generate_password_hash(pwd))
    
    # add roles for admin
    role_admin = Role('admin', 'Administrator role.')
    user.roles.append(role_admin)

    for corpus in config.CORPORA.keys():
        role_corpus_user = Role(corpus, 'Role for users who may access ' + corpus + ' data.')
        user.roles.append(role_corpus_user)

    db.session.add(user)
    return db.session.commit()
        

@app.cli.command()
def db_init():
    ''' Add admin and corpora roles to database '''
    if not db.session.query(Role).filter(name='admin').count():
        role_admin = Role('admin', 'Administrator role.')
        db.session.add(role_admin)
    for corpus in config.CORPORA.keys():
        if not db.session.query(Role).filter(name=corpus).count():
            role_corpus_user = Role(corpus, 'Role for users who may access ' + corpus + ' data.')
            db.session.add(role_corpus_user)
    return db.session.commit()


@app.cli.command()
@click.option('--corpus', help='Sets which corpus should be indexed' +
                'If not set, first corpus of CORPORA in config.py will be indexed')
@click.option('--start', help='Set the date where indexing should start.' +
                'The input format is YYYY-MM-DD.' + 
                'If not set, indexing will start from corpus minimum date.')
@click.option('--end', help='Set the date where indexing should end' + 
                'The input format is YYYY-MM-DD.' +
                'If not set, indexing will start from corpus maximum date.')        
def es(corpus, start, end):
    if not corpus:
        corpus = config.CORPORA.keys()[0]   
        this_corpus = corpora.DEFINITIONS[corpus]

    try:
        if not start:
            start_index = this_corpus.min_date
        else:
            start_index = datetime.strptime(start, '%Y-%m-%d')
            
        if not end:
            end_index = this_corpus.max_date
        else:
            end_index = datetime.strptime(end, '%Y-%m-%d')  

            print (start_index, end_index)
            
    except Exception:
        logging.critical(
            'Incorrect data format '
            'Example call: manage.py es -c times -s 1785-01-01 -e 2010-12-31'
        )
        raise
        
    perform_indexing(this_corpus, start_index, end_index)


if __name__ == '__main__':
    logging.basicConfig(level=config.LOG_LEVEL)
    app.run()

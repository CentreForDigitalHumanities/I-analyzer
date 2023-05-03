'''
Present the data to the user through a web interface.
'''
from distutils.log import error
import logging

from amqp import error_for_code
logger = logging.getLogger(__name__)
import json
import base64
import math
import functools
import os

from os.path import split, join, isfile, getsize
import sys
import tempfile
from datetime import datetime, timedelta
from celery import chain
from werkzeug.security import generate_password_hash
from flask import Flask, Blueprint, Response, request, abort, current_app, \
    render_template, url_for, jsonify, redirect, flash, send_file, stream_with_context, send_from_directory, session, make_response
import flask_admin as admin
from flask_login import LoginManager, login_required, login_user, \
    logout_user, current_user
from flask_mail import Message

from ianalyzer import models, celery_app
from es import download, search
from addcorpus.load_corpus import corpus_dir, load_all_corpora, load_corpus
import wordmodels.visualisations as wordmodel_visualisations

from api.user_mail import send_user_mail
from . import security
from . import analyze
from . import tasks
from . import api
from . import convert_csv


@api.route('/corpusdocument/<corpus>/<document_name>', methods=['GET'])
@login_required
def api_corpus_document(corpus, document_name):
    '''
    Return a document for a corpus.
    '''
    return send_from_directory(corpus_dir(corpus), 'documents/{}'.format(document_name))


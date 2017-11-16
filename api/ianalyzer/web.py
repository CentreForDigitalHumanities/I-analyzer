'''
Present the data to the user through a web interface.
'''

import json
import logging
logger = logging.getLogger(__name__)
import functools
from datetime import datetime, timedelta

from flask import Flask, Blueprint, Response, request, abort, current_app, \
    render_template, url_for, jsonify, redirect, flash, stream_with_context
import flask_admin as admin
from flask_login import LoginManager, login_required, login_user, logout_user, current_user

from . import config
from . import factories
from . import models
from . import views
from . import security
from . import streaming
from . import corpora


blueprint = Blueprint('blueprint', __name__)
admin_instance = admin.Admin(
    name='textmining', index_view=views.AdminIndexView(), endpoint='admin')
admin_instance.add_view(views.CorpusView(
    corpus_name=config.CORPUS, name=config.CORPUS, endpoint=config.CORPUS_ENDPOINT))
admin_instance.add_view(views.UserView(
    models.User, models.db.session, name='Users', endpoint='users'))
admin_instance.add_view(views.RoleView(
    models.Role, models.db.session, name='Roles', endpoint='roles'))
admin_instance.add_view(views.QueryView(
    models.Query, models.db.session, name='Queries', endpoint='queries'))
login_manager = LoginManager()


def corpus_required(method):
    '''
    Wrapper to make sure that a `corpus` argument is made accessible from a
    'corpus_name' argument.
    '''

    @functools.wraps(method)
    def f(corpus_name, *nargs, **kwargs):
        corpus_definition = corpora.corpus_obj
        print(corpus_definition)
        if not corpus_definition:
            return abort(404)
        if not current_user.has_role(corpus_name):
            return abort(403)

        # TODO: Ideally, the new variables should be made available in the
        # method in flask-style, that is, thread local
        return method(
            corpus_name=corpus_name,
            corpus_definition=corpus_definition,
            *nargs, **kwargs)

    return f


def post_required(method):
    '''
    Wrapper to add relevant POSTed data to the parameters of a function.
    Also puts data in correct format. (Requires that a `corpus` parameter is
    available, so wrap with `@corpus_required` first.
    '''

    @functools.wraps(method)
    def f(corpus_name, corpus_definition, *nargs, **kwargs):
        if not request.method == 'POST':
            abort(405)

        # Collect fields selected for appearance
        fields = (
            field
            for field in corpus_definition.fields
            if ('field:' + field.name) in request.form
        )

        # Collect filters in ES format
        filters = (
            field.search_filter.elasticsearch(request.form)
            for field in corpus_definition.fields
            if field.search_filter
        )

        return method(
            corpus_name=corpus_name,
            corpus_definition=corpus_definition,
            query_string=request.form.get('query'),
            fields=list(fields),
            filters=list(f for f in filters if f is not None),
            *nargs,
            **kwargs
        )

    return f


@login_manager.user_loader
def load_user(user_id):
    return models.User.query.get(user_id)


@blueprint.route('/', methods=['GET'])
def init():
    if current_user:
        return redirect(url_for('admin.index'))
    else:
        return redirect(url_for('admin.login'))


@blueprint.route('/api/corpus', methods=['GET'])
@login_required
def api_corpus_list():
    if hasattr(config, 'AVAILABLE_CORPORA'):
        available_corpora = config.AVAILABLE_CORPORA
    else:
        available_corpora = [config.CORPUS]

    response = jsonify(dict(
        (key, corpora.DEFINITIONS[key].serialize()) for key in available_corpora
    ))
    return response


@blueprint.route('/api/login', methods=['POST'])
def api_login():
    if not request.json:
        abort(400)
    username = request.json['username']
    password = request.json['password']
    user = security.validate_user(username, password)
    if user is None:
        response = jsonify({'success': False})
    else:
        security.login_user(user)
        response = jsonify({
            'success': True,
            'username': user.username,
            'roles': [{'name': role.name, 'description': role.description} for role in user.roles]
        })

    return response


@blueprint.route('/api/log', methods=['POST'])
@login_required
def api_log():    
    if not request.json:
        abort(400)
    msg_type = request.json['type']
    msg = request.json['msg']

    if msg_type == 'info':
        logger.info(msg)
    else:
        logger.error(msg)

    return jsonify({'success': True})

@blueprint.route('/api/logout', methods=['POST'])
def api_logout():
    if current_user.is_authenticated:
        security.logout_user(current_user)
    return jsonify({'success': True})


@blueprint.route('/api/check_session', methods=['POST'])
def api_check_session():
    """
    Check that the specified user is still logged on.
    """
    if not request.json:
        abort(400)
    username = request.json['username']

    if not current_user.is_authenticated or current_user.username != username:
        abort(401)
    else:
        return jsonify({'success': True})



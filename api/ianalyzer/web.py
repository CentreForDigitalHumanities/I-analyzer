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
from flask_login import LoginManager, login_required, login_user, \
    logout_user, current_user
from flask_mail import Mail, Message
from flask_sqlalchemy import SQLAlchemy
from ianalyzer import config_fallback as config
from werkzeug.security import generate_password_hash, check_password_hash
import string
from random import choice
from flask_seasurf import SeaSurf

from . import config_fallback as config
from . import factories
from . import models
from . import views
from . import security
from . import streaming
from . import corpora
from . import analyze

from flask_admin.base import MenuLink


blueprint = Blueprint('blueprint', __name__)
admin_instance = admin.Admin(
    name='IAnalyzer', index_view=views.AdminIndexView(), endpoint='admin')

admin_instance.add_link(MenuLink(name='Frontend', category='', url="/home"))

admin_instance.add_view(views.UserView(
    models.User, models.db.session, name='Users', endpoint='users'))

admin_instance.add_view(views.RoleView(
    models.Role, models.db.session, name='Roles', endpoint='roles'))

admin_instance.add_view(views.CorpusViewAdmin(
    models.Corpus, models.db.session, name='Corpora', endpoint='corpus'))

admin_instance.add_view(views.QueryView(
    models.Query, models.db.session, name='Queries', endpoint='queries'))

login_manager = LoginManager()
csrf = SeaSurf()


def corpus_required(method):
    '''
    Wrapper to make sure that a `corpus` argument is made accessible from a
    'corpus_name' argument.
    '''

    @functools.wraps(method)
    def f(corpus_name, *nargs, **kwargs):
        corpus_definition = corpora.corpus_obj
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


# endpoint for registration new user via signup form
@blueprint.route('/api/register', methods=['POST'])
def api_register():
    if not request.json:
        abort(400)

    username = security.generate_username(request.json['lastname'])
    token = security.generate_confirmation_token(request.json['email'])

    app = Flask(__name__)
    app.config.from_pyfile('config.py')
    mail = Mail(app)
    msg = Message(app.config.get('MAIL_REGISTRATION_SUBJECT_LINE'),
                  sender=app.config.get('MAIL_FROM_ADRESS'),
                  recipients=[request.json['email']])

    msg.html = render_template('mail/new_user.html',
                               firstname=request.json['firstname'],
                               lastname=username,
                               confirmation_link=app.config.get(
                                   'BASE_URL')+'/api/registration_confirmation/'+token
                               )

    # assign basic role to new user
    pw_hash = generate_password_hash(request.json['password'])
    role_name = 'basic'
    role = models.Role.query.filter_by(name=role_name).first()

    if not role:
        role = models.Role(role_name, 'basic role')
        db.session.add(role)

    new_user = models.User(
        username=username,
        email=request.json['email'],
        active=False,
        password=pw_hash,
        role_id=role.id,
    )

    db = SQLAlchemy()
    db.session.add(new_user)
    errormessage = ''
    success = False

    # Check if email already exists in db, if not send mail and add user to database, else fill errormessage to be shown in signup form in frontend
    if security.email_unique(request.json['email']):
        mail.send(msg)
        db.session.commit()
        success = True

    else:
        errormessage = 'The email adress you entered already exists. Please enter a different email adress.'

    response = jsonify({
        'success': success,
        'firstname': request.json['firstname'],
        'lastname': request.json['lastname'],
        'email': request.json['email'],
        'errormessage': errormessage,
    })

    return response


# endpoint for the confirmation of user if link in email is clicked.
@blueprint.route('/api/registration_confirmation/<token>', methods=['GET'])
def api_register_confirmation(token):

    expiration = 60*60*72  # method does not return email after this limit
    try:
        email = security.confirm_token(token, expiration)
    except:
        flash('The confirmation link is invalid or has expired.', 'danger')

    user = models.User.query.filter_by(email=email).first_or_404()
    user.active = True
    models.db.session.add(user)
    models.db.session.commit()

    return redirect(config.BASE_URL+'/login?isActivated=true')


@blueprint.route('/api/es_config', methods=['GET'])
@login_required
def api_es_config():
    return jsonify([{
        'name': server_name,
        'host': server_config['host'],
        'port': server_config['port'],
        'chunkSize': server_config['chunk_size'],
        'maxChunkBytes': server_config['max_chunk_bytes'],
        'bulkTimeout': server_config['bulk_timeout'],
        'overviewQuerySize': server_config['overview_query_size'],
        'scrollTimeout': server_config['scroll_timeout'],
        'scrollPagesize': server_config['scroll_page_size']
    } for server_name, server_config in config.SERVERS.items()])


@blueprint.route('/api/corpus', methods=['GET'])
@login_required
def api_corpus_list():
    response = jsonify(dict(
        (key, dict(
            server_name=config.CORPUS_SERVER_NAMES[key],
            **corpora.DEFINITIONS[key].serialize()
        )) for key in
        corpora.DEFINITIONS.keys()
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

        roles = [{
            'name': corpus.name,
            'description': corpus.description
        } for corpus in user.role.corpora]

        # roles are still defined as corpusses in frontend. If role is admin, append 'admin' to the roles to keep frontend working
        if user.role.name == "admin":
            roles.append({'name': 'admin', 'description': 'admin role'})

        print(roles)
        response = jsonify({
            'success': True,
            'id': user.id,
            'username': user.username,
            'roles': roles,
            'downloadLimit': user.download_limit,
            'queries': [{
                'query': query.query_json,
                'corpusName': query.corpus_name
            } for query in user.queries]
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


@blueprint.route('/api/query', methods=['PUT'])
@login_required
def api_query():
    if not request.json:
        abort(400)

    query_json = request.json['query']
    corpus_name = request.json['corpus_name']

    if 'id' in request.json:
        query = models.Query.query.filter_by(id=request.json['id']).first()
    else:
        query = models.Query(
            query=query_json, corpus_name=corpus_name, user=current_user)

    date_format = "%Y-%m-%dT%H:%M:%S.%fZ"
    query.started = datetime.now() if ('markStarted' in request.json and request.json['markStarted'] == True) \
        else (datetime.strptime(request.json['started'], date_format) if 'started' in request.json else None)
    query.completed = datetime.now() if ('markCompleted' in request.json and request.json['markCompleted'] == True)  \
        else (datetime.strptime(request.json['completed'], date_format) if 'completed' in request.json else None)

    query.aborted = request.json['aborted']
    query.transferred = request.json['transferred']

    models.db.session.add(query)
    models.db.session.commit()

    return jsonify({
        'id': query.id,
        'query': query.query_json,
        'corpus_name': query.corpus_name,
        'started': query.started,
        'completed': query.completed,
        'aborted': query.aborted,
        'transferred': query.transferred,
        'userID': query.userID
    })


@blueprint.route('/api/search_history', methods=['GET'])
@login_required
def api_search_history():
    user = current_user
    queries = user.queries
    return jsonify({
        'queries': [{
            'query': query.query_json,
            'corpusName': query.corpus_name,
            'started': query.started,
            'completed': query.completed,
            'transferred': query.transferred
        } for query in user.queries]
    })


@blueprint.route('/api/get_wordcloud_data', methods=['POST'])
@login_required
def api_get_wordcloud_data():
    if not request.json:
        abort(400)
    word_counts = analyze.make_wordcloud_data(request.json['content_list'])
    return jsonify({'data': word_counts})

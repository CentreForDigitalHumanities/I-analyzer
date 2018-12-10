'''
Present the data to the user through a web interface.
'''
import json
import base64
import logging
logger = logging.getLogger(__name__)
import functools
import logging
logging.basicConfig(format='%(message)s')
from os.path import splitext, join, isfile
import sys
import tempfile
from io import BytesIO
from PyPDF2 import PdfFileReader, PdfFileWriter
from datetime import datetime, timedelta
from flask import Flask, Blueprint, Response, request, abort, current_app, \
    render_template, url_for, jsonify, redirect, flash, send_file, stream_with_context, send_from_directory
import flask_admin as admin
from flask_login import LoginManager, login_required, login_user, \
    logout_user, current_user
from flask_mail import Mail, Message
from ianalyzer import config_fallback as config
from werkzeug.security import generate_password_hash, check_password_hash
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
csrf.exempt_urls('/es',)

mail = Mail()


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

    # Validate user's input
    username = request.json['username']
    is_valid_username = security.is_unique_username(username)
    is_valid_email = security.is_unique_email(request.json['email'])

    if not is_valid_username or not is_valid_email:
        return jsonify({
            'success': False,
            'is_valid_username': is_valid_username,
            'is_valid_email': is_valid_email
        })

    # try sending the email
    if not send_registration_mail(request.json['email'], username):
        return jsonify({
            'success': False,
            'is_valid_username': True,
            'is_valid_email': True
        })

    # if email was succesfully sent, add user to db
    basic_role = models.Role.query.filter_by(name='basic').first()
    pw_hash = generate_password_hash(request.json['password'])

    new_user = models.User(
        username=username,
        email=request.json['email'],
        active=False,
        password=pw_hash,
        role_id=basic_role.id,
    )

    models.db.session.add(new_user)
    models.db.session.commit()

    return jsonify({'success': True})


def send_registration_mail(email, username):
    '''
    Send an email with a confirmation token to a new user
    Returns a boolean specifying whether the email was sent succesfully
    '''
    token = security.generate_confirmation_token(email)

    msg = Message(config.MAIL_REGISTRATION_SUBJECT_LINE,
                  sender=config.MAIL_FROM_ADRESS, recipients=[email])

    msg.html = render_template('mail/new_user.html',
                               username=username,
                               confirmation_link=config.BASE_URL+'/api/registration_confirmation/'+token,
                               url_i_analyzer=config.BASE_URL,
                               logo_link=config.LOGO_LINK)

    try:
        mail.send(msg)
        return True
    except Exception as e:
        logger.error("An error occured sending an email to {}:".format(email))
        logger.error(e)
        return False


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
        'host': url_for('es.forward_head', server_name=server_name, _external=True),
        'port': None,
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


@blueprint.route('/api/corpusimage/<image_name>', methods=['GET'])
@login_required
def api_corpus_image(image_name):
    '''
    Return the image for a corpus.
    '''
    return send_from_directory(config.CORPUS_IMAGE_ROOT, '{}'.format(image_name))


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

        corpora = [{
            'name': corpus.name,
            'description': corpus.description
        } for corpus in user.role.corpora]
        role = {
            'name': user.role.name,
            'description': user.role.description,
            'corpora': corpora
        }

        response = jsonify({
            'success': True,
            'id': user.id,
            'username': user.username,
            'role': role,
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

    # if 'id' in request.json:
    #     query = models.Query.query.filter_by(id=request.json['id']).first()
    # else:
    query = models.Query(
        query=query_json, corpus_name=corpus_name, user=current_user)

    date_format = "%Y-%m-%dT%H:%M:%S.%fZ"
    query.started = datetime.now() if ('markStarted' in request.json and request.json['markStarted'] == True) \
        else (datetime.strptime(request.json['started'], date_format) if 'started' in request.json else None)
    query.completed = datetime.now() if ('markCompleted' in request.json and request.json['markCompleted'] == True)  \
        else (datetime.strptime(request.json['completed'], date_format) if 'completed' in request.json else None)

    query.aborted = request.json['aborted']
    query.transferred = request.json['transferred']

    # models.db.session.add(query)
    # models.db.session.commit()

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


@blueprint.route('/api/get_scan_image/<corpus_index>/<int:page>/<path:image_path>', methods=['GET'])
@login_required
def api_get_scan_image(corpus_index, page, image_path):
    backend_corpus = corpora.DEFINITIONS[corpus_index]
    image_type = backend_corpus.scan_image_type
    user_permitted_corpora = [
        corpus.name for corpus in current_user.role.corpora]

    if (corpus_index in user_permitted_corpora):
        absolute_path = join(backend_corpus.data_directory, image_path)

        if image_type == 'pdf':
            tmp = BytesIO()
            pdf_writer = PdfFileWriter()
            input_pdf = PdfFileReader(absolute_path, "rb")
            target_page = input_pdf.getPage(page)
            pdf_writer.addPage(target_page)
            pdf_writer.write(tmp)
            tmp.seek(0)
            return send_file(tmp, mimetype='application/pdf', attachment_filename="scan.pdf", as_attachment=True)

        if image_type == 'png':
            return send_file(absolute_path, mimetype='image/png')


@blueprint.route('/api/get_related_words', methods=['POST'])
@login_required
def api_get_related_words():
    if not request.json:
        abort(400)
    results = analyze.get_diachronic_contexts(
        request.json['query_term'],
        request.json['corpus_name']
    )
    if isinstance(results, str):
        # the method returned an error string
        response = jsonify({
            'success': False,
            'message': results})
    else:
        response = jsonify({
            'success': True,
            'related_word_data': {
                'similar_words_all': results[0],
                'similar_words_subsets': results[1],
                'time_points': results[2]
            }
        })
    return response

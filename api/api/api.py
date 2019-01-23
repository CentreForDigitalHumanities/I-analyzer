from werkzeug.security import generate_password_hash, check_password_hash
from PyPDF2 import PdfFileReader, PdfFileWriter
import logging
from datetime import datetime
from io import BytesIO
from os.path import dirname, isfile, join

from flask import abort, current_app, Blueprint, flash, jsonify, \
    redirect, render_template, request, send_file, send_from_directory, url_for
from flask_login import current_user, login_required 
from flask_mail import Mail, Message

from ianalyzer import models
from addcorpus.load_corpus import load_all_corpora

from . import security
from . import analyze
from . import tasks
from . import forward_es

api = Blueprint('api', __name__)

logger = logging.getLogger(__name__)
logging.basicConfig(format='%(message)s')

mail = Mail()

# endpoint for registration new user via signup form
@api.route('/register', methods=['POST'])
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

    msg = Message(current_app.config['MAIL_REGISTRATION_SUBJECT_LINE'],
                  sender=current_app.config['MAIL_FROM_ADRESS'], recipients=[email])

    msg.html = render_template('new_user_mail.html',
                               username=username,
                               confirmation_link=current_app.config['BASE_URL']+'/api/registration_confirmation/'+token,
                               url_i_analyzer=current_app.config['BASE_URL'],
                               logo_link=current_app.config['LOGO_LINK'])

    try:
        mail.send(msg)
        return True
    except Exception as e:
        logger.error("An error occured sending an email to {}:".format(email))
        logger.error(e)
        return False


# endpoint for the confirmation of user if link in email is clicked.
@api.route('/registration_confirmation/<token>', methods=['GET'])
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

    return redirect(current_app.config['BASE_URL']+'/login?isActivated=true')


@api.route('/es_config', methods=['GET'])
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
    } for server_name, server_config in current_app.config['SERVERS'].items()])


@api.route('/corpus', methods=['GET'])
@login_required
def api_corpus_list():
    load_all_corpora()
    response = jsonify(dict(
        (key, dict(
            server_name=current_app.config['CORPUS_SERVER_NAMES'][key],
            **current_app.config['CORPUS_DEFINITIONS'][key].serialize()
        )) for key in
        current_app.config['CORPUS_DEFINITIONS'].keys()
    ))
    return response


@api.route('/corpusimage/<corpus>/<image_name>', methods=['GET'])
@login_required
def api_corpus_image(corpus, image_name):
    '''
    Return the image for a corpus.
    '''
    return send_from_directory(join(
        dirname(current_app.config['CORPORA'][corpus]), 
        current_app.config['IMAGE_PATH']), '{}'.format(image_name))

@api.route('/corpusdescription/<corpus>/<description_name>', methods=['GET'])
@login_required
def api_corpus_description(description_name):
    '''
    Return comprehensive information on the corpus.
    '''
    return send_from_directory(join(
        dirname(current_app.config['CORPORA'][corpus]),
        current_app.config['CORPUS_DESCRIPTION_ROOT']), '{}'.format(description_name))

@api.route('/corpusdocument/<corpus>/<document_name>', methods=['GET'])
@login_required
def api_corpus_document(document_name):
    '''
    Return a document for a corpus.
    '''
    return send_from_directory(join(
        dirname(current_app.config['CORPORA'][corpus]),
        current_app.config['CORPUS_DOCUMENT_ROOT']), '{}'.format(document_name))


# endpoint for backend handeling of large csv files
@api.route('/download', methods=['POST'])
@login_required
def api_download():
    response=jsonify({'success': False})
    if not request.json:
        return response
    if request.mimetype != 'application/json':
        return response
    if not 'esQuery' in request.json.keys():
        return response
    if not 'corpus' in request.json.keys():
        return response
    if not current_user.email:
        return response
    if not current_user.download_limit:
        return response
    # Celery task    
    tasks.download_csv.apply_async(args=[request.json, current_user.email, current_app.instance_path, current_user.download_limit] ) 
    response=jsonify({'success': True})
    return response
    

# endpoint for link send in email to download csv file
@api.route('/csv/<filename>', methods=['get'])
def api_csv(filename):
    return send_from_directory( current_app.instance_path, '{}'.format(filename))


@api.route('/login', methods=['POST'])
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


@api.route('/log', methods=['POST'])
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


@api.route('/logout', methods=['POST'])
def api_logout():
    if current_user.is_authenticated:
        security.logout_user(current_user)
    return jsonify({'success': True})


@api.route('/check_session', methods=['POST'])
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


@api.route('/query', methods=['PUT'])
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


@api.route('/search_history', methods=['GET'])
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
        } for query in queries]
    })


@api.route('/get_wordcloud_data', methods=['POST'])
@login_required
def api_get_wordcloud_data():
    if not request.json:
        abort(400)
    word_counts = analyze.make_wordcloud_data(request.json['content_list'])
    return jsonify({'data': word_counts})


@api.route('/get_scan_image/<corpus_index>/<int:page>/<path:image_path>', methods=['GET'])
@login_required
def api_get_scan_image(corpus_index, page, image_path):
    backend_corpus = current_app.config['CORPUS_DEFINITIONS'][corpus_index]
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


@api.route('/get_related_words', methods=['POST'])
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


@api.route('/get_related_words_time_interval', methods=['POST'])
@login_required
def api_get_related_words_time_interval():
    if not request.json:
        abort(400)
    results = analyze.get_context_time_interval(
        request.json['query_term'],
        request.json['corpus_name'],
        request.json['time']
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
                'similar_words_subsets': results,
                'time_points': [request.json['time']]
            }
        }) 
    return response

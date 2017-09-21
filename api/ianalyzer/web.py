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
from . import search
from . import security
from . import streaming
from . import corpora


blueprint = Blueprint('blueprint', __name__)
admin_instance = admin.Admin(name='textmining', index_view=views.AdminIndexView(), endpoint='admin')
admin_instance.add_view(views.CorpusView(corpus_name=config.CORPUS, name=config.CORPUS, endpoint=config.CORPUS_ENDPOINT))
admin_instance.add_view(views.UserView(models.User, models.db.session, name='Users', endpoint='users'))
admin_instance.add_view(views.RoleView(models.Role, models.db.session, name='Roles', endpoint='roles'))
admin_instance.add_view(views.QueryView(models.Query, models.db.session, name='Queries', endpoint='queries'))
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
            corpus_name = corpus_name,
            corpus_definition = corpus_definition,
            query_string = request.form.get('query'),
            fields = list(fields),
            filters = list(f for f in filters if f is not None),
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


@blueprint.route('/api/search', methods=['POST'])
@login_required
def api_search_json():
    if not request.json:
        abort(400)
    corpus_name = request.json['corpusName']
    query = request.json['query']
    fields = request.json['fields']
    filters = request.json['filters']
    num_results = request.json['n']
    corpus = corpora.DEFINITIONS[corpus_name]

    return search_json(corpus, query, fields, filters, num_results)


@blueprint.route('/api/search/csv', methods=['POST'])
@login_required
def api_search_csv():
    if not request.form:
        abort(400)
    corpus_name = request.form['corpus_name']
    query = request.form['query']
    fields = json.loads(request.form['fields'])
    filters = json.loads(request.form['filters'])
    corpus = corpora.DEFINITIONS[corpus_name]

    return search_csv(corpus_name, corpus, query, fields, filters)


def search_csv(corpus_name, corpus_definition, query_string=None, fields=None, filters=None):
    '''
    Stream all results of a search to a CSV file.
    '''

    # Create a query from POST data
    query = search.make_query(query_string=query_string, filters=filters)

    # Log the query to the database
    q = models.Query(query=str(query), corpus_name=corpus_name, user=current_user)
    models.db.session.add(q)
    models.db.session.commit()


    def logged_stream(stream):
        '''
        Wrap an iterator such that its completion or abortion get logged to the
        database.
        '''
        total_transferred = 0
        try:
            for item in stream:
                total_transferred += 1
                yield item
            q.completed = datetime.now()
        except IOError:
            # Does not work as expected. The initial idea was to catch an
            # unfinished download by the assumption that an exception will be
            # raised when the stream cannot continue. It seems obvious that
            # won't work, but I'm not sure how it would work.  TODO
            # (Of course, we can just assume that any unfinished download is
            # aborted until it is actually finished.)
            q.aborted = True
        q.transferred = total_transferred
        models.db.session.add(q)
        models.db.session.commit()

    # Perform the search and obtain output stream
    logging.info('Requested CSV for query: {}'.format(query))
    docs = search.execute_iterate(corpus_definition,
        query, size=current_user.download_limit
        )
    rows = streaming.field_lists(docs, selected=fields)
    stream = logged_stream(streaming.as_csv(rows))

    # Create appropriate filename
    def alphanums(string): return ''.join(
        char for char in string if char.isalnum())
    query_memo = '-' + alphanums(query_string)[:12] if query_string else ''

    try:
        # TODO: Too dependent on particular string structure I chose somewhere
        # else for the date filter
        date_memo = request.form['filter:date'].split(':')
        date1_memo = alphanums(date_memo[0])
        date2_memo = alphanums(date_memo[1])
    except (IndexError, AttributeError, KeyError):
        date1_memo = corpus_definition.min_date.strftime('%Y%m%d')
        date2_memo = corpus_definition.max_date.strftime('%Y%m%d')

    filename = '{}-{}-{}{}.csv'.format(corpus_name, date1_memo, date2_memo, query_memo)

    # Stream results CSV
    response = Response(stream_with_context(stream), mimetype='text/csv')
    response.headers['Content-Disposition'] = (
        'attachment; filename={}'.format(filename)
    )
    return response


def search_json(corpus_definition, query_string=None, fields=None, filters=None, n=None):
    '''
    Return the first `n` results of a search operation. The result is a JSON
    dictionary, containing search statistics, plus the result entries as a list
    of lists. Used to provide example results.
    '''

    # Build the query from POST data
    query = search.make_query(query_string=query_string, filters=filters)

    # Perform the search
    logging.info('Requested example JSON for query: {}'.format(query))
    n = config.ES_EXAMPLE_QUERY_SIZE if n==None else n
    result = search.execute(corpus_definition, query, size=n)

    # Extract relevant information from dictionary returned by ES
    stats = result.get('hits', {})
    docs = (
        # reassemble _source dictionary and _id string into single dict
        dict(
            doc.get('_source'),
            id=doc.get('_id')
        )
        for doc in stats.get('hits', ())
    )
    rows = streaming.field_lists(docs, selected=fields)

    # Return result as JSON
    return jsonify({
        'total': stats.get('total', 0),
        'table': list(rows)
    })

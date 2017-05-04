'''
Present the data to the user through a web interface.
'''

import logging; logger = logging.getLogger(__name__)
import functools
from datetime import datetime, timedelta

from flask import Flask, Blueprint, Response, request, abort, current_app, \
    render_template, url_for, jsonify, redirect, flash, stream_with_context
import flask_admin as admin
from flask_login import LoginManager, login_required, login_user, logout_user, current_user


from . import config
from . import factories
from . import sqla
from . import views
from . import search
from . import streaming
from .corpora import corpora


blueprint = Blueprint('blueprint', __name__)
admin_instance = admin.Admin(name='textmining', index_view=views.AdminIndexView(), endpoint='admin')
admin_instance.add_view(views.CorpusView(corpus='dutchbanking', name='dutchbanking', endpoint='DutchBanking'))
admin_instance.add_view(views.UserView(sqla.User, sqla.db.session, name='Users', endpoint='users'))
admin_instance.add_view(views.RoleView(sqla.Role, sqla.db.session, name='Roles', endpoint='roles'))
admin_instance.add_view(views.QueryView(sqla.Query, sqla.db.session, name='Queries', endpoint='queries'))
login_manager = LoginManager()



def corpus_required(method):
    '''
    Wrapper to make sure that a `corpus` argument is made accessible from a
    'corpusname' argument.
    '''

    @functools.wraps(method)
    def f(corpusname, *nargs, **kwargs):
        corpus = corpora.get(corpusname)
        if not corpus:
            return abort(404)
        if not current_user.has_role(corpusname):
            return abort(403)

        # TODO: Ideally, the new variables should be made available in the
        # method in flask-style, that is, thread local
        return method(corpusname=corpusname, corpus=corpus, *nargs, **kwargs)

    return f



def post_required(method):
    '''
    Wrapper to add relevant POSTed data to the parameters of a function.
    Also puts data in correct format. (Requires that a `corpus` parameter is
    available, so wrap with `@corpus_required` first.
    '''

    @functools.wraps(method)
    def f(corpusname, corpus, *nargs, **kwargs):
        if not request.method == 'POST':
            abort(405)


        # Collect fields selected for appearance
        fields = (
            field
            for field in corpus.fields
                if ('field:' + field.name) in request.form
        )

        # Collect filters in ES format
        filters = (
            field.search_filter.elasticsearch(request.form)
            for field in corpus.fields
                if field.search_filter
        )

        return method(
            corpusname = corpusname,
            corpus = corpus,
            query_string = request.form.get('query'),
            fields = list(fields),
            filters = list(f for f in filters if f is not None),
            *nargs,
            **kwargs
        )

    return f



@login_manager.user_loader
def load_user(user_id):
    return sqla.User.query.get(user_id)



@blueprint.route('/', methods=['GET'])
def init():
    if current_user:
        return redirect(url_for('admin.index'))
    else:
        return redirect(url_for('admin.login'))




@blueprint.route('/<corpusname>/stream.csv', methods=['POST'])
@login_required
@corpus_required
@post_required
def search_csv(corpusname, corpus=None, query_string=None, fields=None, filters=None):
    '''
    Stream all results of a search to a CSV file.
    '''
    
    # Create a query from POST data
    query = search.make_query(query_string = query_string, filters = filters)


    # Log the query to the database
    q = sqla.Query(query=str(query), corpus=corpusname, user=current_user)
    sqla.db.session.add(q)
    sqla.db.session.commit()

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
        sqla.db.session.add(q)
        sqla.db.session.commit()


    # Perform the search and obtain output stream
    logging.info('Requested CSV for query: {}'.format(query))
    docs = search.execute_iterate(corpus, query, size=current_user.download_limit)
    rows = streaming.field_lists(docs, selected=fields)
    stream = logged_stream(streaming.as_csv(rows))

    # Create appropriate filename
    alphanums = lambda string:  ''.join(char for char in string if char.isalnum())
    query_memo = '-' + alphanums(query_string)[:12] if query_string else ''
    
    try:
        # TODO: Too dependent on particular string structure I chose somewhere
        # else for the date filter
        date_memo = request.form['filter:date'].split(':')
        date1_memo = alphanums(date_memo[0])
        date2_memo = alphanums(date_memo[1])
    except (IndexError, AttributeError, KeyError):
        date1_memo = corpus.min_date.strftime('%Y%m%d') 
        date2_memo = corpus.max_date.strftime('%Y%m%d')

    filename = '{}-{}-{}{}.csv'.format(corpusname, date1_memo, date2_memo, query_memo)


    # Stream results CSV
    response = Response(stream_with_context(stream), mimetype='text/csv')
    response.headers['Content-Disposition'] = (
        'attachment; filename={}'.format(filename)
    )
    return response



@blueprint.route('/<corpusname>/search.json', methods=['POST'])
@login_required
@corpus_required
@post_required
def search_json(corpusname, corpus=None, query_string=None, fields=None, filters=None):
    '''
    Return the first `n` results of a search operation. The result is a JSON
    dictionary, containing search statistics, plus the result entries as a list
    of lists. Used to provide example results.
    '''

    # Build the query from POST data
    query = search.make_query(query_string = query_string, filters = filters)
    
    # Perform the search
    logging.info('Requested example JSON for query: {}'.format(query))
    result = search.execute(corpus, query, size=config.ES_EXAMPLE_QUERY_SIZE)
    
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

'''
Present the data to the user through a web interface.
'''

import logging; logger = logging.getLogger(__name__)


from . import config
from . import search
from . import output
from . import factories
from . import sqla
from .corpora import corpora

from datetime import datetime, timedelta
from flask import Flask, Blueprint, Response, request, abort, current_app, \
    render_template, url_for, stream_with_context, jsonify, redirect, flash
from flask_login import LoginManager, login_required, login_user, logout_user, current_user
from flask_admin import Admin

from werkzeug.security import generate_password_hash, check_password_hash



blueprint = Blueprint('blueprint', __name__)
admin = Admin()
login_manager = LoginManager()



@login_manager.user_loader
def load_user(user_id):
    return sqla.User.query.get(user_id)



@blueprint.route('/login', methods=['GET', 'POST'])
def login():
    
    if request.method == 'POST':
        
        user = sqla.User.query.filter(
            sqla.User.username == request.form.get('username')
        ).first()
        
        if user and check_password_hash(user.password, request.form.get('password')):

            user.authenticated = True
            sqla.db.session.add(user)
            sqla.db.session.commit()
            login_user(user)
            
            flash('Logged in successfully.')
            return redirect(url_for('blueprint.front', corpusname='times'))
        else:
            flash('Combination of username and password not recognised.')
            
    return render_template('login.html')



@blueprint.route('/logout')
@login_required
def logout():
    user = current_user
    user.authenticated = True
    sqla.db.session.add(user)
    sqla.db.session.commit()
    logout_user()
    flash('Logged out successfully.')
    return redirect(url_for('blueprint.init'))



@blueprint.route('/', methods=['GET'])
def init():
    return login()



def collect_params(corpus):
    '''
    Collect relevant parameters from POST request data and return them as a
    dictionary.
    '''
    
    query_string = request.form.get('query')

    # Collect names of fields that are activated.
    fields = [
        field.name for field in corpus.fields
        if ('field:' + field.name) in request.form
    ]
    if not fields:
        raise RuntimeError('No recognised fields were selected.')

    # Collect active filters from form data; each filter's arguments get
    # prefixed by filter:<fieldname>
    filters = []

    for field in (f for f in corpus.fields if f.filter_):
        prefix = 'filter:' + field.name
        
        enabled = request.form.get(prefix+'?')
        narg = request.form.get(prefix)
        kwargs = {
            key[(len(prefix)+1):] : value
            for key,value in request.form.items()
            if key.startswith(prefix + ':')
        }
        
        if enabled and (narg or kwargs):
            filters.append(
                field.filter_.es(narg, **kwargs)
            )

    return {
        'fields' : fields,
        'query_string' : query_string,
        'filters' : filters,
    }



@blueprint.route('/<corpusname>', methods=['GET'])
@login_required
def front(corpusname):
    
    corpus = corpora.get(corpusname)
    if not corpus:
        abort(404)
    
    return render_template('app.html', corpus=corpusname,
        fields=[
            field for field in corpus.fields
            if not field.hidden
        ],
        autocomplete=[
            field.name + ':' for field in corpus.fields
            if not field.hidden and not field.mapping
        ]
    )


@blueprint.route('/<corpusname>/stream.csv', methods=['POST'])
@login_required
def search_csv(corpusname):
    '''
    Stream all results of a search to a CSV file.
    '''

    corpus = corpora.get(corpusname)
    if not corpus:
        abort(404)

    parameters = collect_params(corpus)
    query = search.make_query(**parameters)
    

    # Perform the search and obtain output
    logging.info('Requested CSV for query: {}'.format(query))
    docs = search.execute_iterate(corpus, query)

    # Stream results
    result = output.as_csv_stream(docs, select=parameters['fields'])
    stream = stream_with_context(result)
    response = Response(stream, mimetype='text/csv')
    response.headers['Content-Disposition'] = (
        'attachment; filename={}-{}.csv'.format(
            corpusname, datetime.now().strftime('%Y%m%d-%H%M')
        )
    )
    return response



@blueprint.route('/<corpusname>/search.json', methods=['POST'])
@login_required
def search_json(corpusname):
    '''
    Return the first `n` results of a search as a JSON file that also includes
    statistics about the search. To act as example search.
    '''

    corpus = corpora.get(corpusname)
    if not corpus:
        abort(404)

    parameters = collect_params(corpus)
    query = search.make_query(**parameters)
    
    logging.info('Requested example JSON for query: {}'.format(query))

    # Perform the search
    result = search.execute(corpus, query)
    
    hits = result.get('hits', {})

    docs = ( dict(doc.get('_source'), id=doc.get('_id')) for doc in hits.get('hits', {}) )

    return jsonify({
        'total': hits.get('total', 0),
        'table': output.as_list(docs, select=parameters['fields'])
    })

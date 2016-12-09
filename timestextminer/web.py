'''
Present the data to the user through a web interface.
'''

import logging; logger = logging.getLogger(__name__)


from . import config
from . import search
from . import output
from . import factories
from .corpora import corpora

from datetime import datetime, timedelta
from flask import Flask, Blueprint, Response, request, abort, current_app, \
    render_template, url_for, stream_with_context, jsonify


blueprint = Blueprint('blueprint', __name__)


@blueprint.route('/', methods=['GET'])
def init():
    return front('times')


@blueprint.route('/<corpusname>', methods=['GET'])
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



@blueprint.route('/<corpusname>/stream.csv', methods=['POST'])
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
    docs = search.execute(corpus, query, scroll=True)

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
    
    logging.info('Requested example JSON for {}'.format(query_string))

    # Perform the search
    result = search.execute(query, corpus, size=10)

    return jsonify({
        'table': output.as_list(result, select=fields)
    })


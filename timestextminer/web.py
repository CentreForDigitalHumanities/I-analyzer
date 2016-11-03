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
            field for field in corpus.fields if not field.hidden
        ],
        autocomplete=(
            [
                field.name+":" for field in corpus.fields if not field.hidden and not field.mapping
            ]
        )
    )


@blueprint.route('/<corpusname>/stream', methods=['POST'])
def stream_csv(corpusname):

    corpus = corpora.get(corpusname)
    if not corpus:
        abort(404)

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
    filter_should = []
    filter_must = []
    filter_must_not = []

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
            filter_ = field.filter_.es(narg, **kwargs)
            if filter_:
                modality, es = filter_
                if modality == 'should':
                    filters = filter_should
                elif modality == 'must_not':
                    filters = filter_must_not
                else:
                    filters = filter_must
                filters.append(es)


    # Create the search query based on collected data
    query = search.make_query(
        query_string=query_string,
        filter_should=filter_should,
        filter_must=filter_must,
        filter_must_not=filter_must_not
    )
    
    logging.info('Requested search query ``'.format(query_string))

    #return jsonify(query)

    # Perform the search
    result = search.execute(query, corpus)

    # Stream response
    stream = stream_with_context(output.generate_csv(result, select=fields))
    response = Response(stream, mimetype='text/csv')
    response.headers['Content-Disposition'] = (
        'attachment; filename={}.csv'.format(corpus.ES_INDEX)
    )
    return response





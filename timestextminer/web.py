'''
Present the data to the user through a web interface.
'''

from . import config
from . import search
from . import output
from . import factories

from datetime import datetime, timedelta
from flask import Flask, Blueprint, Response, request, abort, current_app, \
    render_template, url_for, stream_with_context, jsonify


blueprint = Blueprint('blueprint', __name__)

from .corpora import times
corpora = {
    'times': times
}

@blueprint.route('/', methods=['GET'])
def init():
    return front('times')


@blueprint.route('/<corpus>', methods=['GET'])
def front(corpus):
    
    module = corpora.get(corpus)
    if not module:
        abort(404)
    
    return render_template('app.html', config=config, corpus=corpus,
        fields=[
            field for field in module.fields if not field.hidden
        ],
        autocomplete=(
            [
                field.name+":" for field in module.fields if not field.hidden
            ]
        )
    )


@blueprint.route('/<corpus>/stream', methods=['POST'])
def stream_csv(corpus):

    module = corpora.get(corpus)
    if not module:
        abort(404)

    query_string = request.form.get('query')

    # Get activated fields
    fields = [
        field.name for field in module.fields
        if ('field:' + field.name) in request.form
    ]
    if not fields:
        raise RuntimeError('No recognised fields were selected.')

    # Get active filters
    filter_should = []
    filter_must = []
    filter_must_not = []

    for field in (f for f in module.fields if f.filter_):
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

    query = search.make_query(
        query_string=query_string,
        filter_should=filter_should,
        filter_must=filter_must,
        filter_must_not=filter_must_not
    )

    #return jsonify(query)

    # Perform the search
    result = search.execute(query)

    # Stream response
    stream = stream_with_context(output.generate_csv(result, select=fields))
    response = Response(stream, mimetype='text/csv')
    response.headers['Content-Disposition'] = (
        'attachment; filename={}.csv'.format(corpus)
    )
    return response





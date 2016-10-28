#!/usr/bin/env python3

'''
Present the data to the user through a web interface.
'''

import config
import factories
import data
import search

from datetime import datetime, timedelta
from flask import Flask, Blueprint, Response, request, abort, current_app, \
    render_template, url_for, stream_with_context, jsonify


times2csv = Blueprint('times2csv', __name__)

@times2csv.route('/', methods=['GET'])
def init():
    return render_template('app.html', config=config,
        fields=[
            field for field in data.fields if not field.hidden
        ],
        autocomplete=(
            ["OR", "AND"]
          + [
                field.name+":" for field in data.fields if not field.hidden
            ]
        )
    )



@times2csv.route('/stream', methods=['POST'])
def stream_csv():

    q = request.form.get('query')

    # Get activated fields
    fields = [
        field.name for field in data.fields
        if ('field:' + field.name) in request.form
    ]
    if not fields:
        raise RuntimeError('No recognised fields were selected.')

    # Get active filters
    sieves = {
        'must': [],
        'must_not': [],
        'should': []
    }
    for field in data.fields:
        key = 'sieve:' + field.name
        if field.sieve and key in request.form:
            modality, filter = field.sieve.represent(request.form.get(key))
            sieves[modality].append(filter)

    # Perform the search
    result = search.execute(query_string=q, sieve={'bool' : sieves})

    # Stream response
    stream = stream_with_context(search.generate_csv(result, select=fields))
    response = Response(stream, mimetype='text/csv')
    response.headers['Content-Disposition'] = 'attachment; filename=times.csv'
    return response



if __name__ == '__main__':
    app = factories.flask_app(blueprint=times2csv)
    app.run()

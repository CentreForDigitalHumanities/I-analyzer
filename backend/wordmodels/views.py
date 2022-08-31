from flask import request, abort, current_app, jsonify, Blueprint
from flask_login import LoginManager, login_required
import wordmodels.visualisations as visualisations
# from . import wordmodels

wordmodels = Blueprint('wordmodels', __name__)


@wordmodels.route('/get_related_words', methods=['POST'])
@login_required
def get_related_words():
    if not request.json:
        abort(400)
    results = visualisations.get_diachronic_contexts(
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
            'data': {
                'total_similarities': results[0],
                'similarities_over_time': results[1],
                'time_points': results[2]
            }
        })
    return response


@wordmodels.route('/get_related_words_time_interval', methods=['POST'])
@login_required
def get_related_words_time_interval():
    if not request.json:
        abort(400)
    results = visualisations.get_context_time_interval(
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
            'data': results
        })
    return response

@wordmodels.route('/get_similarity_over_time', methods=['GET'])
@login_required
def api_get_similarity():
    if not request.args:
        abort(400)
    results = visualisations.get_similarity_over_time(
        request.args['term_1'],
        request.args['term_2'],
        request.args['corpus_name']
    )
    if isinstance(results, str):
        # the method returned an error string
        response = jsonify({
            'success': False,
            'message': results})
    else:
        response = jsonify({
            'success': True,
            'data': results
        })
    return response

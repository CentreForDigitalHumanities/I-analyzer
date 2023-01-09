from flask import request, abort, current_app, jsonify, Blueprint
from flask_login import LoginManager, login_required
import wordmodels.visualisations as visualisations
import wordmodels.utils as utils

wordmodels = Blueprint('wordmodels', __name__)


@wordmodels.route('/get_related_words', methods=['POST'])
@login_required
def get_related_words():
    if not request.json:
        abort(400)
    results = visualisations.get_diachronic_contexts(
        request.json['query_term'],
        request.json['corpus_name'],
        number_similar = request.json.get('neighbours'),
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
                'similarities_over_time_local_top_n': results[3],
                'time_points': results[2]
            }
        })
    return response


@wordmodels.route('/get_similarity_over_time', methods=['GET'])
@login_required
def get_similarity():
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

@wordmodels.route('/get_wm_documentation', methods=['GET'])
@login_required
def get_word_models_documentation():
    if not request.args and 'corpus_name' in request.args:
        abort(400)

    corpus = request.args['corpus_name']
    documentation = utils.load_wm_documentation(corpus)

    return {
        'documentation': documentation
    }


@wordmodels.route('/get_word_in_model', methods=['GET'])
@login_required
def get_word_in_model():
    if not request.args:
        abort(400)
    results = utils.word_in_model(
        request.args['query_term'],
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
            'result': results
        })
    return response

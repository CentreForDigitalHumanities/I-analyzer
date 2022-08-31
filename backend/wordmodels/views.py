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
            'related_word_data': {
                'similar_words_subsets': results,
                'time_points': [request.json['time']]
            }
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

from flask import request, abort, jsonify, Blueprint
from flask_login import login_required
from wordmodels import visualisations, utils, tasks

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
        response = jsonify({
            'success': True,
            'data': []
        })
    else:
        response = jsonify({
            'success': True,
            'data': results
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
    results = utils.word_in_corpus_model(
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

@wordmodels.route('/get_2d_contexts_over_time', methods=['GET'])
@login_required
def api_get_2d_contexts_over_time():
    corpus = request.args.get('corpus')
    terms = request.args.get('query_terms').split(',')
    neighbours = request.args.get('neighbours')

    if not corpus and terms and neighbours:
        abort(400)

    try:
        task = tasks.get_2d_context_results.delay(terms, corpus, int(neighbours))
        return jsonify({
            'success': True,
            'task_id': task.id,
        })
    except:
        return jsonify({
            'succes': False,
            'message': 'could not set up result generation'
        })

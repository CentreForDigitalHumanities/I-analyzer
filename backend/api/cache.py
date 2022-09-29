from tabnanny import check
from ianalyzer.models import Visualization, db, User
from datetime import datetime
import json
from flask import current_app

def make_visualization(visualization_type, corpus, parameters, visualize_function):
    """
    Make a visualisation using the visualisation cache. If the specified
    visualisation is already stored, retrieve it from cache. Otherwise, run
    the calculation and store the result.

    Parameters:
    - `visualization_type` - the type of visualisation (term frequency, wordcloud, etc.)
    - `corpus` - name of the corpus on which the visualisation was made
    - `parameters` - parameters specified to the visualisation. The result should be deterministic based on
    type, corpus, and parameters.
    - `visualize_function` - a unary function that can be run to compute the result of the visualisation.
    """
    if not current_app.config.get('USE_VISUALIZATION_CACHE'):
        return visualize_function()

    cached = check_visualization_cache(visualization_type, corpus, parameters)

    if cached and cached.is_done:
        return get_visualization_result(cached.id)
    else:
        cache_id = store_new_visualization(visualization_type, corpus, parameters)
        result = visualize_function()
        store_visualization_result(cache_id, result)
        return result


def check_visualization_cache(visualization_type, corpus, parameters):
    parameter_key = stringify_parameters(parameters, visualization_type)
    result = Visualization.query.filter_by(
        visualization_type=visualization_type,
        corpus_name=corpus,
        parameters=parameter_key
    ).first()

    return result

def stringify_parameters(parameters, visualization_type):
    return json.dumps(parameters)

def store_new_visualization(visualization_type, corpus, parameters):
    parameter_key = stringify_parameters(parameters, visualization_type)
    vis = Visualization(visualization_type, corpus, parameter_key)
    db.session.add(vis)
    db.session.commit()

    return vis.id

def store_visualization_result(id, result):
    vis = Visualization.query.get(id)
    vis.completed = datetime.now()
    vis.result = json.dumps(result)
    db.session.merge(vis)
    db.session.flush()
    db.session.commit()

def get_visualization_result(id):
    vis = Visualization.query.get(id)
    if vis.is_done:
        return json.loads(vis.result)

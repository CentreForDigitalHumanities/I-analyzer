from tabnanny import check
from ianalyzer.models import Visualisation, db, User
from datetime import datetime
import json
from sqlalchemy.orm.attributes import flag_modified

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
    cached = check_visualization_cache(visualization_type, corpus, parameters)
 
    if cached and cached.is_done:
        return get_visualization_result(cached.id)
    else:
        cache_id = store_new_visualisation(visualization_type, corpus, parameters)
        result = visualize_function()
        store_visualization_result(cache_id, result)
        return result


def check_visualization_cache(visualization_type, corpus, parameters):
    parameter_key = stringify_parameters(parameters, visualization_type)
    result = Visualisation.query.filter_by(
        visualization_type=visualization_type,
        corpus_name=corpus,
        parameters=parameter_key
    ).first()

    return result

def stringify_parameters(parameters, visualization_type):
    return json.dumps(parameters)

def store_new_visualisation(visualization_type, corpus, parameters):
    parameter_key = stringify_parameters(parameters, visualization_type)
    vis = Visualisation(visualization_type, corpus, parameter_key)
    db.session.add(vis)
    db.session.commit()

    return vis.id

def store_visualization_result(id, result):
    vis = Visualisation.query.get(id)
    vis.completed = datetime.now()
    vis.result = result
    db.session.merge(vis)
    db.session.flush()
    db.session.commit()

def get_visualization_result(id):
    vis = Visualisation.query.get(id)
    if vis.is_done:
        return vis.result

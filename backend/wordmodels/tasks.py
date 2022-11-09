from wordmodels import visualisations
from ianalyzer import celery_app

@celery_app.task()
def get_2d_context_results(terms, corpus, neighbours):
    print(terms, corpus, neighbours)
    return visualisations.get_2d_contexts_over_time(terms, corpus, neighbours)

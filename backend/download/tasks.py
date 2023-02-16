import logging
import re
from django.conf import settings
from celery import shared_task, chain, group
from django.urls import reverse

from es import download as es_download
from download import create_csv
from download.models import Download
from addcorpus.models import Corpus
from visualization.tasks import histogram_term_frequency_tasks, timeline_term_frequency_tasks
from visualization import query

logger = logging.getLogger(__name__)

@shared_task()
def complete_download(filename, log_id):
    download = Download.objects.get(id = log_id)
    download.complete(filename)
    return log_id

@shared_task()
def complete_failed_download(request, exc, traceback, log_id):
    logger.error('DOWNLOAD #{} FAILED'.format(log_id)) # traceback is already logged
    try:
        download = Download.objects.get(id = log_id)
        download.complete()
    except:
        logger.error('DOWNLOAD #{} NOT FOUND IN DATABASE'.format(log_id))

@shared_task()
def download_scroll(request_json, download_size=10000):
    results, _ = es_download.scroll(request_json['corpus'], request_json['es_query'], download_size)
    return results

@shared_task()
def make_csv(results, request_json):
    query = create_query(request_json)
    filepath = create_csv.search_results_csv(results, request_json['fields'], query)
    return filepath


def create_query(request_json):
    """
    format the route of the search into a query string
    """
    route = request_json.get('route')
    return re.sub(r';|%\d+', '_', re.sub(r'\$', '', route.split('/')[2]))


def download_search_results(request_json, user):
    '''
    Complete chain for downloading search results. Get results from elasticsearch
    and save as a CSV. Also saves the download action in the database.
    '''

    download_limit = user.download_limit
    corpus_name = request_json['corpus']
    corpus = Corpus.objects.get(name=corpus_name)

    download = Download.objects.create(download_type='search_results', corpus=corpus, parameters=request_json, user=user)

    return chain(
        download_scroll.s(request_json, download_limit),
        make_csv.s(request_json),
        complete_download.s(download.id),
        csv_data_email.s(user.email, user.username),
    ).on_error(complete_failed_download.s(download.id))



@shared_task()
def make_term_frequency_csv(results_per_series, parameters_per_series):
    '''
    Export term frequency results to a csv.
    '''
    query_per_series, field_name, unit = extract_term_frequency_download_metadata(parameters_per_series)
    return create_csv.term_frequency_csv(query_per_series, results_per_series, field_name, unit = unit)


def term_frequency_full_data_tasks(parameters_per_series, visualization_type):
    '''
    Returns a group of tasks which retrieve results for the full data of a
    term frequency graph.
    '''

    parameters_unlimited = map(remove_size_limit, parameters_per_series)
    task_function = histogram_term_frequency_tasks if visualization_type == 'aggregate_term_frequency' else timeline_term_frequency_tasks
    return group(
        task_function(series_parameters, True) for series_parameters in parameters_unlimited
    )

def extract_term_frequency_download_metadata(parameters_per_series):
    '''
    Get some relevant metadata for a term frequency request:
    - The query text for each series
    - The name of the x-axis field
    - The unit on the x-axis, in case of date fields
    '''

    query_per_series = [query.get_query_text(params['es_query']) for params in parameters_per_series]
    field_name = parameters_per_series[0]['field_name']
    unit = parameters_per_series[0].get('unit')
    return query_per_series, field_name, unit

def remove_size_limit(parameters):
    '''
    Removes the size (document limit) specification from term frequency
    parameters. The new parameters can be used to get term frequencies
    without a document limit.
    '''

    for bin in parameters['bins']:
        bin['size'] = None
    return parameters

@shared_task()
def csv_data_email(log_id, user_email, username):
    '''
    Send an email to the user that their CSV is ready
    '''

    logger.info('should now be sending email')
    filename = Download.objects.get(id=log_id).filename
    link_url = settings.BASE_URL + reverse('download-csv', kwargs={'id': log_id})
    # TODO: send email
    # send_user_mail(
    #     email=user_email,
    #     username=username,
    #     subject_line="I-Analyzer CSV download",
    #     email_title="Download CSV",
    #     message=f"Your file '{filename}' is ready for download.",
    #     prompt="Click on the link below.",
    #     link_url=link_url,
    #     link_text="Download .csv file"
    # )


def download_full_data(request_json, user):
    '''
    Download the full data for a visualisation
    '''

    visualization_type = request_json['visualization']

    task_per_type = {
        'date_term_frequency': term_frequency_full_data_tasks,
        'aggregate_term_frequency': term_frequency_full_data_tasks
    }

    parameters = request_json['parameters']
    corpus_name = request_json['corpus']
    corpus = Corpus.objects.get(name=corpus_name)
    task = task_per_type[visualization_type](parameters, visualization_type)

    download = Download.objects.create(
        download_type=visualization_type, corpus=corpus, parameters=parameters, user=user)

    return chain(
        task,
        make_term_frequency_csv.s(parameters),
        complete_download.s(download.id),
        csv_data_email.s(user.email, user.username),
    ).on_error(complete_failed_download.s(download.id))

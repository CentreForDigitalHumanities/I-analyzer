import logging
import re
from django.conf import settings

from es import download as es_download
from download import records, create_csv

logger = logging.getLogger(__name__)

#@shared_task()
def complete_download(filename, log_id):
    records.store_download_completed(log_id, filename)
    return log_id

#@shared_task()
def complete_failed_download(request, exc, traceback, log_id):
    logger.error('DOWNLOAD #{} FAILED'.format(log_id)) # traceback is already logged
    records.store_download_failed(log_id)

#@shared_task()
def download_scroll(request_json, download_size=10000):
    results, _ = es_download.scroll(request_json['corpus'], request_json['es_query'], download_size)
    return results

#@shared_task()
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

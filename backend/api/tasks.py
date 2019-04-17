import requests
import csv
import json
import os.path as op
from flask import Flask, abort, current_app, render_template
from flask_mail import Mail, Message
import logging
from requests.exceptions import Timeout, ConnectionError, HTTPError

from api import analyze, mail
from es import es_forward, download
from ianalyzer import celery_app

logger = logging.getLogger(__name__)


@celery_app.task()
def download_scroll(request_json, download_size=10000):
    results = download.scroll(request_json['corpus'], request_json['es_query'], download_size)
    return results


@celery_app.task()
def make_csv(results, request_json, email=None):
    filename = create_filename(request_json)
    filepath = create_csv(results, request_json['fields'], filename)
    if email:
        # we are sending the results to the user by email
        send_mail(filepath, email)
        return None
    else:
        return filepath


@celery_app.task()
def get_wordcloud_data(request_json):
    list_of_texts = download.scroll(request_json['corpus'], request_json['es_query'], current_app.config['WORDCLOUD_LIMIT'])
    return list_of_texts


@celery_app.task()
def make_wordcloud_data(list_of_texts, request_json):
    word_counts = analyze.make_wordcloud_data(list_of_texts, request_json['field'])
    return word_counts


def create_filename(request_json):
    query = 'query_match_all'
    if (request_json['es_query']['query']['bool']['must'] != {'match_all': {}}):
        query = request_json['es_query']['query']['bool']['must']['simple_query_string']['query']
    filename = request_json['corpus'] + "_" + query
    if not request_json['es_query']['query']['bool']['filter']:
        filename += "_" + 'no_filters'
    else:
        for filter_name in request_json['es_query']['query']['bool']['filter']:
            if filter_name.get('range') != None and filter_name['range'].get('date') != None:
                filename += "_" + \
                    filter_name['range']['date']['gte'] + "_" + \
                    filter_name['range']['date']['lte']
            # iterate through terms, find name of filter term, get value of filter term and append to file name
            if filter_name.get('terms') != None:
                for term in filter_name['terms']:
                    filename += "_" + str(filter_name['terms'].get(term))
    filename += '.csv'
    return filename


def create_csv(results, fields, filename):
    entries = []
    for result in results:
        entry = {field: result['_source'][field] for field in fields}
        entries.append(entry)
    csv.register_dialect('myDialect', delimiter=',', quotechar='"',
                         quoting=csv.QUOTE_NONNUMERIC, skipinitialspace=True)
    filepath = op.join(current_app.config['CSV_FILES_PATH'], filename)
    # newline='' to prevent empty double lines
    with open(filepath, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fields, dialect='myDialect')
        writer.writeheader()
        for row in entries:
            writer.writerow(row)
    return filepath


def send_mail(filename, email):
    msg = Message(current_app.config['MAIL_CSV_SUBJECT_LINE'],
                sender=current_app.config['MAIL_FROM_ADRESS'], recipients=[email])
    msg.html = render_template('send_csv_mail.html',
                # link to the api endpoint where csv will be downloaded
                download_link=current_app.config['BASE_URL'] + "/api/csv/" + filename,
                url_i_analyzer=current_app.config['BASE_URL'],
                logo_link=current_app.config['LOGO_LINK'])
    try:
        mail.send(msg)
        return True
    except Exception as e:
        logger.error(
            "An error occured sending an email to {}:".format(email))
        logger.error(e)
        return False
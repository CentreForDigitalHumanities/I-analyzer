import requests
import csv
import json
from . import config_fallback as config
from celery import Celery
from flask import Flask, current_app, render_template
from flask_mail import Mail, Message
import logging
from . import forward_es
from requests.exceptions import Timeout, ConnectionError, HTTPError

logger = logging.getLogger(__name__)
celery = Celery('tasks', broker=config.BROKER_URL)


@celery.task(bind=True)
def download_csv(self, request_json, email, instance_path, download_size):
    corpus = request_json['corpus']
    host = forward_es.get_es_host_or_404(corpus['serverName'])
    address = host + "/".join(["",  corpus['index'],
                               corpus['doctype'], '_search'])
    params = {'size': download_size}
    kwargs = {}
    kwargs['json'] = request_json['esQuery']
    filename = create_filename(request_json)
    try:
        response = requests.request('POST',
                                    address,
                                    params=params,
                                    stream=True,
                                    timeout=30,
                                    **kwargs
                                    )
    except HTTPError:
        abort(502)
    except ConnectionError:
        abort(503)
    except Timeout:
        abort(504)
    result = json.loads(response.text)
    filepath = instance_path + "/" + filename
    create_csv(result, filepath)
    send_mail(filename, email)


def create_filename(request_json):
    query = 'query_match_all'
    if (request_json['esQuery']['query']['bool']['must'] != {'match_all': {}}):
        query = request_json['esQuery']['query']['bool']['must']['simple_query_string']['query']
    filename = request_json['corpus']['index'] + "_" + query
    if not request_json['esQuery']['query']['bool']['filter']:
        filename += "_" + 'no_filters'
    else:
        for filter in request_json['esQuery']['query']['bool']['filter']:
            if filter.get('range') != None and filter['range'].get('date') != None:
                filename += "_" + \
                    filter['range']['date']['gte'] + "_" + \
                    filter['range']['date']['lte']
            # iterate through terms, find name of filter term, get value of filter term and append to file name
            if filter.get('terms') != None:
                for term in filter['terms']:
                    filename += "_" + str(filter['terms'].get(term))
    filename += '.csv'
    return filename


def create_csv(result, filepath):
    result_hits = result['hits']['hits']  # results we need are in here
    entries = []
    counter = 0
    for entry in result_hits:
        entry_s = entry['_source']
        list = []
        if counter == 0:  # key names in first row
            for key in entry_s:
                list.append(key)
        else:
            for value in entry_s.values():
                list.append(value)
        entries.append(list)
        counter += 1
    csv.register_dialect('myDialect', delimiter=',', quotechar='"',
                         quoting=csv.QUOTE_ALL, skipinitialspace=True)
    with open(filepath, 'w') as f:
        writer = csv.writer(f, dialect='myDialect')
        for row in entries:
            writer.writerow(row)
    f.close()


def send_mail(filename, email):
    app = Flask(__name__)  # context is not available in celery task
    mail = Mail(app)
    with app.app_context():
        msg = Message(config.MAIL_CSV_SUBJECT_LINE,
                      sender=config.MAIL_FROM_ADRESS, recipients=[email])
        msg.html = render_template('mail/send_csv.html',
                                   # link to the api endpoint where csv will be downloaded
                                   download_link=config.BASE_URL + "/api/csv/" + filename,
                                   url_i_analyzer=config.BASE_URL,
                                   logo_link=config.LOGO_LINK)
        try:
            mail.send(msg)
            return True
        except Exception as e:
            logger.error(
                "An error occured sending an email to {}:".format(email))
            logger.error(e)
            return False

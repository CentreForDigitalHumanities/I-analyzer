import requests
import csv
import json
from . import config_fallback as config
from celery import Celery
from flask import Flask, current_app, render_template
from flask_mail import Mail, Message
from flask_login import current_user
import logging
from . import forward_es

logger = logging.getLogger(__name__)
celery= Celery('tasks', broker=config.BROKER_URL)

@celery.task(bind=True)
def download_csv(self, request_json, email ):
    corpus = request_json['corpus']
    es_query = request_json['esQuery']
    download_size = request_json['size']
    
    #use function in forward_es.py
    host = forward_es.get_es_host_or_404(corpus['serverName']) 
    address = host + "/".join(["",  corpus['index'], corpus['doctype'], '_search'])
    params = {'size': download_size }
    kwargs = {}
    kwargs['json'] = request_json['esQuery']

    #is very nested in response TODO: geeft error als er een leeg veld is in query
    query=request_json['esQuery']['query']['bool']['must']['simple_query_string']['query']
    #TODO: geft error als geen datumrange
    publication_range=request_json['esQuery']['query']['bool']['filter'][0]['range']['date']
    
    print(publication_range)

    try:
        response = requests.request('POST',
            address,
            params=params,
            stream=True,
            timeout=30,
            **kwargs
        )
    except ConnectionError:
        abort(503)  # Service unavailable

    #print(response.text)
    result=json.loads(response.text)
    result_hits=result['hits']['hits'] #results we need are in here
    entries = []
    counter=0

    for entry in result_hits:
        entry_s=entry['_source'] #is dictionary

        list=[]
        if counter==0: #key names in first row
            for key in entry_s:
                list.append(key)
        else:
            for value in entry_s.values():
                list.append(value)

        entries.append(list)
        counter+=1

    filename=corpus['index'] + "_" + publication_range['gte'] + "_" + publication_range['lte'] + "_" + query + '.csv'
    filepath='csv_files/'+filename
    csv.register_dialect('myDialect', delimiter = ',', quotechar = '"', quoting=csv.QUOTE_ALL, skipinitialspace=True)
    
    with open(filepath, 'w', newline='') as f:
        writer = csv.writer(f, dialect='myDialect')
        for row in entries:
            writer.writerow(row)
    f.close()
    
    send_mail(filename, email )


@celery.task()
def send_mail(filename, email):

    app = Flask(__name__) #context is not available in celery task
    mail=Mail(app)

    with app.app_context():
        msg = Message(config.MAIL_CSV_SUBJECT_LINE, sender=config.MAIL_FROM_ADRESS, recipients=[email])
        msg.html = render_template('mail/send_csv.html',
                                        download_link=config.BASE_URL+'/api/csv/'+filename,
                                        url_i_analyzer=config.BASE_URL,
                                        logo_link=config.LOGO_LINK)

        try:
            mail.send(msg)
            return True
        except Exception as e:
            logger.error("An error occured sending an email to {}:".format(email))
            logger.error(e)
            return False
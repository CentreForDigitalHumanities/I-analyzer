import requests
import csv
import json
from . import config_fallback as config
from celery import Celery
from flask import Flask, current_app, render_template
from flask_mail import Mail, Message
from flask_login import current_user
import logging

logger = logging.getLogger(__name__)
celery= Celery('tasks', broker=config.BROKER_URL)

@celery.task(bind=True)
def download_csv(self,address, email):
    params = {'size': '10' } #size is max amount, defaults to 10, must be set much higher after development
    response=requests.request('POST', address, params=params, stream=True, timeout=30 )
    result = json.loads(response.text)
    result_hits=result['hits']['hits'] #results we need are in here
    entries = []
    counter=0

    for entry in result_hits:
        entry_s=entry['_source'] #dictionary

        list=[]
        if counter==0: #key names in first row
            for key in entry_s:
                list.append(key)
        else:
            for value in entry_s.values():
                list.append(value)

        entries.append(list)
        counter+=1

    #print(counter)    
    # filename is now the taskid. But it seems more tasks are running at the same time, resulting in more written files, why?
    filename=self.request.id.__str__()+'.csv'
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
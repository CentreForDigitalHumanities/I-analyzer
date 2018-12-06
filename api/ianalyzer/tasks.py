import requests
import csv
import json
from . import config_fallback as config
from celery import Celery

celery= Celery('tasks', broker=config.BROKER_URL)

@celery.task(bind=True)
def download_csv(self,address):
    response = requests.post(address)
    result = json.loads(response.text)
    result_hits=result['hits']['hits'] #results we need are in here
    entries = [['date','title','category','content']]

    for entry in result_hits:
        entries.append([entry['_source']['date'], 
                        entry['_source']['title'], 
                        entry['_source']['category'], 
                        entry['_source']['content'] 
                        ])
        
    # filename afleiden van task id. Maar als er meerdere tasks lopen krijg je net zo veel identieke files. Anders?
    filename=self.request.id.__str__()+'.csv'
    filepath='csv_files/'+filename
    csv.register_dialect('myDialect', delimiter = ',', quotechar = '"', quoting=csv.QUOTE_ALL, skipinitialspace=True)
    
    with open(filepath, 'w', newline='') as f:
        writer = csv.writer(f, dialect='myDialect')
        for row in entries:
            writer.writerow(row)
    f.close()
    
    send_mail(filename)


@celery.task()
def send_mail(filename):
    print(filename) #lijkt te werken
    # email met link naar api, zoals deze
    # confirmation_link=config.BASE_URL+'/api/csv/'+filename,

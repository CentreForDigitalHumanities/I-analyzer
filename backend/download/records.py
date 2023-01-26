from datetime import datetime
import json
import os

from download.models import Download
from users.models import CustomUser
from addcorpus.models import Corpus

def store_download_started(download_type, corpus_name, parameters, user_id):
    user = CustomUser.objects.get(id=user_id)
    corpus = Corpus.objects.get(name=corpus_name)
    download = Download.objects.create(download_type=download_type, corpus=corpus, parameters=parameters, user=user)
    return download.id

def store_download_completed(id, filename):
    download = Download.objects.get(id=id)
    download.filename = filename
    download.completed = datetime.now()
    download.save()

def store_download_failed(id):
    download = Download.objects.get(id=id)
    download.filename = None
    download.completed = datetime.now()
    download.save()

def get_result_filename(id):
    download = Download.objects.get(id=id)
    if download.is_done:
        _, name = os.path.split(download.filename)
        return name

from datetime import datetime
from ianalyzer.models import Download, db, User
import json
import os

def store_download_started(download_type, corpus_name, parameters, user_id):
    user = User.query.get(user_id)
    parameter_key = json.dumps(parameters)
    download = Download(download_type, corpus_name, parameter_key, user)
    db.session.add(download)
    db.session.flush()
    db.session.commit()

    return download.id

def store_download_completed(id, filename):
    download = Download.query.get(id)
    download.filename = filename
    download.completed = datetime.now()
    db.session.merge(download)
    db.session.flush()
    db.session.commit()

def store_download_failed(id):
    download = Download.query.get(id)
    download.completed = datetime.now()
    db.session.merge(download)
    db.session.flush()
    db.session.commit()

def get_result_filename(id):
    download = Download.query.get(id)
    if download.is_done:
        _, name = os.path.split(download.filename)
        return name

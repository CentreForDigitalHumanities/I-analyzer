import warnings

from ianalyzer.celery import app


def worker_is_active() -> bool:
    '''
    Check whether the app can connect to an active worker.
    '''
    inspector = app.control.inspect()
    try:
        workers = inspector.active()
        return workers is not None and len(workers) > 0
    except:
        return False


def warn_if_no_worker() -> None:
    if not worker_is_active():
        warnings.warn('No active celery worker.')

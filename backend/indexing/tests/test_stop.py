from time import sleep

from addcorpus.models import Corpus
from indexing import models, create_job, run_job
from indexing.stop_job import stop_job, is_stoppable


def test_stop_job(transactional_db, mock_corpus, es_index_client, celery_app, celery_worker, monkeypatch):
    # replace first task handler to ensure fixed execution time
    def mock_create(task: models.CreateIndexTask):
        sleep(60) # this is a long time, but the task will never complete
        return task.index.name

    monkeypatch.setattr(run_job, 'create', mock_create)

    # start indexing job asynchronously
    corpus = Corpus.objects.get(name=mock_corpus)
    job =  create_job.create_indexing_job(corpus)
    run_job.perform_indexing_async(job)

    # wait for job to get started
    sleep(0.5)

    # stop
    assert is_stoppable(job)
    stop_job(job)
    assert job.status() == models.TaskStatus.ABORTED

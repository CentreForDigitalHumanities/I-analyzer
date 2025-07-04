from time import sleep
from copy import copy

from addcorpus.models import Corpus
from indexing import models, create_job, run_job, stop_job


def test_stop_job(transactional_db, basic_mock_corpus, es_index_client, celery_worker, monkeypatch):
    # replace create task handler to ensure fixed execution time
    # (note: because this skips creating the index, the index job will fail in a later
    # step if it is not interrupted)
    def mock_create(task: models.CreateIndexTask):
        # this is a long time, but the task will never complete
        for _ in range(20):
            task.refresh_from_db()
            if task.is_aborted():
                return
            sleep(1)
        return task.index.name

    mock_handlers = copy(run_job.TASK_HANDLERS)
    mock_handlers[models.CreateIndexTask] = mock_create
    monkeypatch.setattr(run_job, 'TASK_HANDLERS', mock_handlers)

    # start indexing job asynchronously
    corpus = Corpus.objects.get(name=basic_mock_corpus)
    job =  create_job.create_indexing_job(corpus)
    result = run_job.perform_indexing_async(job)

    # wait for start_job task to complete
    first_result = result.parent.parent
    first_result.get()

    # stop
    assert stop_job.is_stoppable(job)
    stop_job.mark_tasks_stopped(job)

    result.get()

    assert job.status() == models.TaskStatus.ABORTED

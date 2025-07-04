import logging
import elasticsearch.helpers as es_helpers

from addcorpus.reader import make_reader
from indexing.models import PopulateIndexTask

logger = logging.getLogger('indexing')


def populate(task: PopulateIndexTask, celery_task):
    '''
    Populate an ElasticSearch index from the corpus' source files.
    '''
    reader = make_reader(task.corpus)

    logger.info('Attempting to populate index...')

    # Obtain source documents
    files = reader.sources(
        start=task.document_min_date,
        end=task.document_max_date)
    docs = reader.documents(files)

    # Each source document is decorated as an indexing operation, so that it
    # can be sent to ElasticSearch in bulk
    actions = (
        {
            "_op_type": "index",
            "_index": task.index.name,
            "_id": doc.get("id"),
            "_source": doc,
        }
        for doc in docs
    )

    server_config = task.index.server.configuration

    # Do bulk operation
    client = task.client()
    for success, info in es_helpers.streaming_bulk(
        client,
        actions,
        chunk_size=server_config["chunk_size"],
        max_chunk_bytes=server_config["max_chunk_bytes"],
        raise_on_exception=False,
        raise_on_error=False,
    ):
        if not success:
            logger.error(f"FAILED INDEX: {info}")

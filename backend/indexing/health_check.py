from typing import Optional

from addcorpus.models import Corpus, CorpusDataFile
from es.client import server_for_corpus

from es.models import Server, Index
from es.sync import fetch_index_metadata
from es.es_alias import get_current_index_name
from indexing.models import TaskStatus, IndexJob
from indexing.run_create_task import make_es_mapping, make_es_settings



class CorpusIndexHealth:
    '''
    Reports on the "health status" of a corpus index.


    '''

    corpus: Corpus
    server: Server
    index: Optional[Index]
    latest_job: Optional[IndexJob]
    latest_data: Optional[CorpusDataFile]


    def __init__(self, corpus: Corpus):
        self.corpus = corpus
        self.server = self._server()
        self.index = self._index(self.server)
        self.latest_job = self._latest_job()
        self.latest_file = self.latest_datafile()


    def _server(self) -> Server:
        return Server.objects.get(name=server_for_corpus(self.corpus.name))


    def _index(self, server: Server) -> Optional[Index]:
        client = server.client()
        try:
            index_name = get_current_index_name(self.corpus.configuration, client)
        except ValueError: # the corpus has no index
            index_name = self.corpus.configuration.es_index
        except: # connection issues etc.
            return

        index, _ = Index.objects.get_or_create(name=index_name, server=server)

        fetch_index_metadata()
        index.refresh_from_db()

        return index


    def _latest_job(self) -> Optional[IndexJob]:
        '''
        Find the latest job for this index. Returns the most recently created job.

        Note that this is not necessarily the latest job that was completed. Mostly
        informative when the corpus is indexed through the form, which does not enable
        complex job management (such as running older jobs).
        '''
        jobs = IndexJob.objects.filter(corpus=self.corpus)
        if jobs.exists():
            return jobs.latest('created')


    def _latest_datafile(self) -> CorpusDataFile:
        '''
        Find the most recent data file for this corpus. Will not return a value for
        Python corpora.
        '''
        files = CorpusDataFile.objects.filter(corpus_configuration__corpus=self.corpus)
        if files.exists():
            return files.latest('created')


    @property
    def server_active(self) -> bool:
        '''
        Whether the server can be reached.
        '''
        return self.server.can_connect()


    @property
    def index_active(self) -> Optional[bool]:
        '''
        Whether there is an active index for the corpus.

        Returns `None` if the `index` property is empty. This happens when the server
        cannot be reached.
        '''
        if self.index:
            return self.index.available


    @property
    def settings_compatible(self) -> Optional[bool]:
        '''
        Whether the index settings in Elasticsearch are compatible with the corpus
        configuration
        '''

        if self.index:
            generated_settings = make_es_settings(self.corpus)
            actual_settings = self.index.settings()

            if 'analysis' in generated_settings:
                return actual_settings.get('analysis', None) == generated_settings['analysis']


    @property
    def mappings_compatible(self) -> Optional[bool]:
        '''
        Whether the field mappings in Elasticsearch match the corpus configuration
        '''
        if self.index:
            generated_mappings = make_es_mapping(self.corpus.configuration)
            actual_mappings = self.index.mappings
            return generated_mappings == actual_mappings


    @property
    def job_status(self) -> Optional[TaskStatus]:
        '''
        Status of the last IndexJob
        '''
        if self.latest_job:
            return self.latest_job.status()

    @property
    def includes_latest_data(self) -> Optional[bool]:
        '''
        Whether the last index job included the most recent data for the corpus.

        Checks whether the job was created *after* the data was uploaded. This is
        reliable in the context of the corpus form.
        '''
        if self.latest_job and self.latest_data:
            return self.latest_job.created > self.latest_data.created

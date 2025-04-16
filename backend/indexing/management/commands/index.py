import logging
from datetime import datetime
from django.core.management import BaseCommand

from addcorpus.python_corpora.load_corpus import load_corpus_definition
from addcorpus.python_corpora.save_corpus import load_all_corpus_definitions
from addcorpus.models import Corpus
from indexing.create_job import create_indexing_job
from indexing.run_job import perform_indexing, mark_tasks_stopped

class Command(BaseCommand):
    help = '''
    Create, populate or clear elasticsearch indices for corpora.
    '''

    def add_arguments(self, parser):
        parser.add_argument(
            'corpus',
            help='''Sets which corpus should be indexed. This should match the "name"
                field in the database. For Python corpora, this field is based on the
                name in settings.py''',
        )

        parser.add_argument(
            '--start', '-s',
            help='''Minimum date to select documents. The input format is YYYY-MM-DD.
            Optional. Only has effect for Python corpora which implement date selection
            in their sources() method. Cannot be used in combination with
            --mappings-only.'''
        )

        parser.add_argument(
            '--end', '-e',
            help='''Maximum date to select documents. The input format is YYYY-MM-DD.
            Optional. Only has effect for Python corpora which implement date selection
            in their sources() method. Cannot be used  in combination with
            --mappings-only.'''
        )

        parser.add_argument(
            '--delete', '-d',
            action='store_true',
            help='''If this job is set to create an index that already exists, delete
                it instead of raising an exception. Cannot be used in combination with
                --add.'''
        )

        parser.add_argument(
            '--update', '-u',
            action='store_true',
            help='''Run an update script defined in the corpus definition (to add/change
                field values in documents). Only available for Python corpora. This
                will also skip index creation and population. Cannot be used in
                combination with --add, --delete, or --mappings-only'''
        )

        parser.add_argument(
            '--mappings-only', '-m',
            action='store_true',
            help='''Only create the index with mappings without adding data to it. This
                is useful e.g. before a remote reindex. Cannot be used in combination with
                --update.'''
        )

        parser.add_argument(
            '--add', '-a',
            action='store_true',
            help='''Skip index creation. Documents will be added to the existing index
                for the corpus. Cannot be used in combination with --update.'''
        )

        parser.add_argument(
            '--prod', '-p',
            action='store_true',
            help='''Specifies that this is NOT a local indexing operation. This
                will affect index settings. The script will also generate a versioned
                name for the index, which requires an alias to be linked to the
                corpus.'''
        )

        parser.add_argument(
            '--rollover', '-r',
            action='store_true',
            help='''Specifies that the alias of the index should be moved to this version
                after populating the index. Only applicable in combination with --prod.
                Note that you can also move the alias with the separate "alias"
                command after indexing is complete.'''
        )

        parser.add_argument(
            '--create-only',
            action='store_true',
            help='''Save an IndexJob for this command, but don't run it.'''
        )

    def handle(self, corpus, start=None, end=None, add=False, delete=False, update=False, mappings_only=False, prod=False, rollover=False, create_only=False, **options):
        corpus_object = self._corpus_object(corpus)
        corpus_object.validate_ready_to_index()

        corpus_definition = load_corpus_definition(corpus)

        self._validate_arguments(
            start, end, add, delete, update, mappings_only, prod, rollover
        )

        try:
            if start:
                start_index = datetime.strptime(start, '%Y-%m-%d')
            else:
                start_index = corpus_definition.min_date

            if end:
                end_index = datetime.strptime(end, '%Y-%m-%d')
            else:
                end_index = corpus_definition.max_date

        except Exception:
            logging.critical(
                'Incorrect data format; dates must be YYYY-MM-DD. '
                'Example call: python manage.py index times -s 1785-01-01 -e 2010-12-31'
            )
            raise

        job = create_indexing_job(
            corpus_object, start_index, end_index, mappings_only, add, delete, prod,
            rollover, update
        )

        if not create_only:
            try:
                perform_indexing(job)
            except KeyboardInterrupt:
                print('Aborting tasks...')
                mark_tasks_stopped(job)


    def _validate_arguments(
        self,
        start=None,
        end=None,
        add=False,
        delete=False,
        update=False,
        mappings_only=False,
        prod=False,
        rollover=False,
    ):
        if (start or end) and mappings_only:
            raise ValueError(
                '--start cannot be used in combination with --mappings_only. Start/end '
                'date determine data selection when populating or updating the index.'
            )

        if add and delete:
            raise ValueError(
                '--add and --delete cannot be used together. You must either delete the '
                'existing index or add to it.'
            )

        if update and mappings_only:
            raise ValueError(
                '--update cannot be used in combination with --mappings_only. Updates '
                'scripts are intended to be run on a populated index.'
            )

        if update and add:
            raise ValueError(
                '--update cannot be used in combination with --add. Update scripts are '
                'always applied to an existing index.'
            )

        if update and delete:
            raise ValueError(
                '--update cannot be used in combination with --delete. You cannot update '
                'and index after deleting it.'
            )

        if rollover and not prod:
            raise ValueError(
                '--rollover can only be used in combination with --prod. Alias rollover '
                'is only applicable with versioned indices.'
            )


    def _corpus_object(self, corpus_name):
        load_all_corpus_definitions()
        return Corpus.objects.get(name=corpus_name)

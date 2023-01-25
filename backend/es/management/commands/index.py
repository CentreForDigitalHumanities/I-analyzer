import logging
from datetime import datetime
from django.core.management import BaseCommand

from addcorpus.load_corpus import load_corpus
from es.es_index import perform_indexing
from es.es_update import update_index, update_by_query

class Command(BaseCommand):
    help = '''
    Create, populate or clear elasticsearch indices for corpora.
    '''

    def add_arguments(self, parser):
        parser.add_argument(
            'corpus',
            help='''Sets which corpus should be indexed. Use the name provided in settings.py''',
        )

        parser.add_argument(
            '--start', '-s',
            help='''The date where indexing should start.
            The input format is YYYY-MM-DD.
            If not set, indexing will start from corpus minimum date.'''
        )

        parser.add_argument(
            '--end', '-e',
            help='''The date where indexing should end
            The input format is YYYY-MM-DD.
            If not set, indexing will stop at corpus maximum date.'''
        )

        parser.add_argument(
            '--delete', '-d',
            action='store_true',
            help='Delete the index before indexing'
        )

        parser.add_argument(
            '--update', '-u',
            action='store_true',
            help='Update an index (add / change fields in documents)'
        )

        parser.add_argument(
            '--mappings-only', '-m',
            action='store_true',
            help='''Only create the index with mappings
            without adding data to it. This is useful e.g. before a remote reindex.'''
        )

        parser.add_argument(
            '--add', '-a',
            action='store_true',
            help='''Add documents to an existing index, i.e., skip index creation'''
        )

        parser.add_argument(
            '--prod', '-p',
            action='store_true',
            help='''Specifies that this is NOT a local indexing operation.
            This influences index settings in particular'''
        )

        parser.add_argument(
            '--rollover', '-r',
            action='store_true',
            help='''Specifies that the alias of the index should be adjusted.
            (Only applicable in combination with --prod)'''
        )

    def handle(self, corpus, start = None, end = None, add=False, delete=False, update=False, mappings_only=False, prod=False, rollover=False, **options):
        this_corpus = load_corpus(corpus)

        try:
            if start:
                start_index = datetime.strptime(start, '%Y-%m-%d')
            else:
                start_index = this_corpus.min_date

            if end:
                end_index = datetime.strptime(end, '%Y-%m-%d')
            else:
                end_index = this_corpus.max_date

        except Exception:
            logging.critical(
                'Incorrect data format '
                'Example call: flask es times -s 1785-01-01 -e 2010-12-31'
            )
            raise

        if update:
            try:
                if this_corpus.update_body():
                    update_index(
                        corpus,
                        this_corpus,
                        this_corpus.update_query(
                            min_date=start_index.strftime('%Y-%m-%d'),
                            max_date=end_index.strftime('%Y-%m-%d')
                    ))
                elif this_corpus.update_script():
                    update_by_query(
                        corpus, this_corpus, this_corpus.update_script()
                    )
                else:
                    logging.critical("Cannot update without update_body or update_script")
                    return None
            except Exception as e:
                logging.critical(e)
                raise
        else:
            perform_indexing(corpus, this_corpus, start_index, end_index, mappings_only, add, delete, prod, rollover)

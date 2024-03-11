'''
This module defines functions to check if a corpus is ready to be published.
'''

class CorpusNotPublishableError(Exception):
    '''
    The corpus is not meeting the requirements for publication.
    '''
    pass

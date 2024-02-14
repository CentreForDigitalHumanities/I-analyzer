'''
This module is a tool to define how to extract specific information from an
object such as a dictionary or a BeautifulSoup XML node.
'''

from ianalyzer_readers.extract import *

class JSON(Extractor):
    def __init__(self, key, *nargs, **kwargs):
        self.key = key
        super().__init__(*nargs, **kwargs)

    def _apply(self, data, **kwargs):
        return data.get(self.key)


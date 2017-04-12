import re
import os
import os.path as op
import logging

from flask import current_app

from .. import config
from .common import XMLCorpus, Field


class DutchBanking(XMLCorpus):
    """ Alto XML corpus of Dutch banking year records. """
    
    # Data overrides from .common.Corpus (fields at bottom of class)
    data_directory = config.DUTCHBANK_DATA
    min_date = config.DUTCHBANK_MIN_DATE
    max_date = config.DUTCHBANK_MAX_DATE
    es_index = config.DUTCHBANK_ES_INDEX
    es_doctype = config.DUTCHBANK_ES_DOCTYPE
    es_settings = None
    
    # Data overrides from .common.XMLCorpus
    xml_tag_toplevel = 'alto'
    xml_tag_entry = 'TextBlock'
    
    # New data members
    filename_pattern = re.compile('([A-Z]+)_(\d{4})_(\d)_(\d{5})')
    non_xml_msg = 'Skipping non-XML file {}'
    non_match_msg = 'Skipping XML file with nonmatching name {}'
    
    def sources(self, start=min_date, end=max_date):
        logger = logging.getLogger(__name__)
        for filename in os.listdir(self.data_directory):
            name, extension = op.splitext(filename)
            if extension != '.xml':
                logger.debug(self.non_xml_msg.format(filename))
                continue
            match = self.filename_pattern.match(name)
            if not match:
                logger.warning(self.non_match_msg.format(filename))
                continue
            bank, year, serial, scan = match.groups()
            if int(year) < start.year or end.year < int(year):
                continue
            yield op.join(self.data_directory, filename), {
                'bank': bank,
                'year': year,
                'serial': serial,
                'scan': scan,
            }
    
    fields = [
        
    ]

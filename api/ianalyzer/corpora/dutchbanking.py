import re
import os
import os.path as op
import logging

from flask import current_app

from .. import config
from ..extract import XML, Metadata, Combined
from ..filters import MultipleChoiceFilter, RangeFilter
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
    filename_pattern = re.compile('([A-Za-z]+)_(\d{4})_(\d+) ?_(\d{5})')
    non_xml_msg = 'Skipping non-XML file {}'
    non_match_msg = 'Skipping XML file with nonmatching name {}'
    
    def sources(self, start=min_date, end=max_date):
        logger = logging.getLogger(__name__)
        for directory, _, filenames in os.walk(self.data_directory):
            for filename in filenames:
                name, extension = op.splitext(filename)
                full_path = op.join(directory, filename)
                if extension != '.xml':
                    logger.debug(self.non_xml_msg.format(full_path))
                    continue
                match = self.filename_pattern.match(name)
                if not match:
                    logger.warning(self.non_match_msg.format(full_path))
                    continue
                bank, year, serial, scan = match.groups()
                if int(year) < start.year or end.year < int(year):
                    continue
                yield full_path, {
                    'bank': bank,
                    'year': year,
                    'serial': serial,
                    'scan': scan,
                }
    
    fields = [
        Field(
            name='bank',
            description='Banking concern to which the report belongs.',
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Search only within these banks.',
                options=sorted(config.DUTCHBANK_MAP.values()),
            ),
            extractor=Metadata(
                key='bank',
                transform=lambda x: config.DUTCHBANK_MAP[x],
            ),
        ),
        Field(
            name='year',
            description='Year of the financial report.',
            es_mapping={'type': 'integer'},
            search_filter=RangeFilter(
                description='Restrict the years from which search results will be returned.',
                lower=min_date.year,
                upper=max_date.year,
            ),
            extractor=Metadata(key='year', transform=int),
        ),
        Field(
            name='objectno',
            description='Object number in the dataset.',
            es_mapping={'type': 'integer'},
            extractor=Metadata(key='serial', transform=int),
        ),
        Field(
            name='scan',
            description='Scan number within the financial report. A scan contains one or two pages.',
            es_mapping={'type': 'integer'},
            extractor=Metadata(key='scan', transform=int),
        ),
        Field(
            name='id',
            description='Unique identifier of the text block.',
            extractor=Combined(
                Metadata(key='bank'),
                Metadata(key='year'),
                XML(attribute='ID'),
                transform=lambda x: '_'.join(x),
            ),
        ),
        Field(
            name='content',
            description='Text content of the block.',
            extractor=XML(
                tag='String',
                attribute='CONTENT',
                recursive=True,
                multiple=True,
                transform=lambda x: ' '.join(x),
            ),
        ),
        Field(
            name='hpos',
            description='Horizontal position on the scan in pixels.',
            indexed=False,
            es_mapping={'type': 'integer'},
            extractor=XML(attribute='HPOS', transform=int),
        ),
        Field(
            name='vpos',
            description='Vertical position on the scan in pixels.',
            indexed=False,
            es_mapping={'type': 'integer'},
            extractor=XML(attribute='VPOS', transform=int),
        ),
        Field(
            name='width',
            description='Width on the scan in pixels.',
            indexed=False,
            es_mapping={'type': 'integer'},
            extractor=XML(attribute='WIDTH', transform=int),
        ),
        Field(
            name='height',
            description='Height on the scan in pixels.',
            indexed=False,
            es_mapping={'type': 'integer'},
            extractor=XML(attribute='HEIGHT', transform=int),
        ),
    ]

import re
import os
import os.path as op
import logging

from flask import current_app

from ianalyzer import config_fallback as config
from ianalyzer.extract import XML, Metadata, Combined
from ianalyzer.filters import MultipleChoiceFilter, RangeFilter
from ianalyzer.corpora.common import XMLCorpus, Field


class DutchBanking(XMLCorpus):
    """ Alto XML corpus of Dutch banking year records. """

    # Data overrides from .common.Corpus (fields at bottom of class)
    title = config.DUTCHBANK_TITLE
    description = config.DUTCHBANK_DESCRIPTION
    data_directory = config.DUTCHBANK_DATA
    min_date = config.DUTCHBANK_MIN_DATE
    max_date = config.DUTCHBANK_MAX_DATE
    es_index = config.DUTCHBANK_ES_INDEX
    es_doctype = config.DUTCHBANK_ES_DOCTYPE
    es_settings = None
    image = config.DUTCHBANK_IMAGE

    # Data overrides from .common.XMLCorpus
    tag_toplevel = 'alto'
    tag_entry = 'TextBlock'

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
            display_name='Bank',
            description='Banking concern to which the report belongs.',
            results_overview=True,
            visualization_type='term_frequency',
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Search only within these banks.',
                options=sorted(config.DUTCHBANK_MAP.values()),
            ),
            extractor=Metadata(
                key='bank',
                transform=lambda x: config.DUTCHBANK_MAP[x],
            ),
            preselected=True
        ),
        Field(
            name='year',
            display_name='Year',
            description='Year of the financial report.',
            results_overview=True,
            visualization_type='term_frequency',
            es_mapping={'type': 'integer'},
            search_filter=RangeFilter(
                description='Restrict the years from which search results will be returned.',
                lower=min_date.year,
                upper=max_date.year,
            ),
            extractor=Metadata(key='year', transform=int),
            preselected=True
        ),
        Field(
            name='page_number',
            display_name='Page Number',
            description='The number of the page in the scan',
            es_mapping={'type': 'integer'},
            extractor=XML(attribute='PHYSICAL_IMG_NR', transform=int),
        ),
        Field(
            name='id',
            display_name='ID',
            description='Unique identifier of the page.',
            extractor=Combined(
                Metadata(key='bank'),
                Metadata(key='year'),
                XML(attribute='ID'),
                transform=lambda x: '_'.join(x),
            ),
            hidden=False,
        ),
        Field(
            name='content',
            display_name='Content',
            display_type='text_content',
            description='Text content of the page.',
            results_overview=True,
            extractor=XML(
                tag='String',
                attribute='CONTENT',
                recursive=True,
                multiple=True,
                transform=lambda x: ' '.join(x),
            ),
            preselected=True
        ),
    ]

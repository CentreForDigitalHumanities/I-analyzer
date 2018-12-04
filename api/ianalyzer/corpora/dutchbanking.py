import csv
import re
import os
import os.path as op
import logging

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
    tag_entry = 'Page'

    # New data members
    non_xml_msg = 'Skipping non-XML file {}'
    non_match_msg = 'Skipping XML file with nonmatching name {}'

    with open(config.DUTCHBANK_MAP_FP) as f:
        reader = csv.DictReader(f)
        for line in reader:
            config.DUTCHBANK_MAP[line['abbr']] = line['name']

    def sources(self, start=min_date, end=max_date):
         # make the mapping dictionary from the csv file defined in config
        logger = logging.getLogger(__name__)
        for directory, _, filenames in os.walk(self.data_directory):
            _, tail = op.split(directory)
            if tail == "Financials":
                company_type = "Financial"
            elif tail == "Non-Financials":
                company_type = "Non-Financial"
            for filename in filenames:
                name, extension = op.splitext(filename)
                full_path = op.join(directory, filename)
                if extension != '.xml':
                    logger.debug(self.non_xml_msg.format(full_path))
                    continue
                information = re.split("_", name)
                # financial folders contain multiple xmls, ignore the abby files
                if information[-1] == "abby" or len(information[-1]) > 5:
                    continue
                company = information[0]
                year = information[1]
                if len(information) == 3:
                    serial = information[-1]
                    scan = "00001"
                else:
                    serial = information[-2]
                    scan = information[-1]
                # to do: what about year reports which are combined (e.g. "1969_1970" in filepath)
                # or which cover parts of two years ("br" in filepath)?
                if int(year) < start.year or end.year < int(year):
                    continue
                print(scan)
                yield full_path, {
                    'company': company,
                    'company_type': company_type,
                    'year': year,
                    'serial': serial,
                    'scan': scan,
                }

    fields = [
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
            visualization_sort="key",
            extractor=Metadata(key='year', transform=int),
            preselected=True
        ),
        Field(
            name='company',
            display_name='Company',
            description='Company to which the report belongs.',
            results_overview=True,
            visualization_type='term_frequency',
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Search only within these companies.',
                options=sorted(config.DUTCHBANK_MAP.values()),
            ),
            extractor=Metadata(
                key='company',
                transform=lambda x: config.DUTCHBANK_MAP[x],
            ),
            preselected=True
        ),
        Field(
            name='company_type',
            display_name='Company Type',
            description='Financial or non-financial company?',
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description=(
                    'Accept only financial / non-financial companies'
                ),
                options=[
                    'Financial',
                    'Non-Financial'
                ]
            ),
            extractor=Metadata(key='company_type')
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
                Metadata(key='company'),
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
            visualization_type='wordcloud',
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

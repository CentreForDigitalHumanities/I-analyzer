import csv
import re
import os
import os.path as op
import logging
from datetime import datetime

from flask import current_app

from addcorpus.extract import XML, Metadata, Combined
from addcorpus.filters import MultipleChoiceFilter, RangeFilter
from addcorpus.corpus import XMLCorpus, Field


class DutchAnnualReports(XMLCorpus):
    """ Alto XML corpus of Dutch annual reports. """

    # Data overrides from .common.Corpus (fields at bottom of class)
    title = "Dutch Annual Reports"
    description = "Annual reports of Dutch financial and non-financial institutes"
    min_date = datetime(year=1957, month=1, day=1)
    max_date = datetime(year=2008, month=12, day=31)
    data_directory = current_app.config['DUTCHANNUALREPORTS_DATA']
    es_index = current_app.config['DUTCHANNUALREPORTS_ES_INDEX']
    es_doctype = current_app.config['DUTCHANNUALREPORTS_ES_DOCTYPE']
    es_settings = None
    image = current_app.config['DUTCHANNUALREPORTS_IMAGE']
    scan_image_type = current_app.config['DUTCHANNUALREPORTS_SCAN_IMAGE_TYPE']
    description_page = current_app.config['DUTCHANNUALREPORTS_DESCRIPTION_PAGE']

    # Data overrides from .common.XMLCorpus
    tag_toplevel = 'alto'
    tag_entry = 'Page'

    # New data members
    non_xml_msg = 'Skipping non-XML file {}'
    non_match_msg = 'Skipping XML file with nonmatching name {}'

    dutchannualreports_map = {}

    with open(op.join(op.dirname(current_app.config['CORPORA']['dutchannualreports']),
     current_app.config['DUTCHANNUALREPORTS_MAP_FILE'])) as f:
        reader = csv.DictReader(f)
        for line in reader:
            dutchannualreports_map[line['abbr']] = line['name']

    def sources(self, start=min_date, end=max_date):
         # make the mapping dictionary from the csv file defined in config
        logger = logging.getLogger(__name__)
        for directory, _, filenames in os.walk(self.data_directory):
            rel_dir = op.relpath(directory, self.data_directory)
            _, tail = op.split(directory)
            if tail == "Financials":
                company_type = "Financial"
            elif tail == "Non-Financials":
                company_type = "Non-Financial"
            for filename in filenames:
                name, extension = op.splitext(filename)
                full_path = op.join(directory, filename)
                file_path = op.join(rel_dir, filename)
                image_path = op.join(
                    rel_dir, name + '.' + self.scan_image_type)
                if extension != '.xml':
                    logger.debug(self.non_xml_msg.format(full_path))
                    continue
                information = re.split("_", name)
                # financial folders contain multiple xmls, ignore the abby files
                if information[-1] == "abby" or len(information[-1]) > 5:
                    continue
                company = information[0]
                if re.match("[a-zA-Z]+", information[1]):
                    # second part of file name is part of company name
                    company = "_".join([company, information[1]])
                # using first four-integer string in the file name as year
                years = re.compile("[0-9]{4}")
                year = next((info for info in information
                             if re.match(years, info)), None)
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
                yield full_path, {
                    'file_path': file_path,
                    'image_path': image_path,
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
            csv_core=True
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
                options=sorted(dutchannualreports_map.values()),
            ),
            extractor=Metadata(
                key='company',
                transform=lambda x: dutchannualreports_map[x],
            ),
            csv_core=True
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
            name='page',
            display_name='Page Number',
            description='The number of the page in the scan',
            es_mapping={'type': 'integer'},
            extractor=XML(attribute='PHYSICAL_IMG_NR', transform=int),
            csv_core=True,
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
            hidden=True,
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
            search_field_core=True
        ),
        Field(
            name='file_path',
            display_name='File path',
            description='Filepath of the source file containing the document,\
            relative to the corpus data directory.',
            extractor=Metadata(key='file_path'),
            hidden=True,
        ),
        Field(
            name='image_path',
            display_name="Image path",
            description="Path of the source image corresponding to the document,\
            relative to the corpus data directory.",
            extractor=Metadata(key='image_path'),
            hidden=True,
        )
    ]

import glob
import logging
import os.path as op
from datetime import datetime
from os import makedirs, remove
from typing import Optional
from zipfile import ZipFile, BadZipFile

from addcorpus import extract, filters
from addcorpus.corpus import Field, XMLCorpus
from flask import current_app

from addcorpus.es_mappings import keyword_mapping, main_content_mapping
from addcorpus.es_settings import es_settings

logger = logging.getLogger('indexing')


def rdf_description_extractor(tag, section='xml', **kwargs):
    '''rdf:Description extractor
    There are two rdf:Description tags available in the data:
        - description about the open data enrichment
        - description about the source
    There is only deterministic way to select the right one:
        - check the dcterms:format sibling tag'''
    return extract.XML(
        tag=tag,
        secondary_tag={'tag': 'dcterms:format', 'exact': f'text/{section}'},
        **kwargs
    )


class Rechtspraak(XMLCorpus):
    title = "Judicial system Netherlands"
    description = "Open data of (anonymised) court rulings of the Dutch judicial system"
    min_date = datetime(year=1900, month=1, day=1)
    max_date = datetime(year=2022, month=12, day=6)
    data_directory = current_app.config['RECHTSPRAAK_DATA']
    es_index = current_app.config['RECHTSPRAAK_ES_INDEX']
    language = 'dutch'
    image = current_app.config['RECHTSPRAAK_IMAGE']
    toplevel_zip_file = 'OpenDataUitspraken.zip'

    @property
    def es_settings(self):
        return es_settings(self.language, stopword_analyzer=True, stemming_analyzer=True)

    tag_toplevel = 'open-rechtspraak'

    def unpack(self,
               min_year: Optional[int] = None,
               max_year: Optional[int] = None,
               how: str = 'full',
               per_year: int = 5,
               per_archive: int = 5
               ):
        if not min_year:
            min_year = self.min_date.year
        if not max_year:
            max_year = self.max_date.year

        years = range(min_year, max_year+1)

        logger.info(f'Started unpacking with strategy: {how}')
        toplevel_file = op.join(self.data_directory, self.toplevel_zip_file)
        if not op.isfile(toplevel_file):
            logger.error(f'File {toplevel_file} does not exist, aborting.')
            raise FileNotFoundError()

        unpack_dir = op.join(self.data_directory, 'unpacked')
        makedirs(unpack_dir, exist_ok=True)

        # the toplevel archive contains folders per year
        # each containing more archives
        with ZipFile(toplevel_file, 'r') as zf:
            zipnames = zf.namelist()

            # process these per year
            years_archives = {
                year: [zn for zn in zipnames if zn.startswith(f'{year}/')]
                for year in years
            }

            # filter out empty years
            years_archives = {
                year: archives
                for year, archives in years_archives.items()
                if archives
            }

            # unpack a number of nested archives for each year
            # if unpacking a sample, limit to per_year
            for year, archives in years_archives.items():
                if how == 'sample':
                    archives = archives[:min(per_year, len(archives))]
                logger.info(
                    f'Unpacking year {year}, {len(archives)} archives.')
                for arch in archives:
                    # unpack the nested archive
                    if not op.exists(op.join(unpack_dir, arch)):
                        zf.extract(arch, unpack_dir)
                    else:
                        logger.warning(
                            f'Skipped existing {op.join(unpack_dir, arch)}')

                    # finally, unpack the nested archive
                    # containing XML data files
                    # if unpacking a sample, limit to per_archive
                    try:
                        with ZipFile(op.join(unpack_dir, arch)) as nestedz:
                            target_dir = op.join(unpack_dir, str(year))
                            if how == 'sample':
                                members = nestedz.namelist()
                                to_extract = members[:min(
                                    per_archive, len(members))]
                                nestedz.extractall(
                                    target_dir, members=to_extract)
                            else:
                                nestedz.extractall(target_dir)
                            remove(op.join(unpack_dir, arch))
                    except BadZipFile:
                        logger.warning(
                            f'skipping bad file {op.join(unpack_dir, arch)}')

    def sources(self, min_date: Optional[int] = None, max_date: Optional[int] = None):
        if not min_date:
            min_date = self.min_date
        if not max_date:
            max_date = self.max_date

        for year in range(min_date.year, max_date.year+1):
            glob_pattern = f'{self.data_directory}/unpacked/{year}/*.xml'
            files = glob.glob(glob_pattern)
            for f in files:
                yield f, {'year': year}

    fields = [
        Field(
            name='id',
            display_name='ID',
            description='',
            es_mapping=keyword_mapping(),
            extractor=rdf_description_extractor('dcterms:identifier'),
            csv_core=True,
        ),
        Field(
            name='has_content',
            display_name='Has text content',
            description='Document has available text content.',
            es_mapping={'type': 'boolean'},
            extractor=extract.Backup(
                extract.XML('uitspraak', flatten=True),
                extract.XML('conclusie', flatten=True),
                extract.Constant(False),
                transform=bool
            ),
            search_filter=filters.BooleanFilter(
                true='has content',
                false='does not have content',
                description=(
                    'Accept only articles that have available text content.'
                )
            ),
        ),
        Field(
            name='year',
            display_name='Year',
            es_mapping={'type': 'integer'},
            extractor=extract.Metadata('year'),
            search_filter=filters.RangeFilter(min_date.year, max_date.year)
        ),
        Field(
            name='date',
            display_name='Date',
            extractor=rdf_description_extractor('dcterms:date'),
            es_mapping={'type': 'date', 'format': 'yyyy-MM-dd'},
            results_overview=True,
            primary_sort=True,
            csv_core=True,
            search_filter=filters.DateFilter(
                min_date,
                max_date,
                description=(
                    'Accept only rulings with date in this range.'
                )
            ),

        ),
        Field(
            name='issued',
            display_name='Publication Date',
            extractor=rdf_description_extractor('dcterms:issued'),
            es_mapping={'type': 'date', 'format': 'yyyy-MM-dd'},
            search_filter=filters.DateFilter(
                min_date,
                max_date,
                description=(
                    'Accept only rulings with publication date in this range.'
                )
            ),
        ),
        Field(
            name='publisher',
            display_name='Publisher',
            extractor=rdf_description_extractor('dcterms:publisher'),
            es_mapping={'type': 'keyword'}
        ),
        Field(
            name='creator',
            display_name='Court',
            extractor=rdf_description_extractor('dcterms:creator'),
            es_mapping={'type': 'keyword'},
            csv_core=True,
            results_overview=True,
            search_filter=filters.MultipleChoiceFilter(
                description='Accept only rulings of selected courts.',
                option_count=9999
            ),
            visualizations=['resultscount', 'termfrequency']
        ),
        Field(
            name='zaaknr',
            display_name='Case Number',
            es_mapping=keyword_mapping(),
            extractor=rdf_description_extractor('psi:zaaknummer')
        ),
        Field(
            name='type',
            display_name='Type',
            extractor=rdf_description_extractor('dcterms:type'),
            es_mapping={'type': 'keyword'},
            csv_core=True,
            results_overview=True,
            search_filter=filters.MultipleChoiceFilter(
                description='Accept only rulings of selected type.',
                option_count=2
            ),
            visualizations=['resultscount', 'termfrequency']
        ),
        Field(
            name='procedure',
            display_name='(type of) Procedure',
            extractor=rdf_description_extractor('psi:procedure'),
            csv_core=True,
            es_mapping={'type': 'keyword'},
            search_filter=filters.MultipleChoiceFilter(
                description='Accept only rulings of selected procedure type.',
                option_count=44
            ),
            visualizations=['resultscount', 'termfrequency']
        ),
        Field(
            name='spatial',
            display_name='Location',
            es_mapping=keyword_mapping(),
            extractor=rdf_description_extractor('dcterms:spatial')
        ),
        Field(
            name='subject',
            display_name='Area of law',
            extractor=rdf_description_extractor('dcterms:subject'),
            csv_core=True,
            es_mapping={'type': 'keyword'},
            search_filter=filters.MultipleChoiceFilter(
                description='Accept only rulings within this area of law.',
                option_count=32
            ),
            visualizations=['resultscount', 'termfrequency']
        ),
        Field(
            name='title',
            display_name='Title',
            extractor=rdf_description_extractor(
                'dcterms:title', section='html'),
            results_overview=True,
        ),
        Field(
            name='abstract',
            display_name='Abstract',
            extractor=extract.XML(tag='inhoudsindicatie', flatten=True),
            results_overview=True,
        ),
        Field(
            name='content',
            display_name='Content',
            display_type='text_content',
            es_mapping=main_content_mapping(True, True, True),
            extractor=extract.Backup(
                extract.XML('uitspraak', flatten=True),
                extract.XML('conclusie', flatten=True),
                extract.Constant('Content not available')
            ),
            csv_core=True,
        ),
        Field(
            name='url',
            display_name='URL',
            es_mapping=keyword_mapping(),
            extractor=rdf_description_extractor(
                'dcterms:identifier', section='html')
        )
    ]

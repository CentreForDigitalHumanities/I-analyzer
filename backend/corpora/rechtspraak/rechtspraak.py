import logging
import os.path as op
from datetime import datetime
from os import makedirs
from typing import Optional
from zipfile import ZipFile
import glob

from addcorpus.corpus import XMLCorpus
from flask import current_app
from addcorpus import extract

from backend.addcorpus.corpus import Field

logger = logging.getLogger(__name__)




class Rechtspraak(XMLCorpus):
    title = "de Rechtspraak"
    description = "Open data van (geanonimiseerde) uitspraken van de Nederlandse rechtspraak"
    min_date = datetime(year=1900, month=1, day=1)
    max_date = datetime(year=2022, month=10, day=13)
    data_directory = current_app.config['RECHTSPRAAK_DATA']
    es_index = current_app.config['RECHTSPRAAK_ES_INDEX']
    es_doctype = current_app.config['RECHTSPRAAK_ES_DOCTYPE']
    image = current_app.config['RECHTSPRAAK_IMAGE']
    toplevel_zip_file = 'OpenDataUitspraken.zip'

    tag_toplevel = 'open-rechtspraak'
    tag_entry = ''

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
                    with ZipFile(op.join(unpack_dir, arch)) as nestedz:
                        target_dir = op.join(unpack_dir, str(year))
                        if how == 'sample':
                            members = nestedz.namelist()
                            to_extract = members[:min(
                                per_archive, len(members))]
                            nestedz.extractall(target_dir, members=to_extract)
                        else:
                            nestedz.extractall(target_dir)


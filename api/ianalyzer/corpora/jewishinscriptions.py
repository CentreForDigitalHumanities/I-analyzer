import re
import os
import os.path as op
import logging

from flask import current_app

from ianalyzer import config_fallback as config
from ianalyzer.extract import XML, Metadata, Combined
from ianalyzer.filters import MultipleChoiceFilter, RangeFilter #SliderRangeFilter, BoxRangeFilter
from ianalyzer.corpora.common import XMLCorpus, Field


class JewishInscriptions(XMLCorpus):
    """ Alto XML corpus of Jewish funerary inscriptions. """

    # Data overrides from .common.Corpus (fields at bottom of class)
    title = config.JEWISH_INSCRIPTIONS_TITLE
    description = config.JEWISH_INSCRIPTIONS_DESCRIPTION
    data_directory = config.JEWISH_INSCRIPTIONS_DATA
    min_date = config.JEWISH_INSCRIPTIONS_MIN_DATE
    max_date = config.JEWISH_INSCRIPTIONS_MAX_DATE
    es_index = config.JEWISH_INSCRIPTIONS_ES_INDEX
    es_doctype = config.JEWISH_INSCRIPTIONS_ES_DOCTYPE
    es_settings = None
    image = config.JEWISH_INSCRIPTIONS_IMAGE
    visualize = []

    # Data overrides from .common.XMLCorpus
    tag_toplevel = ''
    tag_entry = 'TEI'

    # New data members
    filename_pattern = re.compile('\d+')
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
                inscriptionID = match.groups()
                yield full_path, {
                    'inscriptionID': inscriptionID
                }

    fields = [
        Field(
            name='id',
            description='ID of the inscription entry.',
            es_mapping={'type': 'string'},
            extractor=XML(
                tag=['teiHeader', 'fileDesc', 'titleStmt', 'title'],
                toplevel=False,
            ),
        ),
        Field(
            name='year',
            description='Year of origin of the inscription.',
            es_mapping={'type': 'integer'},
            search_filter=RangeFilter(
                description='Restrict the years from which search results will be returned.',
                lower=min_date.year,
                upper=max_date.year,
            ),
            extractor=XML(
                tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'history', 'origin', 'origDate'],
                toplevel=False,
            ),
            csv_core=True,
            sortable=True
        ),
        Field(
            name='remarks on date',
            description='Additional comments on the year.',
            extractor=XML(
                tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'history', 'origin', 'remarksOnDate'],
                toplevel=False,
            ),
        ),
        Field(
            name='transcription',
            description='Text content of the inscription.',
            extractor=XML(
                tag=['text', 'body', 'transcription'],
                toplevel=False,
            ),
            search_field_core=True
        ),
        Field(
            name='incipit',
            description='The start of the text content of the inscription.',
            es_mapping={'type': 'keyword'},
            csv_core=True,
            search_filter=MultipleChoiceFilter(
                description='Search only within these incipit types.',
                options=['המצבה הזאת',
                         'הציון הלז',
                         'זכר צדיקים',
                         'משכב',
                         'פה הרגיע',
                         'פה ינוח',
                         'פה נקבר',
                         'פה שוכב']
            ),
            extractor=XML(
                tag=['text', 'body', 'incipit'],
                toplevel=False,
            ),
        ),
        Field(
            name='names mentioned',
            description='Names of the buried persons.',
            extractor=XML(
                tag=['text', 'body', 'namesMentioned'],
                toplevel=False,
            ),
            search_field_core=True
        ),
        Field(
            name='names mentioned (Hebrew)',
            description='Names in Hebrew of the buried persons.',
            extractor=XML(
                tag=['text', 'body', 'namesMentionedHebrew'],
                toplevel=False,
            ),
        ),
        Field(
            name='sex',
            description='Gender of the buried person. None if the sex is unknown.',
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Search only within these genders.',
                options=['None',
                         'M',
                         'F']
            ),
            extractor=XML(
                tag=['text', 'body', 'sex'],
                toplevel=False,
            ),
            csv_core=True
        ),
        Field(
            name='age',
            description='Age of the buried person.',
            es_mapping={'type': 'integer'},
            search_filter=RangeFilter(
                 description='Restrict the ages of persons from which search results will be returned.',
                 lower=0,
                 upper=100,
            ),
            extractor=XML(
                tag=['text', 'body', 'age'],
                toplevel=False,
            ),
            csv_core=True,
            sortable=True
        ),
        Field(
            name='remarks on age',
            description='Additional comments on the age.',
            extractor=XML(
                tag=['text', 'body', 'remarksOnAge'],
                toplevel=False,
            ),
        ),
        Field(
            name='provenance',
            description='Description of the location where the inscription was found.',
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Search only within these provenances.',
                options=['Unknown',
                         'Bari',
                         'Brindisi',
                         'Lavello',
                         'Matera',
                         'Oria',
                         'Taranto',
                         'Venosa']
            ),
            extractor=XML(
                tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'history', 'origin', 'provenance'],
                toplevel=False,
            ),
        ),
        Field(
            name='inscription type',
            description='Type of inscription found.',
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Search only within these inscription types.',
                options=['Epitaph'],
            ),
            extractor=XML(
                tag=['text', 'body', 'inscriptionType'],
                toplevel=False,
            ),
            csv_core=True
        ),
        Field(
            name='iconography type',
            description='Type of iconography on the inscription.',
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Search only within these iconography types.',
                options=['None',
                         'Abstract / geometric',
                         'Crescent',
                         'Magen David',
                         'Menorah',
                         'Shofar',
                         'Menorah, Abstract / geometric',
                         'Menorah, Shofar'],
            ),
            extractor=XML(
                tag=['text', 'body', 'iconographyType'],
                toplevel=False,
            ),
            csv_core=True
        ),
        Field(
            name='iconography description',
            description='Description of the iconography on the inscription.',
            extractor=XML(
                tag=['text', 'body', 'iconographyDescription'],
                toplevel=False,
            ),
        ),
        Field(
            name='material',
            description='Type of material where the inscription is written on.',
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Search only within these material types.',
                options=['Stone',
                         'Stone (carparo)',
                         'Stone (limestone)',
                         'Stone (hard limestone)',
                         'Stone (soft limestone)',
                         'Stone (marble)',
                         'Stone (travertine)',
                         'Stone (tufo cozzigno)'],
            ),
            extractor=XML(
                tag=['text', 'body', 'material'],
                toplevel=False,
            ),
            csv_core=True
        ),
        Field(
            name='language',
            description='Language written on the inscription.',
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Search only within these languages.',
                options=['Hebrew',
                         'Latin',
                         'Hebrew, Latin',
                         'Greek',
                         'Aramaic'],
            ),
            extractor=XML(
                tag=['text', 'body', 'language'],
                toplevel=False,
            ),
            csv_core=True
        ),
        Field(
            name='number of lines surviving',
            description='The amount of lines of text on the incipit that is readable.',
            es_mapping={'type': 'integer'},
            search_filter=RangeFilter(
                description='Restrict the amount of lines from which search results will be returned.',
                lower=0,
                upper=100,
            ),
            extractor=XML(
                tag=['text', 'body', 'numberOfLinesSurviving'],
                toplevel=False,
            ),
            csv_core=True
        ),
        Field(
            name='location',
            description='Storage location of the published work.',
            extractor=XML(
                tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'msIdentifier', 'location'],
                toplevel=False,
            ),
            csv_core=True
        ),
        Field(
            name='publication',
            description='Article or book where inscription is published.',
            extractor=XML(
                tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'msIdentifier', 'publication'],
                toplevel=False,
            ),
        ),
        Field(
            name='facsimile',
            description='Photo or facsimile of publication.',
            extractor=XML(
                tag=['facsimile', 'photoFacsimile'],
                toplevel=False,
            ),
        ),
        Field(
            name='photos by Leonard',
            description='Photos by Leonard.',
            extractor=XML(
                tag=['facsimile', 'photosLeonard'],
                toplevel=False,
            ),
        ),
        Field(
            name='3D image',
            description='3D image of inscription.',
            extractor=XML(
                tag=['facsimile', 'image3D'],
                toplevel=False,
            ),
        ),
        Field(
            name='commentary',
            description='Extra comments, questions or remarks on this inscription.',
            extractor=XML(
                tag=['text', 'body', 'commentary'],
                toplevel=False,
            ),
            search_field_core=True,
        )
    ]
    """ Removed for first demo: this tag is empty in all 64 xml files
       Field(
           name='number of lines original',
           description='The amount of lines of text orginally on the incipit.',
           es_mapping={'type': 'integer'},
           search_filter=RangeFilter(#BoxRangeFilter(
               description='Restrict the amount of lines from which search results will be returned.',
               lower=0,
               upper=100,
           ),
           extractor=XML(
               tag=['text', 'body', 'numberOfLinesOriginal'],
               toplevel=False,
           ),
       ),
       """

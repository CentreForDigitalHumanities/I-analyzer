import re
import os
import os.path as op
import logging
from datetime import datetime

from django.conf import settings

from addcorpus.python_corpora.extract import XML
from addcorpus.python_corpora.filters import MultipleChoiceFilter, RangeFilter #SliderRangeFilter, BoxRangeFilter
from addcorpus.python_corpora.corpus import XMLCorpusDefinition, FieldDefinition
from addcorpus.es_mappings import keyword_mapping, main_content_mapping


class JewishInscriptions(XMLCorpusDefinition):
    """ Alto XML corpus of Jewish funerary inscriptions. """

    # Data overrides from .common.Corpus (fields at bottom of class)
    title = "Jewish Funerary Inscriptions"
    description = "A collection of inscriptions on Jewish burial sites"
    min_date = datetime(year=769, month=1, day=1)
    max_date = datetime(year=849, month=12, day=31)
    data_directory = settings.JEWISH_INSCRIPTIONS_DATA
    es_index = getattr(settings, 'JEWISH_INSCRIPTIONS_ES_INDEX', 'jewishinscriptions')
    image = 'jewish_inscriptions.jpg'
    visualize = []
    languages = ['heb', 'lat']
    category = 'inscription'

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
        FieldDefinition(
            name='id',
            display_name='ID',
            description='ID of the inscription entry.',
            extractor=XML(
                tag=['teiHeader', 'fileDesc', 'titleStmt', 'title'],
                toplevel=False,
            ),
            es_mapping=keyword_mapping()
        ),
        FieldDefinition(
            name='year',
            display_name='Year',
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
            sortable=True,
            visualizations=['resultscount', 'termfrequency'],
            visualization_sort='key',
            results_overview=True
        ),
        FieldDefinition(
            name='date_remarks',
            display_name='Date comments',
            description='Additional comments on the year.',
            extractor=XML(
                tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'history', 'origin', 'remarksOnDate'],
                toplevel=False,
            ),
        ),
        FieldDefinition(
            name='transcription',
            display_name='Transcription',
            description='Text content of the inscription.',
            extractor=XML(
                tag=['text', 'body', 'transcription'],
                toplevel=False,
                flatten=True
            ),
            search_field_core=True,
            results_overview=True,
            display_type='text_content',
            es_mapping=main_content_mapping()
        ),
        FieldDefinition(
            name='incipit',
            display_name='Incipit',
            description='The start of the text content of the inscription.',
            es_mapping={'type': 'keyword'},
            csv_core=True,
            search_filter=MultipleChoiceFilter(
                description='Search only within these incipit types.',
                option_count=8
            ),
            extractor=XML(
                tag=['text', 'body', 'incipit'],
                toplevel=False,
            ),
            visualizations=['resultscount', 'termfrequency']
        ),
        FieldDefinition(
            name='names',
            display_name='Names',
            description='Names of the buried persons.',
            extractor=XML(
                tag=['text', 'body', 'namesMentioned'],
                toplevel=False,
            ),
            search_field_core=True
        ),
        FieldDefinition(
            name='names_hebrew',
            display_name='Names (Hebrew)',
            description='Names in Hebrew of the buried persons.',
            extractor=XML(
                tag=['text', 'body', 'namesMentionedHebrew'],
                toplevel=False,
            ),
        ),
        FieldDefinition(
            name='sex',
            display_name='Sex',
            description='Gender of the buried person. None if the sex is unknown.',
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Search only within these genders.',
                option_count=3,
            ),
            extractor=XML(
                tag=['text', 'body', 'sex'],
                toplevel=False,
            ),
            csv_core=True
        ),
        FieldDefinition(
            name='age',
            display_name='Age',
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
        FieldDefinition(
            name='age_remarks',
            display_name='Age remarks',
            description='Additional comments on the age.',
            extractor=XML(
                tag=['text', 'body', 'remarksOnAge'],
                toplevel=False,
            ),
        ),
        FieldDefinition(
            name='provenance',
            display_name='Provenance',
            description='Description of the location where the inscription was found.',
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Search only within these provenances.',
                option_count = 8
            ),
            extractor=XML(
                tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'history', 'origin', 'provenance'],
                toplevel=False,
            ),
            visualizations=['resultscount', 'termfrequency']
        ),
        FieldDefinition(
            name='inscription_type',
            display_name='Inscription type',
            description='Type of inscription found.',
            es_mapping={'type': 'keyword'},
            extractor=XML(
                tag=['text', 'body', 'inscriptionType'],
                toplevel=False,
            ),
            csv_core=True
        ),
        FieldDefinition(
            name='iconography_type',
            display_name='Iconography Type',
            description='Type of iconography on the inscription.',
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Search only within these iconography types.',
                option_count=8
            ),
            extractor=XML(
                tag=['text', 'body', 'iconographyType'],
                toplevel=False,
            ),
            csv_core=True,
            visualizations=['resultscount', 'termfrequency']
        ),
        FieldDefinition(
            name='iconography_desc',
            display_name='Iconography description',
            description='Description of the iconography on the inscription.',
            extractor=XML(
                tag=['text', 'body', 'iconographyDescription'],
                toplevel=False,
            ),
        ),
        FieldDefinition(
            name='material',
            display_name='Material',
            description='Type of material where the inscription is written on.',
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Search only within these material types.',
                option_count=8
            ),
            extractor=XML(
                tag=['text', 'body', 'material'],
                toplevel=False,
            ),
            csv_core=True,
            visualizations=['resultscount', 'termfrequency']
        ),
        FieldDefinition(
            name='language',
            display_name='Language',
            description='Language written on the inscription.',
            es_mapping={'type': 'keyword'},
            search_filter=MultipleChoiceFilter(
                description='Search only within these languages.',
                option_count = 3
            ),
            extractor=XML(
                tag=['text', 'body', 'language'],
                toplevel=False,
            ),
            csv_core=True,
            visualizations=['resultscount', 'termfrequency']
        ),
        FieldDefinition(
            name='no_surviving',
            display_name='Surviving lines',
            description='The amount of lines of text on the incipit that is readable.',
            es_mapping={'type': 'integer'},
            # commenting filter out for now, may be uncommented in case we have more documents
            # search_filter=RangeFilter(
            #     description='Restrict the amount of lines from which search results will be returned.',
            #     lower=0,
            #     upper=100,
            # ),
            extractor=XML(
                tag=['text', 'body', 'numberOfLinesSurviving'],
                toplevel=False,
            ),
            csv_core=True
        ),
        FieldDefinition(
            name='location',
            display_name='Storage location',
            description='Storage location of the published work.',
            es_mapping=keyword_mapping(),
            extractor=XML(
                tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'msIdentifier', 'location'],
                toplevel=False,
            ),
            csv_core=True,
            results_overview=True
        ),
        FieldDefinition(
            name='publication',
            display_name='Publication',
            description='Article or book where inscription is published.',
            extractor=XML(
                tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'msIdentifier', 'publication'],
                toplevel=False,
            ),
            es_mapping=keyword_mapping(True)
        ),
        FieldDefinition(
            name='facsimile',
            display_name='Facsimile',
            description='Photo or facsimile of publication.',
            extractor=XML(
                tag=['facsimile', 'photoFacsimile'],
                toplevel=False,
            ),
            es_mapping=keyword_mapping()
        ),
        FieldDefinition(
            name='photos_leonard',
            display_name='Photos (Leonard)',
            description='Photos by Leonard.',
            extractor=XML(
                tag=['facsimile', 'photosLeonard'],
                toplevel=False,
            ),
            es_mapping=keyword_mapping()
        ),
        FieldDefinition(
            name='3D_image',
            display_name='3D image',
            description='3D image of inscription.',
            extractor=XML(
                tag=['facsimile', 'image3D'],
                toplevel=False,
            ),
            es_mapping=keyword_mapping()
        ),
        FieldDefinition(
            name='commentary',
            display_name='Commentary',
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

from datetime import datetime
import os
from django.conf import settings

from addcorpus.corpus import FieldDefinition
from addcorpus.xlsx import XLSXCorpusDefinition
from addcorpus.es_settings import es_settings
from addcorpus.es_mappings import text_mapping, main_content_mapping, keyword_mapping
from addcorpus.extract import CSV

class HumCourseDescriptions(XLSXCorpusDefinition):
    title = 'Humanities Course Descriptions'
    description = 'Courses taught in the UU Humanities faculty in 2023'
    category = 'informative'
    min_date = datetime(2022, 9, 1)
    max_date = datetime(2023, 8, 31)
    image = 'uu.png'
    languages = ['nl', 'en']
    es_index = 'hum_course_descriptions'

    data_directory = settings.HUM_COURSE_DESCRIPTIONS_DATA


    def sources(self, **kwargs):
        path = os.path.join(self.data_directory, 'doel_inhoud_cursussen2023GW.xlsx')
        yield path

    field_entry = 'CURSUS'

    fields = [
        FieldDefinition(
            name='id',
            display_name='Course ID',
            extractor=CSV('CURSUS')
        )
    ]

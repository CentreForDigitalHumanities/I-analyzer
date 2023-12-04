from datetime import datetime

from addcorpus.corpus import CSVCorpusDefinition, FieldDefinition
from addcorpus.es_settings import es_settings
from addcorpus.es_mappings import text_mapping, main_content_mapping, keyword_mapping

class HumCourseDescriptions(CSVCorpusDefinition):
    title = 'Humanities Course Descriptions'
    description = 'Courses taught in the UU Humanities faculty in 2023'
    category = 'informative'
    min_date = datetime(2022, 9, 1)
    max_date = datetime(2023, 8, 31)
    image = 'uu.png'
    languages = ['nl', 'en']

    es_index = 'hum_course_descriptions'

    fields = []

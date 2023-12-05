from datetime import datetime
import os
from django.conf import settings

from addcorpus.corpus import FieldDefinition
from addcorpus.xlsx import XLSXCorpusDefinition
from addcorpus.es_settings import es_settings
from addcorpus.es_mappings import text_mapping, main_content_mapping, keyword_mapping, int_mapping
from addcorpus.extract import CSV, Combined, Pass
from django.utils.html import strip_tags
import re


def filter_label(label):
    def get_content_with_label(data):
        labels, contents = data
        get_label = lambda pair: pair[0]
        get_content = lambda pair: pair[1]
        has_label = lambda pair: get_label(pair) == label
        filtered = filter(has_label, zip(labels, contents))
        filtered_content = map(get_content, filtered)
        return '\n'.join(filtered_content)

    return get_content_with_label

def html_to_text(content):
    html_replacements = [
        (r'<style.*</style>', ''),
        (r'&nbsp;', ' '),
        (r'<li>', '<li>- '),
    ]

    for pattern, repl in html_replacements:
        content = re.sub(pattern, repl, content, flags=re.DOTALL)

    plain = strip_tags(content)

    stripped_lines = '\n'.join(map(str.strip, plain.splitlines()))
    return stripped_lines.strip()

def content_extractor(label):
    return Pass(
        Combined(
            CSV('LABEL', multiple=True),
            CSV('INHOUD', multiple=True),
            transform=filter_label(label)
        ),
        transform=html_to_text,
    )

def get_level(course_id):
    level = course_id[2]
    if level in ['1', '2', '3']:
        return f'Bachelor {level}'
    else:
        return 'Master'

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
            extractor=CSV('CURSUS'),
            es_mapping=keyword_mapping(),
        ),
        FieldDefinition(
            name='academic_year',
            display_name='Academic year',
            extractor=CSV('COLLEGEJAAR'),
            es_mapping=int_mapping(),
        ),
        FieldDefinition(
            name='name',
            display_name='Name',
            extractor=CSV('KORTE_NAAM_NL'),
            es_mapping=text_mapping(),
        ),
        FieldDefinition(
            name='level',
            display_name='Level',
            extractor=CSV('CURSUS', transform=get_level),
            es_mapping=keyword_mapping(),
        ),
        FieldDefinition(
            name='type',
            display_name='Course type',
            extractor=CSV('CURSUSTYPE'),
            es_mapping=keyword_mapping(),
        ),
        FieldDefinition(
            name='department',
            display_name='Coordinating department',
            extractor=CSV('COORDINEREND_ONDERDEEL'),
            es_mapping=keyword_mapping(),
        ),
        FieldDefinition(
            name='description',
            display_name='Description',
            extractor=CSV('OMSCHRIJVING'),
            es_mapping=keyword_mapping(enable_full_text_search=True),
        ),
        FieldDefinition(
            name='faculty',
            display_name='Faculty',
            extractor=CSV('FACULTEIT'),
            es_mapping=keyword_mapping(),
        ),
        FieldDefinition(
            name='goal',
            display_name='Course goal',
            extractor=content_extractor('DOEL'),
            es_mapping=main_content_mapping(),
        ),
        FieldDefinition(
            name='content',
            display_name='Course content',
            extractor=content_extractor('INHOUD'),
            es_mapping=main_content_mapping(),
        ),
    ]

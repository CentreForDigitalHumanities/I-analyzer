from datetime import datetime
import os
from django.conf import settings
import re
from django.utils.html import strip_tags
from langdetect import detect

from addcorpus.corpus import FieldDefinition
from addcorpus.xlsx import XLSXCorpusDefinition
from addcorpus.es_mappings import text_mapping, main_content_mapping, keyword_mapping, int_mapping
from addcorpus.extract import CSV, Combined, Pass, Constant, Metadata
from addcorpus.filters import MultipleChoiceFilter
from addcorpus.serializers import LanguageField

def filter_label(label):
    def get_content_with_label(data):
        labels, contents = data
        get_label = lambda pair: pair[0]
        get_content = lambda pair: pair[1]
        has_label = lambda pair: get_label(pair) == label
        filtered = filter(has_label, zip(labels, contents))
        filtered_content = map(get_content, filtered)
        return '\n'.join(filter(None, filtered_content))

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

    stripped_lines = '\n'.join(filter(None, map(str.strip, plain.splitlines())))
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

def all_content_extractor():
    return Combined(
        content_extractor('DOEL'),
        content_extractor('INHOUD'),
        transform='\n'.join
    )

def detect_language(content):
    try:
        return detect(content)
    except:
        pass

def language_name(language_code):
    return LanguageField().to_representation(language_code)

def get_level(course_id):
    level = course_id[2]
    if level in ['1', '2', '3']:
        return f'Bachelor {level}'
    else:
        return 'Master'

def filter_teacher_roles(data):
    course_id, role, all_roles = data
    select = lambda row: row['course_id'] == course_id and row['role'] == role
    filtered = list(filter(select, all_roles))
    return filtered

def get_teacher_names(rows):
    if rows:
        extractor = CSV('names')
        return extractor.apply(rows)

def format_names(names):
    format_name = lambda parts: ' '.join(filter(None, parts))
    full_names = map(format_name, names)
    return '; '.join(full_names)

def teacher_extractor(role):
    return Pass(
        Combined(
            CSV('CURSUS'),
            Constant(role),
            Metadata('teacher_roles'),
            transform=filter_teacher_roles,
        ),
        transform=get_teacher_names,
    )

class CourseStaffMetadata(XLSXCorpusDefinition):
    data_directory = settings.HUM_COURSE_DESCRIPTIONS_DATA

    def sources(self, **kwargs):
        path = os.path.join(self.data_directory, 'docenten_cursussen2023GW.xlsx')
        yield path

    field_entry = 'ROL'

    fields = [
        FieldDefinition(
            name='course_id',
            extractor=CSV('CURSUS'),
        ),
        FieldDefinition(
            name='role',
            extractor=CSV('ROL'),
        ),
        FieldDefinition(
            name='names',
            extractor=Pass(
                Combined(
                    CSV('VOORLETTERS', multiple=True),
                    CSV('VOORVOEGSELS', multiple=True),
                    CSV('ACHTERNAAM', multiple=True),
                    transform=lambda values: zip(*values)
                ),
                transform=format_names,
            ),
        ),
    ]

class HumCourseDescriptions(XLSXCorpusDefinition):
    title = 'Humanities Course Descriptions'
    description = 'Courses taught in the UU Humanities faculty in 2023'
    category = 'informative'
    min_date = datetime(2022, 9, 1)
    max_date = datetime(2023, 8, 31)
    image = 'uu_logo_cropped.jpg'
    languages = ['nl', 'en', 'de', 'fr', 'es', 'it']
    es_index =  getattr(settings, 'HUM_COURSE_DESCRIPTIONS_INDEX', 'hum_course_descriptions')

    data_directory = settings.HUM_COURSE_DESCRIPTIONS_DATA

    def sources(self, *args, **kwargs):
        teacher_roles = self._extract_teacher_data()
        path = os.path.join(self.data_directory, 'doel_inhoud_cursussen2023GW.xlsx')
        yield path, { 'teacher_roles': teacher_roles }

    def _extract_teacher_data(self):
        reader = CourseStaffMetadata()
        roles = reader.documents()
        return list(roles)

    field_entry = 'CURSUS'
    required_field = 'CURSUS'

    fields = [
        FieldDefinition(
            name='id',
            display_name='Course ID',
            extractor=CSV('CURSUS'),
            es_mapping=keyword_mapping(),
            csv_core=True,
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
            results_overview=True,
            search_field_core=True,
            csv_core=True,
        ),
        FieldDefinition(
            name='level',
            display_name='Level',
            extractor=CSV('CURSUS', transform=get_level),
            es_mapping=keyword_mapping(),
            results_overview=True,
            search_filter=MultipleChoiceFilter(),
            visualizations=['resultscount', 'termfrequency'],
            csv_core=True,
        ),
        FieldDefinition(
            name='type',
            display_name='Course type',
            extractor=CSV('CURSUSTYPE'),
            es_mapping=keyword_mapping(),
            search_filter=MultipleChoiceFilter(option_count=100),
            visualizations=['resultscount', 'termfrequency'],
        ),
        FieldDefinition(
            name='department',
            display_name='Coordinating department',
            extractor=CSV('COORDINEREND_ONDERDEEL'),
            es_mapping=keyword_mapping(),
            results_overview=True,
            search_filter=MultipleChoiceFilter(option_count=100),
            visualizations=['resultscount', 'termfrequency'],
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
            name='contact',
            display_name='Contact',
            extractor=teacher_extractor('CONTACTPERSOON'),
            es_mapping=keyword_mapping(enable_full_text_search=True)
        ),
        FieldDefinition(
            name='coordinator',
            display_name='Coordinator',
            extractor=teacher_extractor('COORDINATOR'),
            es_mapping=keyword_mapping(enable_full_text_search=True)
        ),
        FieldDefinition(
            name='course_coordinator',
            display_name='Course coordinator',
            extractor=teacher_extractor('CURSUSCOORDINAT'),
            es_mapping=keyword_mapping(enable_full_text_search=True)
        ),
        FieldDefinition(
            name='program_coordinator',
            display_name='Program coordinator',
            extractor=teacher_extractor('OPLEIDINGSCOORD'),
            es_mapping=keyword_mapping(enable_full_text_search=True)
        ),
        FieldDefinition(
            name='min_coordinator',
            display_name='Min coordinator',
            extractor=teacher_extractor('MINCOORDINATOR'),
            es_mapping=keyword_mapping(enable_full_text_search=True)
        ),
        FieldDefinition(
            name='teacher',
            display_name='Teacher',
            extractor=teacher_extractor('DOCENT'),
            es_mapping=keyword_mapping(enable_full_text_search=True)
        ),
        FieldDefinition(
            name='language',
            display_name='Language',
            extractor=Pass(
                    Pass(
                    all_content_extractor(),
                    transform=detect_language
                ),
                transform=language_name,
            ),
            description='Language used in the course description',
            es_mapping=keyword_mapping(),
            search_filter=MultipleChoiceFilter(),
        ),
        FieldDefinition(
            name='language_code',
            display_name='Language code',
            extractor=Pass(
                all_content_extractor(),
                transform=detect_language
            ),
            description='IETF tag of the language used in the course description',
            es_mapping=keyword_mapping(),
            hidden=True,
        ),
        FieldDefinition(
            name='goal',
            display_name='Course goal',
            extractor=content_extractor('DOEL'),
            es_mapping=main_content_mapping(token_counts=True),
            display_type='text_content',
            results_overview=True,
            visualizations=['wordcloud'],
            search_field_core=True,
            csv_core=True,
        ),
        FieldDefinition(
            name='content',
            display_name='Course content',
            extractor=content_extractor('INHOUD'),
            es_mapping=main_content_mapping(token_counts=True),
            display_type='text_content',
            results_overview=True,
            visualizations=['wordcloud'],
            search_field_core=True,
            csv_core=True,
        ),
    ]

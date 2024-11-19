from datetime import datetime
import os
from django.conf import settings
import re
from django.utils.html import strip_tags
from langdetect import detect
from ianalyzer_readers.readers.xlsx import XLSXReader

from addcorpus.python_corpora.corpus import FieldDefinition, XLSXCorpusDefinition
from addcorpus.es_mappings import text_mapping, main_content_mapping, keyword_mapping, int_mapping
from addcorpus.python_corpora.extract import CSV, Combined, Pass, Constant, Metadata
from addcorpus.python_corpora.filters import MultipleChoiceFilter
from addcorpus.serializers import LanguageField

FACULTIES = {
    'BETA': 'Betawetenschappen',
    'GW': 'Geesteswetenschappen',
    'DGK': 'Diergeneeskunde',
    'GEO': 'Geowetenschappen',
    'GNK': 'Geneeskunde',
    'HC': 'Honours College',
    'IVLOS': 'Interfacultair Instituut voor Lerarenopleiding, Onderwijsontwikkeling en Studievaardigheden',
    'JCU': 'Junior College Utrecht',
    'RA': 'Roosevelt Academy',
    'REBO': 'Recht, Economie, Bestuur en Organisatie',
    'SW': 'Sociale Wetenschappen',
    'UC': 'University College',
    'UU': 'Utrecht University',
}

def format_faculty(value):
    return FACULTIES.get(value, value)

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
        (r'</li>', '</li>\n'),
        (r'<br />', '<br />\n'),
        (r'</p>', '</p>\n'),
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
        detected = detect(content)
        if detected == 'af':
            # dutch is sometimes mistaken for afrikaans
            # but we know afrikaans is never actually used in this corpus
            return 'nl'
        return detected
    except:
        pass

def language_name(language_code):
    return LanguageField().to_representation(language_code)


def filter_teacher_roles(data):
    course_id, roles, all_roles = data
    select = lambda row: row['course_id'] == course_id and row['role'] in roles
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

def staff_extractor(*roles):
    return Pass(
        Combined(
            CSV('CURSUS'),
            Constant(roles),
            Metadata('teacher_roles'),
            transform=filter_teacher_roles,
        ),
        transform=get_teacher_names,
    )

class CourseStaffReader(XLSXReader):
    data_directory = settings.UU_COURSE_DESCRIPTIONS_DATA

    def sources(self, **kwargs):
        path = os.path.join(self.data_directory, '2024_docenten.xlsx')
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

class UUCourseDescriptions(XLSXCorpusDefinition):
    title = 'Utrecht University Course Descriptions'
    description = 'Courses taught at Utrecht University in 2023-2024'
    category = 'informative'
    min_date = datetime(2022, 9, 1)
    max_date = datetime(2023, 8, 31)
    image = 'uu_logo_cropped.jpg'
    languages = ['nl', 'en', 'de', 'fr', 'es', 'it']
    es_index =  getattr(settings, 'UU_COURSE_DESCRIPTIONS_INDEX', 'uu_course_descriptions')

    data_directory = settings.UU_COURSE_DESCRIPTIONS_DATA

    def sources(self, *args, **kwargs):
        teacher_roles = self._extract_teacher_data()
        path = os.path.join(self.data_directory, '2024_doel_inhoud.xlsx')
        yield path, { 'teacher_roles': teacher_roles }

    def _extract_teacher_data(self):
        reader = CourseStaffReader()
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
            results_overview=True,
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
            name='type',
            display_name='Course type',
            extractor=CSV('CURSUSTYPE'),
            es_mapping=keyword_mapping(),
            search_filter=MultipleChoiceFilter(option_count=100),
            visualizations=['resultscount', 'termfrequency'],
        ),
        FieldDefinition(
            name='faculty',
            display_name='Faculty',
            extractor=CSV('FACULTEIT', transform=format_faculty),
            es_mapping=keyword_mapping(),
            search_filter=MultipleChoiceFilter(),
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
            name='department_description',
            display_name='Department description',
            extractor=CSV('OMSCHRIJVING'),
            es_mapping=keyword_mapping(enable_full_text_search=True),
        ),
        FieldDefinition(
            name='contact',
            display_name='Contact',
            extractor=staff_extractor('CONTACTPERSOON'),
            es_mapping=keyword_mapping(enable_full_text_search=True)
        ),
        FieldDefinition(
            name='coordinator',
            display_name='Coordinator',
            extractor=staff_extractor('COORDINATOR'),
            es_mapping=keyword_mapping(enable_full_text_search=True)
        ),
        FieldDefinition(
            name='course_coordinator',
            display_name='Course coordinator',
            extractor=staff_extractor('CURSUSCOORDINAT', 'COORDINATOR'),
            es_mapping=keyword_mapping(enable_full_text_search=True)
        ),
        FieldDefinition(
            name='program_coordinator',
            display_name='Program coordinator',
            extractor=staff_extractor('OPLEIDINGSCOORD'),
            es_mapping=keyword_mapping(enable_full_text_search=True)
        ),
        FieldDefinition(
            name='min_coordinator',
            display_name='Min coordinator',
            extractor=staff_extractor('MINCOORDINATOR'),
            es_mapping=keyword_mapping(enable_full_text_search=True)
        ),
        FieldDefinition(
            name='teacher',
            display_name='Teacher',
            extractor=staff_extractor(
                'DOCENT', 'DOCENT_RES', 'DOC_GEEN_RES', 'DOC_INZAGE', 'DOC_MELDING',
                'CURSUSASSISTENT',
            ),
            es_mapping=keyword_mapping(enable_full_text_search=True)
        ),
        FieldDefinition(
            name='examinator',
            display_name='Examinator',
            extractor=staff_extractor('EXAMINATOR'),
            es_mapping=keyword_mapping(enable_full_text_search=True)
        ),
        FieldDefinition(
            name='language',
            display_name='Description language',
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

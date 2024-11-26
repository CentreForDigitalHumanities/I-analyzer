from typing import Callable
from ianalyzer_readers.readers.core import Document
from ianalyzer_readers.extract import CSV

from addcorpus.es_mappings import keyword_mapping
from addcorpus.python_corpora.corpus import FieldDefinition
from corpora.uu_course_descriptions.uu_course_descriptions import UUCourseDescriptions, FACULTIES

def _faculty_filter(faculty: str) -> Callable[[Document], bool]:
    return lambda doc: doc['faculty'] == FACULTIES[faculty]


_faculty_field = FieldDefinition(
    name='faculty',
    display_name='Faculty',
    extractor=CSV('FACULTEIT', transform=FACULTIES.get),
    es_mapping=keyword_mapping(),
)
'''Adjusted version of the faculty field that does not use a search filter or
visualisation'''


class _UUCourseDescriptionsFaculty(UUCourseDescriptions):
    faculty_code = None
    description_page = None

    def source2dicts(self, source):
        all_docs = super().source2dicts(source)
        return filter(_faculty_filter(self.faculty_code.upper()), all_docs)

    @property
    def es_index(self):
        return super().es_index + '_' + self.faculty_code

    @property
    def image(self):
        return f'uu_{self.faculty_code}.jpg'

    fields = [
        field if field.name != 'faculty' else _faculty_field
        for field in UUCourseDescriptions.fields
    ]


class UUCourseDescriptionsBETA(_UUCourseDescriptionsFaculty):
    title = 'Faculty of Science'
    description = 'Courses taught at the Faculty of Science in 2024-2025'
    languages = ['nl', 'en']
    faculty_code = 'beta'


class UUCourseDescriptionsDGK(_UUCourseDescriptionsFaculty):
    title = 'Faculty of Vetinary Medicine'
    description = 'Courses taught at the Faculty of Vetinary Medicine in 2024-2025'
    languages = ['nl', 'en']
    faculty_code = 'dgk'


class UUCourseDescriptionsGEO(_UUCourseDescriptionsFaculty):
    title = 'Faculty of Geosciences'
    description = 'Courses taught at the Faculty of Geosciences in 2024-2025'
    languages = ['nl', 'en']
    faculty_code = 'geo'


class UUCourseDescriptionsGNK(_UUCourseDescriptionsFaculty):
    title = 'Faculty of Medicine - UMC Utrecht'
    description = 'Courses taught at the Faculty of Medicine and UMC Utrecht in 2024-2025'
    languages = ['nl', 'en']
    faculty_code = 'gnk'


class UUCourseDescriptionsGW(_UUCourseDescriptionsFaculty):
    title = 'Faculty of Humanities'
    description = 'Courses taught at the Faculty of Humanities in 2024-2025'
    faculty_code = 'gw'


class UUCourseDescriptionsREBO(_UUCourseDescriptionsFaculty):
    title = 'Faculty of Law, Economics and Governance'
    description = 'Courses taught at the Faculty of Law, Economics, and Governance in 2024-2025'
    languages = ['nl', 'en']
    faculty_code = 'rebo'


class UUCourseDescriptionsSW(_UUCourseDescriptionsFaculty):
    title = 'Faculty of Social and Behavioural Sciences'
    description = 'Courses taught at the Faculty of Social and Behavioural Sciences in 2024-2025'
    languages = ['nl', 'en']
    faculty_code = 'sw'

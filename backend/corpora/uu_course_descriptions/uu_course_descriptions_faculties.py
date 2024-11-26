from django.conf import settings

from corpora.uu_course_descriptions.uu_course_descriptions import UUCourseDescriptions, FACULTIES

def faculty_filter(faculty):
    return lambda doc: doc['faculty'] == FACULTIES[faculty]


class UUCourseDescriptionsGW(UUCourseDescriptions):
    title = 'Course Descriptions: Humanities faculty'
    description = 'Courses taught at the Humanities faculty in 2024-2025'
    image = 'uu_gw.jpg'
    es_index =  getattr(settings, 'UU_COURSE_DESCRIPTIONS_GW_INDEX', 'uu_course_descriptions_gw')

    def source2dicts(self, source):
        all_docs = super().source2dicts(source)
        return filter(faculty_filter('GW'), all_docs)


class UUCourseDescriptionsBETA(UUCourseDescriptions):
    title = 'Course Descriptions: Science faculty'
    description = 'Courses taught at the Faculty of Science in 2024-2025'
    image = 'uu_beta.jpg'
    languages = ['nl', 'en']
    es_index =  getattr(settings, 'UU_COURSE_DESCRIPTIONS_BETA_INDEX', 'uu_course_descriptions_beta')

    def source2dicts(self, source):
        all_docs = super().source2dicts(source)
        return filter(faculty_filter('BETA'), all_docs)

class UUCourseDescriptionsREBO(UUCourseDescriptions):
    title = 'Faculty of Law, Economics and Governance'
    description = 'Courses taught at the Faculty of Law, Economics, and Governance in 2024-2025'
    image = 'uu_rebo.jpg'
    languages = ['nl', 'en']
    es_index =  getattr(settings, 'UU_COURSE_DESCRIPTIONS_REBO_INDEX', 'uu_course_descriptions_rebo')

    def source2dicts(self, source):
        all_docs = super().source2dicts(source)
        return filter(faculty_filter('REBO'), all_docs)

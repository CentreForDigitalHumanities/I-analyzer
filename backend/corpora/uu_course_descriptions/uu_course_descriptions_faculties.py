from django.conf import settings

from corpora.uu_course_descriptions.uu_course_descriptions import UUCourseDescriptions, FACULTIES

def faculty_filter(faculty):
    return lambda doc: doc['faculty'] == FACULTIES[faculty]


class UUCourseDescriptionsBETA(UUCourseDescriptions):
    title = 'Faculty of Science'
    description = 'Courses taught at the Faculty of Science in 2024-2025'
    image = 'uu_beta.jpg'
    languages = ['nl', 'en']
    es_index =  getattr(settings, 'UU_COURSE_DESCRIPTIONS_BETA_INDEX', 'uu_course_descriptions_beta')

    def source2dicts(self, source):
        all_docs = super().source2dicts(source)
        return filter(faculty_filter('BETA'), all_docs)


class UUCourseDescriptionsDGK(UUCourseDescriptions):
    title = 'Faculty of Vetinary Medicine'
    description = 'Courses taught at the Faculty of Vetinary Medicine in 2024-2025'
    image = 'uu_dgk.jpg'
    languages = ['nl', 'en']
    es_index =  getattr(settings, 'UU_COURSE_DESCRIPTIONS_REBO_INDEX', 'uu_course_descriptions_dgk')

    def source2dicts(self, source):
        all_docs = super().source2dicts(source)
        return filter(faculty_filter('DGK'), all_docs)


class UUCourseDescriptionsGEO(UUCourseDescriptions):
    title = 'Faculty of Geosciences'
    description = 'Courses taught at the Faculty of Geosciences in 2024-2025'
    image = 'uu_dgk.jpg'
    languages = ['nl', 'en']
    es_index =  getattr(settings, 'UU_COURSE_DESCRIPTIONS_GEO_INDEX', 'uu_course_descriptions_geo')

    def source2dicts(self, source):
        all_docs = super().source2dicts(source)
        return filter(faculty_filter('GEO'), all_docs)


class UUCourseDescriptionsGNK(UUCourseDescriptions):
    title = 'Faculty of Medicine - UMC Utrecht'
    description = 'Courses taught at the Faculty of Medicine and UMC Utrecht in 2024-2025'
    image = 'uu_gnk.jpg'
    languages = ['nl', 'en']
    es_index =  getattr(settings, 'UU_COURSE_DESCRIPTIONS_GNK_INDEX', 'uu_course_descriptions_gnk')

    def source2dicts(self, source):
        all_docs = super().source2dicts(source)
        return filter(faculty_filter('GNK'), all_docs)


class UUCourseDescriptionsGW(UUCourseDescriptions):
    title = 'Faculty of Humanities'
    description = 'Courses taught at the Faculty of Humanities in 2024-2025'
    image = 'uu_gw.jpg'
    es_index =  getattr(settings, 'UU_COURSE_DESCRIPTIONS_GW_INDEX', 'uu_course_descriptions_gw')

    def source2dicts(self, source):
        all_docs = super().source2dicts(source)
        return filter(faculty_filter('GW'), all_docs)


class UUCourseDescriptionsREBO(UUCourseDescriptions):
    title = 'Faculty of Law, Economics and Governance'
    description = 'Courses taught at the Faculty of Law, Economics, and Governance in 2024-2025'
    image = 'uu_rebo.jpg'
    languages = ['nl', 'en']
    es_index =  getattr(settings, 'UU_COURSE_DESCRIPTIONS_REBO_INDEX', 'uu_course_descriptions_rebo')

    def source2dicts(self, source):
        all_docs = super().source2dicts(source)
        return filter(faculty_filter('REBO'), all_docs)


class UUCourseDescriptionsSW(UUCourseDescriptions):
    title = 'Faculty of Social and Behavioural Sciences'
    description = 'Courses taught at the Faculty of Social and Behavioural Sciences in 2024-2025'
    image = 'uu_sw.jpg'
    languages = ['nl', 'en']
    es_index =  getattr(settings, 'UU_COURSE_DESCRIPTIONS_SW_INDEX', 'uu_course_descriptions_sw')

    def source2dicts(self, source):
        all_docs = super().source2dicts(source)
        return filter(faculty_filter('SW'), all_docs)

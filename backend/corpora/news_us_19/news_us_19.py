import os
from datetime import datetime
from corpora.gale.gale import GaleCorpus


from django.conf import settings

class NewsUS(GaleCorpus):
    title = "19th Century US Newspapers"
    description = "A collection of 19th century newspapers from the United States"
    min_date = datetime(1800,1,1)
    max_date = datetime(1900,1,1)
    data_directory = settings.NEWS_US_19_DATA
    es_index = getattr(settings, 'PERIODICALS_NEWS_US_19_ES_INDEX', 'news_us_19')
    #description_page = '19thCenturyUKPeriodicals.md'
    image = 'press_room.jpg'
    languages = ['en']
    category = 'periodical'

    @property
    def metafile(self):
        return os.path.join(self.data_directory, "19thCenturyUSNewspapers.xlsx"), "NewspapersPeriodicals"

from django.conf import settings
from visualization import wordcloud
from es import download as es_download
from celery import shared_task

#  @shared_task()
def get_wordcloud_data(request_json):
    list_of_texts, _ = es_download.scroll(request_json['corpus'], request_json['es_query'], settings.WORDCLOUD_LIMIT)
    word_counts = wordcloud.make_wordcloud_data(list_of_texts, request_json['field'], request_json['corpus'])
    return word_counts

'''Temporary test task'''
@shared_task
def add(x, y):
    return x + y

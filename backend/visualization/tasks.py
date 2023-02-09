from celery import shared_task

'''Temporary test task'''
@shared_task
def add(x, y):
    return x + y

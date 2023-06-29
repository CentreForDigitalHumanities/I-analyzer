from django.contrib.auth.models import Group
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser


@receiver(post_save, sender=CustomUser)
def assign_basic_group(sender, instance, created, **kwargs):
    '''Ensure every new user is assigned to the 'basic' user group'''
    if created:
        basic_group, _ = Group.objects.get_or_create(name='basic')
        instance.groups.add(basic_group)

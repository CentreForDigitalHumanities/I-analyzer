from allauth.account.models import EmailAddress
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


@receiver(post_save, sender=CustomUser)
def ensure_admin_email(sender, instance, created, **kwargs):
    ''' Ensure emailaddress is automatically verified for superuser accounts'''
    if created and instance.is_superuser:
        try:
            EmailAddress.objects.get_or_create(
                user=instance,
                email=instance.email,
                verified=True,
                primary=True
            )
            print(f'Automatically verified email {instance.email} for {instance}')
        except Exception as e:
            print('Failed to automatically verify admin email', e, sep='\n')

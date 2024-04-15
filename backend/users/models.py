import django.contrib.auth.models as django_auth_models
from django.db import models

DEFAULT_DOWNLOAD_LIMIT = 10000


class CustomUser(django_auth_models.AbstractUser):
    saml = models.BooleanField(blank=True, null=True, default=False)
    download_limit = models.IntegerField(
        help_text='Maximum documents that this user can download per query',
        default=DEFAULT_DOWNLOAD_LIMIT)

    def has_access(self, corpus_name):
        # superusers automatically have access to all corpora
        if self.is_superuser:
            return True

        # check if any corpus added to the user's group(s) match the corpus name
        return any(corpus for group in self.groups.all()
                   for corpus in group.corpora.filter(name=corpus_name))


class AnoymousProfile(object):
    enable_search_history = False


class CustomAnonymousUser(django_auth_models.AnonymousUser):
    ''' extend AnonymousUser class with has_access method
        return True for any corpus assigned to the `basic` group
    '''
    profile = AnoymousProfile()

    def has_access(self, corpus_name):
        basic_group, _ = django_auth_models.Group.objects.get_or_create(
            name='basic')
        return basic_group.corpora.filter(name=corpus_name)


django_auth_models.AnonymousUser = CustomAnonymousUser


class UserProfile(models.Model):
    ''' User information that is not relevant to authentication.
    E.g. settings, preferences, optional personal information.
    '''

    user = models.OneToOneField(
        to=CustomUser,
        on_delete=models.CASCADE,
        related_name='profile',
    )

    enable_search_history = models.BooleanField(
        help_text='Whether to save the search history of this user',
        default=True,
    )

    def __str__(self):
        return f'Profile of {self.user.username}'

